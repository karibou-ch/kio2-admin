import { Component, NgZone } from '@angular/core';
import { IonicPage,Loading, LoadingController, NavController, NavParams, ViewController } from 'ionic-angular';
import { Order } from 'kng2-core';
import { TrackerProvider } from '../../providers/tracker/tracker.provider';
import { Geolocation, Geoposition } from '@ionic-native/geolocation';
import { Subscription } from "rxjs";
import 'leaflet';


/**
 * Generated class for the TrackerPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
@IonicPage()
@Component({
  selector: 'page-tracker',
  templateUrl: 'tracker.html',
})
export class TrackerPage {

  private orders: Order[] = this.navParams.get('results');
  public lat: number;
  public lng: number;
  private isReady;
  private map;
  private markers: L.Marker[];
  private geoSub:Subscription;
  private loader:Loading;

  constructor(
    private loadingCtrl: LoadingController,
    public navCtrl: NavController,
    public navParams: NavParams,
    public trackerSrv: TrackerProvider,
    private viewCtrl: ViewController,
    public zone: NgZone
  ) {
  }

  // ionViewDidLoad() {
  //   console.log('ionViewDidLoad TrackerPage');
  // }

  ngOnDestroy(){
    if(this.map) this.map.off();
  }

  ngOnInit() {
    // ============ BACKGROUND geolocalisation (can be replaced by the Hypertrack one) ====================

    // this.trackerSrv.backgroundLocation$.subscribe((location) => {

    //   console.log('BackgroundGeolocation:  ' + location.latitude + ',' + location.longitude);

    //   // Run update inside of Angular's zone
    //   this.zone.run(() => {
    //     this.lat = location.latitude;
    //     this.lng = location.longitude;
    //     this.isReady = true;
    //   });

    // }, (err) => {

    //   console.log(err);

    // });

    // Turn ON the background-geolocation system.
    // this.trackerSrv.backgroundGeolocation.start();

    // ====================== FOREGROUND geolocalisation =====================================
    this.showLoading();
    this.geoSub = this.trackerSrv.geoLocation$.subscribe((position: Geoposition) => {

      console.log(position);

      // Run update inside of Angular's zone to trigger change detection
      this.zone.run(() => {
        this.lat = position.coords.latitude;
        this.lng = position.coords.longitude;
        if(!this.map)this.createMap();
        this.isReady = true;
        this.loader.dismiss();
      });

    });

  }

  createMap() {
    this.map = L.map('map');

    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
      maxZoom: 18,
      id: 'mapbox.streets',
      accessToken: 'pk.eyJ1IjoiZ29uemFsZCIsImEiOiJjajR3cW5ybHQwZ3RrMzJvNXJrOWdkbXk5In0.kMW6xbKtCLEYAEo2_BdMjA'
    }).addTo(this.map);

    this.map.setView([this.lat, this.lng], 10);

    this.markers = this.orders.map((order) => {
      let marker = L.marker(new L.LatLng(order.shipping.geo.lat, order.shipping.geo.lng));
      marker.bindPopup(`
                        <b>`+order.shipping.name+`</b><br>
                        `+order.shipping.streetAdress+`
                       `);
      return marker;
    });
    let group = L.featureGroup(this.markers).addTo(this.map);
    this.map.fitBounds(group.getBounds().pad(0.5));
    
  }

  showLoading() {
    this.loader = this.loadingCtrl.create({
      spinner: "crescent",
      content: "Chargement de la carte"
    });
    this.loader.present();
  }

  onDismiss() {
    if(!this.geoSub.closed) this.geoSub.unsubscribe();
    this.viewCtrl.dismiss();
  }

}
