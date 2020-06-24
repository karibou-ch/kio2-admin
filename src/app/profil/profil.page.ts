import { Component, OnInit } from '@angular/core';
import { Config, User, ConfigKeyStoreEnum, config, LoaderService, UserService, Shop } from 'kng2-core';
import { App } from '@ionic/pro';
import { ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { EngineService } from '../services/engine.service';

@Component({
  selector: 'app-profil',
  templateUrl: './profil.page.html',
  styleUrls: ['./profil.page.scss'],
})
export class ProfilPage implements OnInit {


  //
  // Stripe connect
  STRIPE_CONNECT = 'https://connect.stripe.com/express/oauth/authorize';

  defaultShop: Shop;
  stripeParameters: any;
  stripeUrl: string;


  config: Config = config;
  server: string;
  isReady: boolean;
  user: User = new User();
  postalCodes = [];

  KIO2_SERVER: string = ConfigKeyStoreEnum[ConfigKeyStoreEnum.KIO2_SERVER];

  constructor(
    private $engine: EngineService,
    private $router: Router,
    private toast: ToastController,
    private $user: UserService
  ) {
    this.user = this.$engine.currentUser;
    this.config = this.$engine.currentConfig;

    //
    // fix TVA
    // if (!this.user.account.tva) {
    //   this.user.account.tva = {};
    // }

    //
    // display vendor informations
    if (this.user.shops.length) {
      this.defaultShop = this.user.shops[0];
      this.stripeParameters = {};
      const redirect = window.location.href;
      this.stripeParameters.state = this.user.id;
      this.stripeParameters.client_id = 'ca_AUrJdJtcFPx2GlG38h2i1XxUld9J2Ya8';//+config.shared.keys.pubStripe;
      this.stripeParameters.redirect_uri = redirect + '/stripe';
      this.stripeParameters['stripe_user[business_type]'] = 'company';
      this.stripeParameters['stripe_user[phone_number]'] = this.defaultShop.address.phone;
      this.stripeParameters['stripe_user[business_name]'] = this.defaultShop.name;
      this.stripeParameters['stripe_user[first_name]'] = this.user.name.givenName;
      this.stripeParameters['stripe_user[last_name]'] = this.user.name.familyName;
      this.stripeParameters['stripe_user[email]'] = this.user.email.address;

      // we can pass some additional fields to prefill:
      this.stripeParameters['suggested_capabilities[]'] = 'transfers';
      this.stripeParameters['stripe_user[street_address]'] = this.defaultShop.address.streetAdress;
      this.stripeParameters['stripe_user[zip]'] = this.defaultShop.address.postalCode;
      this.stripeParameters['stripe_user[state]'] = this.defaultShop.address.region;


      this.stripeUrl = this.STRIPE_CONNECT + '?' + new URLSearchParams(this.stripeParameters).toString();
    }

  }

  isPC(postal: string) {
    const lst = this.user.logistic.postalCode || [];
    return lst.indexOf(postal) !== -1;
  }

  isToggleAll() {
    const lst = this.user.logistic.postalCode || [];
    return lst.length;
  }

  ngOnInit() {
  }

  logout() {
    this.$user.logout().subscribe();
    this.$router.navigateByUrl('/login');
  }

  save() {
    this.$user.save(this.user).subscribe(
      () => {
        this.toast.create({
          message: 'Enregistré',
          duration: 1000
        }).then(alert => alert.present());
      },
      error => {
        this.toast.create({
          message: error.error,
          duration: 3000
        }).then(alert => alert.present());

      }
    );
  }


  toggleAll() {
    const lst = this.user.logistic.postalCode || [];
    if (lst.length) {
      this.user.logistic.postalCode = [];
    } else {
      this.user.logistic.postalCode = this.postalCodes;
    }
    this.save();
  }

  togglePC(postal: string) {
    const lst = this.user.logistic.postalCode || [];
    const pos = lst.indexOf(postal);
    if (pos === -1) {
      lst.push(postal);
    } else {
      lst.splice(pos, 1);
    }
    this.user.logistic.postalCode = lst;
    this.save();
  }

}
