import { LOCALE_ID, NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MyApp } from './app.component';

import { Kng2CoreModule } from 'kng2-core';
import { HttpModule } from '@angular/http';

import { ShopperPage }  from '../pages/shopper/shopper';
import { CollectePage }  from '../pages/collecte/collecte';
import { ProfilPage }  from '../pages/profil/profil';
import { LoginPage } from '../pages/login/login'

import { TabsPage } from '../pages/tabs/tabs';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

@NgModule({
  declarations: [
    MyApp,
    ShopperPage,
    CollectePage,
    ProfilPage,
    LoginPage,
    TabsPage
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
    TabsPage
  ],
  providers: [
    { provide: LOCALE_ID, useValue: "fr-FR" },  //set locale to french (dates, etc. )
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {}
