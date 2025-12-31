import { Component } from '@angular/core';

import { Platform, ToastController, AlertController } from '@ionic/angular';
import { LoaderService, User, UserService } from 'kng2-core';
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
  NETWORK_APP_ISSUE: boolean;
  firstInit: boolean;
  isLoading: boolean;
  loadingTimeout: any;

  // ✅ Session timeout: reload après 12h
  private initTime: number;
  private sessionCheckInterval: any;
  private readonly SESSION_TIMEOUT_MS = 12 * 60 * 60 * 1000; // 12 heures
  private readonly CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(
    private $engine: EngineService,
    private $loader: LoaderService,
    private $router: Router,
    private $update: SwUpdate,
    private $user: UserService,
    private platform: Platform,
    private $toast: ToastController,
    private $alert: AlertController
  ) {
    this.firstInit = true;
    // let 300ms delay before displaying loading
    this.loadingTimeout = setTimeout(() => this.isLoading = true, 1500);

    //
    // digest magic auth
    this.$user.digestMagicAuth();

    //
    // initialize app
    this.initializeApp();

    // ✅ MIGRATION: ready() supprimé, utiliser update() directement
    this.$loader.update().subscribe((ctx) => {
      if (ctx.config) {
        this.$engine.currentConfig = ctx.config;
      }

      if (ctx.user) {
        this.onInit(ctx.user);
      }
    }, (status) => {
      // ✅ Gestion erreur déplacée ici depuis ancien ready()
      this.NETWORK_APP_ISSUE = true;
      setTimeout(() => document.location.reload(), 8000);
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
        setTimeout(()=>this.NETWORK_ISSUE = ['none','unknown'].indexOf(status.connectionType)>-1||(!window.navigator.onLine),0);
      });

    });
  }


  onInit(user: User) {

    //
    // update global state
    this.$engine.currentUser = user;
    clearTimeout(this.loadingTimeout);
    if (!user.isAuthenticated()) {
      this.$router.navigateByUrl('/login');
      return;
    }

    if (!this.firstInit) {
      return;
    }

    this.firstInit = false;

    // ✅ Session timeout: démarrer le timer de vérification
    this.startSessionCheck();

    setTimeout(() => this.isLoading = false, 6000);
    //
    // navigation is running
    if(this.$router.url === '/') {
      return;
    }

    //
    // if admin||logistic => shopper
    if (user.hasRole('logistic')) {
      this.$router.navigateByUrl('/shopper');
      return;
    }
  }

  // =========================================================================
  // ✅ Session timeout: vérification toutes les 5 minutes
  // =========================================================================

  /**
   * Démarre le timer de vérification de session
   */
  private startSessionCheck() {
    this.initTime = Date.now();
    this.scheduleNextCheck();
  }

  /**
   * Planifie la prochaine vérification
   */
  private scheduleNextCheck() {
    this.sessionCheckInterval = setTimeout(() => {
      this.checkSessionTimeout();
    }, this.CHECK_INTERVAL_MS);
  }

  /**
   * Vérifie si 12h se sont écoulées depuis l'init
   */
  private checkSessionTimeout() {
    const elapsed = Date.now() - this.initTime;

    if (elapsed >= this.SESSION_TIMEOUT_MS) {
      this.showSessionExpiredDialog();
    } else {
      // Replanifier le prochain check
      this.scheduleNextCheck();
    }
  }

  /**
   * Affiche un dialog informant l'utilisateur de recharger
   */
  private async showSessionExpiredDialog() {
    const hours = Math.floor(this.SESSION_TIMEOUT_MS / (60 * 60 * 1000));

    const alert = await this.$alert.create({
      header: 'Session expirée',
      message: `L'application est ouverte depuis plus de ${hours}h. Pour garantir un fonctionnement optimal, veuillez recharger la page.`,
      backdropDismiss: false,
      buttons: [
        {
          text: 'Recharger maintenant',
          handler: () => {
            document.location.reload();
          }
        }
      ]
    });

    await alert.present();
  }

}
