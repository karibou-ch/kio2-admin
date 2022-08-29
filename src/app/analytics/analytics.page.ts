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
  currentWeek: Date;
  metrics: any = {};
  hubs: string[] = [];
  lastAction: Date;
  filterByIP:any;

  constructor(
    private $engine: EngineService,
    private $analytics: AnalyticsService
  ) {
    this.months = 'janvier,fevrier,mars,avril,mai,juin,juillet,aout,septembre,octobre,novembre,decembre'.split(',');
    this.cache = {};
    this.currentWeek = new Date(Date.now() - 86400000 * 7)
    this.filterByIP = {};
  }

  ngOnInit() {
    this.currentShipping = this.$engine.currentShippingDate;
    this.currentMonth = this.currentShipping.getMonth();
    this.getMetrics();
  }

  resetCache() {
    this.hubs.forEach(hub => {
      this.cache[hub]={};
      this.filterByIP[hub]='';
    });
    this.actions.forEach(action => {
      this.hubs.forEach(hub => this.cache[hub+action+this.filterByIP[hub]]={});
    })
  }

  get month() {
    return this.months[this.currentMonth];
  }

  getMetrics(){
    const params ={
      from:this.currentWeek.getTime()
    }
    this.$analytics.get(params).subscribe((metrics: any)=> {
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


  modulo(n, mod) {
    return ((n % mod) + mod) % mod;
  }



  getDays(hub) {
    if(!this.hubs.length) {
      return [];
    }

    return Object.keys(this.metrics[hub]);
  }

  getActionHit(hub,action){
    if(!this.hubs.length) {
      return 0;
    }
    if(this.isCached(hub,action) && this.cache[hub+action+this.filterByIP[hub]].hit>=0){
      return this.cache[hub+action+this.filterByIP[hub]].hit;
    }
    this.cache[hub+action+this.filterByIP[hub]] = this.cache[hub+action+this.filterByIP[hub]] || {hit:0};
    const days = this.getDays(hub);
    this.cache[hub+action+this.filterByIP[hub]].hit = days.reduce((sum,day) => {
      //
      // request filter by IP ?
      const value = this.metrics[hub][day][action] || {hit:0, ip:[]};
      if(!this.isIpInFunnel(hub,value.ip)){
        return sum;
      }

      return sum + value.hit;
    },0);
    return this.cache[hub+action+this.filterByIP[hub]].hit;
  }

  getActionAmount(hub,action){
    if(!this.hubs.length) {
      return 0;
    }

    if(this.isCached(hub,action) && this.cache[hub+action+this.filterByIP[hub]].amount>=0){
      return this.cache[hub+action+this.filterByIP[hub]].amount;
    }
    this.cache[hub+action+this.filterByIP[hub]] = this.cache[hub+action+this.filterByIP[hub]] || {amout:0};
    const days = this.getDays(hub);
    this.cache[hub+action+this.filterByIP[hub]].amount = days.reduce((sum,day) => {
      const value = this.metrics[hub][day][action] || {amount:0,ip:[]};
      //
      // request filter by IP ?
      if(!this.isIpInFunnel(hub,value.ip)){
        return sum;
      }

      return sum + value.amount;
    },0);
    return this.cache[hub+action+this.filterByIP[hub]].amount;
  }

  getActionUID(hub,action){
    if(!this.hubs.length) {
      return 0;
    }
    if(this.isCached(hub,action) && this.cache[hub+action+this.filterByIP[hub]].uid){
      return this.cache[hub+action+this.filterByIP[hub]].uid;
    }
    this.cache[hub+action+this.filterByIP[hub]] = this.cache[hub+action+this.filterByIP[hub]] || {};
    let uid = [];
    const days = this.getDays(hub);
    days.forEach(day => {
      uid = (this.metrics[hub][day][action]&&this.metrics[hub][day][action].uid||[]).concat(uid);
    });
    return this.cache[hub+action+this.filterByIP[hub]].uid = uid;
  }

  isCached(action,hub){
    return !!this.cache[hub+action+this.filterByIP[hub]];
  }



  isIpInFunnel(hub, ip) {
    if(this.filterByIP[hub]=='' || !ip || !ip.length) {
      return true;
    }
    if(!this.cache[hub].sources ) {
      return true;
    }
    const sources = this.cache[hub].sources[this.filterByIP[hub]].ip;
    // console.log('----DBG funnel 0',sources.some(source => ip.indexOf(source)>-1))
    return sources.some(source => ip.indexOf(source)>-1);
  }


  // Order by descending property key
  sortSourceDesc(a, b): number {
    return a.value.hit > b.value.hit ? -1 : (b.value.hit > a.value.hit ? 1 : 0);
  }

  getSources(hub){
    if(!this.hubs.length) {
      return {};
    }
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
    const map = this.cache[hub].sources = {};
    sources.filter(source => source).forEach(source=> {
      map[source.name] = map[source.name] || {hit:0,ip:[]};
      map[source.name].hit++;
      map[source.name].ip = [...new Set(map[source.name].ip.concat(source.ip))];
    });
    return this.cache[hub].sources;
  }


  onBackWeek(){
    this.currentWeek = new Date(this.currentWeek.getTime() - 86400000 * 7)
    this.getMetrics();
  }

  onForwardWeek(){
    this.currentWeek = new Date(this.currentWeek.getTime() + 86400000 * 7)
    this.getMetrics();
  }

  onBackMonth() {
    this.currentMonth = this.modulo( this.currentMonth - 1, 12);
  }

  onForwardMonth() {
    this.currentMonth = this.modulo( this.currentMonth + 1, 12);
  }

  setSourceFilter(hub,filter) {
    this.filterByIP[hub] = filter;
    console.log(this.filterByIP)
  }

}
