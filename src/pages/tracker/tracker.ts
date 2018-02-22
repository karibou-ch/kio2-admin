import { Component, NgZone } from '@angular/core';
import { Platform, ActionSheetController, Events, IonicPage, NavController, NavParams, ToastController, ViewController } from 'ionic-angular';
import { LoaderService, Order } from 'kng2-core';
import { LaunchNavigator, LaunchNavigatorOptions } from '@ionic-native/launch-navigator';
//import { Subscription } from "rxjs";
declare var google;


/**
 * Generated class for the TrackerPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * See https://developers.google.com/maps/documentation/urls/guide#directions-action for direction options
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
  private orders: Order[];
  public lat: number=46.200472;
  public lng: number=6.1316835;
  private isReady;
  private map;
  private userMarker;
  private markers = [];
  private closestMarkers;
  // private geoSub: Subscription;
  private directionsDisplay;
  private directionsService;

  constructor(
    public actionSheetCtrl: ActionSheetController,
    private events:Events,
    private launchNavigator: LaunchNavigator,
    private $loader: LoaderService,
    public navCtrl: NavController,
    public navParams: NavParams,
    public platform: Platform,
    private toast:ToastController,
    private viewCtrl: ViewController,
    public zone: NgZone
  ) {
    this.orders = this.navParams.get('results');
    this.directionsService = new google.maps.DirectionsService();
  }

  // ionViewDidLoad() {
  //   console.log('ionViewDidLoad TrackerPage');
  // }

  ngOnDestroy() {
    if (this.ready$) this.ready$.unsubscribe();
  }

  ngOnInit() {
    this.$loader.ready().subscribe((loader) => {
      this.config = loader[0];
      if (!this.map) this.createMap();
      this.isReady = true;
    })

    //
    //
    this.platform.pause.subscribe(()=>{

    });
    this.platform.resume.subscribe(()=>{

    });
    
    
  }


  //
  // refresh standby state
  //ionViewWillEnter(){
  ionViewDidLoad(){
    //
    // background
    let computedRoute=false;
    this.events.subscribe('location',(position)=>{
      this.showLoading("updating position ...",1500);
      this.updateUserMarker(position);
      //
      // display route when only one is selected
      if(this.orders.length===1&&!computedRoute){
        this.directionRoute(this.orders[0]);
      }
      computedRoute=true;
    });

  }

  ionViewDidLeave(){
    this.events.unsubscribe('location');    
    // if (!this.geoSub.closed) this.geoSub.unsubscribe();
    this.deleteMarkers();
  }


  onDismiss() {
    this.viewCtrl.dismiss();    
  }
  

  updateUserMarker(coords){
    this.lat = coords.latitude;
    this.lng = coords.longitude;
    if(!this.userMarker){
      return this.userMarker = new google.maps.Marker({
        position: { lat: coords.latitude, lng: coords.longitude },
        map: this.map
      });
    }
    this.userMarker.setPosition( new google.maps.LatLng( coords.latitude, coords.longitude ) );

    //this.map.panTo( new google.maps.LatLng( coords.latitude, coords.longitude ) );

  }

  createMap() {
    var bikeLayer = new google.maps.BicyclingLayer();
    this.map = new google.maps.Map(document.getElementById('map'), {
      disableDefaultUI: true,
      mapTypeControl: false
    });

    bikeLayer.setMap(this.map);
    this.setMapMarkers(this.orders);

    this.directionsDisplay = new google.maps.DirectionsRenderer({map:this.map});
    //this.directionsDisplay.setMap(this.map);    

  }

  showLoading(msg:string,ttl?) {
    this.toast.create({
      message: msg,
      duration: (ttl||3000)
    }).present()
  }


  directionRoute(order:Order){
    let request = {
      origin: new google.maps.LatLng(this.lat, this.lng),
      destination: new google.maps.LatLng(order.shipping.geo.lat, order.shipping.geo.lng),
      travelMode: 'BICYCLING'
    };
    this.directionsService.route(request, (result, status)=> {
      if (status == 'OK') {
        this.directionsDisplay.setDirections(result);
      }
    });
  }

  openDirection(){
    // launchnavigator.APP.GOOGLE_MAPS
    // TRANSPORT_MODE => this.launchNavigator.TRANSPORT_MODE.BICYCLING
    // 
    let options: LaunchNavigatorOptions = {
      app:this.launchNavigator.APP.GOOGLE_MAPS,
      destinationName:this.orders[0].shipping.name,
      transportMode:this.launchNavigator.TRANSPORT_MODE.BICYCLING,
      enableDebug:true
    };

    let destination=(this.orders[0].shipping.geo)?
      this.orders[0].shipping.streetAdress+","+this.orders[0].shipping.postalCode+","+this.orders[0].shipping.region:
      [this.orders[0].shipping.geo.lat,this.orders[0].shipping.geo.lng];

    //console.log('direction',destination)
    //this.launchNavigator.navigate(destination, options)
    this.launchNavigator.navigate(destination)
        .then(
            success => {},
            error => alert('Error launching navigator: ' + error)
    );
  }

  userZoom() {
    if(this.orders.length < 2){
     return this.map.setCenter(new google.maps.LatLng(this.lat, this.lng)); 
    }
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
      if(!order.shipping.geo){
        return;
      }
      let pos = new google.maps.LatLng(order.shipping.geo.lat, order.shipping.geo.lng);
      let marker = new google.maps.Marker({
        position: pos,
        map: this.map,
        icon: 'http://chart.apis.google.com/chart?chst=d_map_spin&chld=0.8|0|00FF88|13|b|' + (order.rank).toString()
      });
      this.markers.push(marker);
      //set popup window on marker
      let phone=order.customer.phoneNumbers[0]?order.customer.phoneNumbers[0].number:'';
      let infowindow = new google.maps.InfoWindow({
        content: `<b><a href="tel:${phone}">${order.shipping.name}</a></b><br>
                  ${order.shipping.streetAdress}, é:${order.shipping.floor}<br/>
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
