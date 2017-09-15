import { Component, ViewChild } from '@angular/core';
import { Events, IonicPage, ModalController, ToastController  } from 'ionic-angular';
import { LoaderService, Order, OrderService, User } from 'kng2-core';
import { ShopperItemComponent } from '../../components/shopper-item/shopper-item';
import { LogisticHeaderComponent }  from '../../components/logistic-header/logistic-header';
/**
 * Generated class for the ShopperPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
@IonicPage({name:'ShopperPage'})
@Component({
  selector: 'page-shopper',
  templateUrl: 'shopper.html'
})
export class ShopperPage {

  selectedOrder={};

  @ViewChild(LogisticHeaderComponent) header: LogisticHeaderComponent;
  
  private user:User=new User();
  private isReady:boolean=false;
  private orders: Order[] = [];
  private planning=[];
  private currentPlanning;

  constructor(
    public events: Events,
    private $loader: LoaderService,
    private $order: OrderService,
    private modalCtrl: ModalController,
    private toast:ToastController
  ) {
  }

  ngOnInit() {
    this.$loader.ready().subscribe((loader) => {
      Object.assign(this.user, loader[1]);
    });
  }

  onDone(msg){
    this.toast.create({
      message: msg,
      duration: 3000
    }).present()

  }
  onError(msg){
    this.toast.create({
      message: msg,
      duration: 3000
    }).present()

  }

  isPlanified(){

  }

  doRefresh(refresher){
    this.events.publish('refresh');    
    setTimeout(() => {
      refresher.complete();
    }, 2000);    
  }

  toggleOrder(order){
    this.selectedOrder[order.oid]=!this.selectedOrder[order.oid];
  }

  isOrderSelected(order){
    return this.selectedOrder[order.oid];
  }

  selectShipping(order:Order){
    this.$order.updateShippingShopper(order,order.shipping.priority)
        .subscribe(ok=>{
          this.onDone("Livraison planifiée")
          this.trackPlanning(this.orders);
        },error=>this.onError(error.text()))
  }

  updateBag(order,count){
    this.$order.updateBagsCount(order,count).subscribe(ok=>{
          this.onDone("Nombre sac enregistré")        
    },(error)=>this.onError(error.text()));
  }

  // $scope.updateShippingPrice=function(order,amount){
  //   order.updateShippingPrice(amount).$promise.then(function(o){
  //     api.info($scope,"Commande modifée",2000);
  //     order.wrap(o);
  //   });
  // };

  displayOrders(orders: Order[]){
    this.orders = orders;
    this.isReady=true;
    this.trackPlanning(orders);  
  }

  togglePlanning(plan){
    if(this.currentPlanning===plan){
      return this.currentPlanning=undefined;
    }
    this.currentPlanning=plan;
  }

  trackPlanning(orders: Order[]){
    this.planning=orders.reduce((planning,order,i)=>{
      if(order.shipping.priority &&
         planning.indexOf(order.shipping.priority)==-1){
        planning.push(order.shipping.priority);
      }
      return planning.sort();
    },[]);

  }

  trackOrders(orders:Order[]){
    // count available selection
    let oids=Object.keys(this.selectedOrder).reduce((count,oid)=>{
      return this.selectedOrder[oid]?count+1:count;
    },0);
    let selectedOrders=(order)=>{
      return this.selectedOrder[order.oid]|| (!oids);
    }
    let selected=orders.filter(selectedOrders);
    this.modalCtrl.create('tracker', { results: selected  }).present();
  }


  openTracker4One(order:Order){
    this.modalCtrl.create('tracker', { results: order }).present();
  }

  sortOrdersByCP(o1,o2){
    //TODO checking type of postalCode is always a number
    return (o1.shipping.postalCode|0)-(o2.shipping.postalCode|0);
  }





}
