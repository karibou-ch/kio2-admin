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
  hubs: any[];
  currentGeoIndex: number;
  defaultShop: Shop;
  authlinkName: string;
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
    this.config = this.$engine.currentConfig;
    this.hubs = (this.config.shared.hubs || []).slice();
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
      this.customer.identity = this.customer.identity || {} as any;
      this.customer.reminder = this.customer.reminder || {} as any;
      this.authlinkName = (this.customer.identity as any).codelink || '';

      if (this.customer.shops.length) {
        this.defaultShop = this.customer.shops[0];
      }
    });
  }


  onGeloc(idx, address) {
    this.currentGeoIndex = idx;
    this.$util.updateGeoCode(address.streetAdress,
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

  doUpdateAuthLink() {
    console.log('doUpdateAuthLink', this.customer.id);
    this.$user.createOrUpdateAuthLink(this.customer.id, {
      codelink: this.authlinkName,
      email: this.customer.email.address
    }).subscribe(result => {
      this.customer.identity.authlink = result.link;
      (this.customer.identity as any).codelink = result.codelink || this.authlinkName;
      this.doToast('L\'autorisation a été mise à jour');
    });
  }

  getAuthLinkUrl(target: 'store' | 'admin') {
    if (!this.customer || !this.customer.identity || !this.customer.identity.authlink) {
      return '';
    }
    const base = target === 'admin' ? 'https://admin.karibou.ch' : 'https://karibou.ch';
    return base + '?authlink=' + this.customer.identity.authlink;
  }

  async copyAuthLink(target: 'store' | 'admin') {
    const link = this.getAuthLinkUrl(target);
    if (!link) {
      return;
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(link);
      } else {
        this.copyTextFallback(link);
      }
      this.doToast('Lien copié');
    } catch (err) {
      this.copyTextFallback(link);
      this.doToast('Lien copié');
    }
  }

  private copyTextFallback(text: string) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }

  doCustomerPlan($event) {
    this.customer.plan.name = $event.detail.value;
  }

  getHubName(hub: any) {
    return hub && hub.name ? hub.name : this.getHubSlug(hub);
  }

  getHubSlug(hub: any) {
    if (!hub || !hub.slug) {
      return '';
    }
    return Array.isArray(hub.slug) ? hub.slug[0] : hub.slug;
  }

  async doClose() {
    try{
      await this.$modal.dismiss();
    }catch(err){
      history.back();
    }
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
    this.$user.saveDelegated(customer).subscribe(user => {
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
