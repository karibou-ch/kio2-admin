import { Component, OnInit } from '@angular/core';
import { Config, User, ConfigKeyStoreEnum, config, LoaderService, UserService } from 'kng2-core';
import { App } from '@ionic/pro';
import { ToastController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profil',
  templateUrl: './profil.page.html',
  styleUrls: ['./profil.page.scss'],
})
export class ProfilPage implements OnInit {


  config: Config = config;
  server: string;
  isReady: boolean;
  user: User = new User();
  postalCodes = [];

  KIO2_SERVER: string = ConfigKeyStoreEnum[ConfigKeyStoreEnum.KIO2_SERVER];

  constructor(
    private $loader: LoaderService,
    private $router: Router,
    private toast: ToastController,
    private $user: UserService
  ) {
  }

  isPC(postal: string) {
    const lst = this.user.logistic.postalCode || [];
    return lst.indexOf(postal) !== -1;
  }

  isToggleAll() {
    const lst = this.user.logistic.postalCode || [];
    return lst.length;
  }

  ngOnInit() {
    this.$loader.ready().subscribe((loader) => {
      this.config = loader[0];
      Object.assign(this.user, loader[1]);
      this.isReady = true;
      //
      // config.shared.shipping.periphery
      this.postalCodes = this.config.shared.user.location.list || [];
    });

    this.$user.subscribe(user => Object.assign(this.user, user));
  }

  logout() {
    this.$user.logout().subscribe(() =>
      this.$router.navigateByUrl('/')
    );
  }

  save() {
    this.$user.save(this.user).subscribe(
      () => {
        this.toast.create({
          message: 'Enregistré',
          duration: 1000
        }).then(alert => alert.present());
      },
      error => {
        this.toast.create({
          message: error.error,
          duration: 3000
        }).then(alert => alert.present());

      }
    );
  }


  toggleAll() {
    const lst = this.user.logistic.postalCode || [];
    if (lst.length) {
      this.user.logistic.postalCode = [];
    } else {
      this.user.logistic.postalCode = this.postalCodes;
    }
    this.save();
  }

  togglePC(postal: string) {
    const lst = this.user.logistic.postalCode || [];
    const pos = lst.indexOf(postal);
    if (pos === -1) {
      lst.push(postal);
    } else {
      lst.splice(pos, 1);
    }
    this.user.logistic.postalCode = lst;
    this.save();
  }

}
