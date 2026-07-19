import { IsEnum, IsUUID, Length } from 'class-validator';
import { OtpChannel } from '@prisma/client';

export class VerifyOtpDto {
  @IsUUID()
  userId!: string;

  @IsEnum(OtpChannel)
  channel!: OtpChannel;

  @Length(6, 6)
  code!: string;
}
