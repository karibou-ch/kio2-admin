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
  pickerDate: string;
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
    this.getMetrics({fromMonth:this.currentMonth+1});
  }

  resetCache() {
    this.hubs.forEach(hub => {
      this.cache[hub]={};
      this.filterByIP[hub]='';
    });

    this.actions.forEach(action => {
      this.hubs.forEach(hub => this.cache[hub+action]={hit:-1,amount:-1});
    })
  }

  get month() {
    return this.months[this.currentMonth];
  }

  getMetrics(params){
    this.$analytics.get(params).subscribe((metrics: any)=> {
      this.lastAction = new Date(metrics['lastUpdate']);
      delete metrics['lastUpdate'];
      this.hubs=Object.keys(metrics);
      this.metrics = metrics;
      this.resetCache();


      console.log('----DBG halle-de-rive',metrics['halle-de-rive']);
      console.log('----DBG artamis',metrics['artamis']);
      // test with 45.131.171.122 83.137.6.188
      // const hub = 'halle-de-rive';
      // const days = this.getDays(hub);
      // days.forEach(day => {
      //   const actions = Object.keys(this.metrics[hub][day]);
      //   actions.forEach(action => {
      //     if(this.metrics[hub][day][action].ip.indexOf('45.131.171.122')>-1){
      //       console.log('----DBG',hub,action,day,this.metrics[hub][day][action].hit);
      //     }
      //     if(this.metrics[hub][day][action].ip.indexOf('83.137.6.188')>-1){
      //       console.log('----DBG',hub,action,day,this.metrics[hub][day][action].hit);
      //     }
      //   });
      // });
  

    });

  }

  countIpInFunnel(hub,action, ips) {
    const filter = this.filterByIP[hub] || '';
    if(filter=='') {
      return true;
    }
    if(!ips || !ips.length) {
      return false;
    }

    if(!this.cache[hub].sources ) {
      return true;
    }
    const sources = this.cache[hub].sources[filter].ip;
    const count = sources.reduce((sum, sourceIp)=>{
      return sum + ips.filter(ip=>ip==sourceIp).length;
    },0)
    //if(hub=='halle-de-rive'&&action=='signup')console.log('----DBG funnel 0',hub,action,match,sources,ip)
    return count;
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
    const filter = this.filterByIP[hub]||'';
    const cached = !!this.cache[hub+action+filter];

    if(cached && this.cache[hub+action+filter].hit>=0){
      return this.cache[hub+action+filter].hit;
    }
    this.cache[hub+action+filter] = this.cache[hub+action+filter] || {hit:0};
    const days = this.getDays(hub);
    this.cache[hub+action+filter].hit = days.reduce((sum,day) => {
      //
      // request filter by IP ?
      const value = this.metrics[hub][day][action] || {hit:0, ip:[]};
      if(filter == ''){
        return sum + value.hit;
      }
      const ipHit = this.countIpInFunnel(hub,action,value.ip);
      return sum + ipHit;
    },0);
    return this.cache[hub+action+filter].hit;
  }

  getActionAmount(hub,action){
    if(!this.hubs.length) {
      return 0;
    }
    const filter = this.filterByIP[hub]||'';
    const cached = !!this.cache[hub+action+filter];

    if(cached && this.cache[hub+action+filter].amount>=0){
      return this.cache[hub+action+filter].amount;
    }
    this.cache[hub+action+filter] = this.cache[hub+action+filter] || {amount:0};
    const days = this.getDays(hub);
    this.cache[hub+action+filter].amount = days.reduce((sum,day) => {
      const value = this.metrics[hub][day][action] || {amount:0,ip:[]};
      const ipHit = this.countIpInFunnel(hub,action,value.ip);
      
      //
      // FIXME, this is not the right amount value
      // we should use total amount / by total hit * ipHit
      if(!ipHit){
        return sum;
      }

      return sum + value.amount;
    },0);
    return this.cache[hub+action+filter].amount;
  }

  getActionUID(hub,action){
    if(!this.hubs.length) {
      return 0;
    }
    const filter = this.filterByIP[hub]||'';
    const cached = !!this.cache[hub+action+filter];

    if(cached && this.cache[hub+action+filter].uid){
      return this.cache[hub+action+filter].uid;
    }
    this.cache[hub+action+filter].uid =[];
    let uid = [];
    const days = this.getDays(hub);
    days.forEach(day => {
      uid = (this.metrics[hub][day][action]&&this.metrics[hub][day][action].uid||[]).concat(uid);
    });
    return this.cache[hub+action+filter].uid = uid;
  }


  isFilterActive(hub,key){
    return this.filterByIP[hub] == key;
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
    console.log('---- build  sources (name->[ip])',hub,this.cache[hub].sources)
    return this.cache[hub].sources;
  }

  onDatePicker(){
    const date = (new Date(this.pickerDate))
    date.setDate(1);
    this.currentMonth = date.getMonth();
    this.currentWeek =date;
    this.getMetrics({fromMonth:this.currentMonth+1});
  }

  onBackWeek(){
    this.currentWeek = new Date(this.currentWeek.getTime() - 86400000 * 7)
    this.getMetrics({from:this.currentWeek});
  }

  onForwardWeek(){
    this.currentWeek = new Date(this.currentWeek.getTime() + 86400000 * 7)
    this.getMetrics({from:this.currentWeek});
  }

  onBackMonth() {
    this.currentMonth = this.modulo( this.currentMonth - 1, 12);
  }

  onForwardMonth() {
    this.currentMonth = this.modulo( this.currentMonth + 1, 12);
  }

  setSourceFilter(hub,filter) {
    this.filterByIP[hub] = filter;
    console.log('---DBG HDR',this.cache[hub].sources)
  }

}
