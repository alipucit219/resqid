import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ExceptionHandlerResponse } from "./exception.types";
import { ExceptionHandlersMappedType } from './exception.types';

@Injectable()
export class ExceptionHandler {
  constructor() { }

  private handleJWTExpiredError(): ExceptionHandlerResponse {
    return {
      message: 'Session has been expired. Please login again',
      status: HttpStatus.UNAUTHORIZED
    }
  }

  private handleJWTError(): ExceptionHandlerResponse {
    return {
      message: 'Token not found. Please try again',
      status: HttpStatus.UNAUTHORIZED
    }
  }

  private handleDBValidationError(error): ExceptionHandlerResponse {
    let errors: string[] = [];

    Object.keys(error.errors).forEach((key, index) => {
      errors[index] = error.errors[key].message;
    });

    return {
      message: errors,
      status: HttpStatus.BAD_REQUEST
    }
  }

  public handle(exception: HttpException) {
    const handlers: ExceptionHandlersMappedType = {
      TokenExpiredError: this.handleJWTExpiredError,
      JsonWebTokenError: this.handleJWTError,
      ValidationError: this.handleDBValidationError
    }

    return handlers[exception.name](exception);
  }
};