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
  private shipping:Date;
  private planning=[];
  private currentPlanning;
  private reorder:boolean=false;

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

  setShippingPriority(order:Order){
    let position=order.shipping.position;
    let priority=order.shipping.priority;
    this.$order.updateShippingShopper(order,priority,position)
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

  onInitOrders([orders,shipping]:[Order[],Date]){
    //
    // set default order value based on postalCode
    this.orders = orders||[];
    this.shipping= shipping;
    this.isReady=true;
    this.trackPlanning(orders);  
  }


  reorderItems(index){
    let order=this.orders[index.from];
    let position=order.shipping.position;
    let priority=order.shipping.priority;

    order.shipping.position=this.orders[index.to].shipping.position-1;    
    this.orders = this.orders.sort(this.sortOrdersBySort);
    this.$order.updateShippingShopper(order,priority,position)
      .subscribe(ok=>{
      },error=>this.onError(error.text()))

  }

  toggleReorder(){
    this.reorder=!this.reorder;
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

  onSelectedOrders([orders,shipping]:[Order[],Date]){
    // count available selection
    let oids=Object.keys(this.selectedOrder).reduce((count,oid)=>{
      return this.selectedOrder[oid]?count+1:count;
    },0);
    let selectedOrders=(order)=>{
      return this.selectedOrder[order.oid]|| (!oids);
    }
    //
    // filter orders to display, 
    let selected=orders.filter(selectedOrders).filter(this.filterByPlan.bind(this));
    this.modalCtrl.create('tracker', { results: selected  }).present();
  }

  onEditCustomer(customer){

  }

  openTracker4One(order:Order){
    this.modalCtrl.create('tracker', { results: order }).present();
  }

  togglePlanning(plan){
    if(this.currentPlanning===plan){
      return this.currentPlanning=undefined;
    }
    this.currentPlanning=plan;
  }


  sortOrdersByCP(o1,o2){
    //TODO checking type of postalCode is always a number
    return (o1.shipping.postalCode|0)-(o2.shipping.postalCode|0);
  }

  sortOrdersBySort(o1,o2){
    //TODO checking type of postalCode is always a number
    return (o1.shipping.position)-(o2.shipping.position);
  }


  filterByPlan(order:Order){
    if(!this.currentPlanning) return true;
    return (this.currentPlanning===order.shipping.priority);
  }




}
