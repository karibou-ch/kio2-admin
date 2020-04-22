import { Component, ViewChild } from '@angular/core';
import { Events, IonicPage, ModalController, ToastController  } from 'ionic-angular';
import { LoaderService, Order, OrderService, User, UserService } from 'kng2-core';
import { TrackerProvider } from '../../providers/tracker/tracker.provider';
import { LogisticHeaderComponent }  from '../../components/logistic-header/logistic-header';

import 'rxjs/add/operator/filter';

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
  private isReady:boolean;
  private orders: Order[] = [];
  private shipping:Date;
  private planning=[];
  private currentPlanning;
  private reorder:boolean=false;
  searchFilter: string;
 
  constructor(
    public events: Events,
    private $loader: LoaderService,
    private $order: OrderService,
    private modalCtrl: ModalController,
    public $tracker: TrackerProvider,
    private $user:UserService,
    private toast:ToastController
  ) {
    this.isReady=false;
  }

  ngOnInit() {
    this.$loader.ready().subscribe((loader) => {
      Object.assign(this.user, loader[1]);
      this.$tracker.start();    
    });

    //
    this.$user.subscribe(user=>Object.assign(this.user,user));
  }

  ngOnDestroy() {
    this.$tracker.stop();    
  }


  isDeposit(order){
    // undefined test is for Bretzel 
    return order.shipping.deposit||(order.shipping.deposit==undefined);
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
    }, 1000);    
  }

  getPhoneNumber(order:Order){
    if(!order||!order.customer.phoneNumbers||!order.customer.phoneNumbers.length){
      return false;
    }
    return order.customer.phoneNumbers[0].number;
  }

  getOrders(){
    if(!this.searchFilter){
      return this.orders;
    }
    return this.orders.filter(order => {
      const filter = order.oid+' '+order.email+' '+order.rank+' '+order.customer.displayName
      return filter.toLocaleLowerCase().indexOf(this.searchFilter.toLocaleLowerCase())>-1;
    });
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
        },error=>this.onError(error.error))
  }

  updateBag(order,count){
    this.$order.updateBagsCount(order,count).subscribe(ok=>{
          this.onDone("Nombre sac enregistré")        
    },(error)=>this.onError(error.error));
  }

  // $scope.updateShippingPrice=function(order,amount){
  //   order.updateShippingPrice(amount).$promise.then(function(o){
  //     api.info($scope,"Commande modifée",2000);
  //     order.wrap(o);
  //   });
  // };
  getShopperInfo(order:Order){
    if(!order||!order.shipping.shopper){
      return '';
    }
    // priority and initials from emails 
    let initials=order.shipping.shopper.split('@')[0];
    initials=initials[0]+initials[1];
    return '('+order.shipping.priority+')('+initials+')';
  }

  onInitOrders([orders,shipping]:[Order[],Date]){
    //
    // set default order value based on postalCode
    this.shipping= shipping;
    this.orders = orders.sort(this.sortOrdersByPosition);
    this.isReady=true;    
    this.trackPlanning(this.orders);  
    this.debug();
  }

  debug(){
    // this.orders.forEach(o=>{
    //   console.log('-----init orders rans',o.rank,'position',o.shipping.position)
    // })    
  }



  //
  // manual reorder of items 
  reorderItems(index){
    let order=this.orders[index.from];
    let priority=order.shipping.priority;
    let gt=order.shipping.position>this.orders[index.to].shipping.position;    
    order.shipping.position=(gt)?
      this.orders[index.to].shipping.position-1:this.orders[index.to].shipping.position+1;    
    this.orders = this.orders.sort(this.sortOrdersByPosition);
    
    this.$order.updateShippingShopper(order,priority,order.shipping.position)
      .subscribe(ok=>{
      },error=>this.onError(error.error))

  }
  toggleOrder(order){
    this.selectedOrder[order.oid]=!this.selectedOrder[order.oid];
    this.debug();
  }


  togglePlanning(plan){
    if(this.currentPlanning===plan){
      return this.currentPlanning=undefined;
    }
    this.currentPlanning=plan;
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


  onSearchInput($event){
  }

  onSearchCancel($event){
    this.searchFilter=null;
  }



  sortOrdersByCP(o1,o2){
    //TODO checking type of postalCode is always a number
    return (o1.shipping.postalCode|0)-(o2.shipping.postalCode|0);
  }

  sortOrdersByPosition(o1,o2){
    //TODO checking type of postalCode is always a number
    //console.log('sort',(o1.shipping.position*10+o1.rank),(o2.shipping.position*10+o2.rank))
    let delta=((o1.shipping.position|0))-((o2.shipping.position|0));
    if(delta===0){
      return o1.rank-o2.rank;
    }
    return delta;
  }


  filterByPlan(order:Order){
    if(!this.currentPlanning) return true;
    return (this.currentPlanning===order.shipping.priority);
  }




}
