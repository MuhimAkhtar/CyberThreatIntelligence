import { IsString, IsNotEmpty, IsEnum, IsOptional, IsArray } from 'class-validator';
import { CasePriority } from '@prisma/client';

export class CreateInvestigationDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(CasePriority)
  @IsOptional()
  priority?: CasePriority;

  @IsString()
  @IsOptional()
  assignedToUserId?: string;

  @IsString()
  @IsOptional()
  sourceAlertId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  alertIds?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  iocIds?: string[];
}
