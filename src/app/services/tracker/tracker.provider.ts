import { Injectable, NgZone } from '@angular/core';
import { Geolocation, Geoposition } from '@ionic-native/geolocation/ngx';
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

  public update$: ReplaySubject<Coordinates>;
  options = {
    enableHighAccuracy: true,
    frequency: 12000
  };

  constructor(
    public $geolocation: Geolocation,
    public $zone: NgZone
  ) {
    this.update$ = new ReplaySubject(1);
  }

  fetch() {
    this.$geolocation.getCurrentPosition(this.options).then(position => {
      this.$zone.run(() => this.update$.next(position.coords));
    }).catch(err=>{
      console.log('--- ',err)
    });
  }

  start() {
    this.watch = this.$geolocation.watchPosition(this.options).pipe(
      filter((p: any) => p.code === undefined)
    ).subscribe((position: Geoposition) => {
      this.$zone.run(() => this.update$.next(position.coords));
    });

    this.$geolocation.getCurrentPosition(this.options).then(position => {
      this.$zone.run(() => this.update$.next(position.coords));
    });
  }

  stop() {
    if (this.watch) {
      this.watch.unsubscribe();
      this.watch = null;
    }
  }
}
