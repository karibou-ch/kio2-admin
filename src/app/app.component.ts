import { Component, ViewChild } from '@angular/core';
import { Platform, NavController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { LoaderService, User, UserService } from 'kng2-core';

import localeFr from '@angular/common/locales/fr';
//
// the second parameter 'fr' is optional
import { registerLocaleData } from '@angular/common';
import { Network } from '@ionic-native/network';
import { Dialogs } from '@ionic-native/dialogs';
registerLocaleData(localeFr, 'fr');


@Component({
  templateUrl: 'app.html'
})
export class Kio2Aadmin {
  currentUser:User=new User();
  rootPage: any ;
  @ViewChild('adminNavigation') nav: NavController;

  constructor(
    private dialogs:Dialogs,
    private $loader: LoaderService,
    private $network: Network,
    private platform: Platform,
    private statusBar: StatusBar,
    private splashScreen: SplashScreen,
    private $user:UserService
  ) {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.statusBar.hide();
      this.splashScreen.hide();
      console.log('INIT APP isCore,isMobileweb',this.platform.is('core'),this.platform.is('mobileweb'))

    });
  }


  //
  // if default URL/# is set
  // QUICK FIX for report 
  defaultPage(){
    try{
      if(window&&window.location.hash){
        let hash=window.location.hash;
        return setTimeout(()=>{
          window.location.hash=hash;
        },400);
      }  
    }catch(e){

    }
  }



  onInit(user:User){

    if(!user.isAuthenticated()){
      this.rootPage='LoginPage';
      return;
    }

    //
    // if admin||logistic => shopper
    if(user.isAdmin()||user.hasRole('logistic')){
      this.rootPage='ShopperPage';
      this.defaultPage();
      return;
    }

    this.rootPage='OrderCustomersPage';
    this.defaultPage();

  }

  // ngAfterViewInit() {

  //   // Convenience to route with a given nav
  //   Deeplinks.routeWithNavController(this.navChild, {
  //     '/about-us': AboutPage,
  //     '/universal-links-test': AboutPage,
  //     '/products/:productId': ProductPage
  //   }).subscribe((match) => {
  //     console.log('Successfully routed', match);
  //   }, (nomatch) => {
  //     console.warn('Unmatched Route', nomatch);
  //   });
  // }  

  ngOnInit() {
  
    //
    // checking network on start!
    setTimeout(()=>{
      if(this.$network.type=='none'){
        return this.dialogs.alert("Il n'y a pas d'accès au réseau actuellement").then(()=>{
          this.platform.exitApp();
        })
      }  
    },1000);


    this.$loader.ready().subscribe((loader) => {
      console.log('--- init',this.rootPage,this.currentUser)
      Object.assign(this.currentUser,loader[1]);
      this.onInit(this.currentUser);
    },error=>{
      console.log('--- ISSUE',error)
      this.rootPage='OupsPage';
      this.dialogs.alert("Un problème empêche l'accès au service..").then(()=>{
        this.platform.exitApp();        
      })
    });

    this.$user.subscribe(user=>{
      this.onInit(user);
    },issue=>{
      console.log('--- ISSUE',issue)
    });
  }
}
