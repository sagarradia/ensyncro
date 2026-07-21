import { IntroRequestStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateIntroRequestDto {
  @IsUUID()
  toUserId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

export class RespondIntroRequestDto {
  @IsEnum(IntroRequestStatus)
  status!: IntroRequestStatus;
}
