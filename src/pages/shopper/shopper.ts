import { Component, ViewChild } from '@angular/core';
import { IonicPage, ModalController,  } from 'ionic-angular';
import { Order} from 'kng2-core';
import { ShopperItemComponent } from '../../components/shopper-item/shopper-item';
import { LogisticHeaderComponent }  from '../../components/logistic-header/logistic-header';
import { TrackerPage } from '../../pages/tracker/tracker';
/**
 * Generated class for the ShopperPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
@IonicPage({name:'shopper'})
@Component({
  selector: 'page-shopper',
  templateUrl: 'shopper.html'
})
export class ShopperPage {

  @ViewChild(LogisticHeaderComponent) header: LogisticHeaderComponent;
  
  private orders: Order[] = [];

  constructor(
    private modalCtrl: ModalController,
  ) {
  }


  displayOrders(orders: Order[]){
    this.orders = orders;
  }

  openTracker4One(order:Order){
    this.modalCtrl.create(TrackerPage, { results: order }).present();

  }

  sortOrdersByCP(o1,o2){
    //TODO checking type of postalCode is always a number
    return (o1.shipping.postalCode|0)-(o2.shipping.postalCode|0);
  }





}
