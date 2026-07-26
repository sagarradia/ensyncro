import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateConsultantProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  firm?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  registrationNumber?: string;
}
