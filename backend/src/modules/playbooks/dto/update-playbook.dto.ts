import { IsString, IsOptional, IsEnum, IsObject, IsArray } from 'class-validator';
import { PlaybookTrigger, PlaybookStatus } from '@prisma/client';

export class UpdatePlaybookDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(PlaybookTrigger)
  trigger?: PlaybookTrigger;

  @IsOptional()
  @IsObject()
  conditions?: Record<string, any>;

  @IsOptional()
  @IsArray()
  actions?: any[];

  @IsOptional()
  @IsEnum(PlaybookStatus)
  status?: PlaybookStatus;
}
