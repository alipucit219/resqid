import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ResetPasswordDto {
  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{6}$/, { message: "Code must be 6 digits." })
  code: string;

  @ApiProperty()
  @IsNotEmpty({ message: "Password is required" })
  @IsString({ message: "Password should be a String" })
  @MinLength(8, { message: "Password must be atleast 8 characters longer" })
  newPassword: string;
}
