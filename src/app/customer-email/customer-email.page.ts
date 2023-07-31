import { Component, OnInit, Input } from '@angular/core';
import { User, UserService } from 'kng2-core';
import { PopoverController, ToastController } from '@ionic/angular';
import { EngineService } from '../services/engine.service';

@Component({
  selector: 'kio-customer-email',
  templateUrl: './customer-email.page.html',
  styleUrls: ['./customer-email.page.scss'],
})
export class CustomerEmail implements OnInit {

  @Input() customers: User[];


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

  get customersEmail() {
    return this.customers.map(user => user.email.address).join(', ');
  }

  set customersEmail(emails) {
    this.selectedEmail = emails;
  }

  ngOnInit() {
  }

  async onCustomerFunnel() {

    try{
      const content={
        emails:this.selectedEmail||this.customersEmail,
        from:this.from,
        funnel:this.funnel
      }
      await this.$user.crmFunnel(content).toPromise();
    }catch(err){
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
    }catch(err){
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
