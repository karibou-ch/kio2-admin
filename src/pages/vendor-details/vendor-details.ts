import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController } from 'ionic-angular';

import { User, 
         Shop,
         ShopService,
         Category} from 'kng2-core';

import moment from 'moment';

@IonicPage()
@Component({
  selector: 'kio2-vendor-details',
  templateUrl: 'vendor-details.html',
})
export class VendorDetailsPage {

  user:User;
  defaultShop:Shop=new Shop();
  shop:Shop;
  categories:Category[];
  title:string;
  weekdays={};
  tvaId;
  catalog;

  constructor(
    private navCtrl: NavController, 
    private navParams: NavParams,
    private $shop:ShopService,
    private toast:ToastController    
  ) {

    // using form validator ?
    // let iBAN_Validator=(control: FormControl)=>{ 
    //   return this.isValidIBANNumber(control.value);
    // }    
    //this.ibanCtrl=new FormControl('', [Validators.required, iBAN_Validator])
    this.shop = this.navParams.get('shop')||this.defaultShop;
    this.user = this.navParams.get('user')||new User();    
    this.categories = this.navParams.get('categories')||[];
    this.$shop.get(this.shop.urlpath).subscribe(shop=>{
      Object.assign(this.shop,shop);
    })
    this.initShop();    
  }


  formatToGMT(date:Date){
    return moment(date).format()
  }

  ibanCtrl(){
    return this.isValidIBANNumber(this.shop.account.IBAN);
  }
  /*
   * Returns 1 if the IBAN is valid 
   * Returns FALSE if the IBAN's length is not as should be (for CY the IBAN Should be 28 chars long starting with CY )
   * Returns any other number (checksum) when the IBAN is invalid (check digits do not match)
   */
  isValidIBANNumber(input) {
    let mod97=(str:string)=>{
      let checksum:any = str.slice(0, 2), 
          fragment:any;
      for (let offset = 2; offset < str.length; offset += 7) {
        fragment = String(checksum) + str.substring(offset, offset + 7);
        checksum = parseInt(fragment, 10) % 97;
      }
      return checksum;
    }  
  
    let CODE_LENGTHS = {
      AD: 24, AE: 23, AT: 20, AZ: 28, BA: 20, BE: 16, BG: 22, BH: 22, BR: 29,
      CH: 21, CR: 21, CY: 28, CZ: 24, DE: 22, DK: 18, DO: 28, EE: 20, ES: 24,
      FI: 18, FO: 18, FR: 27, GB: 22, GI: 23, GL: 18, GR: 27, GT: 28, HR: 21,
      HU: 28, IE: 22, IL: 23, IS: 26, IT: 27, JO: 30, KW: 30, KZ: 20, LB: 28,
      LI: 21, LT: 20, LU: 20, LV: 21, MC: 27, MD: 24, ME: 22, MK: 19, MR: 27,
      MT: 31, MU: 30, NL: 18, NO: 15, PK: 24, PL: 28, PS: 29, PT: 25, QA: 29,
      RO: 24, RS: 22, SA: 24, SE: 24, SI: 19, SK: 24, SM: 27, TN: 24, TR: 26
    };
    let iban = String(input).toUpperCase().replace(/[^A-Z0-9]/g, ''), // keep only alphanumeric characters
      code = iban.match(/^([A-Z]{2})(\d{2})([A-Z\d]+)$/), // match and capture (1) the country code, (2) the check digits, and (3) the rest
      digits;
    // check syntax and length
    if (!code || iban.length !== CODE_LENGTHS[code[1]]) {
      return false;
    }
    // rearrange country code and check digits, and convert chars to ints
    let replaceFunc=(letter:string):any=>{
      return letter.charCodeAt(0) - 55;
    }
    digits = (code[3] + code[1] + code[2]).replace(/[A-Z]/g, replaceFunc);
    // final check
    return mod97(digits);
  }

  initShop(){
    //
    // Catalog
    if(this.shop.catalog){
      this.catalog=(this.shop.catalog._id)||this.shop.catalog;
    }
    
    //
    // TVA
    if(!this.shop.account.tva){
      this.shop.account.tva={}
    }
    this.tvaId=this.shop.account.tva.number||'';
    //
    // model for weekdays
    (this.shop.available.weekdays||[]).map(day=>this.weekdays[day]=true);
    
  }

  onDateFrom(){

  }
  onDateTo(){

  }


  doSave(){

    //
    // sync catalog
    if(this.catalog!=this.shop.catalog){
      this.shop.catalog=this.categories.find(c=>c._id==this.catalog);
    }
    
    //
    // sync TVA
    if(!this.shop.account.tva){
      this.shop.account.tva={}
    }
    this.shop.account.tva.number=this.tvaId;

    //
    // sync weekdays
    this.shop.available.weekdays=Object.keys(this.weekdays).filter(day=>this.weekdays[day]).map(day=>(parseInt(day)));
    this.$shop.save(this.shop).subscribe(
      (shop:Shop)=>{
        this.toast.create({
          message: "Enregistré",
          duration: 3000
        }).present();

    
      },
      error=>{
        this.toast.create({
          message: error.error,
          duration: 3000,
          position:'top',
          cssClass:'toast-error'
        }).present();
      }     
    )
  }

  doExit(){
    this.navCtrl.pop();
  }

  getCatalog(){
    return this.categories.filter(cat=>cat.active&&cat.type=='Catalog');
  }
}
