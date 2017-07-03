import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { LoaderService, Order, OrderService, User, UserService } from 'kng2-core';
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

  isAuthenticated:boolean;
  isReady:boolean;
  user: User = new User();
  myDate;
  results;
  shippingByDay = [];
  weekDay;
  openShippings;
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

  getDayShipping(orders: Order[]){
    this.results = orders;
  }

  findAllOrdersForShipping(){
    this.shippingByDay = [];
    let date = new Date(this.myDate);
    let month = date.getMonth();
    this.orderSrv.findAllOrders({fulfillments:'fulfilled,partial', month:month+1})
      .flatMap(orders => Observable.from(orders)) //transform single order[] item into Observable order sequence (for groupBy)
      .groupBy(order=> new Date(order.closed).getDate()) //group items by month
      .flatMap(group => group.reduce((acc, curr) => [...acc, curr], []))  //create an array item for each group
      .subscribe(ordersByDay => this.shippingByDay.push(ordersByDay),
      (err)=>console.log(err),
      ()=> {
        this.shippingByDay.reverse();
      });

}

}
