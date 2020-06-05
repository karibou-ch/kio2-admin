import { Component, OnInit } from '@angular/core';
import { Config, ReportOrders, ReportingService } from 'kng2-core';
import { EngineService } from '../services/engine.service';
import { ToastController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-report',
  templateUrl: './report.page.html',
  styleUrls: ['./report.page.scss'],
})
export class ReportPage implements OnInit {


  config: Config;
  report: ReportOrders;
  month: number;
  year: number;
  today: Date = new Date();
  headerImg = '/assets/img/k-sm.jpg';
  shops: string[] = [];
  defaultShop: string;
  defaultTitle: string;

  format = 'MMM yyyy';
  pickerDate: string;
  currentDate: Date;
  pickerShippingDate: string;


  constructor(
    private $engine: EngineService,
    private $report: ReportingService,
    private $route: ActivatedRoute,
    private $router: Router,
    private $toast: ToastController,
  ) {
    this.currentDate = this.$engine.currentShippingDate;
    this.config = this.$engine.currentConfig;
    this.defaultShop = this.$route.snapshot.params.shop;
    this.month = this.$route.snapshot.params.month || (this.currentDate.getMonth() + 1);
    this.year = this.$route.snapshot.params.year || this.currentDate.getFullYear();
    this.currentDate.setFullYear(this.year);
    this.currentDate.setMonth(this.month - 1);
    this.pickerShippingDate = this.currentDate.toISOString();

    //
    // reload data 
    // this.$route.params.subscribe(params => {
    //   console.log('--',params);
    // });
  }

  ngOnInit() {
    this.onInitReport();
  }


  doToast(msg) {
    this.$toast.create({
      message: msg,
      duration: 3000
    }).then(alert => alert.present());
  }

  //
  // on selected date
  onDatePicker() {
    const date = new Date(this.pickerShippingDate);
    date.setHours(0, 0, 0, 0);
    date.setDate(2);

    this.pickerShippingDate = date.toISOString();
    this.currentDate = date;
    this.month = (this.currentDate.getMonth() + 1);
    this.year = (this.currentDate.getFullYear());
    this.$router.navigate(['/report', this.month, this.year]);
    this.onInitReport();
  }


  onInitReport() {
   this.month = new Date(this.currentDate).getMonth() + 1;
   this.year = new Date(this.currentDate).getFullYear();
   const month = ('0' + (this.month + 1)).slice(-2);

   this.shops = [];
   this.report = null;

   //
   // this value depends on HUB
   // FIXME siteName not available on report
   //  this.headerImg = this.config.shared.siteName.image || this.headerImg;
   this.$report.getReport(this.year, this.month, this.defaultShop).subscribe(
    (report: ReportOrders) => {
      this.report = report;
      this.report.orders = this.report.orders || [];
      this.report.shops = this.report.shops || {};
      this.shops = Object.keys(this.report.shops);
      this.defaultTitle = month + '/' + this.year + ' - karibou.ch';
      if (this.shops.length == 1) {
        this.defaultShop = this.shops[0];
        this.defaultTitle = month + '/' + this.year + ' - ' + this.shops[0];
      }
      document.title = this.defaultTitle;
      if (this.report.products) {
        this.report.products = this.report.products.sort((a, b) => {
          // sku,title,amount,count,vendor
          return b.amount - a.amount;
        });
      }
    }, error => this.doToast(error.error)
   );
  }

  openReport(slug) {
    this.$router.navigate(['/report', this.month, this.year, slug]);
  }

  shopName() {
    if (!this.report) {
      return '';
    }
    return this.report.shops[this.shops[0]].name;
  }
  shopGetFirst() {
    if (!this.report) {
      return {};
    }
    return this.report.shops[this.shops[0]];
  }


  totalErrors() {
    return this.shops.reduce((sum, slug) => {
      return sum + this.report.shops[slug].errors;
    }, 0)
  }

  totalRefunds() {
    return this.shops.reduce((sum, slug) => {
      return sum + this.report.shops[slug].refunds;
    }, 0)
  }

}
