import { IsNotEmpty, IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty()
  @IsNotEmpty({ message: "Password is required" })
  @IsString({ message: "Password should be a String" })
  @MinLength(8, { message: "Password must be atleast 8 characters longer" })
  newPassword: string;
}

