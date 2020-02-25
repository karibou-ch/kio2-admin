import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, ToastController } from 'ionic-angular';
import { Product, User, Config, ProductService, Shop } from 'kng2-core';


/**
 * Generated class for the UploadImagePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'kio2-upload-image',
  templateUrl: 'upload-image.html',
})
export class UploadImagePage {

  config:Config;
  user:User;
  product:Product;
  shopfg:Shop;
  shopowner:Shop;
  shoplogo:Shop;
  image:string;
  pubUpcare:string;

  constructor(
    private alertCtrl: ToastController,
    public viewCtrl:ViewController,
    public navCtrl: NavController, 
    public navParams: NavParams,
    public $product:ProductService
  ) {
    this.config=navParams.get('config');
    this.user=navParams.get('user');
    this.product=navParams.get('product');
    this.shopfg=navParams.get('shopfg');
    this.shopowner=navParams.get('shopowner');
    this.shoplogo=navParams.get('shoplogo');
    if(this.product){
      this.image=this.product.photo.url;
    }
    if(this.shopfg){
      this.image=this.shopfg.photo.fg;
    }
    if(this.shopowner){
      this.image=this.shopowner.photo.owner;
    }
    if(this.shoplogo){
      this.image=this.shoplogo.photo.logo;
    }

    if(this.config){
      this.pubUpcare = this.config.shared.keys.pubUpcare;
    }
  }

  isReady(){
    return (this.config&&this.user);
  }

  ionViewDidLoad() {
    
  }

  onDialogOpen(dialog){
    dialog.done(dlg=>{
      if(dlg.state()=='rejected'){
        this.showMsg("Attention, la taille maximum d'une image est limitée à 150kb");
      }
    })
  }

  onUpload($uc){
    //this.image="//ucarecdn.com/"+$uc.uuid+"/";
    this.image=$uc.cdnUrl.replace('https:','');
    if(this.product){
      this.product.photo.url=this.image;
    }
    if(this.shopfg){
      this.shopfg.photo.fg=this.image;
    }
    if(this.shopowner){
      this.shopowner.photo.owner=this.image;
    }
    if(this.shoplogo){
      this.shoplogo.photo.logo=this.image;
    }

  }  

  showMsg(msg) {
    this.alertCtrl.create({
      message: msg,
      duration: 3000
    }).present();
  }

  ucValidator(info,more){
    console.log('DEBUG uc --',info)
    console.log('DEBUG uc --',more)
    if (info.size !== null && info.size > 170 * 1024) {
      // throw new Error("fileMaximumSize");
    }  
  }



}
