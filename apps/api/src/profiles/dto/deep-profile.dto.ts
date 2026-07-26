import { RiskSeverity, SwotCategory } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/** Structured sections of the deep founder (Investee) profile (VMB §7). */

export class CreatePromoterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  background?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  shareholdingPct?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  priorExperience?: string;
}

export class CreateGroupCompanyDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  relationship?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  ownershipPct?: number;
}

export class CreateProductServiceDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;
}

export class CreateCompetitorDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  differentiation?: string;
}

export class CreateSwotItemDto {
  @IsEnum(SwotCategory)
  category!: SwotCategory;

  @IsString()
  @MinLength(2)
  @MaxLength(500)
  text!: string;
}

export class CreateRiskItemDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsEnum(RiskSeverity)
  severity?: RiskSeverity;
}

export class CreateFuturePlanDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  timeframe?: string;
}

export class CreateBenchmarkPeerDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  peerName!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  arr?: number;

  @IsOptional()
  @IsInt()
  @Min(-100)
  @Max(100000)
  growthPct?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  grossMarginPct?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
