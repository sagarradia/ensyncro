import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordService } from './password/password.service';
import { TokenService } from './tokens/token.service';
import { OtpService } from './otp/otp.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, PasswordService, TokenService, OtpService, JwtAuthGuard],
  // Exported for reuse by feature modules and the RBAC layer (task #6).
  exports: [TokenService, JwtAuthGuard],
})
export class AuthModule {}
