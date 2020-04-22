import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { User, UserService } from 'kng2-core';
import { Pro } from '@ionic/pro';

@IonicPage({name:'AdminSettingsPage'})
@Component({
  selector: 'kio2-admin-settings',
  templateUrl: 'admin-settings.html',
})
export class AdminSettingsPage {
  availableDates:Date[]=[];
  currentShippingDate:Date;
  toggle:boolean;
  parent:any;
  user:User=new User();
  version:string='';
  sub:any;

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public $user:UserService
  ) {
    this.currentShippingDate = this.navParams.get('current');
    this.availableDates=this.navParams.get('shipping');
    this.parent=this.navParams.get('component');
    this.toggle=this.navParams.get('toggle');
    this.user=this.navParams.get('user')||this.user;
    if(this.availableDates.length){
      this.availableDates=this.availableDates.sort((a:Date,b:Date)=>a.getTime()-b.getTime());
    }

  }

  ngOnInit(){
    Object.assign(this.user,this.$user.currentUser||this.user);
    // this.$user.user$.subscribe(user=>{
    //   Object.assign(this.user,user)
    // });
    this.version=' (v'+Pro.getApp().version+')';
    this.sub=this.parent.doInitOrders.subscribe(([orders,when,dates])=>{
      this.availableDates=(dates||[]).sort((a,b)=>a-b);
    })
  }

  ngOnDestroy(){
    if(this.sub){
      this.sub.unsubscribe();
    }
  }

  ionViewDidLoad() {
  }

  displayOrders(shipping){
    this.parent.initOrders(shipping);
    this.navCtrl.pop();
  }

  goHome(){
    window.location.href='/';
  }

  toggleShippingFilter(){
    this.parent.toggleShippingFilter();
  }

  openCustomers(){
    this.navCtrl.pop();
    this.navCtrl.push('CustomersPage');
  }
  
  openProducts(){
    this.navCtrl.pop();
    this.navCtrl.push('ProductsPage',{
      user:this.user      
    });    
  }

  openProfile(){
    this.navCtrl.pop();
    this.navCtrl.push('ProfilPage');
  }
 
  openOrders(){
    this.navCtrl.pop();
    this.navCtrl.push('OrderCustomersPage');    
  }

  openVendors(){
    this.navCtrl.pop();
    this.navCtrl.push('VendorPage',{
      user:this.user      
    });        
  }

  openReports(){
    let month=this.currentShippingDate.getMonth()+1;
    let year=this.currentShippingDate.getFullYear();     

    this.navCtrl.pop();
    this.navCtrl.push('ReportPage',{
      user:this.user,      
      month:month,
      year:year
    });        
  }
  
}
