import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { LoaderService, Order, OrderService, User, UserService } from 'kng2-core';
import { LogisticHeaderComponent }  from '../../components/logistic-header/logistic-header';

/**
 * Generated class for the CollectPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
@IonicPage({name:'CollectPage'})
@Component({
  selector: 'page-collecte',
  templateUrl: 'collecte.html',
})
export class CollectPage {

  orders:Order[];
  isReady: boolean;
  user: User = new User();

  constructor(
    private loaderSrv: LoaderService,
    public navCtrl: NavController,
    public navParams: NavParams,
    private $order: OrderService,
    private userSrv: UserService
  ) {}

  displayOrders(orders: Order[]){
    this.orders = orders;
    this.isReady=true;
  }

  // ionViewCanEnter() {
  //   return this.userSrv.currentUser.isAuthenticated();
  // }

  ionViewDidLoad() {
    // this.loaderSrv.ready().subscribe((loader) => {
    //   Object.assign(this.user, loader[1]);
    //   this.isReady = true;
    // })
  }

  updateCollect(shopname,status,when) {
    this.$order.updateCollect(shopname,status,when)
      .subscribe(function (os) {
        //api.info($scope,"Collecte enregistrée",2000);
      });
  };


  isCollectableShopForDay (shop,when) {
    // if(!when||!$scope.shops) return true;
    // var items=$scope.shops[shop].filter(function(item) {
    //   return (item.when===when);
    // });
    // return (items.length>0);
  };

  isCollectedShopForDay (shop,when) {
    // for (var i = $scope.orders.length - 1; i >= 0; i--) {
    //   if($scope.orders[i].shipping.when===when){
    //     for (var j = $scope.orders[i].vendors.length - 1; j >= 0; j--) {
    //       if($scope.orders[i].vendors[j].slug===shop){
    //         return $scope.orders[i].vendors[j].collected;
    //       }
    //     }
    //   }
    // }

    return false;
  };


  //
  //
  selectOrderByShop=function(shop){
    // if(!shop){
    //   $scope.selected.items=[];
    //   $scope.selected.shop=false;        
    //   return;
    // }
    // $scope.selected.items=$scope.shops[shop];
    // $scope.selected.shop=shop;
  };

}
