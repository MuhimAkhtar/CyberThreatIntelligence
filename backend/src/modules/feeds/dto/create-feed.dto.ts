import { IsString, IsNotEmpty, IsEnum, IsOptional, IsBoolean, IsInt, Min, IsObject } from 'class-validator';
import { FeedType } from '@prisma/client';

export class CreateFeedDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(FeedType)
  type!: FeedType;

  @IsOptional()
  @IsString()
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
  config?: Record<string, any>;
}
