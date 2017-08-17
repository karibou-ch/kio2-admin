import { Component, NgZone } from '@angular/core';
import { ActionSheetController, IonicPage, Loading, LoadingController, NavController, NavParams, ViewController } from 'ionic-angular';
import { ConfigService, config, LoaderService, Order  } from 'kng2-core';
import { TrackerProvider } from '../../providers/tracker/tracker.provider';
import { Geoposition } from '@ionic-native/geolocation';
import { Subscription } from "rxjs";
import * as L from 'leaflet';
import * as Routing from 'leaflet-routing-machine';
import * as ExtraMarkers from 'leaflet-extra-markers';
//import 'leaflet-usermarker';


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

  private ready$;
  private config:any;
  private orders: Order[] = this.navParams.get('results');
  public lat: number;
  public lng: number;
  private isReady;
  private map;
  private userMarker;
  private markers: L.Marker[];
  public closestOrders;
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
    if (this.map) this.map.off();
    if (this.ready$) this.ready$.unsubscribe();
  }

  ngOnInit() {
    this.loaderSrv.ready().subscribe((loader) => {
      Object.assign(this.config, config);
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

      console.log(position);

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
    this.map = L.map('map');

    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
      maxZoom: 18,
      id: 'mapbox.streets',
      accessToken: this.config.mapBoxToken
    }).addTo(this.map);

    //this.map.setView([this.lat, this.lng], 10);

    this.markers = this.orders.map((order) => {
      var numberMarker = ExtraMarkers.icon({
        icon: 'fa-number',
        number: order.rank,
        markerColor: 'blue',
        prefix: 'fa'
      });
      let marker = L.marker(new L.LatLng(order.shipping.geo.lat, order.shipping.geo.lng), {icon: numberMarker});
      marker.bindPopup(`
                        <b><a href="tel:${order.customer.phoneNumbers[0]}">${order.shipping.name}</a></b><br>
                          ${order.shipping.streetAdress}<br/>
                          ${order.shipping.note}
                       `);
      return marker;
    });
    let group = L.featureGroup(this.markers).addTo(this.map);
    this.map.fitBounds(group.getBounds().pad(0.0));

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

  //zoom on the user position
  trackMe() {
    // user marker
    if (!this.userMarker) this.userMarker = L.marker([this.lat, this.lng]);
    this.userMarker.addTo(this.map);
    // destinations markers within a radius
    this.closestOrders = this.getClosestOrders(5000);
    this.map.flyTo([this.lat, this.lng], 14);
    this.getOrderRoute(this.closestOrders[0].order);

  }

  //get list of the closest orders below <radius> meters
  getClosestOrders(radius: number): any {
    return this.orders
      .filter((order) => this.distanceToOrder(order) <= radius)
      .sort((a, b) => { return this.distanceToOrder(a) - this.distanceToOrder(b) })
      .map(order => {
        return {order: order, distance: this.distanceToOrder};
      });
  }

  //distance between user position and an order destination position
  distanceToOrder(order:Order):number {
    return L.latLng(this.lat, this.lng).distanceTo(L.latLng(order.shipping.geo.lat, order.shipping.geo.lng))
  }

  //fit the screen zoom to all orders
  allOrdersZoom() {
    this.map.flyToBounds(L.featureGroup(this.markers).getBounds());
  }

  //give the path between the user and the order position
  getOrderRoute(order: Order) {
    if(this.router) this.router.spliceWaypoints(0,2);
    this.router = Routing.control({
      waypoints: [
        L.latLng(this.lat, this.lng),
        L.latLng(order.shipping.geo.lat, order.shipping.geo.lng)
      ],
      language: 'fr',
      autoRoute: true
    }).addTo(this.map);
  }

  //  presentActionSheet() {
  //   let actionSheet = this.actionSheetCtrl.create({
  //     title: 'Modify your album',
  //     buttons: this.closestOrders.forEach(marker => {
        
  //     });
  //       {
  //         text: 'Destructive',
  //         role: 'destructive',
  //         handler: () => {
  //           console.log('Destructive clicked');
  //         }
  //       },{
  //         text: 'Archive',
  //         handler: () => {
  //           console.log('Archive clicked');
  //         }
  //       }
  //     ]
  //   });
  //   actionSheet.present();
  // }


}
