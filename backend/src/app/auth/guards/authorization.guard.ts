import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { IAuthenticatedRequest } from "src/shared/interfaces";

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const allowedRolesMetadata = this.reflector.getAllAndOverride<
      string | string[]
    >("ROLE", [
      context.getHandler(),
      context.getClass(),
    ]);

    // Case when request is public
    if (allowedRolesMetadata === undefined || allowedRolesMetadata === null) {
      return true;
    }

    const allowedRoles = Array.isArray(allowedRolesMetadata)
      ? allowedRolesMetadata
      : [allowedRolesMetadata];

    // Get authenticated user from context
    const { user } = context
      .switchToHttp()
      .getRequest() as IAuthenticatedRequest;

    const canAccess = allowedRoles.includes(user.role);

    if (!canAccess)
      throw new ForbiddenException(
        "Sorry! You do not have permission to access this feature. Please contact administrator.",
      );

    return true;
  }
}
