import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Sentry bundle size
// https://github.com/getsentry/sentry-javascript/issues/1552
import * as Sentry from '@sentry/angular-ivy';
import pkgInfo from '../../../package.json';
import { AnalyticsService } from 'kng2-core';


//
// FIXME use chunk js module to load Sentry (50kb) only on demand
window['Sentry'] = window['Sentry'] || Sentry;
Sentry.init({
  dsn: 'https://aac321667b42442baa195e1eff100860@o9343.ingest.sentry.io/5268039',

  integrations: [
    // Registers and configures the Tracing integration,
    // which automatically instruments your application to monitor its
    // performance, including custom Angular routing instrumentation
    new Sentry.BrowserTracing({
      routingInstrumentation: Sentry.routingInstrumentation,
    }),
    // Registers the Replay integration,
    // which automatically captures Session Replays
    new Sentry.Replay(),
  ],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 0.7,

  // Usefull for CORS api 
  // Set `tracePropagationTargets` to control for which URLs distributed tracing should be enabled
  tracePropagationTargets: [/^https:\/\/admin.karibou/],

  // Capture Replay for 10% of all sessions,
  // plus for 100% of sessions with an error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  release: pkgInfo.version
});

//
// attach  handler for nginx 
Sentry.setTag("k-debug", AnalyticsService.FBP);

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
