import { Component } from '@angular/core';
import { App, IonicPage, NavController, NavParams, ToastController } from 'ionic-angular';
import { LoaderService, User, UserService, ConfigKeyStoreEnum, Config, config } from 'kng2-core';
import { NativeStorage } from '@ionic-native/native-storage';

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

  config:Config=config;
  server:string;
  isReady: boolean;
  user: User = new User();
  postalCodes=[];
  
  KIO2_SERVER:string=ConfigKeyStoreEnum[ConfigKeyStoreEnum.KIO2_SERVER];

  constructor(
    private _app: App,
    private $loader: LoaderService,
    public navCtrl: NavController,
    public navParams: NavParams,
    private nativeStorage: NativeStorage,
    private toast:ToastController,
    private $user: UserService
  ) {
  }

  isPC(postal:string){
    let lst=this.user.logistic.postalCode||[];
    return lst.indexOf(postal)!==-1;
  }

  isToggleAll(){
    let lst=this.user.logistic.postalCode||[];
    return lst.length;    
  }

  ngOnInit() {
    this.$loader.ready().subscribe((loader) => {
      this.config=loader[0];
      Object.assign(this.user, loader[1]);
      this.isReady = true;
      //
      // config.shared.shipping.periphery
      this.postalCodes=this.config.shared.user.location.list||[];
    });

    this.$user.subscribe(user=>Object.assign(this.user,user));
    try{      
      this.nativeStorage.getItem(this.KIO2_SERVER).then(server=>this.server=server).catch(e=>{});
    }catch(e){

    }
    
  }

  devMode(){
    this.nativeStorage.setItem(this.KIO2_SERVER, this.server)    
  }

  logout() {
    this.$user.logout().subscribe(() =>
      //this.navCtrl.setRoot(LoginPage)
      this._app.getRootNav().setRoot('LoginPage')
    );
  }

  save(){
    this.$user.save(this.user).subscribe(
      ()=>{
        this.toast.create({
          message: "Enregistré",
          duration: 1000
        }).present();
      },
      error=>{
        this.toast.create({
          message: error.text(),
          duration: 3000
        }).present();

      }
    );    
  }


  toggleAll(){
    let lst=this.user.logistic.postalCode||[];
    if(lst.length){
      this.user.logistic.postalCode=[];
    }else{
      this.user.logistic.postalCode=this.postalCodes;
    }
    this.save();
  }

  togglePC(postal:string){
    let lst=this.user.logistic.postalCode||[];
    let pos=lst.indexOf(postal);
    if(pos===-1){
      lst.push(postal);
    }else{
      lst.splice(pos,1);
    }    
    this.user.logistic.postalCode=lst;
    this.save();
  }
  


}
