import { Injectable, NgZone } from '@angular/core';
import { Http } from '@angular/http';
import { BackgroundGeolocation } from '@ionic-native/background-geolocation';
import { Geolocation, Geoposition } from '@ionic-native/geolocation';
import 'rxjs/add/operator/map';

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
  public currentPosition$;

  constructor(
    public backgroundGeolocation: BackgroundGeolocation,
    public geolocation: Geolocation,
    public http: Http,
    public zone: NgZone
  ) {
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
      interval: 20000
    };
    
    this.backgroundLocation$ = this.backgroundGeolocation.configure(config);
    
  }

  start(){

    // Foreground Tracking
    let options = {
      enableHighAccuracy:true,
      frequency: 1000
    };

    this.geoLocation$ = this.geolocation.watchPosition(options).filter((p) => p.coords !== undefined);
    this.currentPosition$ = this.geolocation.getCurrentPosition(options);
    this.backgroundGeolocation.start();

  }

  stop() {
    this.backgroundGeolocation.finish();
  }



}
