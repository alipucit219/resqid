import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IAuthenticatedRequest } from '../interfaces/authenticated-request.interface';

export const AuthenticatedRequestPayload = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): IAuthenticatedRequest => {
    const request = ctx.switchToHttp().getRequest();
    return {
      user: request.user
    } as IAuthenticatedRequest;
  },
);