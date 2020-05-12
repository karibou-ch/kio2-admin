import { NgModule, LOCALE_ID, Injectable, ErrorHandler, Injector } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { Kio2Admin } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { Kng2CoreModule } from 'kng2-core';
import { environment } from 'src/environments/environment';
import { HttpClientModule } from '@angular/common/http';
import { Geolocation } from '@ionic-native/geolocation/ngx';

//
// local data
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
registerLocaleData(localeFr);


//
// preparing Sentry feedback
@Injectable({ providedIn: 'root' })
export class Kio2AdminErrorHandler implements ErrorHandler {
  errorHandler: ErrorHandler;

  constructor(injector: Injector) {
    try {
      this.errorHandler = injector.get(ErrorHandler);
    } catch (e) {
      // Unable to get the IonicErrorHandler provider, ensure
      // IonicErrorHandler has been added to the providers list below
    }
  }

  handleError(err: any): void {
    console.log('---- Kio2AdminErrorHandler', 'version', err);
    // Pro.monitoring.handleNewError(err);
    // Remove this if you want to disable Ionic's auto exception handling
    // in development mode.
    this.errorHandler && this.errorHandler.handleError(err);
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
      ]
    }),
    AppRoutingModule
  ],
  providers: [
    StatusBar,
    SplashScreen,
    Geolocation,
    { provide: LOCALE_ID, useValue: 'fr-FR' },
    // { provide: ErrorHandler, useClass: Kio2AdminErrorHandler },
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }  ],
  bootstrap: [Kio2Admin]
})
export class AppModule {}
