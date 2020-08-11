import { NgModule, LOCALE_ID, Injectable, ErrorHandler, Injector } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { Kio2Admin } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { Kng2CoreModule } from 'kng2-core';
import { HttpClientModule, HttpErrorResponse, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Geolocation } from '@ionic-native/geolocation/ngx';

//
// local data
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { Network } from '@ionic-native/network/ngx';
import { TokenInterceptorProvider } from './services/token-interceptor/token-interceptor';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
registerLocaleData(localeFr);


//
// preparing Sentry feedback
@Injectable({ providedIn: 'root' })
export class Kio2AdminErrorHandler implements ErrorHandler {
  errorHandler: ErrorHandler;

  constructor(injector: Injector) {
    try {
      // this.errorHandler = injector.get(ErrorHandler);
    } catch (e) {
      // Unable to get the IonicErrorHandler provider, ensure
      // IonicErrorHandler has been added to the providers list below
    }
  }

  extractError(error) {
    // Try to unwrap zone.js error.
    // https://github.com/angular/angular/blob/master/packages/core/src/util/errors.ts
    if (error && error.ngOriginalError) {
      error = error.ngOriginalError;
    }

    // We can handle messages and Error objects directly.
    if (typeof error === 'string' || error instanceof Error) {
      return error;
    }

    // If it's http module error, extract as much information from it as we can.
    if (error instanceof HttpErrorResponse) {
      // The `error` property of http exception can be either an `Error` object, which we can use directly...
      if (error.error instanceof Error) {
        return error.error;
      }

      // ... or an`ErrorEvent`, which can provide us with the message but no stack...
      if (error.error instanceof ErrorEvent) {
        return error.error.message;
      }

      // ...or the request body itself, which we can use as a message instead.
      if (typeof error.error === 'string') {
        return `Server returned code ${error.status} with body "${error.error}"`;
      }

      // If we don't have any detailed information, fallback to the request message itself.
      return error.message;
    }

    // Skip if there's no error, and let user decide what to do with it.
    return null;
  }

  handleError(error: any): void {
    const extractedError = this.extractError(error) || "Handled unknown error";

    //
    // Page after new build deploy to load new chunks everything works fine,
    // all we need to either show a popup message to user and ask him to reload
    // page or we programmatically force app to reload if chunks failed error occurs.
    // https://medium.com/@kamrankhatti/angular-lazy-routes-loading-chunk-failed-42b16c22a377
    const chunkFailedMessage = /Loading chunk [\d]+ failed/;

    //
    // Reload App is enough
    if (chunkFailedMessage.test(error.message)) {
      return window.location.reload(true);
    }

    //
    // IMPORTANT: Rethrow the error otherwise it gets swallowed
    if (error.statusText === 'Unknown Error' ||
        error.rejection && error.rejection.status === 0) {
      window['API_ISSUE'] = true;
      console.log('--- Network error');
      return;
    }

    //
    // LAZY LOADIN SENTRY
    if (environment.production) {
      import('./sentry/sentry.module').then(m => {
        const Sentry = window['Sentry'];

        Sentry.captureException(extractedError);
        return m.SentryModule;
      });
    }

    console.log('---- Kio2AdminErrorHandler', 'version', extractedError);
    // // Pro.monitoring.handleNewError(err);
    // // Remove this if you want to disable Ionic's auto exception handling
    // // in development mode.
    // this.errorHandler && this.errorHandler.handleError(error);

    throw error;
  }
}


@NgModule({
  declarations: [Kio2Admin],
  entryComponents: [],
  imports: [
    BrowserModule,
    HttpClientModule,
    IonicModule.forRoot(),
    Kng2CoreModule.forRoot({
      API_SERVER: environment.API_SERVER,
      loader: [
        'categories',
        /** 'shops'  shop is requiered by product-details:L90 */
      ]
    }),
    AppRoutingModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
  ],
  providers: [
    StatusBar,
    SplashScreen,
    Geolocation,
    Network,
    { provide: LOCALE_ID, useValue: 'fr-FR' },
    { provide: ErrorHandler, useClass: Kio2AdminErrorHandler },
    { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptorProvider, multi: true}
    // { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
  ],
  bootstrap: [Kio2Admin]
})
export class AppModule {}
