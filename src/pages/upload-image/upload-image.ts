import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, ToastController } from 'ionic-angular';
import { Product, User, Config, ProductService } from 'kng2-core';

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
    this.image=this.product.photo.url;

    if(this.config){
      this.pubUpcare = this.config.shared.keys.pubUpcare;
    }
  }

  isReady(){
    return (this.config&&this.user&&this.product&&true);
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
    // console.log('---- upload',$uc);
    this.image=this.product.photo.url="//ucarecdn.com/"+$uc.uuid+"/";
  }  

  showMsg(msg) {
    this.alertCtrl.create({
      message: msg,
      duration: 3000
    }).present();
  }

  ucValidator(info){
      if (info.size !== null && info.size > 150 * 1024) {
      // console.log('---- validator',info,150*1024)
      throw new Error("fileMaximumSize");
    }  
  }



}
