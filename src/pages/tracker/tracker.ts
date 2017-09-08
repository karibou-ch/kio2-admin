import { Component, NgZone } from '@angular/core';
import { ActionSheetController, IonicPage, Loading, LoadingController, NavController, NavParams, ViewController } from 'ionic-angular';
import { ConfigService, LoaderService, Order } from 'kng2-core';
import { TrackerProvider } from '../../providers/tracker/tracker.provider';
import { Geoposition } from '@ionic-native/geolocation';
import { Subscription } from "rxjs";
declare var google;


/**
 * Generated class for the TrackerPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
@IonicPage({name:'tracker'})
@Component({
  selector: 'page-tracker',
  templateUrl: 'tracker.html',
})
export class TrackerPage {

  private RADIUS = 2000;
  private toggleZoom: boolean;
  private markerBounds;
  private config;
  private ready$;
  private orders: Order[] = this.navParams.get('results');
  public lat: number;
  public lng: number;
  private isReady;
  private map;
  private userMarker;
  private markers = [];
  private closestMarkers;
  private geoSub: Subscription;
  private loader: Loading;
  private router;

  constructor(
    public actionSheetCtrl: ActionSheetController,
    private configSrv: ConfigService,
    private loadingCtrl: LoadingController,
    private loaderSrv: LoaderService,
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

  ngOnDestroy() {
    if (this.ready$) this.ready$.unsubscribe();
  }

  ngOnInit() {
    this.loaderSrv.ready().subscribe((loader) => {
      this.config = loader[0];
      //Object.assign(this.config, new Config);
    })

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


      // Run update inside of Angular's zone to trigger change detection
      this.zone.run(() => {
        this.lat = position.coords.latitude;
        this.lng = position.coords.longitude;
        if (!this.map) this.createMap();
        this.isReady = true;
        if (this.loader) this.loader.dismiss();
      });

    });

  }

  createMap() {
    this.map = new google.maps.Map(document.getElementById('map'), {
      disableDefaultUI: true,
      mapTypeControl: true
    });
    this.userMarker = new google.maps.Marker({
      position: { lat: this.lat, lng: this.lng },
      map: this.map,
    });

    this.setMapMarkers(this.orders);

    

  }

  showLoading() {
    this.loader = this.loadingCtrl.create({
      spinner: "crescent",
      content: "Chargement de la carte"
    });
    this.loader.present();
  }

  onDismiss() {
    if (!this.geoSub.closed) this.geoSub.unsubscribe();
    this.viewCtrl.dismiss();
  }

  userZoom() {
    if (!this.toggleZoom) {
      this.toggleZoom = true;
      this.getClosestOrders(this.RADIUS);
    }
    else {
      this.toggleZoom = false;
      this.setMapMarkers(this.orders);
    }
    this.map.fitBounds(this.markerBounds);
  }

  setMapMarkers(orders: Order[]) {
    this.deleteMarkers();
    orders.forEach((order, i) => {
      let pos = new google.maps.LatLng(order.shipping.geo.lat, order.shipping.geo.lng);
      let marker = new google.maps.Marker({
        position: pos,
        map: this.map,
        icon: 'http://chart.apis.google.com/chart?chst=d_map_spin&chld=0.8|0|00FF88|13|b|' + (order.rank).toString()
      });
      this.markers.push(marker);
      //set popup window on marker
      var infowindow = new google.maps.InfoWindow({
        content: `<b><a href="tel:${order.customer.phoneNumbers[0]}">${order.shipping.name}</a></b><br>
                  ${order.shipping.streetAdress}<br/>
                  ${order.shipping.note}
                    `
      });
      marker.addListener('click', () => {
        infowindow.open(this.map, marker);
      });
      google.maps.event.addListener(this.map, 'click', (event) => {
        infowindow.close();
      });

      this.markerBounds.extend(pos); //extend markerBounds with each marker (for the zoom)
    });
    this.markerBounds.extend(new google.maps.LatLng(this.lat, this.lng))  //add user marker
    this.map.fitBounds(this.markerBounds);   //zoom over all the markers
  }

  // //get list of the closest orders below <radius> meters
  getClosestOrders(radius: number): any {
    radius = radius > this.RADIUS ? this.RADIUS : radius;
    this.closestMarkers = this.orders
      .filter((order) => this.distanceToOrder(order) <= radius)
      .sort((a, b) => { return this.distanceToOrder(a) - this.distanceToOrder(b) })
      .map(order => {
        return { order: order, distance: this.distanceToOrder };
      });
      this.setMapMarkers(this.closestMarkers.map(item => item.order));
  }

  // //distance between user position and an order destination position
  distanceToOrder(order: Order): number {
    return google.maps.geometry.spherical.computeDistanceBetween(new google.maps.LatLng(this.lat, this.lng), new google.maps.LatLng(order.shipping.geo.lat, order.shipping.geo.lng));
  }

  // Sets the map on all markers in the array.
  setMapOnAll(map) {
    for (var i = 0; i < this.markers.length; i++) {
      this.markers[i].setMap(map);
    }
  }

  // Removes the markers from the map, but keeps them in the array.
  clearMarkers() {
    this.setMapOnAll(null);
  }

  // Deletes all markers in the array by removing references to them.
  deleteMarkers() {
    this.clearMarkers();
    this.markers = [];
    this.markerBounds = new google.maps.LatLngBounds();
  }


}
