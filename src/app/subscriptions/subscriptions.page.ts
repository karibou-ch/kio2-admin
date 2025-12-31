import { Component, OnInit } from '@angular/core';
import { Config, User, CartSubscription, CartService, CalendarService, LoaderService } from 'kng2-core';
import { Router, ActivatedRoute } from '@angular/router';
import { EngineService } from '../services/engine.service';
import { ToastController, AlertController } from '@ionic/angular';

@Component({
  selector: 'kio-subscriptions',
  templateUrl: './subscriptions.page.html',
  styleUrls: ['./subscriptions.page.scss'],
})
export class SubscriptionsPage implements OnInit {
  isReady: boolean;
  loadError: boolean;
  config: Config;
  user: User;

  // ✅ MIGRATION: Plus de hardcoded, utiliser CalendarService
  weekdays: string[];
  hubs: any[];
  currentHub: any;
  _subscriptions: CartSubscription[];

  // ✅ ADMIN: Variables pour la gestion de pause (même pattern que kng-subscription-control)
  until: Date;
  pauseUntil: Date;
  isProcessing: boolean = false;

  cache: {
    active: boolean;
    showAdminControls: boolean;
    search: string;
    subscriptions: CartSubscription[];
    step: number;
    start: number;
  };


  constructor(
    private $route: ActivatedRoute,
    private $router: Router,
    private $engine: EngineService,
    private $cart: CartService,
    private toast: ToastController,
    private alertController: AlertController,
    private $calendar: CalendarService,
    private $loader: LoaderService
  ) {
    this.cache = {
      active: true,
      showAdminControls: false,
      search: '',
      subscriptions: [],
      step: 50,
      start: 0
    };

    this._subscriptions = [];
    this.hubs = [];

    // ✅ MIGRATION: Utiliser i18n centralisé
    this.weekdays = this.$calendar.i18n_weekdays('fr');

    // ✅ ADMIN: Date par défaut de pause (6 jours dans le futur, comme kng-subscription-control)
    this.pauseUntil = this.until = new Date(Date.now() + 3600000 * 24 * 6);
  }

  get isAdmin() {
    return this.user.isAdmin();
  }

  /**
   * ✅ Getter pour filtrer les abonnements actifs vs inactifs
   * cache.active = true  → affiche seulement les actifs
   * cache.active = false → affiche seulement les inactifs/canceled
   */
  get subscriptions(): CartSubscription[] {
    if (this.cache.active) {
      return this._subscriptions.filter(sub => sub.status === 'active');
    }
    return this._subscriptions.filter(sub => sub.status !== 'active');
  }

  ngOnInit() {
    const { config, user } = this.$loader.getLatestCoreData();
    this.user = user;
    this.config = config;

    //
    // select default HUB
    this.hubs = (this.config.shared.hubs || []).slice();
    if (this.hubs.length) {
      //
      // if you are associed to one HUB
      this.currentHub = this.hubs[0];
      if (this.user.hubs && this.user.hubs.length === 1) {
        this.currentHub = this.hubs.find(hub => hub.slug === this.user.hubs[0])||this.currentHub;
      }
      this.currentHub.selected = true;
    }


    //
    // all available shops
    this.subscriptionsGet();
  }

  /**
   * ✅ MIGRATION: Utiliser i18n centralisé via CalendarService
   */
  namedDayOfWeek(day: number) {
    return this.$calendar.i18n_weekdays('fr')[day];
  }

  /**
   * ✅ MIGRATION: Conversion dates avec validation
   */
  subscriptionsGet() {
    this.cache.subscriptions = [];

    this.$cart.subscriptionsGetAll().subscribe(subscriptions => {
      subscriptions.forEach(sub => {
        // ✅ Validation + conversion date
        sub.nextInvoice = new Date(sub.nextInvoice);

        // ✅ OPTIONNEL: Formater pour affichage timezone Hub si nécessaire
        // const hub = this.$engine.currentConfig.shared.hub;
        // sub.nextInvoiceFormatted = this.$calendar.formatForClient(sub.nextInvoice, hub);
      });

      console.log(subscriptions[0]);

      this._subscriptions = this.cache.subscriptions = subscriptions.sort(this.sortBySubscription);
      this.isReady = true;
    }, status => {
      this.toast.create({
        message: (status.message || status),
        duration: 3000,
        color: 'alert'
      }).then(alert => alert.present());
    });
  }


  openDetails(subscription: CartSubscription) {
  }

  onSearchInput($event) {
    const search = this.cache.search.toLocaleLowerCase();
    if (search.length < 3) {
      return this._subscriptions = this.cache.subscriptions;
    }

    return this._subscriptions = this.cache.subscriptions.filter((subscription: CartSubscription) => {
      const content = (subscription.items.map(item=>item.title).join(' ') + subscription.description) || '';
      return content.toLocaleLowerCase().indexOf(search) > -1;
    });
  }

  onSearchCancel($event) {
    this.cache.search = '';
    this.cache.start = 0;
    this._subscriptions = this.cache.subscriptions;
  }

  setCurrentHub(hub) {
  }

  /**
   * ✅ Tri par nextInvoice décroissant (dates les plus récentes en premier)
   */
  sortBySubscription(p1: CartSubscription, p2: CartSubscription) {
    if(!p2.nextInvoice||!p1.nextInvoice){
      return 0;
    }
    // Décroissant: p2 - p1 (dates les plus récentes en premier)
    return p1.nextInvoice.getTime() - p2.nextInvoice.getTime();
  }

  // =========================================================================
  // ✅ ADMIN: Helpers d'affichage pour statut et raisons
  // =========================================================================

  /**
   * Retourne le label de statut pour affichage dans le tag
   */
  getStatusLabel(subscription: CartSubscription): string {
    // Pause a priorité sur le status
    if (subscription.pauseUntil) {
      return '⏸️';
    }

    switch (subscription.status) {
      case 'active':
        return '✔️';
      case 'incomplete':
        return '⚠️ Paiement';
      case 'canceled':
        return '❌';
      case 'paused':
        return '⏸️';
      case 'unpaid':
        return '💳 Impayé';
      default:
        return subscription.status;
    }
  }

  /**
   * Retourne la raison du problème de paiement
   */
  getIssueReason(subscription: CartSubscription): string {
    // Le champ 'issue' contient le status Stripe original
    const issue = (subscription as any).issue;

    switch (issue) {
      case 'incomplete':
        return 'Paiement initial en attente ou échec de confirmation';
      case 'incomplete_expired':
        return 'Délai de paiement expiré (24h)';
      case 'past_due':
        return 'Facture en retard de paiement';
      case 'unpaid':
        return 'Factures impayées après plusieurs tentatives';
      default:
        // Vérifier le latestPaymentIntent si disponible
        if (subscription.latestPaymentIntent) {
          switch (subscription.latestPaymentIntent.status) {
            case 'requires_payment_method':
              return 'Méthode de paiement invalide ou expirée';
            case 'requires_action':
              return 'Authentification 3D Secure requise';
            default:
              return `Statut paiement: ${subscription.latestPaymentIntent.status}`;
          }
        }
        return 'Problème de paiement non spécifié';
    }
  }

  // =========================================================================
  // ✅ ADMIN: Fonctions de pause/resume (même API que kng-subscription-control)
  // =========================================================================

  /**
   * Calcule le nombre de jours avant la date de pause
   */
  pauseInDays(subscription: CartSubscription): number {
    const now = new Date();
    const pauseDate = subscription['_pauseUntil'] || this.pauseUntil;
    return Math.floor((pauseDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Met à jour la date de pause pour une souscription spécifique
   */
  onPauseDateChange(subscription: CartSubscription, event: any) {
    const dateValue = event.detail?.value || event.target?.valueAsDate;
    if (dateValue) {
      subscription['_pauseUntil'] = new Date(dateValue);
    }
  }

  /**
   * Affiche une confirmation et met en pause la souscription
   */
  async onPause(subscription: CartSubscription) {
    const pauseDate = subscription['_pauseUntil'] || this.pauseUntil;
    const formattedDate = pauseDate.toLocaleDateString('fr-CH', { weekday: 'short', day: 'numeric', month: 'short' });

    const alert = await this.alertController.create({
      header: 'Confirmer la pause',
      message: `Mettre en pause l'abonnement de <strong>${subscription.shipping?.name || subscription.customer}</strong> jusqu'au <strong>${formattedDate}</strong> ?`,
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Confirmer',
          handler: () => {
            this.executePause(subscription, pauseDate);
          }
        }
      ]
    });
    await alert.present();
  }

  /**
   * Exécute la pause via l'API (même API que kng-subscription-control)
   */
  private executePause(subscription: CartSubscription, pauseDate: Date) {
    this.isProcessing = true;

    this.$cart.subscriptionPause(subscription, pauseDate).subscribe(
      (updatedSubscription) => {
        // ✅ Mettre à jour la souscription dans la liste
        const index = this._subscriptions.findIndex(s => s.id === subscription.id);
        if (index !== -1) {
          this._subscriptions[index] = updatedSubscription;
          this.cache.subscriptions[index] = updatedSubscription;
        }
        this.isProcessing = false;
        this.showToast(`Abonnement mis en pause jusqu'au ${pauseDate.toLocaleDateString('fr-CH')}`, 'success');
      },
      (error) => {
        this.isProcessing = false;
        this.showToast(error.error || 'Erreur lors de la mise en pause', 'danger');
      }
    );
  }

  /**
   * Affiche une confirmation et reprend la souscription (supprime la pause)
   */
  async onResume(subscription: CartSubscription) {
    const alert = await this.alertController.create({
      header: 'Reprendre l\'abonnement',
      message: `Reprendre l'abonnement de <strong>${subscription.shipping?.name || subscription.customer}</strong> ?`,
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Confirmer',
          handler: () => {
            this.executeResume(subscription);
          }
        }
      ]
    });
    await alert.present();
  }

  /**
   * Exécute la reprise via l'API (même API que kng-subscription-control)
   */
  private executeResume(subscription: CartSubscription) {
    this.isProcessing = true;

    this.$cart.subscriptionResume(subscription).subscribe(
      (updatedSubscription) => {
        // ✅ Mettre à jour la souscription dans la liste
        const index = this._subscriptions.findIndex(s => s.id === subscription.id);
        if (index !== -1) {
          this._subscriptions[index] = updatedSubscription;
          this.cache.subscriptions[index] = updatedSubscription;
        }
        this.isProcessing = false;
        this.showToast('Abonnement repris avec succès', 'success');
      },
      (error) => {
        this.isProcessing = false;
        this.showToast(error.error || 'Erreur lors de la reprise', 'danger');
      }
    );
  }

  /**
   * Helper pour afficher un toast
   */
  private async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toast.create({
      message,
      duration: 3000,
      color
    });
    await toast.present();
  }

  /**
   * Retourne la date minimum pour le date picker (demain)
   */
  getMinPauseDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  /**
   * Retourne la date de pause actuelle ou par défaut pour une souscription
   */
  getPauseDate(subscription: CartSubscription): Date {
    return subscription['_pauseUntil'] || this.pauseUntil;
  }

  /**
   * Reset billing cycle avec la date sélectionnée (même date que pause)
   * Utilisé par le bouton "Reset cycle" dans les contrôles admin
   */
  async onResetBillingCycleWithDate(subscription: CartSubscription) {
    const selectedDate = subscription['_pauseUntil'] || this.pauseUntil;
    const formattedDate = selectedDate.toLocaleDateString('fr-CH', { weekday: 'short', day: 'numeric', month: 'short' });

    const alert = await this.alertController.create({
      header: 'Réinitialiser le cycle',
      message: `<p>Réinitialiser le cycle de facturation au <strong>${formattedDate}</strong> ?</p>
                <p><small>⚠️ Aucune facturation jusqu'à cette date</small></p>`,
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Confirmer',
          handler: () => {
            this.executeResetBillingCycle(subscription, selectedDate);
          }
        }
      ]
    });
    await alert.present();
  }

  // =========================================================================
  // ✅ ADMIN: Réinitialisation du cycle de facturation (via slide)
  // =========================================================================

  /**
   * Affiche une confirmation et réinitialise le cycle de facturation
   * Permet de choisir entre 'maintenant' ou une date future
   */
  async onResetBillingCycle(subscription: CartSubscription) {
    const alert = await this.alertController.create({
      header: 'Réinitialiser le cycle',
      message: `<p>Réinitialiser le cycle de facturation pour <strong>${subscription.shipping?.name || subscription.customer}</strong> ?</p>
                <p><small>⚠️ Date future = période sans facturation jusqu'à cette date</small></p>`,
      inputs: [
        {
          name: 'resetOption',
          type: 'radio',
          label: '📅 Maintenant',
          value: 'now',
          checked: true
        },
        {
          name: 'resetOption',
          type: 'radio',
          label: '📆 Date future...',
          value: 'future'
        }
      ],
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Suivant',
          handler: (data) => {
            if (data === 'now') {
              this.executeResetBillingCycle(subscription, 'now');
            } else {
              this.showFutureDatePicker(subscription);
            }
          }
        }
      ]
    });
    await alert.present();
  }

  /**
   * Affiche un picker pour sélectionner une date future
   */
  private async showFutureDatePicker(subscription: CartSubscription) {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 1); // Minimum demain

    const alert = await this.alertController.create({
      header: 'Choisir la date',
      message: 'La prochaine facture sera générée à cette date',
      inputs: [
        {
          name: 'futureDate',
          type: 'date',
          min: minDate.toISOString().split('T')[0],
          value: this.pauseUntil.toISOString().split('T')[0]
        }
      ],
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Confirmer',
          handler: (data) => {
            if (data.futureDate) {
              const futureDate = new Date(data.futureDate);
              this.executeResetBillingCycle(subscription, futureDate);
            }
          }
        }
      ]
    });
    await alert.present();
  }

  /**
   * Exécute la réinitialisation du cycle via l'API
   * @param toDate - 'now' ou une Date future
   */
  private executeResetBillingCycle(subscription: CartSubscription, toDate: Date | 'now') {
    this.isProcessing = true;

    this.$cart.subscriptionResetBillingCycle(subscription, toDate).subscribe(
      (updatedSubscription) => {
        // ✅ Mettre à jour la souscription dans la liste
        const index = this._subscriptions.findIndex(s => s.id === subscription.id);
        if (index !== -1) {
          // Convertir la date
          updatedSubscription.nextInvoice = new Date(updatedSubscription.nextInvoice);
          this._subscriptions[index] = updatedSubscription;
          this.cache.subscriptions[index] = updatedSubscription;
        }
        this.isProcessing = false;
        const message = toDate === 'now'
          ? 'Cycle réinitialisé à maintenant'
          : `Cycle réinitialisé au ${(toDate as Date).toLocaleDateString('fr-CH')}`;
        this.showToast(message, 'success');
      },
      (error) => {
        this.isProcessing = false;
        this.showToast(error.error || 'Erreur lors de la réinitialisation', 'danger');
      }
    );
  }

}
