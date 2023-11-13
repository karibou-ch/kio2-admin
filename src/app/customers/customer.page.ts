import { Component, OnInit, Input } from '@angular/core';
import { Config, User, UserService, Shop } from 'kng2-core';
import { ToastController, AlertController, ModalController } from '@ionic/angular';
import { EngineService } from '../services/engine.service';
import { ActivatedRoute } from '@angular/router';
import { KngUtils } from '../services/kng-utils';

@Component({
  selector: 'app-customer',
  templateUrl: './customer.page.html',
  styleUrls: ['./customer.page.scss'],
})
export class CustomerPage implements OnInit {

  @Input() id: number;

  config: Config;
  user: User;
  customer: User;
  currentGeoIndex: number;
  defaultShop: Shop;
  invoice: {
    expiry?: string;
    issuer: string
  }

  constructor(
    private $route: ActivatedRoute,
    private $engine: EngineService,
    private $alert: AlertController,
    private $modal: ModalController,
    private $toast: ToastController,
    private $user: UserService,
    private $util: KngUtils
  ) {
    this.user = this.$engine.currentUser;
    this.invoice = {
      expiry: '',
      issuer: 'invoice'
    };

    this.$util.getGeoCode().subscribe(result => {
      const geo = (result.geo || {}).location;
      if(this.currentGeoIndex >= 0 && geo.lat) {
        this.customer.addresses[this.currentGeoIndex].geo = geo;
        this.doToast('La géoloc a bien été modifiée');
      }
      this.currentGeoIndex = null;
    });

  }

  get customerPlans() {
    const config = this.$engine.currentConfig;
    if(!config||!config.shared||!config.shared.user) {
      return [];
    }
    return config.shared.user.plan;
  }


  ngOnInit() {
    const id: number = this.id || Number(this.$route.snapshot.paramMap.get('id'));
    const forceload = true;
    this.$user.get(id,forceload).subscribe(user => {
      this.customer = user;
      if (this.customer.shops.length) {
        this.defaultShop = this.customer.shops[0];
      }
    });
  }


  onGeloc(idx, address) {
    this.currentGeoIndex = idx;
    this.$util.updateGeoCode(address.street,
                        address.postalCode,
                        address.region);

  }


  hasMethod(user, type) {
    if (!user.payments || !user.payments.length) {
      return false;
    }
    return user.payments.some(payment =>  {
      return payment.issuer.toLowerCase() === type;
    });
  }

  doAddInvoiceMethod(invoice,uid) {
    const [month,year] = invoice.expiry.split('/');
    this.$user.addPaymentCreditMethod(uid, month, year).subscribe(user => {
      this.doToast('La méthode de paiement a été ajoutée');
      this.customer = user;
    }, status => {
      this.doToast(status.error || status.message);
    });
  }

  doCustomerPlan($event) {
    this.customer.plan.name = $event.detail.value;
  }

  doClose() {
    this.$modal.dismiss();
  }

  doDeletePaymentMethod( alias, cid) {
    const confirm = window.prompt('SUPPRESSION DE DEFINITIVE! \nCONFIRMER AVEC DELETE');
    if (confirm !== 'DELETE') {
      return;
    }

    this.$user.deletePaymentMethod(alias, cid).subscribe(user => {
      this.doToast('La méthode de paiement a été supprimée');
      this.customer = user;
    }, status => {
      this.doToast(status.error || status.message);
    });
  }

  doRemove(customer) {
    const confirm = window.prompt('SUPPRESSION DE ->' + customer.email.address + '<- DEFINITIVE! \nCONFIRMER AVEC VOTRE MOT-DE-PASSE');
    if (!confirm) {
      return;
    }


    this.$user.remove(customer.id, confirm).subscribe(ok => {
      this.$toast.create({
        message: 'OK',
        duration: 3000,
        position: 'bottom'
      }).then(alert => alert.present());
    }, status => {
      this.$toast.create({
        message: status.error || status.message || status,
        duration: 3000,
        color: 'danger',
        position: 'middle'
      }).then(alert => alert.present());

    });
  }

  doSave(customer) {
    this.$user.save(customer).subscribe(user => {
      this.doToast('Save done!');
      this.customer = user;
    }, status => {
      this.doToast(status.error || status.message);
    });
  }

  doToast(msg) {
    this.$toast.create({
      message: msg,
      duration: 5000,
      color:'black'
    }).then(alert => alert.present());
  }
}
