import { Component } from '@angular/core';
import { Platform,ToastController, IonicPage, Loading, LoadingController, NavController, NavParams } from 'ionic-angular';
import { LoaderService, User, UserService, ConfigKeyStoreEnum } from 'kng2-core';

import { NativeStorage } from '@ionic-native/native-storage';
import { Pro } from '@ionic/pro';

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

  VERSION:string="";
  siteName:string="";
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
    if(Pro.getApp()){
      this.VERSION="- version "+Pro.getApp().version;
    }
    this.platform.ready().then(() => {
      this.nativeStorage.getItem(this.KIO2_LOGIN_REMEMBER).then(remember=>{
        this.model.email=remember.mail;        
        this.model.password=remember.password;
        if(remember.password&&remember.password!=''){
          this.keep=true;
        }
      },(error)=>{
        // using ionic serve --livereload & nativestorage doesnt work 
        console.log('-- ERROR get',this.KIO2_LOGIN_REMEMBER,error)
      });
    });

    this.$loader.ready().subscribe((loader) => {
      this.siteName=loader[0].shared.home.siteName.fr;
      Object.assign(this.user, loader[1]);
      this.isReady=true;        
      //
      // use localstorage
      // https://stackoverflow.com/questions/37318472/ionic-2-app-remember-user-on-the-device      
    });
    
  }


  isValidEmail(){
    return /\S+@\S+\.\S+/.test(this.model.email||'');
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
        console.log('-- LOGIN ERROR storage',this.KIO2_LOGIN_REMEMBER,error)
        // using ionic serve --livereload & nativestorage doesnt work 
      });

      
      if(user.isAuthenticated()){
        this.loader.dismiss(); 
        try{
          window.location.href='/'
        }catch(e){}
        return ;
      }
      this.showError("Erreur d'authentification :-((");
    },error=>{
      this.showError(error.error);
    });  
  }

  resetPassword(){
    this.$user.recover(this.model.email).subscribe(()=>{
      this.alertCtrl.create({
        message: "Nouveau mot de passe envoyé à "+this.model.email,
        duration: 5000
      }).present();  
    },error=>{
      this.showError(error.error);
    })
  }


  showLoading() {
    this.isReady=true;
    this.loader = this.loadingCtrl.create({
      spinner: "crescent",
      content: "Connexion en cours...",
      dismissOnPageChange: true
    });
    this.loader.present();
  }

  showError(msg) {
    this.isReady=true;
    this.loader.dismiss(); 
    this.alertCtrl.create({
      message: msg,
      duration: 3000
    }).present();
  }

}
