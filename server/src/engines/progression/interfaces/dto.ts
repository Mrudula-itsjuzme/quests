import { IsBoolean, IsIn, IsOptional, IsString, MaxLength, Matches } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  displayName?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsIn(['Mind', 'Body', 'Discovery'])
  primaryPath?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  reminderTime?: string;

  @IsOptional()
  @IsIn(['system', 'full', 'reduced'])
  motionPreference?: string;

  @IsOptional()
  @IsBoolean()
  onboardingCompleted?: boolean;
}
