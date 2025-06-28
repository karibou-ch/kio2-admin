import { AfterViewInit, Component, OnInit } from '@angular/core';
import { Platform, ToastController, LoadingController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';


import { LoaderService, User, UserService, ConfigKeyStoreEnum, Config } from 'kng2-core';
import pkg from '../../../package.json';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'kio2-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit, AfterViewInit {

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
    const magic = this.$user.getMagicAuthToken();
    this.model.email = magic.email;
    this.model.password = magic.password;

    this.platform.ready().then(() => {
      //
      // reset the auto formfill when token is valid
      setTimeout(()=>{
        if(magic.email && magic.password) {
          this.model.email = magic.email;
          this.model.password = magic.password;
        }
      },2000);

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

  ngAfterViewInit() {
    const remember =this.storageGet(this.KIO2_LOGIN_REMEMBER)
    if (remember) {
      this.model.email = remember.mail;
      this.model.password = remember.password;
      if (remember.password && remember.password !== '') {
        this.keep = true;
      }
    }

    //
    // check existance on token (override localstorage and auto-form-fill)
    setTimeout(()=>{
      const magic = this.$user.getMagicAuthToken();
      this.model.email = magic.email;
      this.model.password = magic.password;

      if(magic.magic) {
        this.login();
      }
    },250);
  }

  get authLink() {
    const magic = this.$user.getMagicAuthToken();
    return magic.magic;
  }


  get isValidEmail() {
    const email = this.model.email || '';
    if(this.authLink) {
      return true;
    }

    const $email = /^[^@]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return $email.test(email);
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
      this.storageSet(this.KIO2_LOGIN_REMEMBER, remember);


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
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch (err) {
      return null;
    }

  }

  storageSet(key: string, value: any) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return value;
    } catch (err) {
      return null;
    }
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
