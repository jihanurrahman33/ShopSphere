import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

/** Chain of responsibility: maps transport errors to user-friendly messages. */
export const errorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const message =
        error.status === 0
          ? 'Cannot reach the server. Is the API running (npm run api)?'
          : error.status === 404
            ? 'The requested item was not found.'
            : 'Something went wrong. Please try again.';
      return throwError(() => new Error(message));
    }),
  );
