import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, Matches } from "class-validator";

export class VerifyResetCodeDto {
  @ApiProperty({ name: "email", type: String, required: true })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ name: "code", type: String, required: true, example: "123456" })
  @IsNotEmpty()
  @Matches(/^\d{6}$/, { message: "Code must be 6 digits." })
  code: string;
}
