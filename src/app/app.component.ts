import { Component, ViewChild } from '@angular/core';
import { Platform, NavController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { LoaderService, User, UserService } from 'kng2-core';
import { TabsPage } from '../pages/tabs/tabs';
import { LoginPage } from '../pages/login/login';
import { HomePage } from '../pages/home/home'

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage: any = LoginPage;
  @ViewChild('myNav') nav: NavController;
  constructor(
    platform: Platform,
    statusBar: StatusBar,
    splashScreen: SplashScreen,
    private loaderSrv: LoaderService,
    private userSrv: UserService
  ) {

    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      //this.rootPage = LoginPage;
      statusBar.styleDefault();
      splashScreen.hide();

    });
  }

  ngOnInit() {
    this.loaderSrv.ready().subscribe(() => {
      //this.rootPage = this.userSrv.currentUser.isAuthenticated() ? TabsPage : LoginPage;
    });
  }

  logout() {
    this.userSrv.logout().subscribe(() =>
      this.rootPage = LoginPage
    );
  }
}
