import { IsEnum, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { AlertStatus } from '@prisma/client';

export class UpdateAlertStatusDto {
  @IsEnum(AlertStatus)
  @IsNotEmpty()
  status!: AlertStatus;
}

export class AssignAlertDto {
  @IsString()
  @IsOptional()
  assignedToUserId?: string | null;
}
