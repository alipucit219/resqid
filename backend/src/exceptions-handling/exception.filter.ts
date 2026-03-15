import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  BadRequestException,
  HttpStatus,
} from "@nestjs/common";
import { Request, Response } from "express";
import { ExceptionHandler } from "./exception-handler.class";
import { ExceptionsEnum } from "./exception.types";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly exceptionHandler: ExceptionHandler) {}

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    let errorResponse = {
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    };

    // Case when exception needs to be handled explicitly
    if (Object.keys(ExceptionsEnum).includes(exception.name)) {
      const { message, status } = this.exceptionHandler.handle(exception);
      errorResponse["message"] = message;
      errorResponse["status"] = status;
      return response.status(status).json(errorResponse);
    }

    // To handle exceptions returned by class-validator
    else if (exception instanceof BadRequestException) {
      const exceptionResponse = exception.getResponse() as object;
      const status = exception.getStatus();
      if ("message" in exceptionResponse) {
        const { message }: any = exceptionResponse;
        errorResponse["message"] = message;
        errorResponse["status"] = status;
        return response.status(status).json(errorResponse);
      }
    }

    const status = exception?.getStatus() || HttpStatus.INTERNAL_SERVER_ERROR;
    errorResponse["message"] = exception?.message || "Interval server error";
    errorResponse["status"] = status;

    return response.status(status).json(errorResponse);
  }
}
