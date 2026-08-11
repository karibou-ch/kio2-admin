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
    return this.image;
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

  onChange(selection) {
    if(!selection) {
      return;
    }
    const upload = typeof selection.promise === 'function' ? selection.promise() : selection;
    if(typeof upload.fail !== 'function') {
      return;
    }
    upload.fail((errorType) => {
      if(errorType === 'user') {
        return;
      }
      this.showMsg(this.uploadErrorMessage(errorType));
    });
  }

  onUpload($uc) {
    if(!$uc?.cdnUrl) {
      this.showMsg('La photo n\'a pas pu être chargée. Veuillez réessayer.');
      return;
    }
    this.image = $uc.cdnUrl;
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

  private uploadErrorMessage(errorType: string): string {
    switch(errorType) {
      case 'size':
        return 'La photo est trop volumineuse.';
      case 'image':
        return 'Le fichier sélectionné n\'est pas une image prise en charge.';
      case 'upload':
        return 'La photo n\'a pas pu être envoyée. Vérifiez votre connexion et réessayez.';
      case 'info':
        return 'Les informations de la photo n\'ont pas pu être chargées.';
      default:
        return 'Une erreur est survenue pendant l\'envoi de la photo. Veuillez réessayer.';
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
