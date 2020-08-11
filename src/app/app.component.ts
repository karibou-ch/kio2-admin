import { Component } from '@angular/core';

import { Platform,ToastController  } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { Network } from '@ionic-native/network/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { LoaderService, User } from 'kng2-core';
import { Router } from '@angular/router';
import { EngineService } from './services/engine.service';
import { interval } from 'rxjs';
import { SwUpdate } from '@angular/service-worker';


@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class Kio2Admin {
  currentUser: User = new User();
  NET_INFO: boolean;

  constructor(
    private $engine: EngineService,
    private $network: Network,
    private $loader: LoaderService,
    private $router: Router,
    private $update: SwUpdate,
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private $toast: ToastController
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
      this.NET_INFO = false;

      this.$update.available.subscribe(event => {
        const msg = 'Une nouvelle version est disponible. Recharger la page maintenant';
        if (confirm(msg)) {
          this.$update.activateUpdate().then(() => document.location.reload(true));
        }
      });

      //
      // SIMPLE NETWORK CHECKER INFO
      const neteork = interval(5000).subscribe(() => {
        // console.log('---net',this.$network.type, window.navigator.onLine)
        if((this.$network.type || '').toLocaleLowerCase() === 'none' ||
          !window.navigator.onLine) {
          if (this.NET_INFO) {
            return;
          }
          this.NET_INFO = true;
        } else if (this.NET_INFO) {
          this.NET_INFO = false;
        }
      });
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
