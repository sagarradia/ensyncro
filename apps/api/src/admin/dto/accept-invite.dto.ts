import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class AcceptInviteDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'password must contain at least one letter and one number',
  })
  password!: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9]{7,15}$/, {
    message: 'mobile must be 7–15 digits, optionally prefixed with +',
  })
  mobile?: string;
}
