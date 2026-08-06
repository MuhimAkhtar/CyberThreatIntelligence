import { IsString, IsOptional, IsEnum, IsObject, IsBoolean } from 'class-validator';
import { SiemType } from '@prisma/client';

export class UpdateConnectorDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(SiemType)
  type?: SiemType;

  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
