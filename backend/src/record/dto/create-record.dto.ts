import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { RecordMode, StoolColor, Effort, Amount } from '../record.entity';

export class CreateRecordDto {
  @IsEnum(RecordMode)
  mode: RecordMode;

  @IsInt()
  @Min(1)
  @Max(7)
  bristolType: number;

  @IsEnum(StoolColor)
  color: StoolColor;

  @IsInt()
  @Min(0)
  duration: number;

  @IsEnum(Effort)
  effort: Effort;

  @IsInt()
  @Min(1)
  @Max(5)
  comfort: number;

  @IsOptional()
  @IsEnum(Amount)
  amount?: Amount;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  symptoms?: string[];

  @IsOptional()
  @IsString()
  notes?: string;
}
