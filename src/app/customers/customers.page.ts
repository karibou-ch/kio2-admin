import { Component, OnInit } from '@angular/core';
import { Config, ReportCustomer, ReportingService } from 'kng2-core';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-customers',
  templateUrl: './customers.page.html',
  styleUrls: ['./customers.page.scss'],
})
export class CustomersPage implements OnInit {

  config: Config;
  customers: ReportCustomer[];

  cache: {
    refund: boolean;
    errors: boolean;
    search: string;
    start: number;
    step: number;
    customers: ReportCustomer[];
  };

  constructor(
    private $report: ReportingService,
    private $toast: ToastController
  ) {
    this.cache = {
      search: '',
      customers: [],
      step: 50,
      start: 0,
      refund: false,
      errors: false
    };
  }

  ngOnInit() {
    this.$report.getCustomers().subscribe(
      (customers: ReportCustomer[]) => {
        this.cache.customers = customers;
        this.customers = this.sliceCustomers();
      }, error => this.doToast(error.error)
     );

  }

  doInfinite(infiniteScroll) {
    // if(this.cache.search!==''){
    //   return infiniteScroll.complete();
    // }
    setTimeout(() => {
      this.cache.start += this.cache.step;
      this.customers = this.sliceCustomers();
      infiniteScroll.target.complete();
    }, 100);
  }


  doToast(msg) {
    this.$toast.create({
      message: msg,
      duration: 3000
    }).then(alert => alert.present());
  }

  getErrorRatio(customer) {
    return customer.errors / customer.orders;
  }

  //
  // infiniteScroll
  sliceCustomers() {
    return  this.customers = this.cache.customers.filter(customer => {
      let result = true;

      if (this.cache.refund) {
        result = !!customer.refunds;
      }
      if(this.cache.errors) {
        result = !!customer.errors;
      }
      return result;
     }).slice(0, this.cache.start + this.cache.step).sort((a,b) => {
      if (this.cache.refund) {
        return (b.refunds / b.orders) - (a.refunds / a.orders);
      }
      if (this.cache.errors) {
        return (b.errors / b.orders) - (a.errors / a.orders);
      }

      return b.orders - a.orders;
     });
  }
}
