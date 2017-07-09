import { LOCALE_ID, NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MyApp } from './app.component';

import { Kng2CoreModule } from 'kng2-core';
import { HttpModule } from '@angular/http';

import { ShopperPage }  from '../pages/shopper/shopper';
import { CollectePage }  from '../pages/collecte/collecte';
import { ProfilPage }  from '../pages/profil/profil';
import { LoginPage } from '../pages/login/login';
import { TrackerPage }  from '../pages/tracker/tracker';

import { TabsPage } from '../pages/tabs/tabs';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { ShopperItemComponent } from '../components/shopper-item/shopper-item';
import { TopNavigationComponent } from '../components/top-navigation/top-navigation';

import { TrackerProvider } from '../providers/tracker/tracker.provider';
import { BackgroundGeolocation } from '@ionic-native/background-geolocation';
import { Geolocation } from '@ionic-native/geolocation';

@NgModule({
  declarations: [
    MyApp,
    ShopperPage,
    CollectePage,
    ProfilPage,
    LoginPage,
    TabsPage,
    TrackerPage,
    ShopperItemComponent,
    TopNavigationComponent
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    Kng2CoreModule,
    HttpModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    ShopperPage,
    CollectePage,
    ProfilPage,
    LoginPage,
    TabsPage,
    TrackerPage

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
