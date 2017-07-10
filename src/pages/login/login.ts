import { Component } from '@angular/core';
import { AlertController, IonicPage, Loading, LoadingController, NavController, NavParams } from 'ionic-angular';
import { LoaderService, User, UserService } from 'kng2-core';
import { TabsPage } from '../tabs/tabs';

/**
 * Generated class for the LoginPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
@IonicPage()
@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
})
export class LoginPage {

  user: User = new User();
  model: any = {};
  status;
  isReady:boolean=false;
  loader:Loading;

  constructor(
    private alertCtrl: AlertController,
    private loaderSrv: LoaderService,
    public loadingCtrl: LoadingController,
    public navCtrl: NavController, 
    public navParams: NavParams,
    private userSrv: UserService
              
              ) {
  }

  ngOnInit() {
    this.loaderSrv.ready().subscribe((loader) => {
      Object.assign(this.user, loader[1]);
      this.isReady=true;

      if(this.userSrv.currentUser.isAuthenticated()) this.navCtrl.setRoot(TabsPage);
        
    
    });
    
  }

  //TODO checker rôle à la connexion. Modifier comportement si non logistique | admin

  login() {
    this.isReady = false;  //to hide submit button after submitting
    this.showLoading();
    this.userSrv.login({
      email: this.model.email,
      password: this.model.password,
      provider: "local"
    }).subscribe(
    (allowed) => {
        if (this.userSrv.currentUser.isAuthenticated()) this.navCtrl.setRoot(TabsPage);
        else this.showError('Login invalide');
      }
    );  
  }


  showLoading() {
    this.loader = this.loadingCtrl.create({
      spinner: "crescent",
      content: "Connexion en cours...",
      dismissOnPageChange: true
    });
    this.loader.present();
  }

  showError(text) {
    this.loader.dismiss();
 
    let alert = this.alertCtrl.create({
      title: 'Error de connexion',
      subTitle: text,
      buttons: ['OK']
    });
    alert.present(prompt);
  }

}
