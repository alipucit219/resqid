import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsDateString,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from "class-validator";
import { lowerCase, trim } from "src/shared/helpers/string";

const GENDERS = ["male", "female", "other"] as const;

export class RegisterDto {
  @ApiProperty({
    name: "fullName",
    type: String,
    required: true,
    description: "Full name for the account",
  })
  @IsNotEmpty({ message: "Full name is required" })
  @IsString({ message: "Full name should be a string" })
  @Transform(({ value }) => trim(value))
  fullName: string;

  @ApiProperty({
    name: "email",
    type: String,
    required: true,
    description: "Email used to log in",
  })
  @Transform(({ value }) => trim(lowerCase(value)))
  @IsNotEmpty({ message: "Email is required" })
  @IsString({ message: "Email must be a valid string" })
  @IsEmail()
  email: string;

  @ApiProperty({
    name: "phoneNumber",
    type: String,
    required: true,
    description: "Phone number for emergency communication",
  })
  @IsNotEmpty({ message: "Phone number is required" })
  @IsString({ message: "Phone number should be a string" })
  @Transform(({ value }) => trim(value))
  @Matches(/^\+?[0-9()\-\s]{7,20}$/, {
    message: "Phone number format is invalid",
  })
  phoneNumber: string;

  @ApiProperty({
    name: "dateOfBirth",
    type: String,
    required: true,
    description: "Date of birth in ISO format (YYYY-MM-DD)",
  })
  @IsNotEmpty({ message: "Date of birth is required" })
  @IsDateString({}, { message: "Date of birth must be a valid ISO date" })
  dateOfBirth: string;

  @ApiProperty({
    name: "cnic",
    type: String,
    required: true,
    description: "CNIC in 12345-1234567-1 format",
  })
  @IsNotEmpty({ message: "CNIC is required" })
  @IsString({ message: "CNIC should be a string" })
  @Transform(({ value }) => trim(value))
  @Matches(/^\d{5}-\d{7}-\d{1}$/, {
    message: "CNIC must be in 12345-1234567-1 format",
  })
  cnic: string;

  @ApiProperty({
    name: "address",
    type: String,
    required: true,
    description: "Residential address",
  })
  @IsNotEmpty({ message: "Address is required" })
  @IsString({ message: "Address should be a string" })
  @Transform(({ value }) => trim(value))
  address: string;

  @ApiProperty({
    name: "gender",
    type: String,
    required: true,
    enum: GENDERS,
    description: "Gender of the user",
  })
  @IsNotEmpty({ message: "Gender is required" })
  @IsString({ message: "Gender should be a string" })
  @Transform(({ value }) => trim(lowerCase(value)))
  @IsIn(GENDERS)
  gender: (typeof GENDERS)[number];

  @ApiProperty({
    name: "password",
    type: String,
    required: true,
    description: "Password for the account",
  })
  @IsNotEmpty({ message: "Password is required" })
  @IsString({ message: "Password should be a string" })
  @MinLength(8, { message: "Password must be atleast 8 characters longer" })
  password: string;
}
