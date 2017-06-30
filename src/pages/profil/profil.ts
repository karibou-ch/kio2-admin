import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { LoginPage } from '../login/login';
import { LoaderService, User, UserService } from 'kng2-core';

/**
 * Generated class for the ProfilPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
@IonicPage()
@Component({
  selector: 'page-profil',
  templateUrl: 'profil.html',
})
export class ProfilPage {

  isReady:boolean;
  user:User = new User();

  constructor(
    private loaderSrv: LoaderService,
    public navCtrl: NavController, 
    public navParams: NavParams,
    private userSrv:UserService
    ) {
  }

  ngOnInit(){
    this.loaderSrv.ready().subscribe((loader) => {
      Object.assign(this.user, loader[1]);
      this.isReady=true;
      console.log('ready in profile');
    })
  }

  logout() {
    this.userSrv.logout().subscribe( () => 
      this.navCtrl.setRoot(LoginPage)
    );
  }

  // ionViewCanEnter() {
  //   return this.userSrv.currentUser.isAuthenticated();
  // }

}
