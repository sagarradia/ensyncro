import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { InvestorType } from '@prisma/client';

/** Filters for founders browsing investors (task #11). */
export class DiscoverInvestorsQuery {
  @IsOptional()
  @IsEnum(InvestorType)
  investorType?: InvestorType;

  /** Matches against the investor's sectors of interest. */
  @IsOptional()
  @IsString()
  @MaxLength(80)
  sector?: string;

  /**
   * Find investors whose ticket range overlaps the amount you're raising.
   * An investor matches when their max is >= this value (or is unset).
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  ticketMin?: number;

  /** Investor's minimum must be <= this value (or unset). */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  ticketMax?: number;

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
