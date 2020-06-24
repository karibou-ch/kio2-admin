import { Component, OnInit } from '@angular/core';
import { Config, ReportCustomer, ReportingService, User } from 'kng2-core';
import { ToastController, AlertController } from '@ionic/angular';

@Component({
  selector: 'app-customers',
  templateUrl: './customers.page.html',
  styleUrls: ['./customers.page.scss'],
})
export class CustomersPage implements OnInit {

  config: Config;
  customers: ReportCustomer[];
  user: User;

  cache: {
    premium: boolean;
    refund: boolean;
    errors: boolean;
    search: string;
    start: number;
    step: number;
    customers: ReportCustomer[];
  };

  constructor(
    private $alert: AlertController,
    private $report: ReportingService,
    private $toast: ToastController
  ) {
    this.user = new User();
    this.customers = [];
    this.cache = {
      search: '',
      customers: [],
      step: 50,
      start: 0,
      refund: false,
      premium: false,
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

  doDisplayPhone(order) {
    const phone = order.customer.phoneNumbers[0].number;
    this.$alert.create({
      header: 'Numéro de téléphone',
      subHeader: order.customer.displayName,
      message: 'Appeler <a href="tel:' + phone + '">' + phone + '</a>',
    }).then(alert => alert.present());
  }

  doDisplayMail(order) {
    this.$alert.create({
      header: 'Mail de la commande',
      subHeader: order.customer.displayName,
      message: 'Contacter <a href="mailto:' + order.email + '">' + order.email + '</a>',
    }).then(alert => alert.present());
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
      if (this.cache.premium) {
        result = this.user.isPremium(customer);
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
