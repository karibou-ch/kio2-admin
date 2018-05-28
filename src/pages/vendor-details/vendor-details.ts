import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController } from 'ionic-angular';

import { User, 
         Shop,
         ShopService,
         Category} from 'kng2-core';


@IonicPage()
@Component({
  selector: 'kio2-vendor-details',
  templateUrl: 'vendor-details.html',
})
export class VendorDetailsPage {

  user:User;
  defaultShop:Shop=new Shop();
  shop:Shop;
  categories:Category[];
  title:string;
  weekdays={};
  tvaId;
  catalog;

  constructor(
    private navCtrl: NavController, 
    private navParams: NavParams,
    private $shop:ShopService,
    private toast:ToastController    
  ) {
    this.shop = this.navParams.get('shop')||this.defaultShop;
    this.user = this.navParams.get('user')||new User();    
    this.categories = this.navParams.get('categories')||[];
    this.$shop.get(this.shop.urlpath).subscribe(shop=>{
      Object.assign(this.shop,shop);
    })
    this.initShop();    
  }

  initShop(){
    //
    // Catalog
    this.catalog=this.shop.catalog._id||this.shop.catalog;

    //
    // TVA
    if(!this.shop.account.tva){
      this.shop.account.tva={}
    }
    this.tvaId=this.shop.account.tva.number||'';
    //
    // model for weekdays
    (this.shop.available.weekdays||[]).map(day=>this.weekdays[day]=true);

  }

  onDateFrom(){

  }
  onDateTo(){

  }


  doSave(){
    //
    // sync catalog
    if(this.catalog!=this.shop.catalog){
      this.shop.catalog=this.categories.find(c=>c._id==this.catalog);
    }
    

    //
    // sync TVA
    this.shop.account.tva.number=this.tvaId;

    //
    // sync weekdays
    this.shop.available.weekdays=Object.keys(this.weekdays).filter(day=>this.weekdays[day]).map(day=>(parseInt(day)));
    this.$shop.save(this.shop).subscribe(
      (shop:Shop)=>{
        this.toast.create({
          message: "Enregistré",
          duration: 3000
        }).present();

    
      },
      error=>{
        this.toast.create({
          message: error.error,
          duration: 3000
        }).present();
      }     
    )
  }

  doExit(){
    this.navCtrl.pop();
  }

  getCatalog(){
    return this.categories.filter(cat=>cat.active&&cat.type=='Catalog');
  }
}
