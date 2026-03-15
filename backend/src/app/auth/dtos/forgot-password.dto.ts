import { IsEmail, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ForgotPasswordDto {
  @ApiProperty({ name: 'email', type: String, required: true })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}