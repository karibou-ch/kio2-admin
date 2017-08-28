import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Order, OrderService, Shop } from 'kng2-core';
import { ModalController } from 'ionic-angular';
import { TrackerPage } from '../../pages/tracker/tracker';

/**
 * Generated class for the LogisticHeaderComponent component.
 *
 * See https://angular.io/docs/ts/latest/api/core/index/ComponentMetadata-class.html
 * for more info on Angular Components.
 */
@Component({
  selector: 'logistic-header',
  templateUrl: 'logistic-header.html'
})
export class LogisticHeaderComponent {

  @Input() availableDates: Date[] = [];
  @Input() 
  @Output() getResults = new EventEmitter<boolean>(); //execute data fetcher function of parent component
  closedShippings: boolean;
  monthCommands: Map<number, Shop[]> = new Map();
  monthOrders: Map<number, Order[]> = new Map();
  currentShippingDate: Date;
  selectedDate: string = new Date().toISOString();
  
 

  filtersOrder: any;
  FLOATING = { payment: 'authorized' };  //not yet handled by producers
  LOCKED = { fulfillments: 'fulfilled,partial' };  //got by the producers (sub-group of FLOATING)

  

  constructor(
    private modalCtrl: ModalController,
    private loaderSrv: LoaderService,
    public navCtrl: NavController, 
    public navParams: NavParams,
    private orderSrv: OrderService,
    private userSrv:UserService
  ) {
    this.currentShippingDate = Order.currentShippingDay();
    this.currentShippingDate.setHours(0, 0, 0);
    this.filtersOrder = this.FLOATING;
  }

  ngOnInit() {
    this.loaderSrv.ready().subscribe((loader) => {
      Object.assign(this.user, loader[1]);
      this.isReady=true;
      this.findAllOrdersForShipping();
    })
  }

  toggleFilter() {
    if (this.filtersOrder.payment) {
      this.filtersOrder = this.LOCKED;
    } else {
      this.filtersOrder = this.FLOATING;
    }
    this.findAllOrdersForShipping();
  }

  

  openTracker() {
    this.modalCtrl.create(TrackerPage, { results: this.monthOrders[this.currentShippingDate.getTime()] }).present();
  }

}
