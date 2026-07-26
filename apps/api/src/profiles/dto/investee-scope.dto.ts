import {
  BusinessStage,
  CompanyClassification,
  FundingRequirementType,
  NatureOfBusiness,
} from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

/** Classification, funding requirement and operations — the public scalar
 * metadata of the Investee profile (PRD v2 §8 + §7). */
export class UpdateInvesteeMetaDto {
  @IsOptional()
  @IsArray()
  @IsEnum(NatureOfBusiness, { each: true })
  natureOfBusiness?: NatureOfBusiness[];

  @IsOptional()
  @IsEnum(BusinessStage)
  businessStage?: BusinessStage;

  @IsOptional()
  @IsEnum(CompanyClassification)
  companyClassification?: CompanyClassification;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== '')
  @IsString()
  @MaxLength(80)
  sector?: string;

  @IsOptional()
  @IsEnum(FundingRequirementType)
  fundingRequirementType?: FundingRequirementType;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== '')
  @IsString()
  @MaxLength(120)
  fundingInstrument?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== '')
  @IsString()
  @MaxLength(1000)
  fundingUseSummary?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  fundingSought?: number | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== '')
  @IsString()
  @MaxLength(2000)
  manufacturing?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== '')
  @IsString()
  @MaxLength(2000)
  operations?: string | null;
}

export class CreateShareholderDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  shareClass?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage?: number;
}

export class CreateNamedItemDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}

export class CreateProjectedFinancialDto {
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  periodLabel!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  revenue?: number;

  @IsOptional()
  @IsInt()
  ebitda?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
