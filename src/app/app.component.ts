import { Component, ViewChild, ChangeDetectorRef, NgZone } from '@angular/core';
import { Platform, NavController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { LoaderService, User, UserService } from 'kng2-core';

import localeFr from '@angular/common/locales/fr';
//
// the second parameter 'fr' is optional
import { registerLocaleData } from '@angular/common';
registerLocaleData(localeFr, 'fr');


@Component({
  templateUrl: 'app.html'
})
export class Kio2Aadmin {
  currentUser:User=new User();
  rootPage: any ;
  @ViewChild('adminNavigation') nav: NavController;

  constructor(
    private $loader: LoaderService,
    private zone:NgZone,
    private platform: Platform,
    private statusBar: StatusBar,
    private splashScreen: SplashScreen,
    private $user:UserService
  ) {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();

    });
  }

  onInit(user:User){
    if(!user.isAuthenticated()){
      this.rootPage='LoginPage';
      return;
    }

    //
    // if admin||logistic => shopper
    if(user.isAdmin()||user.hasRole('logistic')){
      this.rootPage='ShopperPage';
      return;
    }

    this.rootPage='OrderCustomersPage';
    //
    // if vendor => orders
  }

  ngOnInit() {

    this.$loader.ready().subscribe((loader) => {
      Object.assign(this.currentUser,loader[1]);
      this.onInit(this.currentUser);
    });

    this.$user.subscribe(this.onInit.bind(this));
  }
}
