import { DealStage } from '@prisma/client';
import { IsBoolean, IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

export class ChangeStageDto {
  @IsEnum(DealStage)
  stage!: DealStage;
}

export class AddCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body!: string;
}

export class AddTaskDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;
}

export class ToggleTaskDto {
  @IsBoolean()
  done!: boolean;
}
