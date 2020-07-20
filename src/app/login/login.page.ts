import { Component, OnInit } from '@angular/core';
import { Platform, ToastController, LoadingController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';


import { LoaderService, User, UserService, ConfigKeyStoreEnum, Config } from 'kng2-core';
import { version } from '../../../package.json';

@Component({
  selector: 'kio2-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {

  VERSION: string;
  siteName: string;
  user: User;
  model: any = {};
  status;
  keep: boolean;
  isReady: boolean;
  config: Config;

  KIO2_LOGIN_REMEMBER: string = ConfigKeyStoreEnum[ConfigKeyStoreEnum.KIO2_LOGIN_REMEMBER];

  constructor(
    private alertCtrl: ToastController,
    private $loader: LoaderService,
    public $loading: LoadingController,
    public platform: Platform,
    private $route: ActivatedRoute,
    private $user: UserService
  ) {
    this.VERSION = version;
    this.siteName = '';
    this.isReady = false;
    const loader = this.$route.snapshot.data.loader;
    this.config = loader[0];
    this.user = loader[1];
  }

  ngOnInit() {
    this.platform.ready().then(() => {
      this.storageGet(this.KIO2_LOGIN_REMEMBER).then(remember => {
        if (!remember) {
          return;
        }
        this.model.email = remember.mail;
        this.model.password = remember.password;
        if (remember.password && remember.password !== '') {
          this.keep = true;
        }
      }, (error) => {
        // using ionic serve --livereload & nativestorage doesnt work
        console.log('-- ERROR get', this.KIO2_LOGIN_REMEMBER, error);
      });
    });


    this.isReady = true;
    const isHub = this.config.shared.hub && this.config.shared.hub.siteName;
    this.siteName = (isHub) ? (this.config.shared.hub.siteName.fr ) : 'K';
    Object.assign(this.user, this.user);
    this.isReady = true;

    if(this.user.isAuthenticated()) {
      window.location.href = '/';
    }
    //
    // use localstorage
    // https://stackoverflow.com/questions/37318472/ionic-2-app-remember-user-on-the-device
  }


  isValidEmail() {
    return /\S+@\S+\.\S+/.test(this.model.email || '');
  }

  login() {
    this.isReady = false;  // to hide submit button after submitting
    this.showLoading();
    this.$user.login({
      email: this.model.email,
      password: this.model.password,
      provider: 'local'
    }).subscribe((user: User) => {

      //
      // save remember
      const remember: any = {};
      remember.mail = this.model.email;
      remember.password = (this.keep) ? this.model.password : '';
      this.storageSet(this.KIO2_LOGIN_REMEMBER, remember)
        .catch(error => {
          console.log('-- LOGIN ERROR storage', this.KIO2_LOGIN_REMEMBER, error);
          // using ionic serve --livereload & nativestorage doesnt work
        });


      if (user.isAuthenticated()) {
        try {
          window.location.href = '/';
          this.$loading.dismiss();
        } catch (e) { }
        return;
      }
      this.showError('Erreur d\'authentification :-((');
    }, error => {
      this.showError('Erreur d\'authentification :-((');
    });
  }


  resetPassword() {
    this.$user.recover(this.model.email).subscribe(() => {
      this.alertCtrl.create({
        message: 'Nouveau mot de passe envoyé à ' + this.model.email,
        duration: 5000
      }).then(alert => alert.present());
    }, error => {
      this.showError(error.error);
    });
  }

  storageGet(key: string): any {
    return new Promise((resolve, reject) => {
      try {
        const parsed = JSON.parse(localStorage.getItem(key));
        resolve(parsed);
      } catch (err) {
        return reject(err);
      }
    });
  }

  storageSet(key: string, value: any) {
    return new Promise((resolve, reject) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  showLoading() {
    this.isReady = true;
    return this.$loading.create({
      spinner: 'crescent',
      message: 'Connexion en cours...',
    }).then(loader => loader.present());
  }

  showError(msg) {
    this.isReady = true;
    this.$loading.dismiss();
    this.alertCtrl.create({
      message: msg,
      duration: 3000
    }).then(alert => alert.present());
  }

}
