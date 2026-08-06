import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsObject } from 'class-validator';

export class CreateAlertRuleDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsNotEmpty()
  ruleType!: string; // THRESHOLD, PATTERN, CORRELATION

  @IsObject()
  config!: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}
