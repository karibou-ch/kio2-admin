import { Component, OnInit } from '@angular/core';
import { Config, ReportCustomer, ReportingService, User, UserService } from 'kng2-core';
import { ToastController, AlertController, ModalController } from '@ionic/angular';
import { EngineService } from '../services/engine.service';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { CustomerPage } from './customer.page';

@Component({
  selector: 'app-customers',
  templateUrl: './customers.page.html',
  styleUrls: ['./customers.page.scss'],
})
export class CustomersPage implements OnInit {

  config: Config;
  customers: ReportCustomer[] | User[];
  user: User;
  search$: Subject<string>;

  cache: {
    premium: boolean;
    refund: boolean;
    errors: boolean;
    search: string;
    start: number;
    step: number;
    customers: any[];
  };

  constructor(
    private $engine: EngineService,
    private $alert: AlertController,
    private $modal: ModalController,
    private $report: ReportingService,
    private $toast: ToastController,
    private $user: UserService
  ) {
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

    this.search$ = new Subject();
    this.search$.pipe(debounceTime(500)).subscribe((text: string) => {
      this.$user.query({search: text }).subscribe(customers => {
        this.cache.customers = customers.map(user => {
          const count = user.orders.last1Month +
                        user.orders.last3Month +
                        user.orders.last6Month +
                        user.orders.after6Month;
          return {
            id: user.id,
            last1Month: user.orders.last1Month,
            last3Month: user.orders.last3Month,
            last6Month: user.orders.last6Month,
            after6Month: user.orders.after6Month,
            avg: user.orders.avg,
            orders: count,
            errors: user.orders.errors,
            refunds: user.orders.refunds,
            customer: user
          };
        });
        this.customers = this.sliceCustomers();
      }, status => {
        this.$toast.create({
          message: status.error || status.message || status,
          duration: 3000,
          color: 'danger',
          position: 'middle'
        }).then(alert => alert.present());
      });
    });

  }

  ngOnInit() {
    this.user = this.$engine.currentUser;

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

  doEdit(customer, idx) {

    const params = {
      id: customer.customer.id,
    };

    this.$modal.create({
      component: CustomerPage,
      componentProps: params
    }).then(alert => alert.present());

  }

  doSearch($event: any) {
    const text: string = $event.target.value || '';
    if(text.length < 3) {
      return;
    }
    this.search$.next(text);
  }

  doSearchCancel() {
    this.ngOnInit();
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
