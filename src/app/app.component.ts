import { Component } from '@angular/core';

import { Platform,ToastController  } from '@ionic/angular';
import { LoaderService, User } from 'kng2-core';
import { Router } from '@angular/router';
import { EngineService } from './services/engine.service';
import { SwUpdate } from '@angular/service-worker';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Network } from '@capacitor/network';


@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class Kio2Admin {
  currentUser: User = new User();
  NETWORK_ISSUE: boolean;
  firstInit: boolean;

  constructor(
    private $engine: EngineService,
    private $loader: LoaderService,
    private $router: Router,
    private $update: SwUpdate,
    private platform: Platform,
    private $toast: ToastController
  ) {
    this.firstInit = true;
    this.storeLoginToken();
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
      StatusBar.setStyle({style:Style.Default}).catch(()=>{});
      SplashScreen.hide();
      this.NETWORK_ISSUE = false;

      this.$update.available.subscribe(event => {
        const msg = 'Une nouvelle version est disponible. Recharger la page maintenant';
        let force = true;
        alert (msg); 
        this.$update.activateUpdate().then(() => {
          document.location.reload(true);
          force=false;
        });
        setTimeout(()=> force && document.location.reload(true),4000)
      });

      //
      // SIMPLE NETWORK CHECKER INFO
      // 'wifi' | 'cellular' | 'none' | 'unknown'
      Network.addListener('networkStatusChange', status => {
        this.NETWORK_ISSUE = ['none','unknown'].indexOf(status.connectionType)>-1||(!window.navigator.onLine);
      });

    });
  }


  onInit(user: User) {

    //
    // update global state
    this.$engine.currentUser = user;
    console.log('----', user);

    if (!user.isAuthenticated()) {
      this.$router.navigateByUrl('/login');
      return;
    }

    if (!this.firstInit) {
      return;
    }

    this.firstInit = false;

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

  storeLoginToken() {
    //
    // check existance on token
    try{
      const token = /token=([^&]*)/gm.exec(window.location.href);
      if(token && token.length>1){
        window['KB_TOKEN'] = token[1];
      }  
    }catch(e){}

  }
}
