import { Component, OnInit } from '@angular/core';
import { Config, ReportOrders, ReportingService, User, config } from 'kng2-core';
import { EngineService } from '../services/engine.service';
import { ToastController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';

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
  defaultShop: any;
  defaultTitle: string;
  csv: { data: SafeUrl, filename: string};

  format = 'MMM yyyy';
  pickerDate: Date;
  currentDate: Date;
  user: User;

  isAdmin = false;


  constructor(
    private $engine: EngineService,
    private $http: HttpClient,
    private $report: ReportingService,
    private $route: ActivatedRoute,
    private $router: Router,
    private $sanitizer: DomSanitizer,
    private $toast: ToastController,
  ) {
    this.currentDate = this.$engine.currentShippingDate;
    this.config = this.$engine.currentConfig;
    this.defaultShop = this.$route.snapshot.params['shop'];
    this.month = this.$route.snapshot.params['month'] || (this.currentDate.getMonth() + 1);
    this.year = this.$route.snapshot.params['year'] || this.currentDate.getFullYear();
    this.currentDate.setFullYear(this.year);
    this.currentDate.setMonth(this.month - 1);
    this.pickerShippingString = this.currentDate.toISOString();

    //
    // reload data 
    // this.$route.params.subscribe(params => {
    //   console.log('--',params);
    // });
  }

  set pickerShippingString(date: string){
    this.pickerDate = new Date(date);
    this.pickerDate.setHours(0,0,0,0);
  }

  get pickerShippingString(){
    return this.pickerDate.toYYYYMMDD('-');
  }


  get downloadLink(){
    return config.API_SERVER+'/v1/orders/transfert/'+this.month+'/'+this.year;
  }

  ngOnInit() {
    this.user = this.$engine.currentUser;
    this.isAdmin = this.user.isAdmin();
    this.onInitReport();
  }

  async doDownloadPaymentXML($event) {
    try{
      const blob = await this.$http.get(this.downloadLink,{ responseType: 'blob' }).toPromise();
      // It is necessary to create a new blob object with mime-type explicitly set
      // otherwise only Chrome works like it should
      //const newBlob = new Blob([blob], { type: "application/pdf" });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      // the filename you want
      a.download = 'k-payment-'+this.month+'-'+this.year+'.xml';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      alert('your file has downloaded!'); // or you know, something with better UX...

    }catch(err) {
      console.log('---- download ', err);
    }
    $event.preventDefault();
    $event.stopPropagation();
  }


  doToast(msg) {
    this.$toast.create({
      message: msg,
      duration: 3000
    }).then(alert => alert.present());
  }

  getEmail() {
    // backward compability
    if(this.config.shared['home']){
      return this.config.shared['home'].mail;
    }

    return this.config.shared.mail.address;
  }
  //
  // on selected date
  onDatePicker(popover) {
    const date = (this.pickerDate);
    date.setDate(2);

    this.currentDate = date;
    this.month = (this.currentDate.getMonth() + 1);
    this.year = (this.currentDate.getFullYear());
    this.$router.navigate(['/report', this.month, this.year]);
    this.onInitReport();
    popover.dismiss();
  }

  onCopyCA(report) {
    let csv = `
    Commission, "VENTE.COMMISSION", ${report.ca}
    Service K. , "VENTE.SERVICE", ${report.serviceamount}
    Livraison , "VENTE.LOGISTIQUE", ${report.shippingamount}
    `  
    navigator.clipboard.writeText(csv.trim());
  }


  onInitReport() {
   this.month = new Date(this.currentDate).getMonth() + 1;
   this.year = new Date(this.currentDate).getFullYear();
   const month = ('0' + (this.month )).slice(-2);

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

        //
        // build csvData
        // actual delimiter characters for CSV format
        // const colDelim = '";"';
        // const rowDelim = '"\r\n"';
        const header = ['"nom"', '"ventes"', '"chf"', '"tva"'].join(';')
        const csv = header+"\n"+this.report.products.sort(this.sortByTvaAndSell).map( product => {
          // escape double quotes
          return [
            '"' + product.title.replace(/"/g, "'") + '"',
            product.count,
            product.amount.toFixed(2).replace('.', ','),
            product.tva.toFixed(3 ).replace('.', ','),
          ].join(';');
        }).join('\r\n');
        this.csv = {
          data: this.$sanitizer.bypassSecurityTrustUrl('data:application/csv;charset=utf-8,' + encodeURIComponent(csv)),
          filename: this.defaultTitle + '.csv'
        } ;
      }
    }, error => this.doToast(error.error)
   );
  }

  openReport(slug) {
    this.$router.navigate(['/report', this.month, this.year, slug]);
  }


  totalErrors() {
    return this.shops.reduce((sum, slug) => {
      return sum + this.report.shops[slug].errors;
    }, 0);
  }

  totalRefunds() {
    return this.shops.reduce((sum, slug) => {
      return sum + this.report.shops[slug].refunds;
    }, 0);
  }

  sortByTvaAndSell(a, b) {  
    a.tva = a.tva || 0;
    b.tva = b.tva || 0;
    if (a.tva == b.tva) {
      return b.count - a.count;
    }
    return b.tva - a.tva;
  }

}
