import { IsEmail, IsString, IsNotEmpty, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
//import { IsStrongPassword } from "src/utils/decorators/IsStrongPassword.decorator";

export class ChangePasswordDto {
  @ApiProperty({ name: "currentPassword", type: String, required: true })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, {
    message: "Current password must be atleast 8 characters longer.",
  })
  currentPassword: string;

  @ApiProperty({ name: "newPassword", type: String, required: true })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, {
    message: "New password must be atleast 8 characters longer.",
  })
  newPassword: string;
}
