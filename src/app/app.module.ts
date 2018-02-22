import { LOCALE_ID, NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { Kio2Aadmin } from './app.component';

import { Kng2CoreModule } from 'kng2-core';
import { HttpModule } from '@angular/http';

import { NativeStorage } from '@ionic-native/native-storage';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';


import { TrackerProvider } from '../providers/tracker/tracker.provider';
import { BackgroundGeolocation } from '@ionic-native/background-geolocation';
import { Geolocation  } from '@ionic-native/geolocation';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/publishReplay';
import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/observable/throw';
import 'rxjs/add/observable/of';

@NgModule({
  declarations: [
    Kio2Aadmin
  ],
  imports: [
    BrowserModule,
    HttpModule,
    Kng2CoreModule.forRoot({
      API_SERVER:'https://api.karibou.ch',
      disqus:'7e23b8cfd1ba48cdb5a3487efcbcdc56', /*karibou dev*/
      // disqus:'a0602093a94647cd948e95fadb9b9e38'; /*karibou prod*/
      mapBoxToken:'pk.eyJ1IjoiZ29uemFsZCIsImEiOiJjajR3cW5ybHQwZ3RrMzJvNXJrOWdkbXk5In0.kMW6xbKtCLEYAEo2_BdMjA'
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
    { provide: LOCALE_ID, useValue: "fr-FR" },  //set locale to french (dates, etc. )
    StatusBar,
    SplashScreen,
    NativeStorage,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    BackgroundGeolocation,
    Geolocation,
    TrackerProvider
  ]
})
export class AppModule {
}
