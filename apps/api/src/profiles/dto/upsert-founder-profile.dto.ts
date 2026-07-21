import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { FundingStage } from '@prisma/client';

/** Company profile captured by the founder onboarding wizard (task #7). */
export class UpsertFounderProfileDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  companyName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  sector!: string;

  @IsEnum(FundingStage)
  stage!: FundingStage;

  @IsOptional()
  @IsInt()
  @Min(0)
  fundingSought?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  location?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  teamSize?: number;

  /** Set by the wizard's final step. */
  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
