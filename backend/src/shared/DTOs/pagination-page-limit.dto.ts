import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsNumber,
  IsPositive
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PAGINATION_DEFAULT_LIMIT, PAGINATION_DEFAULT_PAGE } from 'src/constants';
import { paginationDefaultLimitTransformer, paginationDefaultPageTransformer } from '../helpers/transformers';

export class PaginationDto {
  @ApiProperty({ type: Number, required: false, name: 'page' })
  @IsOptional()
  @Transform(paginationDefaultPageTransformer)
  page?: number = PAGINATION_DEFAULT_PAGE;

  @ApiProperty({ type: Number, required: false, name: 'limit' })
  @IsOptional()
  @Transform(paginationDefaultLimitTransformer)
  limit?: number = PAGINATION_DEFAULT_LIMIT;
}