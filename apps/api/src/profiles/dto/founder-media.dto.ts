import { DataRoomVisibility, FundingStage, ProfileSection } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

/**
 * `null` is meaningful in these payloads — it clears a value — so optional
 * fields accept null explicitly rather than only being absent.
 */
export class UpdateFounderMediaDto {
  /** A YouTube, Vimeo or Loom link. Validated properly in parsePitchVideoUrl. */
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== '')
  @IsString()
  @MaxLength(500)
  pitchVideoUrl?: string | null;

  /** An uploaded PITCH_VIDEO file belonging to this founder. */
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== '')
  @IsUUID()
  pitchVideoFileId?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== '')
  @IsUrl({ require_tld: false })
  @MaxLength(500)
  website?: string | null;
}

export class UpdateFounderProductDto {
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== '')
  @IsString()
  @MaxLength(120)
  productName?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== '')
  @IsString()
  @MaxLength(200)
  tagline?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== '')
  @IsString()
  @MaxLength(5000)
  productDescription?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  categories?: string[];

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== '')
  @IsUUID()
  logoFileId?: string | null;
}

export class UpdateFinancialsDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  mrr?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  arr?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  monthlyBurn?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(600)
  runwayMonths?: number | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== '')
  @IsString()
  @MaxLength(2000)
  useOfFunds?: string | null;

  @IsOptional()
  @IsEnum(DataRoomVisibility)
  financialsVisibility?: DataRoomVisibility;
}

export class SetSectionVisibilityDto {
  @IsEnum(ProfileSection)
  section!: ProfileSection;

  @IsEnum(DataRoomVisibility)
  visibility!: DataRoomVisibility;
}

export class CreateMilestoneDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsDateString()
  occurredOn!: string;

  @IsOptional()
  @IsBoolean()
  achieved?: boolean;
}

export class CreateFundingRoundDto {
  @IsEnum(FundingStage)
  stage!: FundingStage;

  @IsInt()
  @Min(0)
  amountRaised!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  preMoney?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  postMoney?: number;

  @IsDateString()
  closedOn!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  leadInvestor?: string;
}
