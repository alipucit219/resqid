import { HttpException } from "@nestjs/common"

export enum ExceptionsEnum {
  ValidationError = 'ValidationError',
  JsonWebTokenError = 'JsonWebTokenError',
  TokenExpiredError = 'TokenExpiredError'
}

type ExceptionTypes = keyof typeof ExceptionsEnum

export type ExceptionHandlerResponse = {
  status: number;
  message: string | string[];
}

type ExceptionHandlerFn = (exception?: HttpException) => ExceptionHandlerResponse

export type ExceptionHandlersMappedType = {
  [K in ExceptionTypes]: ExceptionHandlerFn
}