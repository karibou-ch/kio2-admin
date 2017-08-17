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
  weekDay;
  openShippings: boolean;
  nbCabas;

  OPEN  ={payment:'authorized'};
  CLOSED={fulfillments:'fulfilled,partial'};

  filtersOrder:any={
    fulfillments:'fulfilled,partial'
  };

  selectedDate:Date=new Date();
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
    this.currentShippingDate.setHours(0,0,0)

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
      this.filtersOrder=this.CLOSED;
    }else{
      this.filtersOrder=this.OPEN;      
    }
    this.findAllOrdersForShipping();  
  }


  findAllOrdersForShipping(){
    let params={month:(this.selectedDate.getMonth())+1};
    Object.assign(params,this.filtersOrder);
    this.monthOrders=new Map();
    this.availableOrders=[];
    this.orderSrv.findAllOrders(this.filtersOrder).subscribe(orders =>{
      orders.forEach((order:Order)=>{
        order.shipping.when=new Date(order.shipping.when);
        order.shipping.when.setHours(0,0,0)
        if(!this.monthOrders[order.shipping.when.getTime()]){
            this.monthOrders[order.shipping.when.getTime()]=[];
            this.availableOrders.push(new Date(order.shipping.when));
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
