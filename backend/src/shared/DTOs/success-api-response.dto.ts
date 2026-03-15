import { ApiProperty } from "@nestjs/swagger";

export class SuccessApiResponseDto {
  @ApiProperty({ type: String, example: 'Some message' })
  message: string;
}