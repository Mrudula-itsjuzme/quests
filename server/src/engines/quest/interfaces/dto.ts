import { IsInt, IsOptional, IsString, Max, Min, MaxLength } from 'class-validator';

export class ProgressDto {
  @IsInt()
  @Min(0)
  @Max(10_000_000)
  value!: number;
}

export class SubmissionDto {
  @IsOptional()
  @IsString()
  @MaxLength(10_000)
  text?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  uploadId?: string;

  @IsOptional()
  feedOptIn?: boolean;
}
