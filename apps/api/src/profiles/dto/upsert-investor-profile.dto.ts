import {
  ArrayMinSize,
  IsArray,
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
import { InvestorType } from '@prisma/client';

/** Investor profile captured by the onboarding wizard (task #8). */
export class UpsertInvestorProfileDto {
  /** Fund name, or the individual's name for angels. */
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  /** Multi-select from the PRD §3 list — at least one is required. */
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(InvestorType, { each: true })
  investorTypes!: InvestorType[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  sectors?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  ticketMin?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  ticketMax?: number;

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
  @IsBoolean()
  completed?: boolean;
}
