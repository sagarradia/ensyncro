import { IsEnum } from 'class-validator';
import { DataRoomVisibility } from '@prisma/client';

export class SetVisibilityDto {
  @IsEnum(DataRoomVisibility)
  visibility!: DataRoomVisibility;
}
