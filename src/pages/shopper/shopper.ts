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
  myDate;
  results: Order[];
  toggledResults: Order[];
  currentOrders:number;
  shippingByDay=[];
  weekDay;
  openShippings: boolean;
  nbCabas;

  constructor(
    private loaderSrv: LoaderService,
    private modalCtrl: ModalController,
    public navCtrl: NavController, 
    public navParams: NavParams,
    private orderSrv: OrderService,
    private userSrv:UserService
    ) {
  }



  ngOnInit() {
    this.loaderSrv.ready().subscribe((loader) => {
      Object.assign(this.user, loader[1]);
      this.isReady=true;
    })
  }

  getDayShipping(ordersOneDay: Order[]){
    this.toggledResults = null;
    this.results = this.openShippings ? ordersOneDay.filter(order => order.payment.status === EnumFinancialStatus.authorized)
        : ordersOneDay;
    this.content.resize();
  }

  toggleFilter(){
    if(this.openShippings){
      this.toggledResults = this.results;
      this.results = this.results.filter(order => order.payment.status === EnumFinancialStatus.authorized);
    }
    else
      this.results = this.toggledResults;
  }

  findAllOrdersForShipping(){
    this.shippingByDay = [];
    this.toggledResults = null;
    let month = new Date(this.myDate).getMonth();
    this.orderSrv.findAllOrders({fulfillments:'fulfilled,partial', month:month+1})
      .flatMap(orders => Observable.from(orders)) //transform single order[] item into Observable order sequence (for groupBy)
      .groupBy(order=> new Date(order.shipping.when).getDate()) //group items by month
      .flatMap(group => group.reduce((acc, curr) => [...acc, curr], []))  //create an array item for each group
      .subscribe(ordersByDay => this.shippingByDay.push(ordersByDay),
      (err)=>console.log(err),
      ()=> {
        this.shippingByDay.reverse();
        this.currentOrders=this.shippingByDay.length-1;
      });
}

  openTracker(){
    this.modalCtrl.create(TrackerPage, {results: this.shippingByDay[this.currentOrders]}).present();
  }

}
