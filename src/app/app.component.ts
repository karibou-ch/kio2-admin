import { Component } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { LoaderService, User } from 'kng2-core';
import { Router } from '@angular/router';
import { EngineService } from './services/engine.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class Kio2Admin {
  currentUser: User = new User();

  constructor(
    private $engine: EngineService,
    private $loader: LoaderService,
    private $router: Router,
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar
  ) {
    this.initializeApp();
    this.$loader.update().subscribe((ctx) => {
      if (ctx.config) {
        this.$engine.currentConfig = ctx.config;
      }

      if (ctx.user) {
        this.onInit(ctx.user);
      }
    });
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();
    });
  }


  onInit(user: User) {

    //
    // update global state
    this.$engine.currentUser = user;

    if (!user.isAuthenticated()) {
      this.$router.navigateByUrl('/login');
      return;
    }

    //
    // navigation is running
    if(this.$router.url === '/') {
      return;
    }

    //
    // if admin||logistic => shopper
    if (user.isAdmin() || user.hasRole('logistic')) {
      this.$router.navigateByUrl('/shopper');
      return;
    }
  }
}
