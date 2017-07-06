import { Component, ViewChild } from '@angular/core';
import { Content, IonicPage, NavController, NavParams } from 'ionic-angular';
import { LoaderService, Order, OrderService, EnumFinancialStatus, User, UserService } from 'kng2-core';
import 'rxjs/Rx';
import { Observable } from 'rxjs/Rx';
/**
 * Generated class for the LivraisonPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
@IonicPage()
@Component({
  selector: 'page-livraison',
  templateUrl: 'livraison.html',
})
export class LivraisonPage {

  @ViewChild(Content) content: Content;

  isAuthenticated:boolean;
  isReady:boolean;
  user: User = new User();
  myDate;
  results: Order[];
  toggledResults: Order[];
  shippingByDay;
  weekDay;
  openShippings: boolean;
  nbCabas;

  constructor(
    private loaderSrv: LoaderService,
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
    this.results = null;
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
      });

}

}
