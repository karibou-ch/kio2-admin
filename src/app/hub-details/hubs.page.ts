import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Config, Hub, HubService, LoaderService, User } from 'kng2-core';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'kio-hubs',
  templateUrl: './hubs.page.html',
  styleUrls: ['./hubs.page.scss'],
})
export class HubsPage implements OnInit {
  config: Config;
  user: User;
  hubs: Hub[] = [];
  isReady: boolean;

  constructor(
    private $router: Router,
    private $hub: HubService,
    private $loader: LoaderService,
    private $toast: ToastController
  ) {}

  ngOnInit() {
    const { config, user } = this.$loader.getLatestCoreData();
    this.config = config;
    this.user = user;
    this.hubs = (this.config.shared.hubs || []).slice();

    this.$hub.list().subscribe(hubs => {
      this.hubs = hubs.sort((a, b) => this.getHubName(a).localeCompare(this.getHubName(b), 'fr'));
      this.isReady = true;
    }, status => {
      this.isReady = true;
      this.notify((status.error || status.message || status), 'danger');
    });
  }

  openDetails(hub: Hub) {
    const slug = this.getHubSlug(hub);
    if (!slug) {
      return;
    }
    this.$router.navigate(['/hubs', slug]);
  }

  onCreateHub() {
    this.$router.navigate(['/hubs', 'create']);
  }

  getHubName(hub: Hub) {
    return hub && hub.name ? hub.name : this.getHubSlug(hub);
  }

  getHubSlug(hub: any) {
    if (!hub || !hub.slug) {
      return '';
    }
    return Array.isArray(hub.slug) ? hub.slug[0] : hub.slug;
  }

  private notify(message: string, color = 'dark') {
    this.$toast.create({
      message,
      duration: 3000,
      color
    }).then(alert => alert.present());
  }
}
