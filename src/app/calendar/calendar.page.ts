import { Component, OnInit, Input } from '@angular/core';
import { Order, CalendarService } from 'kng2-core';
import { PopoverController } from '@ionic/angular';
import { EngineService, OrderStatus } from '../services/engine.service';

@Component({
  selector: 'kio-calendar',
  templateUrl: './calendar.page.html',
  styleUrls: ['./calendar.page.scss'],
})
export class CalendarPage implements OnInit {

  @Input() orders: Order[];

  STATUS_OPEN = 'current';
  STATUS_ARCHIVE = 'archive';
  isLoading: boolean; // ✅ État de chargement pour désactiver interactions

  months: string[];
  weekdays: string[];

  currentMonth: number;
  currentYear: number;
  currentShipping: Date;
  availableDates: Date[];
  monthCalendar: Date[][]; // ✅ NOUVEAU : Calendrier mensuel (semaines x jours)
  currentOrderStatus: boolean;
  segmentValue: string;

  constructor(
    private $engine: EngineService,
    private $popup: PopoverController,
    private $calendar: CalendarService
  ) {
    // ✅ MIGRATION: Utiliser i18n centralisé au lieu de hardcoded
    this.months = this.$calendar.i18n_months('fr');

    // ✅ CORRECTION BUG : Réorganiser pour commencer par lundi au lieu de dimanche
    // i18n_weekdaysShort retourne ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.']
    // Mais le calendrier commence par lundi, donc on réorganise
    const weekdaysFromSunday = this.$calendar.i18n_weekdaysShort('fr');
    this.weekdays = [
      ...weekdaysFromSunday.slice(1), // lun. à sam.
      weekdaysFromSunday[0]           // dim.
    ]; // Résultat: ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.']

    this.monthCalendar = [];
  }

  ngOnInit() {
    this.availableDates = this.$engine.availableDates;
    this.currentShipping = this.$engine.currentShippingDate;
    this.currentMonth = this.currentShipping.getMonth();
    this.currentYear = this.currentShipping.getFullYear();
    this.currentOrderStatus = this.$engine.currentOrderStatus;
    this.segmentValue = this.$engine.currentOrderStatus ? this.STATUS_OPEN : this.STATUS_ARCHIVE;

    // ✅ NOUVEAU : Générer calendrier mensuel complet
    this.buildMonthCalendar();
    this.$engine.status$.subscribe(this.onEngineStatus.bind(this));

  }

  modulo(n, mod) {
    return ((n % mod) + mod) % mod;
  }

  month() {
    // ✅ MIGRATION: Utiliser i18n centralisé
    return this.$calendar.i18n_months('fr')[this.currentMonth];
  }

  backMonth() {
    // ✅ MIGRATION: Utiliser i18n centralisé
    return this.$calendar.i18n_months('fr')[this.modulo(this.currentMonth - 1, 12)];
  }

  forwardMonth() {
    // ✅ MIGRATION: Utiliser i18n centralisé
    return this.$calendar.i18n_months('fr')[this.modulo(this.currentMonth + 1, 12)];
  }

  onEngineStatus(status: OrderStatus) {
    this.isLoading = status.running;
    this.availableDates = this.$engine.availableDates;
    // console.log('availableDates', this.availableDates);
  }


  onBackMonth() {
    this.currentMonth = this.modulo(this.currentMonth - 1, 12);

    // ✅ Gérer changement d'année
    if (this.currentMonth === 11) {
      this.currentYear--;
    }

    this.currentShipping.setFullYear(this.currentYear);
    this.currentShipping.setMonth(this.currentMonth);
    this.$engine.currentShippingDate = this.currentShipping;

    // ✅ Régénérer calendrier
    this.buildMonthCalendar();
    this.$engine.selectOrderArchives(this.segmentValue === 'archive');
  }

  onForwardMonth() {
    this.currentMonth = this.modulo(this.currentMonth + 1, 12);

    // ✅ Gérer changement d'année
    if (this.currentMonth === 0) {
      this.currentYear++;
    }

    this.currentShipping.setFullYear(this.currentYear);
    this.currentShipping.setMonth(this.currentMonth);
    this.$engine.currentShippingDate = this.currentShipping;

    // ✅ Régénérer calendrier
    this.buildMonthCalendar();
    this.$engine.selectOrderArchives(this.segmentValue === 'archive');

  }

  /**
   * ✅ CORRECTION : Ne PAS fermer le popup quand on change de segment
   * Seul le click sur une date doit fermer le popup
   */
  onStatusChanged($event) {
    this.segmentValue = $event.detail.value;
    this.$engine.selectOrderArchives(this.segmentValue === 'archive');
    // ❌ SUPPRIMÉ : this.$popup.dismiss();
    // Le popup reste ouvert pour permettre de sélectionner une date
  }

  onSelectDay(shipping: Date) {
    if(!this.hasOrders(shipping)) {
      return;
    }
    // ✅ SIMPLIFIÉ: Plus besoin de normalisation UTC
    // Les clés dans engine.service.ts utilisent maintenant toYYYYMMDD() (strings)
    // La correspondance se fait sur le jour, pas sur le timestamp exact
    this.currentShipping = shipping;
    this.$engine.currentShippingDate = shipping;
    const status = this.segmentValue === this.STATUS_OPEN;
    this.$popup.dismiss([this.currentShipping, status]);
  }

  onClose() {
    const status = this.segmentValue === this.STATUS_OPEN;
    this.$popup.dismiss([this.currentShipping, status]);
  }

  /**
   * ✅ NOUVEAU : Générer calendrier mensuel complet (tous les jours)
   * Organisé en semaines (une semaine par ligne)
   */
  buildMonthCalendar() {
    this.monthCalendar = [];

    // Premier jour du mois
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);

    // Dernier jour du mois
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);

    // Jour de la semaine du premier jour (0 = dimanche, 1 = lundi, etc.)
    let startDayOfWeek = firstDay.getDay();

    // ✅ Ajuster pour que la semaine commence le lundi (1) au lieu de dimanche (0)
    startDayOfWeek = (startDayOfWeek === 0) ? 6 : startDayOfWeek - 1;

    // Créer la première semaine avec éventuellement des jours vides au début
    let currentWeek: Date[] = [];

    // Ajouter des jours vides pour aligner le premier jour
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push(null); // null = jour vide (mois précédent)
    }

    // Ajouter tous les jours du mois
    // ✅ CORRECTION: Utiliser setHours() (local) au lieu de setUTCHours() (UTC)
    // Conforme au principe Hub-Centric: "Generate Hub, Stay Hub, Display Hub"
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(this.currentYear, this.currentMonth, day);
      date.setHours(0, 0, 0, 0); // ✅ LOCAL cohérent avec Hub timezone
      currentWeek.push(date);

      // Si on a 7 jours, commencer une nouvelle semaine
      if (currentWeek.length === 7) {
        this.monthCalendar.push(currentWeek);
        currentWeek = [];
      }
    }

    // Compléter la dernière semaine avec des jours vides si nécessaire
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null); // null = jour vide (mois suivant)
      }
      this.monthCalendar.push(currentWeek);
    }
  }

  /**
   * ✅ NOUVEAU : Vérifier si un jour a des commandes
   * ✅ CORRECTION: Comparer les jours avec toYYYYMMDD() au lieu de getTime()
   * Les timestamps sont différents (backend UTC vs frontend Hub timezone)
   */
  hasOrders(day: Date): boolean {
    if (!day) return false;

    return this.availableDates.some(availableDate =>
      availableDate.toYYYYMMDD('-') === day.toYYYYMMDD('-')
    );
  }

  /**
   * ✅ NOUVEAU : Obtenir le statut d'un jour (open/closed)
   */
  getDayStatus(day: Date): string {
    if (!day) return null;

    const order = this.$engine.availableOrders.find(order =>
      order.shipping.when.toYYYYMMDD('-') === day.toYYYYMMDD('-')
    );

    if (!order) return null;
    return order.closed ? 'closed' : 'open';
  }

  /**
   * ✅ NOUVEAU : Obtenir les classes CSS pour un jour
   * ✅ CORRECTION: Comparer les jours avec toYYYYMMDD() au lieu de getTime()
   */
  getDayClasses(day: Date): any {
    if (!day) return { empty: true };

    const isSelected = day.toYYYYMMDD('-') === this.currentShipping.toYYYYMMDD('-');
    const hasOrders = this.hasOrders(day);
    const status = this.getDayStatus(day);

    return {
      selected: isSelected,
      'has-orders': hasOrders,
      'status-open': status === 'open',
      'status-closed': status === 'closed',
      'no-orders': !hasOrders
    };
  }
}
