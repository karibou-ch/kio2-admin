import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Events, ToastController } from 'ionic-angular';

import { User, 
         Shop,
         ShopService} from 'kng2-core';


@IonicPage()
@Component({
  selector: 'kio2-vendor-details',
  templateUrl: 'vendor-details.html',
})
export class VendorDetailsPage {

  user:User;
  defaultShop:Shop=new Shop();
  shop:Shop;
  title:string;

  constructor(
    private events: Events,
    private navCtrl: NavController, 
    private navParams: NavParams,
    private $shop:ShopService,
    private toast:ToastController    
  ) {
    this.shop = this.navParams.get('shop')||this.defaultShop;
    this.user = this.navParams.get('user')||new User();    

  }


  onDateFrom(){

  }
  onDateTo(){

  }

  doSave(){
    this.$shop.save(this.shop).subscribe(
      (shop:Shop)=>{
        this.toast.create({
          message: "Enregistré",
          duration: 3000
        }).present();

    
      },
      error=>{
        this.toast.create({
          message: error.text(),
          duration: 3000
        }).present();
      }     
    )
  }

  doExit(){
    this.navCtrl.pop();
  }


}
