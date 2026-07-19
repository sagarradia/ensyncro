import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { OtpChannel, Prisma, User, UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from './password/password.service';
import { TokenService, TokenPair } from './tokens/token.service';
import { OtpService } from './otp/otp.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

/** User shape safe to return over the wire (never includes passwordHash). */
export type SafeUser = Omit<User, 'passwordHash'>;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
    private readonly otp: OtpService,
  ) {}

  async signup(dto: SignupDto) {
    const passwordHash = await this.passwords.hash(dto.password);

    let user: User;
    try {
      user = await this.prisma.user.create({
        data: {
          email: dto.email.toLowerCase(),
          mobile: dto.mobile,
          passwordHash,
          role: dto.role,
          status: UserStatus.PENDING_VERIFICATION,
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException('Email or mobile is already registered');
      }
      throw err;
    }

    // Issue OTPs for both channels (email + mobile) per PRD §4.
    const emailCode = await this.otp.issue(user.id, OtpChannel.EMAIL, user.email);
    const mobileCode = await this.otp.issue(
      user.id,
      OtpChannel.MOBILE,
      user.mobile ?? '',
    );

    return {
      userId: user.id,
      status: user.status,
      message: 'Verify the email and mobile codes to activate the account.',
      // Present only in mock OTP mode (demo/staging) — never in live mode.
      devOtp:
        emailCode || mobileCode
          ? { email: emailCode, mobile: mobileCode }
          : undefined,
    };
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<{ status: UserStatus }> {
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) throw new UnauthorizedException('Unknown user');

    await this.otp.verify(user.id, dto.channel, dto.code);

    const patch =
      dto.channel === OtpChannel.EMAIL
        ? { emailVerified: true }
        : { mobileVerified: true };
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: patch,
    });

    // Both channels verified → activate the account.
    if (
      updated.emailVerified &&
      updated.mobileVerified &&
      updated.status === UserStatus.PENDING_VERIFICATION
    ) {
      const active = await this.prisma.user.update({
        where: { id: user.id },
        data: { status: UserStatus.ACTIVE },
      });
      return { status: active.status };
    }
    return { status: updated.status };
  }

  async login(dto: LoginDto): Promise<TokenPair & { user: SafeUser }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    // Uniform error to avoid leaking which emails exist.
    const invalid = new UnauthorizedException('Invalid credentials');
    if (!user) {
      // Still run a compare to keep timing roughly constant.
      await this.passwords.compare(dto.password, DUMMY_HASH);
      throw invalid;
    }

    const ok = await this.passwords.compare(dto.password, user.passwordHash);
    if (!ok) throw invalid;

    if (user.status === UserStatus.PENDING_VERIFICATION) {
      throw new ForbiddenException('Account not verified');
    }
    if (user.status === UserStatus.DISABLED) {
      throw new ForbiddenException('Account disabled');
    }

    const pair = await this.tokens.issuePair(user);
    return { ...pair, user: toSafeUser(user) };
  }

  refresh(refreshToken: string) {
    return this.tokens.rotateRefreshToken(refreshToken);
  }

  async logout(refreshToken: string): Promise<{ success: true }> {
    await this.tokens.revokeRefreshToken(refreshToken);
    return { success: true };
  }

  async me(userId: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Unknown user');
    return toSafeUser(user);
  }
}

// A valid bcrypt hash of a random value, used to equalize login timing when
// the email is not found. Never matches a real password.
const DUMMY_HASH =
  '$2a$10$CwTycUXWue0Thq9StjUM0uJ8DvXjJh4Vf0z6h1o8sQ8m2c8mIcVe';

function toSafeUser(user: User): SafeUser {
  const { passwordHash: _omit, ...safe } = user;
  void _omit;
  return safe;
}
