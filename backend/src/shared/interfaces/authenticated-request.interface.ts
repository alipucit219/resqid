import Request from "express";
import { UserWithoutPassword } from "src/app/user/user.types";

export interface IAuthenticatedSessionPayload {
  id: string;
  userId: string;
  isAuthenticated: boolean;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: Date;
}

export interface IAuthenticatedRequest extends Request {
  user: UserWithoutPassword & { session: IAuthenticatedSessionPayload };
}
