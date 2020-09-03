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
  defaultShop: Shop;
  invoice: {
    name?: string,
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
      name: '',
      expiry: '',
      issuer: 'invoice'
    };

    this.$util.getGeoCode().subscribe(result => {


      // if (result.geo && result.geo.location) {
      //   this.shop.address.geo = result.geo.location;
      // }

      // (result.components || []).forEach(comp => {
      //   if (this.locations.indexOf(comp) > -1 && (this.shop.address.postalCode !== comp)) {
      //     this.shop.address.postalCode = comp;
      //   }
      //   if (this.regions.indexOf(comp) > -1 && (this.shop.address.region !== comp)) {
      //     this.shop.address.region = comp;
      //   }
      // });

    });

  }

  ngOnInit() {
    const id: number = this.id || Number(this.$route.snapshot.paramMap.get('id'));
    this.$user.get(id).subscribe(customer => {
      this.customer = customer;
      if (this.customer.shops.length) {
        this.defaultShop = this.customer.shops[0];
      }
    });
  }


  ngOnChanges(input) {
    // const street: any = {
    //   streetAdress: this.shop.address.streetAdress,
    //   region: this.shop.address.region,
    //   postalCode: this.shop.address.postalCode
    // };

    // if (!this.shop.address.streetAdress ||
    //   this.shop.address.streetAdress === '') {
    //   return;
    // }

    // //
    // // request new GEO
    // this.$util.updateGeoCode(
    //   this.shop.address.streetAdress,
    //   this.shop.address.postalCode,
    //   this.shop.address.region);

  }

  hasMethod(user, type) {
    if (!user.payments || !user.payments.length) {
      return false;
    }
    return user.payments.some(payment =>  {
      return payment.issuer.toLowerCase() === type;
    });
  }

  doAddInvoiceMethod(invoice, cid) {
    invoice.id = Date.now();
    this.$user.addPaymentMethod(invoice,cid).subscribe(user => {
      this.doToast('La méthode de paiement a été ajoutée');
      this.customer = user;
    }, status => {
      this.doToast(status.error || status.message);
    });
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
      duration: 3000
    }).then(alert => alert.present());
  }
}
