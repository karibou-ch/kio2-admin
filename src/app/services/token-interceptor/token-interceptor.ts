import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UserService } from 'kng2-core';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { buildHttpStatusZeroContext, captureBrowserNetSnapshot } from '../../sentry/http-failure-context';

@Injectable({ providedIn: 'root' })
export class TokenInterceptorProvider implements HttpInterceptor {

  constructor(
    public $router: Router,
    public $user: UserService
  ) {
  }

  intercept(request: HttpRequest<any>, next: HttpHandler) {

    // JWT
    // - https://ryanchenkie.com/angular-authentication-using-the-http-client-and-http-interceptors
    // - https://blog.angular-university.io/angular-jwt-authentication/
    //
    // if(this.$user.currentUser['token']){
    //   request = request.clone({
    //     setHeaders: {
    //       Authorization: `Bearer ${this.$user.currentUser['token']}`
    //     }
    //   });  
    // }
    // delphine.cluzel@gmail.com

    const startedAtMs = Date.now();
    const netAtStart = captureBrowserNetSnapshot();

    return next.handle(request).pipe(
      catchError(error => {
        //
        // on error
        if (error.status === 401) {
          // console.log('TokenInterceptorProvider:ERROR',err.status)
          this.$router.navigate(['/login']);
        }

        if (error instanceof HttpErrorResponse && error.status === 0) {
          (error as HttpErrorResponse & { kioDiag?: unknown }).kioDiag = buildHttpStatusZeroContext({
            method: request.method,
            url: request.urlWithParams,
            startedAtMs,
            failedAtMs: Date.now(),
            start: netAtStart,
            end: captureBrowserNetSnapshot(),
          });
        }

        return throwError(error);
      }),
      tap((event: HttpEvent<any>) => {
      })
    );
  }


}
