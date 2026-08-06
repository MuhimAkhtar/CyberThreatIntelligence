import { IsString, IsNotEmpty, IsEnum, IsObject, IsArray } from 'class-validator';
import { PlaybookTrigger } from '@prisma/client';

export class CreatePlaybookDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsEnum(PlaybookTrigger)
  @IsNotEmpty()
  trigger!: PlaybookTrigger;

  @IsObject()
  @IsNotEmpty()
  conditions!: Record<string, any>;

  @IsArray()
  @IsNotEmpty()
  actions!: any[];
}
