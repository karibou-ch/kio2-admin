import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController, App } from 'ionic-angular';
import { config, Order, ReportOrders, ReportingService, Config } from 'kng2-core';


/**
 * Generated class for the ReportPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage({
  segment:'report/:month/:year'
})
@Component({
  selector: 'page-report',
  templateUrl: 'report.html'
})
export class ReportPage {

  config:Config;
  report:ReportOrders;
  month:number;
  year:number;
  today:Date=new Date();
  headerImg:string="/assets/img/k-sm.jpg";
  shops:string[]=[];
  defaultShop:string;
  defaultTitle:string;

  format:string="MMM yyyy";
  pickerDate:string;
  currentDate:Date;

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    private $report: ReportingService,
    private toast:ToastController,
    private $app:App
  ) {

    this.month=this.today.getMonth()+1;
    this.year=this.today.getFullYear();     
    this.config=config;
    this.defaultShop=this.navParams.get('shop');
    this.defaultTitle;
    this.month=this.navParams.get('month')||this.month;
    this.year=this.navParams.get('year')||this.year;
    this.currentDate=new Date(this.year,this.month,0);

    this.onInitReport();
  }


  doToast(msg){
    this.toast.create({
      message: msg,
      duration: 3000
    }).present()
  }

  onInitReport(){
   this.month=new Date(this.currentDate).getMonth()+1;
   this.year=new Date(this.currentDate).getFullYear();
   let month=("0" + (this.month + 1)).slice(-2);

   this.shops=[];
   this.report=null;
   this.config=config;
   this.headerImg=config.shared.home.siteName.image||this.headerImg;
   this.$report.getReport(this.year,this.month,this.defaultShop).subscribe(
    (report:ReportOrders)=>{
      this.report=report;
      this.report.orders=this.report.orders||[];
      this.report.shops=this.report.shops||{};
      this.shops=Object.keys(this.report.shops);
      this.defaultTitle=month+'/'+this.year+' - karibou.ch';
      if(this.shops.length==1){
        this.defaultShop=this.shops[0];
        this.defaultTitle=month+'/'+this.year+' - '+this.shops[0];
      }
      document.title = this.defaultTitle;
      if(this.report.products){
        this.report.products=this.report.products.sort((a,b)=>{
          //sku,title,amount,count,vendor
          return b.amount-a.amount;
        });  
      }
    },error=>this.doToast(error.error)
   )
  }

  openReport(slug){
    this.navCtrl.push('ReportPage',{
      shop:slug,
      month:this.month,
      year:this.year
    });        
  }

  //
  // on selected date
  updateDateFromPicker(){
    this.currentDate=new Date(this.pickerDate);
    this.pickerDate = this.currentDate.toISOString();
    this.onInitReport();
  }  

  shopName(){
    if(!this.report){
      return '';
    }
    return this.report.shops[this.shops[0]].name;
  }
  shopGetFirst(){
    if(!this.report){
      return {};
    }
    return this.report.shops[this.shops[0]];    
  }
  

  totalErrors(){
    return this.shops.reduce((sum,slug)=>{
      return sum+this.report.shops[slug].errors;
    },0)   
  }

  totalRefunds(){
    return this.shops.reduce((sum,slug)=>{
      return sum+this.report.shops[slug].refunds;
    },0)   
  }
  
}
