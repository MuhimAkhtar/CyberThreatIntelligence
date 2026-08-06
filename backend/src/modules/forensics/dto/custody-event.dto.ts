import { IsString, IsOptional, IsEnum } from 'class-validator';
import { CustodyAction } from '@prisma/client';

export class CustodyEventDto {
  @IsEnum(CustodyAction)
  action!: CustodyAction;

  @IsOptional()
  @IsString()
  notes?: string;
}
