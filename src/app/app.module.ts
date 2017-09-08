import { LOCALE_ID, NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { Kio2Aadmin } from './app.component';

import { Kng2CoreModule } from 'kng2-core';
import { HttpModule } from '@angular/http';

import { TabsPage } from '../pages/tabs/tabs';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';


import { TrackerProvider } from '../providers/tracker/tracker.provider';
import { BackgroundGeolocation } from '@ionic-native/background-geolocation';
import { Geolocation } from '@ionic-native/geolocation';

@NgModule({
  declarations: [
    Kio2Aadmin,
    TabsPage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(Kio2Aadmin,{
      preloadModules: false
    }),
    Kng2CoreModule,
    HttpModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    Kio2Aadmin,
    TabsPage
  ],
  providers: [
    { provide: LOCALE_ID, useValue: "fr-FR" },  //set locale to french (dates, etc. )
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    BackgroundGeolocation,
    Geolocation,
    TrackerProvider
  ]
})
export class AppModule {}
