import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Geolocation, Geoposition } from '@ionic-native/geolocation';
import { Events } from 'ionic-angular';

/*
  Generated class for the TrackerProvider provider.
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
    frequency: 12000
  };

  constructor(
    public events: Events,
    public geolocation: Geolocation,
    public http: HttpClient,
    public zone: NgZone
  ) {
  }

  fetch() {
    this.geolocation.getCurrentPosition(this.options).then(position => {
      this.zone.run(() => this.events.publish('location', position.coords));
    });
  }

  start() {

    this.watch = this.geolocation.watchPosition(this.options).filter((p: any) => p.code === undefined).subscribe((position: Geoposition) => {
      this.zone.run(() => this.events.publish('location', position.coords));
    });

    this.geolocation.getCurrentPosition(this.options).then(position => {
      this.zone.run(() => this.events.publish('location', position.coords));
    });
  }

  stop() {
    if (this.watch) {
      this.watch.unsubscribe();
      this.watch = null;
    }
  }
}
