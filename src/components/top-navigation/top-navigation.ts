import { Component, Input } from '@angular/core';
import { AlertController, App, NavController, Events, LoadingController, Loading, Platform } from 'ionic-angular';
import { LoaderService, User, UserService } from 'kng2-core';

import { LoginPage }  from '../../pages/login/login';
import { ProfilPage } from '../../pages/profil/profil';
import { Subscription } from 'rxjs';


@Component({
  selector: 'top-navigation',
  templateUrl: 'top-navigation.html'
})
export class TopNavigationComponent {


  shortname:string;
  onResume:Subscription;
  loader:Loading;
  isReady: boolean;
  user: User = new User;

  @Input('home') home:boolean;
  @Input('title') title:string;


  constructor(    
    public alertCtrl: AlertController,
    private _app:App,
    public events: Events,
    private loaderSrv: LoaderService,
    public loading : LoadingController,
    public navCtrl: NavController, 
    public platform: Platform,
    private userSrv: UserService
  ) {


    //
    // checking login on resume
    this.onResume = platform.resume.subscribe(() => {
      this.loader = this.loading.create({
        content: "Veuillez patienter..."
      });
      
      this.loader.present();
      if(this.userSrv.currentUser)
        this.loader.dismiss();
      else this._app.getRootNav().setRoot(LoginPage);
        
    }); 
    
  }


  ngOnDestroy() {
    // always unsubscribe your subscriptions to prevent leaks
    this.onResume.unsubscribe();
  }

  // tryLogin(){
  // }

  ngOnInit(){
    this.loaderSrv.ready().subscribe((loader) => {
      Object.assign(this.user, loader[1]);
      this.isReady = true;
    })
    // this.auth.getAccount().subscribe(
    //   patient =>{
    //     this.shortname=patient.given_name[0]+'. '+patient.family_name;
    //   },
    //   error =>{
    //     // auto login on error
    //   }
    // );

    // this.events.subscribe('user:updated', () => {
    //   let patient=this.auth.patient
    //   this.shortname=patient.given_name[0]+'. '+patient.family_name;
    // });

  }

  isActiveButton(){
    return (ProfilPage!==this.navCtrl.getActive().component);
  }
  doDisplayAccount(){
    this.navCtrl.setRoot(ProfilPage);
  }

  logout(){
    this.userSrv.logout().subscribe(() =>
      //this.navCtrl.setRoot(LoginPage)
      this._app.getRootNav().setRoot(LoginPage)
    );
  }



  displayError(title, err){
    this.loader.dismiss()    
    this.alertCtrl.create({
      title: title,
      subTitle: err.message,
      buttons: ['OK']
    }).present();
  }


}
