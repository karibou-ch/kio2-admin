import { HttpClient, HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserService } from 'kng2-core';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class TokenInterceptorProvider implements HttpInterceptor {

  constructor(
    public $user: UserService
  ) {
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

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
      tap((event: HttpEvent<any>) => {
      //
      // on done
      },(err: any) => {
      //
      // on error
        if (err.status === 401) {
          // console.log('TokenInterceptorProvider:ERROR',err.status)
          this.$user.logout().subscribe();
        }
      })
    );
  }


}
