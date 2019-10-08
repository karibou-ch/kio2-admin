import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController, ModalController } from 'ionic-angular';

import { config, 
         User, 
         Shop,
         ShopService,
         Category} from 'kng2-core';

import moment from 'moment';

@IonicPage()
@Component({
  selector: 'kio2-vendor-create',
  templateUrl: 'vendor-create.html',
})
export class VendorCreatePage {

  user:User;
  defaultShop:Shop=new Shop();
  shop:Shop;
  categories:Category[];
  title:string;
  weekdays={};
  tvaId;
  catalog;

  constructor(
    private modalCtrl: ModalController,
    private navCtrl: NavController, 
    private navParams: NavParams,
    private $shop:ShopService,
    private toast:ToastController    
  ) {
    this.user = this.navParams.get('user')||new User();    
    this.categories = this.navParams.get('categories')||[];
    this.shop=new Shop();
    this.initShop();
  }


  formatToGMT(date:Date){
    return moment(date).format()
  }

  initShop(){
    //
    // Catalog
    if(this.shop.catalog){
      this.catalog=(this.shop.catalog._id)||this.shop.catalog;
    }
    
    //
    // TVA
    if(!this.shop.account.tva){
      this.shop.account.tva={}
    }

    //
    // model for weekdays
    (this.shop.available.weekdays||[]).map(day=>this.weekdays[day]=true);

    //
    // FAQ
    (<any>this.shop.faq)=[];
    
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
    // shop creation
    this.$shop.create(this.shop).subscribe(
      (shop:Shop)=>{
        this.toast.create({
          message: "Enregistré",
          duration: 3000
        }).present();

    
      },
      error=>{
        this.toast.create({
          message: error.error,
          duration: 3000,
          position:'top',
          cssClass:'toast-error'
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

  uploadImageOwner(){
    this.modalCtrl.create("UploadImagePage",{
      user:this.user,
      config:config,
      shopowner:this.shop,
    }).present();
  }

  uploadImageFG(){
    this.modalCtrl.create("UploadImagePage",{
      user:this.user,
      config:config,
      shopfg:this.shop,
    }).present();
  }
}
