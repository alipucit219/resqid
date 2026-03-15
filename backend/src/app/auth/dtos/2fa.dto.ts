import { IsNotEmpty, IsNumberString, Length } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger';

export class TwoFactorAuthenticationCodeDto {
  @ApiProperty({
    name: 'twoFactorAuthenticationCode',
    type: String,
    required: true,
    description: 'Secret code that could be found in the Authenticator application you used to scan the QR code while enabling 2FA'
  })
  @IsNumberString()
  @IsNotEmpty()
  @Length(6)
  twoFactorAuthenticationCode: string;
}
