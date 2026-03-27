import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from "class-validator";
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
    name: "phoneNumber",
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Phone number should be a string" })
  @Transform(({ value }) => (value ? trim(value) : value))
  @Matches(/^\+?[0-9()\-\s]{7,20}$/, {
    message: "Phone number format is invalid",
  })
  phoneNumber?: string;

  @ApiProperty({
    name: "dateOfBirth",
    type: String,
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: "Date of birth must be a valid ISO date" })
  dateOfBirth?: string;

  @ApiProperty({
    name: "gender",
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Gender should be a string" })
  @Transform(({ value }) => (value ? trim(lowerCase(value)) : value))
  @IsIn(["male", "female", "other"])
  gender?: string;

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
