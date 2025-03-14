import { Component, OnInit } from '@angular/core';
import { Config, User, UserService, config } from 'kng2-core';
import { EngineService } from '../services/engine.service';
import { PopoverController, ToastController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerEmail } from '../customer-email/customer-email.page';


@Component({
  selector: 'app-ucrm',
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
  toggleSource:number = 0;
  sourceLabel = {
    0:'all',
    1:'b2b',
    2:'b2b-school'
  }

  toggle = {
    recurrent:false,
    source:0,
    lastMail:false,
    recentMail:false,
    profileChange:false,
    when:new Date()
  }

  funnelFilter:string;

  isAdmin = false;


  $crm:{
    customerOblivious:{users:User[],churn:any[]};
    customerNew:{users:User[],churn:any[]}  ;
    customerOccasional:{users:User[],churn:any[]};
    customerPremium:{users:User[],churn:any[]};
    customerRecurrent:{users:User[],churn:any[]};
    customerQuit:{users:User[],churn:any[]};
    customerChurn:any[];
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
    this.month = this.$route.snapshot.params['month'] || (this.currentDate.getMonth() + 1);
    this.year = this.$route.snapshot.params['year'] || this.currentDate.getFullYear();

    this.funnelFilter = "";
    this.$crm = {
      from:(new Date()),
      to:(new Date()),
      customerOblivious:{users:[],churn:[]},
      customerNew:{users:[],churn:[]},
      customerOccasional:{users:[],churn:[]},
      customerPremium:{users:[],churn:[]},
      customerRecurrent:{users:[],churn:[]},
      customerQuit:{users:[],churn:[]},
      customerChurn:[]
    } as any;

    this.toggle.when.setMonth(this.currentDate.getMonth()-1);
    //
    // reload data
    // this.$route.params.subscribe(params => {
    //   console.log('--',params);
    // });
  }

  get totalCustomers() {
    return this.$crm.customerOccasional.users.filter(this.filterToggle(this.toggle)).length +
           this.$crm.customerNew.users.filter(this.filterToggle(this.toggle)).length +
           this.$crm.customerPremium.users.filter(this.filterToggle(this.toggle)).length +
           this.$crm.customerQuit.users.filter(this.filterToggle(this.toggle)).length +
           this.$crm.customerRecurrent.users.filter(this.filterToggle(this.toggle)).length +
           this.$crm.customerOblivious.users.filter(this.filterToggle(this.toggle)).length;
  }

  get emailsSelected() {
    let emails = this.$crm.customerNew.users.filter((user:any) => user.selected);
    emails = emails.concat(this.$crm.customerOblivious.users.filter((user:any) => user.selected));
    emails = emails.concat(this.$crm.customerOccasional.users.filter((user:any) => user.selected));
    emails = emails.concat(this.$crm.customerPremium.users.filter((user:any) => user.selected));
    emails = emails.concat(this.$crm.customerRecurrent.users.filter((user:any) => user.selected));
    emails = emails.concat(this.$crm.customerQuit.users.filter((user:any) => user.selected));

    return emails;
  }

  get emailsSelectedCount() {
    return this.emailsSelected.length;
  }

  get customerOccasional() {
    if(!this.funnelFilter) {
      return this.$crm.customerOccasional.users.filter(this.filterToggle(this.toggle));
    }
    return this.$crm.customerOccasional.users.filter(this.filterToggle(this.toggle)).filter(user => user.orders.funnel == this.funnelFilter)
  }
  get customerNew() {
    if(!this.funnelFilter) {
      return this.$crm.customerNew.users.filter(this.filterToggle(this.toggle));
    }
    return this.$crm.customerNew.users.filter(this.filterToggle(this.toggle)).filter(user => user.orders.funnel == this.funnelFilter)
  }
  get customerPremium() {
    if(!this.funnelFilter) {
      return this.$crm.customerPremium.users.filter(this.filterToggle(this.toggle));
    }
    return this.$crm.customerPremium.users.filter(this.filterToggle(this.toggle)).filter(user => user.orders.funnel == this.funnelFilter)
  }
  get customerQuit() {
    if(!this.funnelFilter) {
      return this.$crm.customerQuit.users.filter(this.filterToggle(this.toggle));
    }
    return this.$crm.customerQuit.users.filter(this.filterToggle(this.toggle)).filter(user => user.orders.funnel == this.funnelFilter)
  }
  get customerRecurrent() {
    if(!this.funnelFilter) {
      return this.$crm.customerRecurrent.users.filter(this.filterToggle(this.toggle));
    }
    return this.$crm.customerRecurrent.users.filter(this.filterToggle(this.toggle)).filter(user => user.orders.funnel == this.funnelFilter)
  }
  get customerOblivious() {
    if(!this.funnelFilter) {
      return this.$crm.customerOblivious.users.filter(this.filterToggle(this.toggle));
    }
    return this.$crm.customerOblivious.users.filter(user => user.orders.funnel == this.funnelFilter).filter(this.filterToggle(this.toggle))
  }

  ngOnDestroy() {
    document.querySelector(':root').classList.remove('full-width');
  }

  ngOnInit() {
    this.user = this.$engine.currentUser;
    this.isAdmin = this.user.isAdmin();
    this.onInitStats();
    document.querySelector(':root').classList.add('full-width');
  }


  filterToggle(toggle){
    const mapper = this.sourceLabel;
    return (user:any) => {
      let ok = true;
      if(toggle.source){
        ok = (user.plan.name == mapper[toggle.source]);
      }
      if(toggle.lastMail && user.orders.lastMail) {
        ok = ok && (new Date(user.orders.lastMail)<toggle.when);
      }
      if(toggle.recentMail && user.orders.recentMail) {
        ok = ok && (new Date(user.orders.lastMail)>toggle.when);
      }
      // Filter users who changed profile in the last 60 days
      if(toggle.profileChange && user.orders.profileChange) {
        const ellapsed = Date.now() - new Date(user.orders.profileChange).getTime();
        ok = ok && (ellapsed < (15 * 24 * 60 * 60 * 1000));
        if(user.orders.profile=='recurrent')console.log('profileChange',(60 * 24 * 60 * 60 * 1000),ellapsed);
      }
      return ok;
    };
  }


  doToast(msg) {
    this.$toast.create({
      message: msg,
      duration: 3000
    }).then(alert => alert.present());
  }

  countSelected(segment){
    return this.$crm[segment].users.filter(user => user.selected).length;
  }

  selectChrun(segment){
    if(!this.$crm[segment]?.churn) {
      return 0;
    }
    return this.$crm[segment].churn[0]?.lost||0;
  }


  async onInitStats() {
   this.month = new Date(this.currentDate).getMonth() + 1;
   this.year = new Date(this.currentDate).getFullYear();
   const month = ('0' + (this.month )).slice(-2);

   this.$crm.customerNew = await this.$user.customerNew().toPromise();
   this.$crm.customerOccasional = await this.$user.customerOccasional().toPromise();
   this.$crm.customerPremium = await this.$user.customerPremium().toPromise();
   this.$crm.customerRecurrent = (await this.$user.customerRecurrent().toPromise());
   this.$crm.customerQuit = await this.$user.customerQuit().toPromise();
   this.$crm.customerChurn = await this.$user.customerChurn().toPromise();
  }

  async onOblivious() {
    this.$crm.customerOblivious = await this.$user.customerOblivious().toPromise();
  }

  onChecked(user){
    user.selected? (delete user.selected):(user.selected=true);
  }

  onSelectWelcome(weeks:number){
    const now = new Date();
    const ellapsed = (now).setDate(now.getDate()-weeks*7);
    this.$crm.customerNew.users.forEach(user => delete(user.selected));
    this.$crm.customerNew.users.filter(user => user.created.getTime() > ellapsed).forEach(user => {
      user.selected = !user.selected;
    });
  }
  onSelectChrun(segment){
    this.$crm[segment].users.forEach(user => delete(user.selected));
    const churn = this.$crm[segment].churn || [];
    const quits = churn.find(ch => ch.quits).quits || [];
    const users = [];
    users.push(...this.$crm['customerQuit'].users.filter(user => quits.indexOf(user.id)>=0));
    users.push(...this.$crm['customerPremium'].users.filter(user => quits.indexOf(user.id)>=0));
    users.push(...this.$crm['customerRecurrent'].users.filter(user => quits.indexOf(user.id)>=0));
    users.push(...this.$crm['customerOccasional'].users.filter(user => quits.indexOf(user.id)>=0));

    users.forEach(user => {
      user.selected = !user.selected;
    });
  }



  onToggleSource() {
    this.toggle.source = (++this.toggle.source) % 3;
  }

  onToggleLastMail() {
    this.toggle.lastMail=!this.toggle.lastMail;
    this.toggle.recentMail = false;
  }

  onToggleNewMail() {
    this.toggle.recentMail=!this.toggle.recentMail;
    this.toggle.lastMail = false;
    console.log('customerNew',this.customerNew.filter(u => u.orders.lastMail));
    console.log('customerOccasional',this.customerOccasional.filter(u => u.orders.lastMail));
  }

  onCheckedAll(thread) {
    if(!this.$crm[thread]) {
      return;
    }
    this.$crm[thread].users.filter(this.filterToggle(this.toggle)).forEach(user => {
      if(user.selected){
        delete user.selected;
      }else{
        user.selected = true;
      }
    })
    this.$crm.selected = thread;
  }

  async onEmail() {
    // FIXME this should be on a service API
    const CRM = this.$crm;
    const customers = this.emailsSelected;
    const pop = await this.$popup.create({
      component: CustomerEmail,
      translucent: false,
      cssClass: 'customer-contact-popover',
      componentProps: {
        customers,from:this.$user.currentUser.email.address, CRM
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

  onReset() {
    this.$crm['customerNew'].users.forEach(user => delete(user.selected));
    this.$crm['customerOccasional'].users.forEach(user => delete(user.selected));
    this.$crm['customerRecurrent'].users.forEach(user => delete(user.selected));
    this.$crm['customerPremium'].users.forEach(user => delete(user.selected));
    this.$crm['customerOblivious'].users.forEach(user => delete(user.selected));
    this.$crm['customerQuit'].users.forEach(user => delete(user.selected));
    this.funnelFilter='';
    this.toggle.source=0;
    this.toggle.lastMail = false;
    this.toggle.recentMail = false;
    this.toggle.profileChange = false;
    this.toggle.recurrent = false;
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

    this.$crm[thread].users = this.$crm[thread].users.sort(sorters[sort]);
    this.$crm[thread+'-sort']=sort;
  }



}
