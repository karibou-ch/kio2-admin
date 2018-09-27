import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController, Config } from 'ionic-angular';
import { ReportingService, ReportCustomer } from 'kng2-core';

/**
 * Generated class for the CustomersPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-customers',
  templateUrl: 'customers.html',
})
export class CustomersPage {
  config:Config;
  customers:ReportCustomer[];

  cache:{
    search:string;
    start:number;
    step:number;
    customers:ReportCustomer[];
  }

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    private $report: ReportingService,
    private toast:ToastController
  ) {
    this.cache={
      search:'',
      customers:[],
      step:50,
      start:0
    }
  }

  doInfinite(infiniteScroll) {
    // if(this.cache.search!==''){
    //   return infiniteScroll.complete();
    // }
    setTimeout(() => {
      this.cache.start+=this.cache.step;
      this.customers=this.sliceCustomers();
      infiniteScroll.complete();    
    },100);    
  }  
  

  doToast(msg){
    this.toast.create({
      message: msg,
      duration: 3000
    }).present()
  }
  
  ngOnInit(){
    this.$report.getCustomers().subscribe(
      (customers:ReportCustomer[])=>{
        this.cache.customers=customers;
        this.customers=this.sliceCustomers();
      },error=>this.doToast(error.error)
     )
      
  }

  //
  // infiniteScroll
  sliceCustomers(){
    return this.cache.customers.slice(0,this.cache.start+this.cache.step);
  }
  
}
