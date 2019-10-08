import { Component } from '@angular/core';
import { IonicPage } from 'ionic-angular';
import { OrderItemsPage } from './order-items';


@IonicPage()
@Component({
  selector: 'kio2-item-orders',
  styles:['order-items.scss'],
  templateUrl: 'item-orders.html',
})
export class ItemOrderPage extends OrderItemsPage{

}
