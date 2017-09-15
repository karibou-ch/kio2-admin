import { Component, ViewChild } from '@angular/core';
import { Platform, NavController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { ConfigService, LoaderService, User, UserService } from 'kng2-core';



@Component({
  templateUrl: 'app.html'
})
export class Kio2Aadmin {
  currentUser:User=new User();
  rootPage: any = 'ShopperPage';
  @ViewChild('adminNavigation') nav: NavController;
  constructor(
    platform: Platform,
    statusBar: StatusBar,
    splashScreen: SplashScreen,
    private $loader: LoaderService,
    private $user: UserService
  ) {
    platform.ready().then(() => {
      statusBar.styleDefault();
      splashScreen.hide();

    });
  }

  ngOnInit() {

    this.$loader.ready().subscribe((loader) => {
      Object.assign(this.currentUser,loader[1]);
      if(!this.currentUser.isAuthenticated()){
        return this.rootPage='LoginPage';
      }
      //
      // manage shop admin
    });
  }
}
