import { Component } from '@angular/core';
import { Platform,ToastController, IonicPage, Loading, LoadingController, NavController, NavParams } from 'ionic-angular';
import { LoaderService, User, UserService, ConfigKeyStoreEnum } from 'kng2-core';

import { NativeStorage } from '@ionic-native/native-storage';

/**
 * Generated class for the LoginPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
@IonicPage({
  name:'LoginPage'
})
@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
})
export class LoginPage {

  user: User = new User();
  model: any = {};
  status;
  keep:boolean;
  isReady:boolean=false;
  loader:Loading;

  KIO2_LOGIN_REMEMBER:string=ConfigKeyStoreEnum[ConfigKeyStoreEnum.KIO2_LOGIN_REMEMBER];

  constructor(
    private alertCtrl: ToastController,
    private $loader: LoaderService,
    public loadingCtrl: LoadingController,
    private nativeStorage: NativeStorage,
    public navCtrl: NavController, 
    public navParams: NavParams,
    public platform: Platform,
    private $user: UserService
  ) {
  }

  ngOnInit() {
    this.platform.ready().then(() => {
      this.nativeStorage.getItem(this.KIO2_LOGIN_REMEMBER).then(remember=>{
        this.model.email=remember.mail;        
        this.model.password=remember.password;
      },(error)=>{
        // using ionic serve --livereload & nativestorage doesnt work 
        console.log('-- ERROR get',this.KIO2_LOGIN_REMEMBER,error)
      });
    });

    this.$loader.ready().subscribe((loader) => {
      Object.assign(this.user, loader[1]);
      this.isReady=true;        
      //
      // use localstorage
      // https://stackoverflow.com/questions/37318472/ionic-2-app-remember-user-on-the-device      
    });
    
  }


  login() {
    this.isReady = false;  //to hide submit button after submitting
    this.showLoading();
    this.$user.login({
      email: this.model.email,
      password: this.model.password,
      provider: "local"
    }).subscribe((user:User) => {
      
      // 
      // save remember  
      var remember:any={};
      remember.mail=this.model.email;
      remember.password=(this.keep)? this.model.password:'';      
      this.nativeStorage.setItem(this.KIO2_LOGIN_REMEMBER, remember)
      .catch(error=>{
        console.log('-- ERROR set',this.KIO2_LOGIN_REMEMBER,error)
        // using ionic serve --livereload & nativestorage doesnt work 
      });

      
      if(user.isAuthenticated()){
        return ;
      }
      this.showError("Erreur d'authentification :-((");
    });  
  }


  showLoading() {
    this.loader = this.loadingCtrl.create({
      spinner: "crescent",
      content: "Connexion en cours...",
      dismissOnPageChange: true
    });
    this.loader.present();
  }

  showError(msg) {
    this.loader.dismiss(); 
    this.alertCtrl.create({
      message: msg,
      duration: 3000
    }).present();
  }

}
