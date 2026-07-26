import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsString, MaxLength, ValidateNested } from 'class-validator';

export class CmsUpdateDto {
  @IsString()
  @MaxLength(200)
  key!: string;

  @IsString()
  @MaxLength(5000)
  value!: string;
}

export class UpdateCmsDto {
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => CmsUpdateDto)
  updates!: CmsUpdateDto[];
}
