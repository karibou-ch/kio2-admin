import { Component, OnInit, Input, NgZone, OnDestroy } from '@angular/core';
import { Config, Order, User, Utils } from 'kng2-core';
import { EngineService } from '../services/engine.service';
import { Platform, ToastController, ModalController } from '@ionic/angular';
import { TrackerProvider } from '../services/tracker/tracker.provider';
import { Loader } from "@googlemaps/js-api-loader"

declare const google;

@Component({
  selector: 'app-tracker',
  templateUrl: './tracker.page.html',
  styleUrls: ['./tracker.page.scss'],
})
export class TrackerPage implements OnInit, OnDestroy {

  private RADIUS = 2000;
  private toggleZoom: boolean;
  private markerBounds;
  private config: Config;
  private user: User;
  public lat = 46.200472;
  public lng = 6.1316835;
  private isReady: boolean;
  private map;
  private userMarker;
  private markers = [];
  private closestMarkers;

  // private geoSub: Subscription;
  private directionsDisplay;
  private directionsService;

  // geo
  obs;

  @Input() orders: Order[];

  constructor(
    private $engine: EngineService,
    private $modal: ModalController,
    private $toast: ToastController,
    private $tracker: TrackerProvider,
    public zone: NgZone
  ) {
    this.isReady = true;
    this.config = this.$engine.currentConfig;
    this.user = this.$engine.currentUser;
    this.orders = [];

    //
    //<script type="text/javascript" src="https://maps.googleapis.com/maps/api/js?libraries=geometry&key=key"></script>
  }

  async ngOnInit() {

    const apiKey = this.config.shared.keys.pubMap;
    const loader = new Loader({
      apiKey,
      version: "weekly"
    });

    loader.load().then(async () => {
      await google.maps.importLibrary("maps");// as google.maps.MapsLibrary;
      this.markerBounds = new google.maps.LatLngBounds();
      this.directionsService = new google.maps.DirectionsService();
      this.$tracker.fetch();
      this.createMap();  
    });
    

    //
    //
    // this.$platform.pause.subscribe(() => {

    // });
    // this.$platform.resume.subscribe(() => {

    // });

    //
    // fetch one position and create map
  }

  ngOnDestroy() {
    this.$tracker.stop();
  }

  getAddressDirection(order: Order) {
    const currentOrder = order;
    const address = currentOrder.shipping.streetAdress + ',' +
                    currentOrder.shipping.postalCode + ',' +
                    currentOrder.shipping.region;
    // const geos = [currentOrder.shipping.geo.lat, currentOrder.shipping.geo.lng];
    // const destination = (currentOrder.shipping.geo) ? address : geos ;
    return address;    
  }
  //
  // refresh standby state
  // ionViewWillEnter(){
  ionViewDidLoad() {
    //
    // background
    // let computedRoute = false;
    this.obs = this.$tracker.update$.subscribe((position) => {
      this.showLoading('updating position ...', 2000);
      this.updateUserMarker(position);
      //
      // display route when only one is selected
      // if (this.orders.length === 1 && !computedRoute) {
      //   this.directionRoute(this.orders[0]);
      // }
      // computedRoute = true;
    });

  }

  ionViewDidLeave() {
    document.getElementById('map').innerHTML = '';
    this.deleteMarkers();
    this.obs && (this.obs.unsubscribe());
  }



  updateUserMarker(coords) {
    this.lat = coords.latitude;
    this.lng = coords.longitude;
    if (!this.userMarker) {
      return this.userMarker = new google.maps.Marker({
        position: { lat: coords.latitude, lng: coords.longitude },
        map: this.map
      });
    }
    this.userMarker.setPosition( new google.maps.LatLng( coords.latitude, coords.longitude ) );

    // this.map.panTo( new google.maps.LatLng( coords.latitude, coords.longitude ) );

  }

  createMap() {
    const bikeLayer = new google.maps.BicyclingLayer();
    this.map = new google.maps.Map(document.getElementById('map'), {
      disableDefaultUI: true,
      mapTypeControl: false
    });

    bikeLayer.setMap(this.map);
    this.setMapMarkers(this.orders);

    this.directionsDisplay = new google.maps.DirectionsRenderer({map: this.map});
    // this.directionsDisplay.setMap(this.map);

  }

  showLoading(msg: string, ttl?) {
    this.$toast.create({
      message: msg,
      duration: (ttl || 3000)
    }).then(alert => alert.present());
  }


  directionRoute(order: Order) {
    const request = {
      origin: new google.maps.LatLng(this.lat, this.lng),
      destination: new google.maps.LatLng(order.shipping.geo.lat, order.shipping.geo.lng),
      travelMode: 'BICYCLING'
    };
    this.directionsService.route(request, (result, status) => {
      if (status === 'OK') {
        this.directionsDisplay.setDirections(result);
      }
    });
  }

  onBack() {
    this.$modal.dismiss();
  }

  openDirection(order? : Order) {
    const currentOrder = order? order: this.orders[0];
    const destination = this.getAddressDirection(currentOrder);

    // console.log('direction',destination)
    // this.launchNavigator.navigate(destination, options)

    //
    // https://github.com/dpa99c/phonegap-launch-navigator/issues/158
    // if(this.platform.is('core') || this.platform.is('mobileweb')){
    //   window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination.toString()}&dir_action=navigate`)
    //   return;
    // }

    // this.launchNavigator.navigate(destination)
    //     .then(
    //         success => {},
    //         error => alert('Error launching navigator: ' + error)
    // );
    try {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}&dir_action=navigate`);
    } catch (error) {
    }
  }


  setMapMarkers(orders: Order[]) {
    this.deleteMarkers();
    // global marker popop
    let currentInfoWindow=null;
    orders.forEach((order, i) => {
      if (!order.shipping.geo) {
        return;
      }
      const pos = new google.maps.LatLng(order.shipping.geo.lat, order.shipping.geo.lng);
      const marker = new google.maps.Marker({
        position: pos,
        map: this.map,
        icon: 'http://chart.apis.google.com/chart?chst=d_map_spin&chld=0.8|0|00FF88|13|b|' + (order.rank).toString()
      });
      this.markers.push(marker);
      // set popup window on marker

      const destination = this.getAddressDirection(order);
      const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&dir_action=navigate`;
      const phone = order.customer.phoneNumbers[0] ? order.customer.phoneNumbers[0].number : '';
      const infowindow = new google.maps.InfoWindow({
        content: `<h1>${order.shipping.name} (${order.rank})</h1><b><a href="tel:${phone}">${phone}</a></b><br>
                  ${order.shipping.streetAdress}, é:${order.shipping.floor}<br/>
                  ${order.shipping.note}<br>
                  <a href="${url}" target="_new">utiliser map</a>
                  `
      });
      marker.infowindow = infowindow;
      marker.addListener('click', () => {
        infowindow.open(this.map, marker);
        if(currentInfoWindow) {
          currentInfoWindow.close();
        }
        currentInfoWindow = infowindow;
      });

      this.markerBounds.extend(pos); // extend markerBounds with each marker (for the zoom)
    });

    // google.maps.event.addListener(this.map, "click", function(event) {
    //   this.markers.forEach(marker => {
    //     marker.infowindow.close();
    //   });
    // });
    this.markerBounds.extend(new google.maps.LatLng(this.lat, this.lng));  // add user marker
    setTimeout(() => this.map.fitBounds(this.markerBounds), 500);
  }

  // //get list of the closest orders below <radius> meters
  getClosestOrders(radius: number): any {
    radius = radius > this.RADIUS ? this.RADIUS : radius;
    this.closestMarkers = this.orders
      .filter((order) => order.shipping.geo && this.distanceToOrder(order) <= radius)
      .sort((a, b) => this.distanceToOrder(a) - this.distanceToOrder(b))
      .map(order => {
        return { order, distance: this.distanceToOrder };
      });
    this.setMapMarkers(this.closestMarkers.map(item => item.order));
  }

  // //distance between user position and an order destination position
  distanceToOrder(order: Order): number {
    return google.maps.geometry.spherical.computeDistanceBetween(new google.maps.LatLng(this.lat, this.lng), new google.maps.LatLng(order.shipping.geo.lat, order.shipping.geo.lng));
  }

  // Sets the map on all markers in the array.
  setMapOnAll(map) {
    for (let i = 0; i < this.markers.length; i++) {
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
