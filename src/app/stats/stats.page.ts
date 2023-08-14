import { Component, OnInit } from '@angular/core';
import { Config, User, UserService, config } from 'kng2-core';
import { EngineService } from '../services/engine.service';
import { PopoverController, ToastController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerEmail } from '../customer-email/customer-email.page';


@Component({
  selector: 'app-report',
  templateUrl: './stats.page.html',
  styleUrls: ['./stats.page.scss'],
})
export class StatsPage implements OnInit {


  config: Config;
  month: number;
  year: number;
  today: Date = new Date();
  headerImg = '/assets/img/k-sm.jpg';

  format = 'MMM yyyy';
  currentDate: Date;
  user: User;
  toggleRecurrent:boolean;
  toggleSource:number = 0;
  sourceLabel = {
    0:'all',
    1:'artamis',
    2:'hdr'
  }
  
  funnelFilter:string;

  isAdmin = false;


  $crm:{
    customerOblivious: User[];
    customerNew:User[];
    customerEarly:User[];
    customerPremium:User[];
    customerRecurrent:User[];
    customerQuit:User[];
    sort:string;
    selected:string;
  }

  constructor(
    private $engine: EngineService,
    private $user: UserService,
    private $popup: PopoverController,
    private $route: ActivatedRoute,
    private $router: Router,
    private $toast: ToastController,
  ) {
    this.currentDate = this.$engine.currentShippingDate;
    this.config = this.$engine.currentConfig;
    this.month = this.$route.snapshot.params.month || (this.currentDate.getMonth() + 1);
    this.year = this.$route.snapshot.params.year || this.currentDate.getFullYear();

    this.funnelFilter = "";
    this.$crm = {
      from:(new Date()),
      to:(new Date()),
      customerOblivious:[],
      customerNew:[],
      customerEarly:[],
      customerPremium:[],
      customerRecurrent:[],
      customerQuit:[]
    } as any;

    //
    // reload data 
    // this.$route.params.subscribe(params => {
    //   console.log('--',params);
    // });
  }

  get totalCustomers() {
    return this.$crm.customerEarly.filter(this.filterSource(this.toggleSource)).length + 
           this.$crm.customerNew.filter(this.filterSource(this.toggleSource)).length + 
           this.$crm.customerPremium.filter(this.filterSource(this.toggleSource)).length + 
           this.$crm.customerQuit.filter(this.filterSource(this.toggleSource)).length + 
           this.$crm.customerRecurrent.filter(this.filterSource(this.toggleSource)).length +
           this.$crm.customerOblivious.filter(this.filterSource(this.toggleSource)).length;
  }

  get emailsSelected() {
    let emails = this.$crm.customerNew.filter((user:any) => user.selected);
    emails = emails.concat(this.$crm.customerOblivious.filter((user:any) => user.selected));
    emails = emails.concat(this.$crm.customerEarly.filter((user:any) => user.selected));
    emails = emails.concat(this.$crm.customerPremium.filter((user:any) => user.selected));
    emails = emails.concat(this.$crm.customerRecurrent.filter((user:any) => user.selected));
    emails = emails.concat(this.$crm.customerQuit.filter((user:any) => user.selected));

    return emails;
  }

  get emailsSelectedCount() {
    return this.emailsSelected.length;
  }

  get customerEarly() {
    if(!this.funnelFilter) {
      return this.$crm.customerEarly.filter(this.filterSource(this.toggleSource));
    }
    return this.$crm.customerEarly.filter(this.filterSource(this.toggleSource)).filter(user => user.orders.funnel == this.funnelFilter)
  }
  get customerNew() {
    if(!this.funnelFilter) {
      return this.$crm.customerNew.filter(this.filterSource(this.toggleSource));
    }
    return this.$crm.customerNew.filter(this.filterSource(this.toggleSource)).filter(user => user.orders.funnel == this.funnelFilter)
  }
  get customerPremium() {
    if(!this.funnelFilter) {
      return this.$crm.customerPremium.filter(this.filterSource(this.toggleSource));
    }
    return this.$crm.customerPremium.filter(this.filterSource(this.toggleSource)).filter(user => user.orders.funnel == this.funnelFilter)
  }
  get customerQuit() {
    if(!this.funnelFilter) {
      return this.$crm.customerQuit.filter(this.filterSource(this.toggleSource));
    }
    return this.$crm.customerQuit.filter(this.filterSource(this.toggleSource)).filter(user => user.orders.funnel == this.funnelFilter)
  }
  get customerRecurrent() {
    if(!this.funnelFilter) {
      return this.$crm.customerRecurrent.filter(this.filterSource(this.toggleSource));
    }
    return this.$crm.customerRecurrent.filter(this.filterSource(this.toggleSource)).filter(user => user.orders.funnel == this.funnelFilter)
  }
  get customerOblivious() {
    if(!this.funnelFilter) {
      return this.$crm.customerOblivious.filter(this.filterSource(this.toggleSource));
    }
    return this.$crm.customerOblivious.filter(user => user.orders.funnel == this.funnelFilter).filter(this.filterSource(this.toggleSource))
  }
  
  ngOnInit() {
    this.user = this.$engine.currentUser;
    this.isAdmin = this.user.isAdmin();
    this.onInitStats();
  }


  filterSource(toggleSource){
    return (user:any) => {
      switch(toggleSource){
        case 0: return true;
        case 1: return user.email.source != 'halle-de-rive';
        case 2: return user.email.source == 'halle-de-rive';
      }
    };
  }
  

  doToast(msg) {
    this.$toast.create({
      message: msg,
      duration: 3000
    }).then(alert => alert.present());
  }



  async onInitStats() {
   this.month = new Date(this.currentDate).getMonth() + 1;
   this.year = new Date(this.currentDate).getFullYear();
   const month = ('0' + (this.month )).slice(-2);

   this.$crm.customerNew = await this.$user.customerNew().toPromise();
   this.$crm.customerEarly = await this.$user.customerEarly().toPromise();
   this.$crm.customerPremium = await this.$user.customerPremium().toPromise();
   this.$crm.customerRecurrent = (await this.$user.customerRecurrent().toPromise()).filter(user => user.orders.count>5);
   this.$crm.customerQuit = await this.$user.customerQuit().toPromise();
  }

  async onOblivious() {
    this.$crm.customerOblivious = await this.$user.customerOblivious().toPromise();
  }

  onChecked(user){
    user.selected? (delete user.selected):(user.selected=true);
  }

  onToggleSource() {
    this.toggleSource = (++this.toggleSource) % 3;
    console.log('----- toggle source', this.toggleSource)
  }

  onCheckedAll(thread) {
    if(!this.$crm[thread]) {
      return;
    }
    this.$crm[thread].filter(this.filterSource(this.toggleSource)).forEach(user => {
      if(user.selected){
        delete user.selected;
      }else{
        user.selected = true;
      }
    })
    this.$crm.selected = thread;
  }

  async onEmail() {
    const customers = this.emailsSelected;
    const pop = await this.$popup.create({
      component: CustomerEmail,
      translucent: false,
      cssClass: 'customer-contact-popover',
      componentProps: {
        customers,from:this.$user.currentUser.email.address
      }
    });

    //
    // when a shipping date is selected
    pop.onDidDismiss().then(result => {
      if (result.data == 'sent') {
      }
      if (result.data == 'cancel') {
      }
    });

    return await pop.present();
  }

  sortCustomers(thread,sort){

    if(!this.$crm[thread]) {
      return;
    }

    const sorters = {
      'created':((a,b) => b.created.getTime()-a.created.getTime()),
      'when':((a,b) => b.orders.latest.getTime()-a.orders.latest.getTime()),
      'count':((a,b) => b.orders.count-a.orders.count)
    }

    this.$crm[thread] = this.$crm[thread].sort(sorters[sort]);
    this.$crm[thread+'-sort']=sort;
  }



}
