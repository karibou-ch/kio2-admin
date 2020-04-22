import { Pro } from '@ionic/pro';
import { LOCALE_ID, NgModule, ErrorHandler, Injectable, Injector } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonApp, IonicModule} from '@ionic/angular';
import { Kio2Aadmin } from './app.component';

import { Kng2CoreModule} from 'kng2-core';
import { HttpClientModule } from '@angular/common/http';

import { NativeStorage } from '@ionic-native/native-storage/ngx';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { Geolocation  } from '@ionic-native/geolocation/ngx';
import { LaunchNavigator } from '@ionic-native/launch-navigator/ngx';
import { Dialogs } from '@ionic-native/dialogs/ngx';
import { Network } from '@ionic-native/network/ngx';

//
// environnement
import { environment } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { version } from '../../package.json';


@Injectable()
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
    console.log('---- Kio2AdminErrorHandler', version, err);
    // Pro.monitoring.handleNewError(err);
    // Remove this if you want to disable Ionic's auto exception handling
    // in development mode.
    this.errorHandler && this.errorHandler.handleError(err);
  }
}


@NgModule({
  declarations: [
    Kio2Aadmin
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    Kng2CoreModule.forRoot({
      API_SERVER: environment.API_SERVER,
      loader: [
        'categories',
        'shops'
      ]
    }),
    IonicModule.forRoot(),
    AppRoutingModule
  ],
  bootstrap: [IonApp],
  entryComponents: [
    Kio2Aadmin
  ],
  providers: [
    // preload
    // { provide: APP_INITIALIZER, useFactory: bootstrap, deps: [LoaderService], multi: true },

    // set locale to french (for dates, etc. )
    { provide: LOCALE_ID, useValue: 'fr-FR' },
    { provide: ErrorHandler, useClass: ErrorHandler},
    { provide: ErrorHandler, useClass: Kio2AdminErrorHandler },
    Dialogs,
    Geolocation,
    LaunchNavigator,
    NativeStorage,
    Network,
    StatusBar,
    SplashScreen
  ]
})
export class AppModule {
}
