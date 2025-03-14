import { Component, OnInit } from '@angular/core';
import { Platform, ToastController, LoadingController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';


import { LoaderService, User, UserService, ConfigKeyStoreEnum, Config } from 'kng2-core';
import pkg from '../../../package.json';

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
    this.VERSION = pkg.version;
    this.siteName = '';
    this.isReady = false;
    const loader = this.$route.snapshot.data['loader'];
    this.config = loader[0];
    this.user = loader[1];
  }

  ngOnInit() {

    //
    // check existance on token
    let defaultEmail;
    let defaultPassword;
    if (window['KB_TOKEN']) {
      // FIXME split char is hardcoded
      try{
        const fields = atob(window['KB_TOKEN']).split('::');
        if (fields.length === 2) {
          this.model.email = defaultEmail = fields[0];
          this.model.password = defaultPassword = fields[1];
        }
      }catch(e) {}
    }

    if (window['KB_authlink']) {
      this.model.password = window['KB_authlink'];
      console.log('---- DBG authlink', this.model.password);
    }

    this.platform.ready().then(() => {
      //
      // reset the auto formfill when token is valid
      setTimeout(()=>{
        if(defaultEmail && defaultPassword) {
          this.model.email = defaultEmail;
          this.model.password = defaultPassword;
        }
      },2000);
      this.storageGet(this.KIO2_LOGIN_REMEMBER).then(remember => {
        if (!remember) {
          return;
        }
        this.model.email = defaultEmail || remember.mail;
        this.model.password = defaultPassword || remember.password;
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

  get authLink() {
    return !!window['KB_authlink'];
  }


  get isValidEmail() {
    const email = this.model.email || '';
    if(window['KB_authlink']) {
      return email.length > 1;
    }
    return /\S+@\S+\.\S+/.test(email || '');
  }

  async login() {
    this.isReady = false;  // to hide submit button after submitting
    await this.showLoading();
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
        } catch (e) {
          console.log('------',e)
        }
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
        resolve(value);
      } catch (err) {
        reject(err);
      }
    });
  }

  async showLoading() {
    this.isReady = true;
    const loader = await this.$loading.create({
      spinner: 'crescent',
      message: 'Connexion en cours...',
    });
    return loader.present();
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
