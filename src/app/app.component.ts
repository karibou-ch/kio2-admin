import { Component, ViewChild } from '@angular/core';
import { Platform, NavController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { ConfigService, LoaderService, User, UserService } from 'kng2-core';
//import { TabsPage } from '../pages/tabs/tabs';

    ConfigService.setDefaultConfig({
      API_SERVER:'https://api.karibou.ch',
      disqus:'7e23b8cfd1ba48cdb5a3487efcbcdc56', /*karibou dev*/
      // disqus:'a0602093a94647cd948e95fadb9b9e38'; /*karibou prod*/
      mapBoxToken:'pk.eyJ1IjoiZ29uemFsZCIsImEiOiJjajR3cW5ybHQwZ3RrMzJvNXJrOWdkbXk5In0.kMW6xbKtCLEYAEo2_BdMjA'
    });


@Component({
  templateUrl: 'app.html'
})
export class Kio2Aadmin {
  rootPage: any = 'login';
  @ViewChild('adminNavigation') nav: NavController;
  constructor(
    platform: Platform,
    statusBar: StatusBar,
    splashScreen: SplashScreen,
    private $loader: LoaderService,
    private $user: UserService
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

    this.$loader.ready().subscribe(() => {
      //this.rootPage = this.$user.currentUser.isAuthenticated() ? TabsPage : LoginPage;
    });
  }

  logout() {
    this.$user.logout().subscribe(() =>
      this.rootPage = 'login'
    );
  }
}
