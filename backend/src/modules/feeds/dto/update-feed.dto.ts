import { IsString, IsOptional, IsEnum, IsBoolean, IsInt, Min, IsUrl, IsObject } from 'class-validator';
import { FeedType } from '@prisma/client';

export class UpdateFeedDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(FeedType)
  type?: FeedType;

  @IsOptional()
  @IsUrl()
  baseUrl?: string;

  @IsOptional()
  @IsString()
  apiKeyEnvVar?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  fetchIntervalMinutes?: number;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}
