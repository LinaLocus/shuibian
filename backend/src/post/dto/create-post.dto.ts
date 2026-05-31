import {
  IsString,
  IsOptional,
  IsArray,
  IsUUID,
  MaxLength,
  ArrayMaxSize,
} from 'class-validator';

export class CreatePostDto {
  @IsUUID()
  familyId: string;

  @IsString()
  @MaxLength(1000)
  content: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(9)
  @IsString({ each: true })
  imageUrls?: string[];
}

export class CreateCommentDto {
  @IsString()
  @MaxLength(200)
  content: string;
}
