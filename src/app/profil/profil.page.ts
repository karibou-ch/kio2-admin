import { Component, OnInit } from '@angular/core';
import { Config, User, ConfigKeyStoreEnum, config, LoaderService, UserService } from 'kng2-core';
import { App } from '@ionic/pro';
import { ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { EngineService } from '../services/engine.service';

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
    private $engine: EngineService,
    private $router: Router,
    private toast: ToastController,
    private $user: UserService
  ) {
    this.user = this.$engine.currentUser;
    this.config = this.$engine.currentConfig;
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
