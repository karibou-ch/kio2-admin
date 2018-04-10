import { Component } from '@angular/core';
import { App, IonicPage, NavController, NavParams } from 'ionic-angular';
import { LoaderService, User, UserService } from 'kng2-core';

/**
 * Generated class for the ProfilPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
@IonicPage({name:'ProfilPage'})
@Component({
  selector: 'page-profil',
  templateUrl: 'profil.html',
})
export class ProfilPage {

  isReady: boolean;
  user: User = new User();

  constructor(
    private _app: App,
    private $loader: LoaderService,
    public navCtrl: NavController,
    public navParams: NavParams,
    private $user: UserService
  ) {
  }

  ngOnInit() {
    this.$loader.ready().subscribe((loader) => {
      Object.assign(this.user, loader[1]);
      this.isReady = true;
    });

    this.$user.subscribe(user=>Object.assign(this.user,user));
  }

  devMode(){
    
  }

  logout() {
    this.$user.logout().subscribe(() =>
      //this.navCtrl.setRoot(LoginPage)
      this._app.getRootNav().setRoot('LoginPage')
    );
  }



}
