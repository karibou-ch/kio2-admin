import { Component, OnInit, OnChanges } from '@angular/core';
import { User, Shop, Category, ShopService, Config, LoaderService } from 'kng2-core';
import { ToastController, ModalController, AlertController } from '@ionic/angular';
import { UploadImagePage } from '../upload-image/upload-image.page';
import { EngineService } from '../services/engine.service';
import { ActivatedRoute, Router } from '@angular/router';
import { KngUtils } from '../services/kng-utils';

@Component({
  selector: 'kio-vendor-details',
  templateUrl: './vendor-details.page.html',
  styleUrls: ['./vendor-details.page.scss'],
})
export class VendorDetailsPage implements OnChanges {

  config: Config;
  user: User;
  shop: Shop;
  categories: Category[];
  title: string;
  weekdays = {};
  tvaId;
  catalog;
  isReady: boolean;
  isCreate: boolean;
  regions: string[];
  locations: any[];

  constructor(
    private $modal: ModalController,
    private $route: ActivatedRoute,
    private $router: Router,
    private $shop: ShopService,
    private $toast: ToastController,
    private $alert: AlertController,
    private $util: KngUtils,
    private $loader: LoaderService

  ) {
    const urlpath = this.$route.snapshot.params['shop'];
    const { config, user, categories } = this.$loader.getLatestCoreData();
    this.user = user;
    this.config = config;
    this.categories = categories;

    this.shop = new Shop();

    //
    // validate geo localisation
    this.locations = this.config.shared.user.location.list;
    this.regions = this.config.shared.user.region.list;

    this.$util.getGeoCode().subscribe(result => {


      if (result.geo && result.geo.location) {
        this.shop.address.geo = result.geo.location;
      }

      (result.components || []).forEach(comp => {
        if (this.locations.indexOf(comp) > -1 && (this.shop.address.postalCode !== comp)) {
          this.shop.address.postalCode = comp;
        }
        if ((this.shop.address.region !== comp)) {
          this.shop.address.region = comp;
        }
      });

    });

    this.isCreate = (urlpath === 'create');
    if (this.isCreate) {
      this.initShop();
      return;
    }
    this.$shop.get(urlpath).subscribe(shop => {
      Object.assign(this.shop, shop);
      this.initShop();
    },(status) => {
      this.$toast.create({
        message: status.error,
        duration: 3000,
        position: 'middle',
        color: 'danger'
      }).then(alert => alert.present());
    });
  }

  ngOnChanges(input) {
    const street: any = {
      streetAdress: this.shop.address.streetAdress,
      region: this.shop.address.region,
      postalCode: this.shop.address.postalCode
    };

    if (!this.shop.address.streetAdress ||
      this.shop.address.streetAdress === '') {
      return;
    }

    //
    // request new GEO
    this.$util.updateGeoCode(
      this.shop.address.streetAdress,
      this.shop.address.postalCode,
      this.shop.address.region);

  }

  doBack() {
    window.history.back();
  }

  doCreateFAQ(shop) {
    shop.faq = shop.faq || [];
    shop.faq.push({
      q: '',
      a: '',
      updated: (new Date())
    });
  }

  //
  // https://stackoverflow.com/a/41905475
  formatToGMT(date: Date) {
    // Try out the incorrectly "converted" date string.
    // new Date(date.valueOf() + date.getTimezoneOffset() * 60000);
    // Sat Jan 28 2017 00:16:35 GMT-0600 (CST)
    if (!date) {
      return '';
    }
    return  (new Date(date)).toISOString();
  }

  ibanCtrl() {
    return this.isValidIBANNumber(this.shop.account.IBAN);
  }

  isClosed() {
    return this.shop.available.active || (this.shop.status !== true);
  }
  /*
   * Returns 1 if the IBAN is valid
   * Returns FALSE if the IBAN's length is not as should be (for CY the IBAN Should be 28 chars long starting with CY )
   * Returns any other number (checksum) when the IBAN is invalid (check digits do not match)
   */
  isValidIBANNumber(input) {
    const mod97 = (str: string) => {
      let checksum: any = str.slice(0, 2),
        fragment: any;
      for (let offset = 2; offset < str.length; offset += 7) {
        fragment = String(checksum) + str.substring(offset, offset + 7);
        checksum = parseInt(fragment, 10) % 97;
      }
      return checksum;
    };

    const CODE_LENGTHS = {
      AD: 24, AE: 23, AT: 20, AZ: 28, BA: 20, BE: 16, BG: 22, BH: 22, BR: 29,
      CH: 21, CR: 21, CY: 28, CZ: 24, DE: 22, DK: 18, DO: 28, EE: 20, ES: 24,
      FI: 18, FO: 18, FR: 27, GB: 22, GI: 23, GL: 18, GR: 27, GT: 28, HR: 21,
      HU: 28, IE: 22, IL: 23, IS: 26, IT: 27, JO: 30, KW: 30, KZ: 20, LB: 28,
      LI: 21, LT: 20, LU: 20, LV: 21, MC: 27, MD: 24, ME: 22, MK: 19, MR: 27,
      MT: 31, MU: 30, NL: 18, NO: 15, PK: 24, PL: 28, PS: 29, PT: 25, QA: 29,
      RO: 24, RS: 22, SA: 24, SE: 24, SI: 19, SK: 24, SM: 27, TN: 24, TR: 26
    };

    //
    // keep only alphanumeric characters
    const iban = String(input).toUpperCase().replace(/[^A-Z0-9]/g, '');
    //
    // match and capture (1) the country code, (2) the check digits, and (3) the rest
    const code = iban.match(/^([A-Z]{2})(\d{2})([A-Z\d]+)$/);
    let digits;
    // check syntax and length
    if (!code || iban.length !== CODE_LENGTHS[code[1]]) {
      return false;
    }
    // rearrange country code and check digits, and convert chars to ints
    const replaceFunc = (letter: string): any => {
      return letter.charCodeAt(0) - 55;
    };
    digits = (code[3] + code[1] + code[2]).replace(/[A-Z]/g, replaceFunc);
    // final check
    return mod97(digits);
  }

  initShop() {
    //
    // Catalog
    if (this.shop.catalog) {
      this.catalog = (this.shop.catalog._id) || this.shop.catalog;
    }

    //
    // TVA
    if (!this.shop.account.tva) {
      this.shop.account.tva = {};
    }
    this.tvaId = this.shop.account.tva.number || '';
    //
    // model for weekdays
    (this.shop.available.weekdays || []).map(day => this.weekdays[day] = true);
    this.isReady = true;
  }

  onDateFrom() {

  }
  onDateTo() {

  }

  onCopy() {
    const jsonString = this.serializeShop();
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      this.notify('La copie automatique n\'est pas disponible dans ce navigateur', 'warning');
      return;
    }

    navigator.clipboard.writeText(jsonString).then(() => {
      this.notify('Vendeur copié dans le presse-papiers');
    }, () => {
      this.notify('Impossible de copier le vendeur', 'warning');
    });
  }

  onPaste(event: ClipboardEvent) {
    if (this.isEditablePasteTarget(event)) {
      return;
    }

    const jsonString = event.clipboardData && event.clipboardData.getData('text/plain');
    if (!jsonString) {
      return;
    }

    let shop;
    try {
      shop = JSON.parse(jsonString);
    } catch (error) {
      this.notify('Le clipboard ne contient pas un vendeur', 'warning');
      return;
    }

    event.preventDefault();
    if (!this.canPasteIntoShop()) {
      this.notify('Le collage est autorisé uniquement sur une nouvelle boutique vide', 'warning');
      return;
    }

    const html = this.serializeShopToHtml(shop);
    this.$alert.create({
      header: 'Remplacer la boutique ?',
      message: html,
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Accepter',
          handler: () => {
            this.weekdays = {};
            this.catalog = undefined;
            this.tvaId = undefined;
            this.shop = shop;
            this.initShop();
          }
        }
      ]
    }).then(alert => alert.present());
  }

  private serializeShop() {
    return JSON.stringify(this.shop, (key, value) => {
      if (this.isProtectedCopyField(key)) {
        return undefined;
      }
      return value;
    }, 2);
  }

  private serializeShopToHtml(shop: any) {
    const name = shop && shop.name ? shop.name : 'Boutique sans nom';
    const description = shop && shop.description ? shop.description : '';
    return '<h2>' + this.escapeHtml(name) + '</h2><p>' + this.escapeHtml(description) + '</p>';
  }

  private isProtectedCopyField(key: string) {
    return ['_id', 'id', '__v', 'urlpath', 'slug', 'created', 'name', 'description'].indexOf(key) > -1;
  }

  private canPasteIntoShop() {
    return !this.shop._id &&
      !this.shop['id'] &&
      !this.shop['slug'] &&
      !this.shop['urlpath'] &&
      !this.shop.name &&
      !this.hasContent(this.shop.description);
  }

  private isEditablePasteTarget(event: ClipboardEvent) {
    const path = typeof event.composedPath === 'function' ? event.composedPath() : [event.target];
    return path.some(target => {
      if (!(target instanceof HTMLElement)) {
        return false;
      }
      const tagName = target.tagName.toLowerCase();
      return target.isContentEditable ||
        ['input', 'textarea', 'select', 'ion-input', 'ion-textarea'].indexOf(tagName) > -1;
    });
  }

  private hasContent(value: any) {
    if (!value) {
      return false;
    }
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }
    if (typeof value === 'object') {
      return Object.keys(value).some(key => this.hasContent(value[key]));
    }
    return true;
  }

  private notify(message: string, color = 'dark') {
    this.$toast.create({
      message,
      duration: 2000,
      color
    }).then(alert => alert.present());
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  doDelete() {
    const confirm = window.prompt('LA SUPPRESSION EST DEFINITIVE! CONFIRMER AVEC VOTRE MOT-DE-PASSE');
    if (!confirm) {
      return;
    }

    this.$shop.remove(this.shop, confirm).subscribe(removeInfo => {
      const shop = new Shop();
      Object.assign(this.shop, shop);
      this.$toast.create({
        message: 'Suppression de produits:' + removeInfo.deletedCount,
        duration: 3000,
        position: 'middle',
        color: 'danger'
      }).then(alert => alert.present());
      this.$router.navigate(['/vendors']);

    }, status => {
      this.$toast.create({
        message: status.error,
        duration: 3000,
        position: 'middle',
        color: 'danger'
      }).then(alert => alert.present());
    });



  }

  doSave():any {


    //
    // sync catalog
    if (this.catalog !== this.shop.catalog) {
      this.shop.catalog = this.categories.find(c => c._id === this.catalog);
    }

    //
    // checks
    if(!this.shop.catalog || this.shop.catalog.type !== 'Catalog') {
      return this.$toast.create({
        message: 'Le catalogue n\'a pas encore été sélectionné',
        duration: 3000,
        color: 'danger',
        position: 'middle'
      }).then(alert => alert.present());
    }


    //
    // sync TVA
    if (!this.shop.account.tva) {
      this.shop.account.tva = {};
    }
    this.shop.account.tva.number = this.tvaId;

    //
    // sync weekdays
    this.shop.available.weekdays = Object.keys(this.weekdays).filter(day => this.weekdays[day]).map(day => (parseInt(day)));
    const action$ = (this.isCreate) ? this.$shop.create(this.shop) : this.$shop.save(this.shop);
    action$.subscribe(
      (shop: Shop) => {
        //
        // once the shop is created, it should switch on edit mode
        this.isCreate = false;
        this.$toast.create({
          message: 'Enregistré',
          duration: 3000,
          color: 'dark'
        }).then(alert => alert.present());


      },
      status => {
        this.$toast.create({
          message: status.error,
          duration: 3000,
          position: 'middle',
          color: 'danger'
        }).then(alert => alert.present());
      }
    );
  }

  doExit() {
    // this.navCtrl.pop();
  }

  getCatalog() {
    return this.categories.filter(cat => cat.active && cat.type == 'Catalog');
  }

  uploadImageOwner() {
    const params = {
      user: this.user,
      config: this.config,
      shopowner: this.shop
    };

    this.$modal.create({
      component: UploadImagePage,
      componentProps: params
    }).then(alert => alert.present());
  }

  uploadImageFG() {
    const params = {
      user: this.user,
      config: this.config,
      shopfg: this.shop
    };

    this.$modal.create({
      component: UploadImagePage,
      componentProps: params
    }).then(alert => alert.present());
  }
  uploadImageLogo() {
    const params = {
      user: this.user,
      config: this.config,
      shoplogo: this.shop
    };
    this.$modal.create({
      component: UploadImagePage,
      componentProps: params
    }).then(alert => alert.present());
  }
}
