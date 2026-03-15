import * as jwt from 'jsonwebtoken';
import { IAuthenticatedUserPayload } from '../types/auth.types';
import { ConfigService } from 'src/config';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthTokenService {
  constructor(private readonly configService: ConfigService) { }

  verify(token: string): Promise<IAuthenticatedUserPayload> {
    return new Promise((resolve, reject) => {
      jwt.verify(token, this.configService.getJWTSecretKey(), (err, decoded) => {
        if (err) {
          return reject(err);
        }
        return resolve(decoded as IAuthenticatedUserPayload);
      });
    });
  }

  sign(payload: IAuthenticatedUserPayload) {
    return jwt.sign(payload, this.configService.getJWTSecretKey(), {
      expiresIn: this.configService.getJWTTokenExpiration()
    });
  }
}
