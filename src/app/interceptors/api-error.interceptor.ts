import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { catchError, throwError } from "rxjs";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const message = extractMessage(error);
      const details = error.error?.error?.details ?? error.error?.details ?? error.error;
      return throwError(() => new ApiError(error.status || 500, message, details));
    }),
  );
};

function extractMessage(error: HttpErrorResponse): string {
  if (typeof error.error === "string") {
    return error.error;
  }

  if (error.error?.error?.message) {
    return error.error.error.message;
  }

  if (error.error?.message) {
    return error.error.message;
  }

  if (error.message) {
    return error.message;
  }

  return "The request could not be completed.";
}
