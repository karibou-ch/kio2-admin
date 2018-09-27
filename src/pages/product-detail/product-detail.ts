import { Component, ViewChild, ElementRef } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController, ModalController, Config, LoadingController, Events } from 'ionic-angular';

import { LoaderService, 
         Product, 
         ProductService, 
         User, 
         Category, 
         Shop } from 'kng2-core';

/**
 * Generated class for the ProductDetailPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'kio2-product-detail',
  templateUrl: 'product-detail.html',
})
export class ProductDetailPage {
  user:User;
  config:Config;
  categories:Category[]=[];
  title:string;
  product:Product;
  shops:Shop[];
  defaultProduct:Product=new Product();
  detailled:boolean=false;
  create:boolean=false;
  
  @ViewChild('desc') desc: ElementRef;

  constructor(
    public events: Events,
    public loadingCtrl: LoadingController,
    public modalCtrl: ModalController,
    public navCtrl: NavController, 
    public navParams: NavParams,
    public toast:ToastController,
    public $loader: LoaderService,
    public $product: ProductService
  ) {
    this.product = this.navParams.get('product')||this.defaultProduct;
    this.user = this.navParams.get('user')||new User();    
    this.config = this.navParams.get('config');    
    this.shops=this.user.shops||[];
    this.create=this.navParams.get('create');    
    
    this.title=this.product.title;

    //
    //FIXME hack category should be normalized in server side
    this.product.categories=this.product.categories['_id']||this.product.categories;
    this.product.vendor=this.product.vendor['_id']||this.product.vendor;


    this.$loader.ready().subscribe((loader) => {
      //
      // only interrested by active category
      this.categories=(loader[2]||[]).filter(c=>c.type==='Category'&&c.active);
      //
      // admin can move a product to all shops
      if(this.user.isAdmin()){
        this.shops=loader[3].sort((s1,s2)=>s1.urlpath.localeCompare(s2.urlpath));
      }

      //
      // default vendor
      if((this.shops.length>0||this.shops.length<3)&&
         (typeof this.product.vendor !='string')){
        this.product.vendor=this.shops[0]['_id'];
      }
    });
    
  }


  descResize(){
    this.desc.nativeElement.style.height = this.desc.nativeElement.scrollHeight + 'px';
    
  }

  isReady(){
    if(!this.product){
      return false;
    }
    return this.product.vendor&&this.product.categories;
  }

  roundN(val,N?){
    if(val<=5){
      return val.toFixed(1);
    }
    if(val<=50){
      return Math.round(val);
    }
    N=N||5;
    return (Math.round(val / N) * N);
  }
  
  portionStr(part,def?){
    if(!def)def='';
    if (!part) return "";
    var m=part.match(/~([0-9.]+) ?(.+)/);
    if(!m&&def)m=def.match(/~([0-9.]+) ?(.+)/);
    if(!m||m.length<2)return '';
    var w=parseFloat(m[1]), unit=(m[2]).toLowerCase();
    return 'une portion entre '+this.roundN(w-w*0.07)+unit+' et '+this.roundN(w+w*0.07)+''+unit;
  }

  doSave(product:Product){
    let loading=this.loadingCtrl.create({
      content: 'Please wait...'
    });
    loading.present();
    let shopowner=this.shops.find(shop=>shop['_id']==product.vendor);
    if(!shopowner||!shopowner.urlpath){
      //
      // TODO DEBUG only
      console.log('---- vendor',this.shops);
      console.log('---- p.vendor',product.vendor);
      console.log('---- shopowner',shopowner);
  
      return this.toast.create({
        message: "La boutique n'a pas été sélectionnée",
        duration: 3000
      }).present();
    }
    

    //this.product.hasFixedPortion();
    let product$=(this.create)?
      this.$product.create(this.product,shopowner.urlpath):this.$product.save(this.product)

    product$.subscribe(
      (product)=>{
        this.create=false;
        this.product.sku=product.sku;
        loading.dismiss();
        this.toast.create({
          message: "Enregistré",
          duration: 3000
        }).present();
      },
      error=>{
        loading.dismiss();
        this.toast.create({
          message: error.error,
          duration: 3000
        }).present();
      }
    )
  }

  doCreate(){
    
  }

  doExit(){
    this.navCtrl.pop();
  }

  getCategories(){  
    return this.categories;
  }

  ionViewDidLeave(){
    this.events.publish('refresh-products',this.product);        
  }

  uploadImage(product:Product){
    this.modalCtrl.create("UploadImagePage",{
      user:this.user,
      config:this.config,
      product:product
    }).present();

  }


}
