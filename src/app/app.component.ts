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
    this.configSrc.setDefaultConfig({
      API_SERVER:'http://localhost:4000',
      disqus:'7e23b8cfd1ba48cdb5a3487efcbcdc56', /*karibou dev*/
      // disqus:'a0602093a94647cd948e95fadb9b9e38'; /*karibou prod*/
      mapBoxToken:'pk.eyJ1IjoiZ29uemFsZCIsImEiOiJjajR3cW5ybHQwZ3RrMzJvNXJrOWdkbXk5In0.kMW6xbKtCLEYAEo2_BdMjA'
    });
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
