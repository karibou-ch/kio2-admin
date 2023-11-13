import { Injectable, NgZone } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { filter } from 'rxjs/operators';
import { ReplaySubject } from 'rxjs';

/*
  Generated class for the TrackerProvider provider.
  for more info on providers and Angular DI.
*/
@Injectable({ providedIn: 'root' })
export class TrackerProvider {

  public watch: any;
  public backgroundLocation$;
  public geoLocation$;
  public currentPosition;

  public update$: ReplaySubject<GeolocationCoordinates>;
  options = {
    enableHighAccuracy: true,
    frequency: 12000
  };

  constructor(
    public $zone: NgZone
  ) {
    this.update$ = new ReplaySubject(1);
  }

  fetch() {
    Geolocation.getCurrentPosition(this.options).then(position => {
      this.$zone.run(() => this.update$.next(position.coords));
    }).catch(err=>{
      console.log('--- ',err)
    });
  }

  start() {
    return this.fetch();
    // this.watch = Geolocation.watchPosition(this.options).pipe(
    //   filter((p: any) => p.code === undefined)
    // ).subscribe((position: Geoposition) => {
    //   this.$zone.run(() => this.update$.next(position.coords));
    // });

    // this.$geolocation.getCurrentPosition(this.options).then(position => {
    //   this.$zone.run(() => this.update$.next(position.coords));
    // });
  }

  stop() {
    // if (this.watch) {
    //   this.watch.unsubscribe();
    //   this.watch = null;
    // }
  }
}
