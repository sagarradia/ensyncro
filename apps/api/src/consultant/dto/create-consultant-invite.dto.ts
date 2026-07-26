import { IsEmail, IsEnum } from 'class-validator';
import { ConsultantType } from '@prisma/client';

export class CreateConsultantInviteDto {
  @IsEmail()
  email!: string;

  @IsEnum(ConsultantType)
  consultantType!: ConsultantType;
}
