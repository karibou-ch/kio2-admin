import { HttpClient, HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UserService } from 'kng2-core';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';

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

    return next.handle(request).pipe(
      catchError(error => {
        //
        // on error
        if (error.status === 401) {
          // console.log('TokenInterceptorProvider:ERROR',err.status)
          this.$router.navigate(['/login']);
        }

        return throwError(error);
      }),
      tap((event: HttpEvent<any>) => {
      })
    );
  }


}
