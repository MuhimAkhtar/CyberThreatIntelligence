import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean, IsObject } from 'class-validator';
import { SiemType } from '@prisma/client';

export class CreateConnectorDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(SiemType)
  @IsNotEmpty()
  type!: SiemType;

  @IsObject()
  @IsNotEmpty()
  config!: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean = true;
}
