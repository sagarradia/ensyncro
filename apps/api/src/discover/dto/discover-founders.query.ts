import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { FundingStage } from '@prisma/client';

/** Filters for investors browsing founders (task #11). */
export class DiscoverFoundersQuery {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  sector?: string;

  @IsOptional()
  @IsEnum(FundingStage)
  stage?: FundingStage;

  /** Founders seeking at least this much. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  fundingMin?: number;

  /** Founders seeking at most this much. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  fundingMax?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;
}
