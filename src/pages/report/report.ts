import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController } from 'ionic-angular';
import { config, Order, ReportOrders, ReportingService, Config } from 'kng2-core';


/**
 * Generated class for the ReportPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-report',
  templateUrl: 'report.html',
})
export class ReportPage {

  config:Config;
  report:ReportOrders;
  month:number;
  year:number;
  today:Date=new Date();
  headerImg:string="/assets/img/k-sm.jpg";
  shops:string[]=[];

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    private $report: ReportingService,
    private toast:ToastController
  ) {
    this.month=this.today.getMonth()+1;
    this.year=this.today.getFullYear();     
    this.config=config;
  }

  doToast(msg){
    this.toast.create({
      message: msg,
      duration: 3000
    }).present()
  }

  onInitOrders([orders,shipping,availableDates]:[Order[],Date,Date[]]){
   this.month=new Date(shipping).getMonth()+1;
   this.year=new Date(shipping).getFullYear();
   this.shops=[];
   this.report=null;
   this.config=config;
   this.headerImg=config.shared.home.siteName.image||this.headerImg;
   this.$report.getVendors(this.year,this.month).subscribe(
    (report:ReportOrders)=>{
      this.report=report;
      this.shops=Object.keys(this.report.shops);
    },error=>this.doToast(error.error)
   )
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
