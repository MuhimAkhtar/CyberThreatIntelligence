import { IsOptional, IsArray, IsString } from 'class-validator';

export class ForwardAlertsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  alertIds?: string[];
}
