import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController } from 'ionic-angular';
import { LoaderService, ShopService, User, Shop, Category } from 'kng2-core';


@IonicPage()
@Component({
  selector: 'kio2-vendor',
  templateUrl: 'vendor.html',
})
export class VendorPage {

  user:User=new User();
  isReady:boolean;
  cache:any;
  shops:Shop[];
  categories:Category[];

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    private $loader: LoaderService,
    private $shop: ShopService,
    private toast:ToastController
  ) {
    this.cache={
      active:true,
      search:'',
      shops:[],
      step:50,
      start:0
    }
    
  }


  ngOnInit() {
    let params={
    };
    this.$loader.ready().subscribe((loader) => {
      this.isReady=true;
      Object.assign(this.user, loader[1]);
      this.categories=(loader[2]||[]);

      //
      // all available shops      
      if(this.user.isAdmin()){
        this.cache.shops=(loader[3]||[]).sort(this.sortByVendor);
      }else{
        this.cache.shops=this.user.shops||[];
      }

      this.shops=this.cache.shops;

      this.$shop.shop$.subscribe(
        shop=>{
          this.cache.shops.some((origin,i)=>{
            if(shop.urlpath===origin.urlpath){
              this.cache.shops[i]=shop;
              return true
            }
            return false;
          })
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

  openDetails(shop:Shop){
    this.navCtrl.push('VendorDetailsPage',{
      shop:shop,
      user:this.user,
      categories:this.categories
    });
  }

  onSearchInput($event){
    let search=this.cache.search.toLocaleLowerCase();
    if(search.length<3){
      return this.shops=this.cache.shops;
    }

    this.shops=this.cache.shops.filter((shop:Shop)=>{
      return (shop.name+
        shop.description).toLocaleLowerCase().indexOf(search)>-1;
    });
  }

  onSearchCancel($event){
    this.cache.search='';
    this.cache.start=0;
    this.shops=this.cache.shops;
  }

  sortByVendor(p1:Shop,p2:Shop){
    if(p1.available.active){
      return -1;
    }
    if(p2.available.active){
      return 1;
    }
    
    return p1.urlpath.localeCompare(p2.urlpath);
  }
  
}
