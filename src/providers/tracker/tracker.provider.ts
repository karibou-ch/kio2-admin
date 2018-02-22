import { Injectable, NgZone } from '@angular/core';
import { Http } from '@angular/http';
import { BackgroundGeolocation } from '@ionic-native/background-geolocation';
import { Geolocation, Geoposition } from '@ionic-native/geolocation';
import { Events } from 'ionic-angular';

/*
  Generated class for the TrackerProvider provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular DI.
*/
@Injectable()
export class TrackerProvider {

  public watch: any;
  public backgroundLocation$;
  public geoLocation$;
  public currentPosition;

  options = {
    enableHighAccuracy:true,
    frequency: 3000
  };

  constructor(
    public backgroundGeolocation: BackgroundGeolocation,
    public events: Events,
    public geolocation: Geolocation,
    public http: Http,
    public zone: NgZone
  ) {
  }

  fetch(){
    this.geolocation.getCurrentPosition(this.options).then(position=>{
      this.zone.run(() => this.events.publish('location',position.coords));      
    })    
  }
  start(){
    // Background Tracking
    // see configuration values at : https://github.com/mauron85/cordova-plugin-background-geolocation
    let config = {
      // Desired accuracy in meters. Possible values [0, 10, 100, 1000]. 
      // The lower the number, the more power devoted to GeoLocation resulting in higher accuracy readings. 
      // 1000 results in lowest power drain and least accurate readings.
      desiredAccuracy: 100, 
      // Stationary radius in meters. When stopped, the minimum distance the device must move 
      // beyond the stationary location for aggressive background-tracking to engage.
      stationaryRadius: 20,
      // The minimum distance (measured in meters) a device must move horizontally before an update event is generated.
      distanceFilter: 10,
      debug: false,
      interval: 10000
    };

    this.watch = this.geolocation.watchPosition(this.options).filter((p: any) => p.code === undefined).subscribe((position: Geoposition) => {
      this.zone.run(() => this.events.publish('location',position.coords));
    });
    
    this.geolocation.getCurrentPosition(this.options).then(position=>{
      this.zone.run(() => this.events.publish('location',position.coords));      
    })
    
    // this.geoLocation$=Observable.combineLatest(
    //     this.backgroundGeolocation.configure(config).map(p=>p),
    //     this.geolocation.watchPosition(options).filter((p) => p.coords !== undefined).map(p=>p)
    //   )
    
    //this.currentPosition=this.geolocation.getCurrentPosition(options);
    
    
    //
    // combine observable 
    // this.geoLocation$=this.backgroundGeolocation.configure(config);
    //   // simple transformation
    //   .map(p=>p)
    //   //
    //   // transform observable to ConnectableObservable (multicasting)
    //   .publishReplay(1)
    //   //
    //   // used to auto-connect to the source when there is >= 1 subscribers
    //   .refCount();

    // this.backgroundGeolocation.configure(config).subscribe(location =>{
    // // Run update inside of Angular's zone
    
    //   this.zone.run(() => this.events.publish('location',location));
    // }, (err) => {
    //   //
    //   // inform errors
    //   this.zone.run(() => this.events.publish('location',{error:err}))  ;
    // });



    //this.backgroundGeolocation.start();
  }

  stop() {
    //this.backgroundGeolocation.finish();
    if(this.watch){
      this.watch.unsubscribe();
      this.watch=null;
    }
  }



}
