import { Component, Input } from '@angular/core';
import { Order }  from 'kng2-core';

/**
 * Generated class for the ShopperItemComponent component.
 *
 * See https://angular.io/docs/ts/latest/api/core/index/ComponentMetadata-class.html
 * for more info on Angular Components.
 */
@Component({
  selector: 'shopper-item',
  templateUrl: 'shopper-item.html'
})
export class ShopperItemComponent {

  @Input() order: Order;

  constructor() {
    
  }

}
