import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty } from "class-validator";

export class RegisterPushTokenDto {
  @ApiProperty({
    example: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  })
  @IsString()
  @IsNotEmpty()
  expoPushToken: string;
}