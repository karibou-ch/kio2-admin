import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Sentry bundle size
// https://github.com/getsentry/sentry-javascript/issues/1552
import * as Sentry from '@sentry/angular-ivy';
import pkg from '../../../package.json';

//
// https://docs.sentry.io/platforms/javascript/angular/

//
// FIXME use chunk js module to load Sentry (50kb) only on demand
window['Sentry'] = window['Sentry'] || Sentry;
Sentry.init({
  dsn: 'https://aac321667b42442baa195e1eff100860@o9343.ingest.sentry.io/5268039',
  release: pkg.version,
  integrations: [new Sentry.Integrations.TryCatch({
    XMLHttpRequest: false,
  })],
});

@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ]
})
export class SentryModule {
  constructor() {}

  Sentry() {
    return Sentry;
  }
}
