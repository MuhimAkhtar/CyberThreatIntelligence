import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ArtifactType } from '@prisma/client';

export class ArtifactQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  caseId?: string;

  @IsOptional()
  @IsEnum(ArtifactType)
  artifactType?: ArtifactType;

  @IsOptional()
  @IsString()
  search?: string;
}
