import { IsEnum, IsNotEmpty } from 'class-validator';
import { ReportFormat } from '@prisma/client';

export class GenerateReportDto {
  @IsEnum(ReportFormat)
  @IsNotEmpty()
  format!: ReportFormat;
}
