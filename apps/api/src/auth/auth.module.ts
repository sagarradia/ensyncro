import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordService } from './password/password.service';
import { TokenService } from './tokens/token.service';
import { OtpService } from './otp/otp.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { AdminRolesGuard } from './guards/admin-roles.guard';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    TokenService,
    OtpService,
    JwtAuthGuard,
    RolesGuard,
    AdminRolesGuard,
  ],
  // Exported so feature modules can compose them on their own routes.
  exports: [TokenService, PasswordService, JwtAuthGuard, RolesGuard, AdminRolesGuard],
})
export class AuthModule {}
