import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Platform } from 'ionic-angular';
import { LoaderService } from 'kng2-core';

/**
 * Generated class for the OupsPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-oups',
  templateUrl: 'oups.html',
})
export class OupsPage {

  error:any;

  constructor(
    public $loader:LoaderService,
    public navCtrl: NavController, 
    public navParams: NavParams,
    public platform: Platform
  ) {
  }

  ionViewDidLoad() {
    this.error=this.$loader.getError();
  }

  onClose(){
    this.platform.exitApp();

  }
}
