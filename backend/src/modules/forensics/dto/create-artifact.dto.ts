import { IsString, IsOptional, IsEnum, IsUUID, IsInt, IsArray } from 'class-validator';
import { ArtifactType } from '@prisma/client';

export class CreateArtifactDto {
  @IsUUID()
  caseId!: string;

  @IsEnum(ArtifactType)
  artifactType!: ArtifactType;

  @IsString()
  fileName!: string;

  @IsOptional()
  @IsString()
  filePath?: string;

  @IsOptional()
  @IsInt()
  fileSizeBytes?: number;

  @IsString()
  sha256!: string;

  @IsOptional()
  @IsString()
  sha1?: string;

  @IsOptional()
  @IsString()
  md5?: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
