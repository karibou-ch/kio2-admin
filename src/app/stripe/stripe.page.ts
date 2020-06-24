import { Component, OnInit } from '@angular/core';
import { Config, UserService, User } from 'kng2-core';
import { EngineService } from '../services/engine.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastController } from '@ionic/angular';

import { version } from '../../../package.json';

@Component({
  selector: 'app-stripe',
  templateUrl: './stripe.page.html',
  styleUrls: ['./stripe.page.scss'],
})
export class StripePage implements OnInit {
  VERSION = version;

  user: User;
  config: Config;
  isValid: boolean;
  isOK: boolean;
  code: string;
  state: string;

  constructor(
    private $engine: EngineService,
    private $router: Router,
    private $route: ActivatedRoute,
    private $toast: ToastController,
    private $user: UserService
  ) {
    this.user = this.$engine.currentUser;
    this.config = this.$engine.currentConfig;

    //
    // mandatory params
    this.code = this.$route.snapshot.queryParamMap.get('code');
    this.state = this.$route.snapshot.queryParamMap.get('state');


    this.isValid = (!!this.code && !!this.state);
    this.isOK = this.user.connect_state;
  }

  ngOnInit() {
  }

  connect() {
    this.$user.connect(this.user.id, this.state, this.code).subscribe(() => {
    }, status => {
      this.$toast.create({
        message: status.error,
        duration: 3000,
        position: 'top',
        color: 'danger'
      }).then(alert => alert.present());

    });
  }

}
