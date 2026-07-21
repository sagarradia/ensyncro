import { DataRoomVisibility, MediaKind } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Describes a file the client is about to upload directly to storage. The
 * declared size is only a claim — it is what gets signed into the presigned
 * URL, and the real size is read back from storage on completion.
 */
export class CreateUploadUrlDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  fileName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  contentType!: string;

  @IsInt()
  @IsPositive()
  sizeBytes!: number;

  @IsOptional()
  @IsEnum(MediaKind)
  kind?: MediaKind;

  @IsOptional()
  @IsEnum(DataRoomVisibility)
  visibility?: DataRoomVisibility;
}
