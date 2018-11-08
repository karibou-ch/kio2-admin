import { Pro } from '@ionic/pro';
import { LOCALE_ID, NgModule, ErrorHandler, Injectable, Injector } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { Kio2Aadmin } from './app.component';

import { Kng2CoreModule} from 'kng2-core';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { NativeStorage } from '@ionic-native/native-storage';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';


import { TrackerProvider } from '../providers/tracker/tracker.provider';
import { BackgroundGeolocation } from '@ionic-native/background-geolocation';
import { Geolocation  } from '@ionic-native/geolocation';
import { LaunchNavigator } from '@ionic-native/launch-navigator';
import { Dialogs } from '@ionic-native/dialogs';
import { Network } from '@ionic-native/network';

import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/publishReplay';
import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/observable/throw';
import 'rxjs/add/observable/of';
import { TokenInterceptorProvider } from '../providers/token-interceptor/token-interceptor';

//
// make value sync with their sources

var NPM_VERSION=require('../../package.json').version;
var IONIC_APPID=require('../../ionic.config.json').prod_id;

// if(process.env.NODE_ENV){

// }

Pro.init(IONIC_APPID, {
  appVersion: NPM_VERSION
});

@Injectable()
export class Kio2AdminErrorHandler implements ErrorHandler {
  ionicErrorHandler: IonicErrorHandler;

  constructor(injector: Injector) {
    try {
      this.ionicErrorHandler = injector.get(IonicErrorHandler);
    } catch(e) {
      // Unable to get the IonicErrorHandler provider, ensure
      // IonicErrorHandler has been added to the providers list below
    }
  }

  handleError(err: any): void {    
    console.log('---- Kio2AdminErrorHandler',NPM_VERSION,err)
    // Pro.monitoring.handleNewError(err);
    // Remove this if you want to disable Ionic's auto exception handling
    // in development mode.
    this.ionicErrorHandler && this.ionicErrorHandler.handleError(err);
  }
}

//
// dynamic server settings

var SERVER:boolean|string=false;
//SERVER="http://localhost:4000";
//SERVER='http://api.karibou.evaletolab.ch';
//SERVER='https://api.karibou.ch';
//SERVER='http://api.boulangerie-bretzel.ch';

// export function bootstrap($loader: LoaderService) {
//   return () => $loader.ready();
// }

@NgModule({
  declarations: [
    Kio2Aadmin
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    Kng2CoreModule.forRoot({
      API_SERVER:SERVER,
      loader:[
        "categories",
        "shops"
      ]
      
    }),
    IonicModule.forRoot(Kio2Aadmin,{
      preloadModules: false
    })
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    Kio2Aadmin
  ],
  providers: [
    // preload
    // { provide: APP_INITIALIZER, useFactory: bootstrap, deps: [LoaderService], multi: true },

    // set locale to french (for dates, etc. )
    { provide: LOCALE_ID, useValue: "fr-FR" },  
    { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptorProvider, multi: true },
    // {provide: ErrorHandler, useClass: IonicErrorHandler},
    { provide: ErrorHandler, useClass: Kio2AdminErrorHandler },    
    BackgroundGeolocation,
    Dialogs,
    Geolocation,
    LaunchNavigator,
    NativeStorage,
    Network,
    StatusBar,
    SplashScreen,
    TrackerProvider,
    TokenInterceptorProvider
  ]
})
export class AppModule {
}
