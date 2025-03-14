import { Component, OnInit, Input } from '@angular/core';
import { User, UserService } from 'kng2-core';
import { PopoverController, ToastController } from '@ionic/angular';
import { EngineService } from '../services/engine.service';

type CRM = {
  customerNew: User[];
  customerOccasional: User[];
  customerRecurrent: User[];
  customerPremium: User[];
  customerQuit: User[];
}

type CRMstats = {
  new: number;
  early: number;
  recurrent: number;
  premium: number;
  quit: number;
  unknown: string[];
}


@Component({
  selector: 'kio-customer-email',
  templateUrl: './customer-email.page.html',
  styleUrls: ['./customer-email.page.scss'],
})
// eslint-disable-next-line @angular-eslint/component-class-suffix
export class CustomerEmail  {

  @Input() customers: User[];
  @Input() CRM:CRM;


  emailStats: CRMstats;
  subject="";
  selectedEmail="";
  content="";
  funnel="new";
  @Input() from:string;


  constructor(
    private $user: UserService,
    private $toast: ToastController,
    private $popup: PopoverController
  ) {
  }

  get selectedEmailStats(): CRMstats {
    const emails = this.selectedEmail.split(/[,:\n]/).map(email => email.trim());
    const unknown = emails.filter(email => {
      return !this.CRM.customerNew.some(user => user.email.address === email) &&
        !this.CRM.customerOccasional.some(user => user.email.address === email) &&
        !this.CRM.customerRecurrent.some(user => user.email.address === email) &&
        !this.CRM.customerPremium.some(user => user.email.address === email) &&
        !this.CRM.customerQuit.some(user => user.email.address === email);
    });
    return {
      new: this.CRM.customerNew.filter(user => emails.indexOf(user.email.address)>-1).length,
      early: this.CRM.customerOccasional.filter(user => emails.indexOf(user.email.address)>-1).length,
      recurrent: this.CRM.customerRecurrent.filter(user => emails.indexOf(user.email.address)>-1).length,
      premium: this.CRM.customerPremium.filter(user => emails.indexOf(user.email.address)>-1).length,
      quit: this.CRM.customerQuit.filter(user => emails.indexOf(user.email.address)>-1).length,
      unknown
    };
  }

  get customersEmail() {
    return this.selectedEmail
  }

  set customersEmail(emails) {
    this.selectedEmail = emails;
    this.emailStats = this.selectedEmailStats;

  }

  ngOnInit() {
    if(this.customers && this.customers.length){
      this.selectedEmail = this.customers.map(user => user.email.address.trim()).sort().join(', ');
    }

    this.emailStats = this.selectedEmailStats;
  }

  async onStats() {
    this.emailStats = this.selectedEmailStats;
  }

  async onUnknownClean() {
    const emails = this.selectedEmail.split(/[,:\n]/).map(email => email.trim()).filter(email => email);


    const filter = emails.filter(email => this.emailStats.unknown.indexOf(email) === -1);
    this.customersEmail = filter.join(', ');
  }

  async onCustomerFunnel() {

    try{
      const content={
        emails:this.selectedEmail||this.customersEmail,
        from:this.from,
        funnel:this.funnel
      }
      await this.$user.crmFunnel(content).toPromise();
    }catch(err:any){
      console.log('crmFunnel ',err);
      this.$toast.create({
        message: err.error||err.message,
        duration: 3000,
        color: 'danger',
        position: 'middle'
      }).then(alert => alert.present());
    }

  }

  async onCustomerTest() {
    try{
      const content={
        emails:this.from,
        from: this.from,
        subject: this.subject,
        message:this.content,
        funnel:this.funnel
      }
      await this.$user.crmEmail(content).toPromise();
    }catch(err){
      console.log('crmTest ',err);
      this.$toast.create({
        message: err.error||err.message,
        duration: 3000,
        color: 'danger',
        position: 'middle'
      }).then(alert => alert.present());
    }

  }

  async onCustomerContact() {
    try{
      const content={
        emails:this.selectedEmail||this.customersEmail,
        from: this.from,
        subject: this.subject,
        message:this.content,
        funnel:this.funnel
      }
      await this.$user.crmEmail(content).toPromise();
      this.$popup.dismiss('send');
    }catch(err:any){
      console.log('crmContact ',err);
      this.$toast.create({
        message: err.error||err.message,
        duration: 3000,
        color: 'danger',
        position: 'middle'
      }).then(alert => alert.present());
    }
  }




  async onCancel() {
    this.$popup.dismiss('cancel');
  }
}
