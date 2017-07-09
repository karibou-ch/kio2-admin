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

  constructor(
    public backgroundGeolocation: BackgroundGeolocation,
    public geolocation: Geolocation,
    public http: Http,
    public zone: NgZone
  ) {
    // Background Tracking
    let config = {
      desiredAccuracy: 100,
      stationaryRadius: 20,
      distanceFilter: 10,
      debug: true,
      interval: 5000
    };
    
    this.backgroundLocation$ = this.backgroundGeolocation.configure(config);
    

    // Foreground Tracking
    let options = {
      frequency: 3000
    };

    this.geoLocation$ = this.geolocation.watchPosition(options).filter((p) => p.coords !== undefined);
  }


  stopTracking() {
    console.log('stopTracking');
    // this.backgroundGeolocation.finish();
    // this.backgroundLocation$.unsubscribe();
  }



}
