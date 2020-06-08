import { Component } from '@angular/core';

import { Platform,ToastController  } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { Network } from '@ionic-native/network/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { LoaderService, User } from 'kng2-core';
import { Router } from '@angular/router';
import { EngineService } from './services/engine.service';
import { interval } from 'rxjs';


@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class Kio2Admin {
  currentUser: User = new User();

  constructor(
    private $engine: EngineService,
    private $network: Network,
    private $loader: LoaderService,
    private $router: Router,
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
      let NET_INFO = false;

      //
      // SIMPLE NETWORK CHECKER INFO
      const neteork = interval(5000).subscribe(() => {
        console.log('Network check',this.$network.type);
        if(this.$network.type.toLocaleLowerCase() === 'none') {
          if(NET_INFO) {
            return;
          }
          this.$toast.create({
            message: 'Problème avec le réseau ',
            position: 'top',
            buttons: [
              {
                text: 'OK',
                role: 'cancel',
                handler: () => {
                }
              }
            ],
            color: 'danger'
          }).then(alert => alert.present());
          NET_INFO = true;
        } else if(NET_INFO){
          this.$toast.dismiss();
          NET_INFO = false;
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
