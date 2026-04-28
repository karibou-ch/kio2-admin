import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Config, Hub, HubService, LoaderService } from 'kng2-core';
import { AlertController, ToastController } from '@ionic/angular';
import { KngUtils } from '../services/kng-utils';

@Component({
  selector: 'kio-hub-details',
  templateUrl: './hub-details.page.html',
  styleUrls: ['./hub-details.page.scss'],
})
export class HubDetailsPage implements OnInit {
  config: Config;
  currentHub: Hub;
  isCreate: boolean;
  isReady: boolean;
  isLoading: boolean;
  weekdays = [
    { id: 0, label: 'Dimanche' },
    { id: 1, label: 'Lundi' },
    { id: 2, label: 'Mardi' },
    { id: 3, label: 'Mercredi' },
    { id: 4, label: 'Jeudi' },
    { id: 5, label: 'Vendredi' },
    { id: 6, label: 'Samedi' }
  ];
  shippingtimeKeys = ['0', '10', '12', '16', '19'];

  constructor(
    private $route: ActivatedRoute,
    private $hub: HubService,
    private $loader: LoaderService,
    private $alert: AlertController,
    private $toast: ToastController,
    private $utils: KngUtils
  ) {
    const { config } = this.$loader.getLatestCoreData();
    this.config = config;
  }

  ngOnInit() {
    const hubSlug = this.$route.snapshot.params['hub'];
    this.isCreate = hubSlug === 'create';
    this.$utils.getGeoCode().subscribe(result => {
      if (!this.currentHub || !result.geo) {
        return;
      }
      this.currentHub.address = result.address;
      this.currentHub.address.geo = result.geo || this.currentHub.address.geo;
    });

    if (this.isCreate) {
      this.currentHub = {} as Hub;
      this.initHub();
      this.isReady = true;
      return;
    }

    this.$hub.get(hubSlug).subscribe(hub => {
      this.currentHub = hub;
      this.initHub();
      this.isReady = true;
    }, status => {
      this.isReady = true;
      this.notify((status.error || status.message || status), 'danger');
    });
  }

  doBack() {
    window.history.back();
  }

  onHubSave() {
    this.isLoading = true;
    const action$ = this.isCreate ? this.$hub.create(this.currentHub) : this.$hub.save(this.currentHub);
    action$.subscribe(hub => {
      this.isCreate = false;
      Object.assign(this.currentHub, hub);
      this.initHub();
      this.notify('Enregistré');
    }, status => {
      this.isLoading = false;
      this.notify((status.error || status.message || status), 'danger');
    }, () => {
      this.isLoading = false;
    });
  }

  onAdminHubSave() {
    this.isLoading = true;
    this.$hub.saveAdmin(this.currentHub).subscribe(hub => {
      Object.assign(this.currentHub, hub);
      this.initHub();
      this.notify('Enregistré');
    }, status => {
      this.isLoading = false;
      this.notify((status.error || status.message || status), 'danger');
    }, () => {
      this.isLoading = false;
    });
  }

  onHubStatusChange($event: any) {
    this.currentHub.status.active = $event.detail.checked;
  }

  onHubPrivateChange($event: any) {
    this.currentHub.status.private = $event.detail.checked;
  }

  updateGeo($event: any) {
    const address = this.currentHub.address;
    const street = address.streetAdress;
    const postal = address.postalCode;
    const region = address.region;

    if (!street || !postal || [street, postal].indexOf($event) > -1) {
      return;
    }

    this.$utils.updateGeoCode(street, postal, region);
  }

  onCopy(event: ClipboardEvent) {
    const clipboard = event.clipboardData;
    if (!clipboard) {
      return;
    }

    const jsonString = this.serializeHub();
    const html = this.serializeHubToHtml(this.currentHub);

    event.preventDefault();
    clipboard.clearData();
    clipboard.setData('text/plain', jsonString);
    clipboard.setData('text/html', html);
    this.notify('Hub copié dans le presse-papiers');
  }

  onPaste(event: ClipboardEvent) {
    const jsonString = event.clipboardData && event.clipboardData.getData('text/plain');
    if (!jsonString) {
      return;
    }

    let hub;
    try {
      hub = JSON.parse(jsonString);
    } catch (error) {
      // this.notify('Le clipboard ne contient pas un hub', 'warning');
      return;
    }

    event.preventDefault();
    if (!this.canPasteIntoHub()) {
      this.notify('Le collage est autorisé uniquement sur un nouveau hub vide', 'warning');
      return;
    }

    const html = this.serializeHubToHtml(hub);
    this.$alert.create({
      header: 'Remplacer le hub ?',
      message: html,
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Accepter',
          handler: () => {
            this.currentHub = this.prepareHubCopy(hub);
            this.initHub();
          }
        }
      ]
    }).then(alert => alert.present());
  }

  private initHub() {
    this.currentHub.description = this.currentHub.description || { fr: '', en: '', de: '' };
    this.currentHub.address = this.currentHub.address || {} as any;
    this.currentHub.address.geo = this.currentHub.address.geo || {} as any;
    this.currentHub.status = this.currentHub.status || { active: true, private: false, reason: { fr: '', en: '', de: '' } };
    this.currentHub.status.reason = this.currentHub.status.reason || { fr: '', en: '', de: '' };
    this.currentHub.status.active = this.normalizeBoolean(this.currentHub.status.active, true);
    this.currentHub.status.private = this.normalizeBoolean(this.currentHub.status.private, false);
    this.currentHub.mail = this.currentHub.mail || {} as any;
    this.currentHub.colors = this.currentHub.colors || {} as any;
    this.currentHub.pageOptions = this.currentHub.pageOptions || {} as any;
    this.currentHub.home = this.currentHub.home || {} as any;
    this.currentHub.home.customLink = this.currentHub.home.customLink || {} as any;
    this.currentHub.home.customLink.label = this.currentHub.home.customLink.label || { fr: '', en: '', de: '' };
    this.currentHub.siteName = this.currentHub.siteName || { fr: '', en: '', de: '', image: '' };
    this.currentHub.tagLine = this.initContentBlock(this.currentHub.tagLine);
    this.currentHub.about = this.initContentBlock(this.currentHub.about);
    this.currentHub.footer = this.initContentBlock(this.currentHub.footer);
    this.currentHub.weekdays = this.currentHub.weekdays || [];
    this.currentHub.shippingtimes = this.currentHub.shippingtimes || {} as any;
    this.initShippingtimes();
  }

  private normalizeBoolean(value: any, defaultValue: boolean) {
    if (value === undefined || value === null) {
      return defaultValue;
    }
    if (typeof value === 'string') {
      return value === 'true';
    }
    return !!value;
  }

  private initContentBlock(block: any) {
    block = block || {};
    block.t = block.t || { fr: '', en: '', de: '' };
    block.h = block.h || { fr: '', en: '', de: '' };
    block.p = block.p || { fr: '', en: '', de: '' };
    return block;
  }

  private initShippingtimes() {
    const defaultShippingtimes = this.config && this.config.shared && this.config.shared.hub ?
      this.config.shared.hub.shippingtimes || {} :
      {};
    const defaultPricetime = this.config && this.config.shared && this.config.shared.shipping ?
      this.config.shared.shipping.pricetime || {} :
      {};

    this.shippingtimeKeys.forEach(time => {
      if (this.currentHub.shippingtimes[time] === undefined || this.currentHub.shippingtimes[time] === null) {
        this.currentHub.shippingtimes[time] = defaultShippingtimes[time] || defaultPricetime[time];
      }
    });
  }

  private serializeHub() {
    return JSON.stringify(this.currentHub, (key, value) => {
      if (this.isProtectedCopyField(key)) {
        return undefined;
      }
      return value;
    }, 2);
  }

  private prepareHubCopy(hub: any) {
    const copy = JSON.parse(JSON.stringify(hub, (key, value) => {
      if (this.isProtectedCopyField(key)) {
        return undefined;
      }
      return value;
    }));

    copy.name = '';
    copy.description = { fr: '', en: '', de: '' };
    return copy;
  }

  private isProtectedCopyField(key: string) {
    return ['_id', 'id', '__v', 'slug', 'alias', 'hid', 'updated'].indexOf(key) > -1;
  }

  private serializeHubToHtml(hub: any) {
    const name = hub && hub.name ? hub.name : 'Hub sans nom';
    const description = hub && hub.description ? hub.description.fr || hub.description : '';
    return '<h2>' + this.escapeHtml(name) + '</h2><p>' + this.escapeHtml(description) + '</p>';
  }

  private canPasteIntoHub() {
    return !this.currentHub['_id'] &&
      !this.currentHub['id'] &&
      !this.currentHub.slug &&
      !this.currentHub.name &&
      !this.hasContent(this.currentHub.description);
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

  private escapeHtml(value: string) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private notify(message: string, color = 'dark') {
    this.$toast.create({
      message,
      duration: 3000,
      color
    }).then(alert => alert.present());
  }
}
