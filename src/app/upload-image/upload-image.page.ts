import { Component, OnInit, Input } from '@angular/core';
import { Config, User, Product, Shop, ProductService } from 'kng2-core';
import { ToastController, ModalController } from '@ionic/angular';
import { EngineService } from '../services/engine.service';

@Component({
  selector: 'app-upload-image',
  templateUrl: './upload-image.page.html',
  styleUrls: ['./upload-image.page.scss'],
})
export class UploadImagePage implements OnInit{


  config: Config;
  user: User;

  @Input() product: Product;
  @Input() shopfg: Shop;
  @Input() shopowner: Shop;
  @Input() shoplogo: Shop;
  image: string;
  pubUpcare: string;

  constructor(
    private $engine: EngineService,
    private $modal: ModalController,
    private $alert: ToastController,
    public $product: ProductService
  ) {
    this.user = this.$engine.currentUser;
    this.config = this.$engine.currentConfig;
  }

  
  get urlImage() {
    if(!this.image) return '';
    return 'https:' + this.image;
  }


  ngOnInit() {
    if (this.product) {
      this.image = this.product.photo.url;
    }
    if (this.shopfg) {
      this.image = this.shopfg.photo.fg;
    }
    if (this.shopowner) {
      this.image = this.shopowner.photo.owner;
    }
    if (this.shoplogo) {
      this.image = this.shoplogo.photo.logo;
    }
    if (this.config) {
      this.pubUpcare = this.config.shared.keys.pubUpcare;
    }
  }

  isReady() {
    return (this.config && this.user);
  }

  onClose() {
    this.$modal.dismiss();
  }

  onDialogOpen(dialog) {
    dialog.done(dlg => {
      if (dlg.state() === 'rejected') {
        this.showMsg('Attention, la taille maximum d\'une image est limitée à 150kb');
      }
    });
  }

  onUpload($uc) {
    // this.image="//ucarecdn.com/"+$uc.uuid+"/";
    this.image = $uc.cdnUrl.replace('https:', '');
    if (this.product) {
      this.product.photo.url = this.image;
    }
    if (this.shopfg) {
      this.shopfg.photo.fg = this.image;
    }
    if (this.shopowner) {
      this.shopowner.photo.owner = this.image;
    }
    if (this.shoplogo) {
      this.shoplogo.photo.logo = this.image;
    }

  }

  showMsg(msg) {
    this.$alert.create({
      message: msg,
      duration: 3000
    }).then(alert => alert.present());
  }

  ucValidator(info, more) {
    console.log('DEBUG uc --', info);
    console.log('DEBUG uc --', more);
    if (info.size !== null && info.size > 170 * 1024) {
      // throw new Error("fileMaximumSize");
    }
  }



}
