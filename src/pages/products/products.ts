import { Component } from '@angular/core';
import { IonicPage, Events, ToastController, NavController, NavParams } from 'ionic-angular';

import { LoaderService, Order, User, ProductService, Product } from 'kng2-core';

/**
 * Generated class for the ProductsPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
@IonicPage()
@Component({
  selector: 'kio2-products',
  templateUrl: 'products.html',
})
export class ProductsPage {

  isReady: boolean;
  noShop:boolean;
  user: User = new User();
  products:Product[];
  cache:any;
  

  constructor(
    public events: Events,
    public navCtrl: NavController,
    public navParams: NavParams,
    private $loader: LoaderService,
    private $product: ProductService,
    private toast:ToastController
  ) {
    this.cache={
      active:true,
      search:'',
      products:[],
      step:50,
      start:0
    }
  }


  doInfinite(infiniteScroll) {
    if(this.cache.search!==''){
      return infiniteScroll.complete();
    }
    setTimeout(() => {
      this.cache.start+=this.cache.step;
      this.products=this.sliceProducts();
      infiniteScroll.complete();    
    },100);    
  }  


  getStateLabel(product:Product){
    return product.attributes.available?'Disponible pour la vente':'Indisponible pour la vente';
  }

  ionViewDidLoad() {

  }
  
  ngOnInit() {
    let params={
    };
    this.$loader.ready().subscribe((loader) => {
      this.isReady=true;
      Object.assign(this.user, loader[1]);

      //
      // get select products
      if(this.user.shops.length){
        params['shopname']=this.user.shops.map(shop=>shop.urlpath);
      }
      if(!this.user.isAdmin()&&!this.user.shops.length){
        params['shopname']=['no-shop-to-list'];
        this.noShop=true;
      }

      this.$product.select(params).subscribe(
        (products:Product[])=>{
          //
          // FIXME remove filter, server should clean orphan products!
          this.cache.products=products.filter(p=>p.vendor).sort(this.sortByVendorAndStock);
          this.products=this.sliceProducts();
        }
      )
    });
  }

  onDone(msg){
    this.toast.create({
      message: msg,
      duration: 3000
    }).present();
  }

  onInitOrders([orders,shipping]:[Order[],Date]){
  }  


  openDetails(product:Product){
    this.navCtrl.push('ProductDetailPage',{
      product:product,
      user:this.user
    });

  }

  onSearchInput($event){
    let search=this.cache.search.toLocaleLowerCase();
    if(search.length<3){
      return this.products=this.sliceProducts();
    }
    this.products=this.cache.products.filter((product:Product)=>{
      return (product.title+
        product.details.description+
        product.vendor.name+
        product.details.keywords).toLocaleLowerCase().indexOf(search)>-1;
    });
  }

  onSearchCancel($event){
    this.cache.search='';
    this.cache.start=0;
    this.products=this.sliceProducts();
  }
  

  resume(product:Product){
    //product.pricing.price
    //product.pricing.stock
    //product.pricing.part
    //product.attributes.available
    //product.attributes.discount
    return product.pricing.price
  }

  //
  // infiniteScroll
  sliceProducts(){
    return this.cache.products.slice(0,this.cache.start+this.cache.step);
  }


  sortByVendorAndStock(p1:Product,p2:Product){
    let vendor=(p1.vendor).urlpath.localeCompare(p2.vendor.urlpath)
    if(vendor!=0){
      return vendor;
    }
    // order by stock
    return p1.pricing.stock-p2.pricing.stock;
  }
  
  toggleActive(product:Product){
    product.attributes.available=!product.attributes.available;
    this.$product.save(product).subscribe(
      ()=>{
        this.onDone('Enregistré');
      },
      (error)=>{
        this.onDone(error.error)
      }
    )
  }  




}
