import { IsOptional, IsEnum, IsString, IsNumber, IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { IocType } from '@prisma/client';

export class IocQueryDto {
  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsEnum(IocType)
  type?: IocType;

  @IsOptional()
  @IsString()
  feedId?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minConfidence?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxConfidence?: number;

  @IsOptional()
  @IsDateString()
  firstSeenAfter?: string;

  @IsOptional()
  @IsDateString()
  firstSeenBefore?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  skip?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  take?: number;
}
