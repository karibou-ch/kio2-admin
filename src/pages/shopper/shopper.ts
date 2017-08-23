import { Component, ViewChild } from '@angular/core';
import { Content, IonicPage, ModalController, NavController, NavParams } from 'ionic-angular';
import { LoaderService, Order, OrderService, EnumFinancialStatus, User, UserService } from 'kng2-core';
import { ShopperItemComponent } from '../../components/shopper-item/shopper-item'
import 'rxjs/Rx';
import { Observable } from 'rxjs/Rx';
import { TrackerPage }  from '../tracker/tracker';
/**
 * Generated class for the ShopperPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
@IonicPage()
@Component({
  selector: 'page-shopper',
  templateUrl: 'shopper.html'
})
export class ShopperPage {

  @ViewChild(Content) content: Content;


  isAuthenticated:boolean;
  isReady:boolean;
  user: User = new User();
  results: Order[];
  toggledResults: Order[];
  shippingByDay=[];
  openShippings: boolean; //"ouvertes", "fermées"
  nbCabas;

  FLOATING  ={payment:'authorized'};  //not yet handled by producers
  LOCKED={fulfillments:'fulfilled,partial'};  //got by the producers (sub-group of FLOATING)

  filtersOrder:any;

  selectedDate:string=new Date().toISOString();
  currentShippingDate:Date;
  availableOrders:Date[]=[];
  monthOrders:Map<number,Order[]>=new Map();

  constructor(
    private loaderSrv: LoaderService,
    private modalCtrl: ModalController,
    public navCtrl: NavController, 
    public navParams: NavParams,
    private orderSrv: OrderService,
    private userSrv:UserService
    ) {
    this.currentShippingDate=Order.currentShippingDay();
    this.currentShippingDate.setHours(0,0,0);
    this.filtersOrder = this.FLOATING;

  }



  ngOnInit() {
    this.loaderSrv.ready().subscribe((loader) => {
      Object.assign(this.user, loader[1]);
      this.isReady=true;
      this.findAllOrdersForShipping();
    })
  }


  toggleFilter(){

    if(this.filtersOrder.payment){
      this.filtersOrder=this.LOCKED;
    }else{
      this.filtersOrder=this.FLOATING;      
    }
    this.findAllOrdersForShipping();  
  }


  findAllOrdersForShipping(){
    let params={month:(new Date(this.selectedDate).getMonth())+1, year: new Date(this.selectedDate).getFullYear()};
    Object.assign(params,this.filtersOrder);
    this.monthOrders=new Map();
    this.availableOrders=[];
    this.orderSrv.findAllOrders(params).subscribe(orders =>{
      orders.forEach((order:Order)=>{
        order.shipping.when=new Date(order.shipping.when);
        order.shipping.when.setHours(0,0,0)
        if(!this.monthOrders[order.shipping.when.getTime()]){
            this.monthOrders[order.shipping.when.getTime()]=[];
            this.availableOrders.push(new Date(order.shipping.when));
            console.log("availableOrders",this.availableOrders);
        }  
        this.monthOrders[order.shipping.when.getTime()].push(order);
      });
      this.currentShippingDate=Order.currentShippingDay();
    })
}

  openTracker(){
    this.modalCtrl.create(TrackerPage, {results: this.monthOrders[this.currentShippingDate.getTime()]}).present();
  }

}
