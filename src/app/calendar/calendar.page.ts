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
  STATUS_CLOSED = 'past';

  currentShipping: Date;
  availableDates: Date[];
  currentOrderAreOpen: boolean;
  segmentValue: string;

  constructor(
    private $engine: EngineService,
    private $popup: PopoverController
  ) {

  }

  ngOnInit() {
    this.availableDates = this.$engine.availableDates;
    this.currentShipping = this.$engine.currentShippingDate;
    this.currentOrderAreOpen = this.$engine.currentOrderAreOpen;
    this.segmentValue = this.$engine.currentOrderAreOpen ? this.STATUS_OPEN : this.STATUS_CLOSED;
  }

  onStatusChanged($event) {
    this.segmentValue = $event.detail.value;
    this.$engine.toggleOrderStatus();
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