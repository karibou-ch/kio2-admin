import { Component, ViewChild, ElementRef } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController } from 'ionic-angular';
import { LoaderService, Product, ProductService, User, Category, Shop } from 'kng2-core';

/**
 * Generated class for the ProductDetailPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-product-detail',
  templateUrl: 'product-detail.html',
})
export class ProductDetailPage {
  user:User;
  categories:Category[]=[];
  title:string;
  product:Product;
  shops:Shop[];
  defaultProduct:Product=new Product();
  @ViewChild('desc') desc: ElementRef;

  constructor(
    private $loader: LoaderService,
    public navCtrl: NavController, 
    public navParams: NavParams,
    public $product: ProductService,
    private toast:ToastController
  ) {
    this.product = this.navParams.get('product')||this.defaultProduct;
    this.title=this.product.title;

    //
    //FIXME hack category should be normalized in server side
    this.product.categories=this.product.categories['_id']||this.categories;
    this.product.vendor=this.product.vendor['_id']||this.product.vendor;


    this.$loader.ready().subscribe((loader) => {
      this.user=loader[1];
      //
      // only interrested by active category
      this.categories=(loader[2]||[]).filter(c=>c.type==='Category'&&c.active);

      //
      // admin can move a product to all shops
      if(this.user.isAdmin()){
        this.shops=loader[3].sort((s1,s2)=>s1.urlpath.localeCompare(s2.urlpath));
      }else{
        this.shops=this.user.shops;
      }
    });
    
  }


  descResize(){
    this.desc.nativeElement.style.height = this.desc.nativeElement.scrollHeight + 'px';
    
  }

  doSave(){
    this.$product.save(this.product).subscribe(
      ()=>{
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

  getCategories(){  
    return this.categories;
  }
  
}
