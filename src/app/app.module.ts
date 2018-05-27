import { Pro } from '@ionic/pro';
import { LOCALE_ID, NgModule, ErrorHandler, Injectable, Injector } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { Kio2Aadmin } from './app.component';

import { Kng2CoreModule } from 'kng2-core';
import { HttpClientModule } from '@angular/common/http';

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

//
// make value sync with their sources
import * as ionic from '../../ionic.config.json';
import * as npm from '../../package.json';


// console.log('---',process.env)
// if(process.env.NODE_ENV){

// }

// let SERVER='http://api.karibou.evaletolab.ch';
let SERVER='https://api.karibou.ch';
//let SERVER='http://api.beta.boulangerie-bretzel.ch';

Pro.init((<any>ionic).app_id, {
  appVersion: (<any>npm).version
})

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
    console.log('---- Kio2AdminErrorHandler',(<any>npm).version,err)
    Pro.monitoring.handleNewError(err);
    // Remove this if you want to disable Ionic's auto exception handling
    // in development mode.
    this.ionicErrorHandler && this.ionicErrorHandler.handleError(err);
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
    // set locale to french (for dates, etc. )
    { provide: LOCALE_ID, useValue: "fr-FR" },  
    // {provide: ErrorHandler, useClass: IonicErrorHandler},
    {provide: ErrorHandler, useClass: Kio2AdminErrorHandler },    
    BackgroundGeolocation,
    Dialogs,
    Geolocation,
    LaunchNavigator,
    NativeStorage,
    Network,
    StatusBar,
    SplashScreen,
    TrackerProvider
  ]
})
export class AppModule {
}
