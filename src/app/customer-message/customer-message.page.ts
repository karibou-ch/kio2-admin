import { Component, OnInit, Input } from '@angular/core';
import { Order, OrderItem } from 'kng2-core';
import { PopoverController } from '@ionic/angular';
import { EngineService } from '../services/engine.service';

@Component({
  selector: 'kio-customer-message',
  templateUrl: './customer-message.page.html',
  styleUrls: ['./customer-message.page.scss'],
})
export class CustomerMessage implements OnInit {

  @Input() order: Order;
  @Input() item: OrderItem;


  selected=0;
  countItems = 0;
  failureItems = 0;
  itemName ="";

  message={
    cancel:
`Bonjour,\nLe produit «_ITEM_» n'est pas disponible pour votre commande karibou.ch, il sera supprimé de votre facture finale.\n
Nous sommes désolés pour ce désagrement.\n`,
    replace:
`Bonjour,\nLe produit «_ITEM_» n'est pas disponible pour votre commande karibou.ch.\n
Si cela vous convient, il sera remplacé par : \n
- _NAME_ \n
D'avance merci pour votre compréhension.`,
    replacecommon:
`Bonjour,\nLe produit «_ITEM_» n'est pas disponible pour votre commande karibou.ch.\n
Si cela vous convient, il sera remplacé par un article similaire. \n
D'avance merci pour votre compréhension.`

  }


  constructor(
    private $engine: EngineService,
    private $popup: PopoverController
  ) {
  }

  get cancelMsg() {
    return this.message.cancel.replace(/_ITEM_/g, this.item.title);
  }

  get replaceMsg() {
    const replace = (this.itemName=='')? "«proposition --v »":this.itemName;
    return this.message.replace.replace(/_ITEM_/g, this.item.title).replace(/_NAME_/,replace);
  }

  get replaceCommonMsg() {
    return this.message.replacecommon.replace(/_ITEM_/g, this.item.title);
  }

  get customerName(){
    return this.order.customer.displayName;
  }


  get body() {
    switch(this.selected){
      case 0: return this.replaceMsg;
      case 1: return this.replaceCommonMsg;
      case 2: return this.cancelMsg;
    }
  }

  get action(){
    switch(this.selected){
      case 0: return "replace";
      case 1: return "replace";
      case 2: return "cancel";
    }
  }

  ngOnInit() {
    this.failureItems = this.order.items.reduce((sum,item) => {
      const fail = (item.fulfillment.status=='failure')?1:0
      return sum + fail;
    },0)

    this.countItems = this.order.items.length;
  }


  doCustomerContact(action) {


    this.selected = action;
    //
    // SMS links are platform dependant
    // https://stackoverflow.com/a/19126326
    const prefix = (document.documentElement.classList.contains('ios')) ? '&' : '?';

    const customerName = this.customerName;
    const body = this.body;
    const phones = this.order.customer.phoneNumbers.filter(phone => phone.number && phone.number.indexOf('022') == -1 && phone.number.indexOf('004122') == -1).map(phone => phone.number);

    const aLink = document.createElement('a');
    aLink.href = "sms:"+phones[0] + prefix + 'body=' + encodeURI(body);
    console.log('--- link',aLink.href);

    aLink.click();
    this.$popup.dismiss(action);
  }




  onClose(action) {
    this.$popup.dismiss(action||'');
  }
}
