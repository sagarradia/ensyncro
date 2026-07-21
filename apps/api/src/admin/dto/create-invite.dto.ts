import { IsEmail, IsEnum } from 'class-validator';
import { AdminRole } from '@prisma/client';

export class CreateInviteDto {
  @IsEmail()
  email!: string;

  @IsEnum(AdminRole)
  adminRole!: AdminRole;
}
