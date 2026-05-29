import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpsertFoodDto {
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
