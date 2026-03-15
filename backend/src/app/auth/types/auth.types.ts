import { Request } from "express";

export interface IAuthenticatedUserPayload {
  userId: string;
  sessionId: string;
}

export interface IAuthenticatedUserRequest extends Request {
  user: IAuthenticatedUserPayload;
}
