import { IsEmail, IsIn, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

/** Public signup is Founder or Investor only — Admin is invite-only (PRD §3). */
export const SIGNUP_ROLES = [Role.FOUNDER, Role.INVESTOR] as const;

export class SignupDto {
  @IsEmail()
  email!: string;

  // Kept permissive (E.164-ish) — full normalization is out of scope for the skeleton.
  @IsString()
  @Matches(/^\+?[0-9]{7,15}$/, {
    message: 'mobile must be 7–15 digits, optionally prefixed with +',
  })
  mobile!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'password must contain at least one letter and one number',
  })
  password!: string;

  @IsIn(SIGNUP_ROLES as unknown as string[])
  role!: (typeof SIGNUP_ROLES)[number];
}
