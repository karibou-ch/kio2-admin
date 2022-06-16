import { Component, OnInit } from '@angular/core';
import { AnalyticsService, Metrics } from 'kng2-core';
import { PopoverController } from '@ionic/angular';
import { EngineService } from '../services/engine.service';

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.page.html',
  styleUrls: ['./analytics.page.scss'],
})
export class AnalyticsPage implements OnInit {

  actions = [
    'landing',
    'home',
    'cart',
    'order',
    'signup'
  ];

  cache:any = {};
  
  months: string[];
  currentShipping: Date;
  currentMonth: number;
  metrics: any = {};
  hubs: string[] = [];
  lastAction: Date;

  constructor(
    private $engine: EngineService,
    private $analytics: AnalyticsService
  ) {
    this.months = 'janvier,fevrier,mars,avril,mai,juin,juillet,aout,septembre,octobre,novembre,decembre'.split(',');
    this.cache = {};
  }

  ngOnInit() {
    this.currentShipping = this.$engine.currentShippingDate;
    this.currentMonth = this.currentShipping.getMonth();
    this.$analytics.get().subscribe((metrics: any)=> {
      this.lastAction = new Date(metrics['lastUpdate']);
      delete metrics['lastUpdate'];
      this.hubs=Object.keys(metrics);
      this.metrics = metrics;
      this.resetCache();


      console.log('----DBG',metrics);
      console.log('----DBG','artamis',this.getSources('artamis'));
      console.log('----DBG','artamis',this.getDays('artamis'));
      console.log('----DBG','artamis','landing',this.getActionHit('artamis','landing'));
      console.log('----DBG','artamis','home',this.getActionHit('artamis','home'));
    });
  }

  resetCache() {
    this.hubs.forEach(hub => this.cache[hub]={});
    this.actions.forEach(action => {
      this.hubs.forEach(hub => this.cache[hub+action]={});
    })
  }

  get month() {
    return this.months[this.currentMonth];
  }


  onBackMonth() {
    this.currentMonth = this.modulo( this.currentMonth - 1, 12);
  }

  onForwardMonth() {
    this.currentMonth = this.modulo( this.currentMonth + 1, 12);
  }


  modulo(n, mod) {
    return ((n % mod) + mod) % mod;
  }



  getDays(hub) {
    return Object.keys(this.metrics[hub]);
  }

  getActionHit(hub,action){
    if(this.cache[hub+action].hit>=0){
      return this.cache[hub+action].hit;
    }
    const days = this.getDays(hub);
    this.cache[hub+action].hit = days.reduce((sum,day) => {
      const value = this.metrics[hub][day][action];
      return sum + (value?(+value.hit):0);
    },0);
    return this.cache[hub+action].hit;
  }

  getActionAmount(hub,action){
    if(this.cache[hub+action].amount>=0){
      return this.cache[hub+action].amount;
    }
    const days = this.getDays(hub);
    this.cache[hub+action].amount = days.reduce((sum,day) => {
      const value = this.metrics[hub][day][action];
      return sum + ((value&&value.amount)?(+value.amount):0);
    },0);
    return this.cache[hub+action].amount;
  }

  getActionUID(hub,action){
    if(this.cache[hub+action].uid){
      return this.cache[hub+action].uid;
    }
    let uid = [];
    const days = this.getDays(hub);
    days.forEach(day => {
      uid = (this.metrics[hub][day][action]&&this.metrics[hub][day][action].uid||[]).concat(uid);
    });
    return this.cache[hub+action].uid = uid;
  }


  getSources(hub){
    if(this.cache[hub].sources){
      return this.cache[hub].sources;
    }
    let sources = [];
    const days = this.getDays(hub);
    days.forEach(day => {
      const actions = Object.keys(this.metrics[hub][day]);
      actions.forEach(action => {
        sources = (this.metrics[hub][day][action]&&this.metrics[hub][day][action].source||[]).concat(sources);
      });
    });
    return this.cache[hub].sources = sources.filter(source => source && source!='');
  }


}
