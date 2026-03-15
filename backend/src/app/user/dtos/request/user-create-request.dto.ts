import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsEmail, IsIn, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { trim, lowerCase } from "src/shared/helpers/string";
import { Role } from "src/app/auth/enums/role.enum";

export class UserCreateRequestDto {
  @ApiProperty({
    name: "email",
    type: String,
    required: true,
  })
  @IsNotEmpty({ message: "Email is required" })
  @IsString({ message: "Email must be a valid string" })
  @IsEmail()
  @Transform(({ value }) => trim(lowerCase(value)))
  email: string;

  @ApiProperty({
    name: "fullName",
    type: String,
    required: true,
  })
  @IsNotEmpty({ message: "Full Name is required" })
  @IsString({ message: "Full Name should be a String" })
  @Transform(({ value }) => trim(value))
  fullName: string;

  @ApiProperty({
    name: "role",
    type: String,
    required: false,
    enum: Object.values(Role),
    default: Role.USER,
  })
  @IsOptional()
  @IsIn(Object.values(Role))
  role?: Role = Role.USER;

  @ApiProperty({
    name: "isActive",
    type: Boolean,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
