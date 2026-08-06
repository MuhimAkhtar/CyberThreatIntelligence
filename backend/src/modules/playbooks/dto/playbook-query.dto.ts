import { IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PlaybookStatus, PlaybookTrigger } from '@prisma/client';

export class PlaybookQueryDto {
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
  @IsEnum(PlaybookStatus)
  status?: PlaybookStatus;

  @IsOptional()
  @IsEnum(PlaybookTrigger)
  trigger?: PlaybookTrigger;
}
