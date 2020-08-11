import { Component, OnInit, Input } from '@angular/core';
import { Order } from 'kng2-core';
import { PopoverController } from '@ionic/angular';
import { EngineService } from '../services/engine.service';

@Component({
  selector: 'kio-calendar',
  templateUrl: './calendar.page.html',
  styleUrls: ['./calendar.page.scss'],
})
export class CalendarPage implements OnInit {

  @Input() orders: Order[];

  STATUS_OPEN = 'current';
  STATUS_ARCHIVE = 'archive';

  months: string[];

  currentMonth: number;
  currentShipping: Date;
  availableDates: Date[];
  currentOrderStatus: boolean;
  segmentValue: string;

  constructor(
    private $engine: EngineService,
    private $popup: PopoverController
  ) {
    this.months = 'janvier,fevrier,mars,avril,mai,juin,juillet,aout,septembre,octobre,novembre,decembre'.split(',');
  }

  ngOnInit() {
    this.availableDates = this.$engine.availableDates;
    this.currentShipping = this.$engine.currentShippingDate;
    this.currentMonth = this.currentShipping.getMonth();
    this.currentOrderStatus = this.$engine.currentOrderStatus;
    this.segmentValue = this.$engine.currentOrderStatus ? this.STATUS_OPEN : this.STATUS_ARCHIVE;
  }

  modulo(n, mod) {
    return ((n % mod) + mod) % mod;
  }

  month() {
    return this.months[this.currentMonth];
  }

  backMonth() {
    return this.months[this.modulo(this.currentMonth - 1, 12)];
  }

  forwardMonth() {
    return this.months[this.modulo(this.currentMonth + 1, 12)];
  }

  onBackMonth() {
    this.currentMonth = this.modulo( this.currentMonth - 1, 12);
    this.currentShipping.setMonth(this.currentMonth);
    this.$engine.currentShippingDate = this.currentShipping;
  }

  onForwardMonth() {
    this.currentMonth = this.modulo( this.currentMonth + 1, 12);
    this.currentShipping.setMonth(this.currentMonth);
    this.$engine.currentShippingDate = this.currentShipping;
  }

  onStatusChanged($event) {
    this.segmentValue = $event.detail.value;
    this.$engine.selectOrderArchives(this.segmentValue === 'archive');
    this.$popup.dismiss();
  }

  onSelectDay(shipping: Date) {
    this.currentShipping = shipping;
    this.$engine.currentShippingDate = shipping;
    const status = this.segmentValue === this.STATUS_OPEN;
    this.$popup.dismiss([this.currentShipping, status ]);
  }

  onClose() {
    const status = this.segmentValue === this.STATUS_OPEN;
    this.$popup.dismiss([this.currentShipping, status ]);

  }
}
