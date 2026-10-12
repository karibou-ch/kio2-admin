# GET `/api/v1/orders` : status 0 « Unknown Error »

Dossier de contexte pour l’issue Sentry [KIO-ADMIN-V3-DM](https://evaletolab.sentry.io/issues/KIO-ADMIN-V3-DM). Ce document ne tranche pas la cause. Il rassemble l’historique, le chemin de code actuel, et ce qu’il faut mesurer pour départager les hypothèses.

## État au 12 octobre 2026

| | |
|---|---|
| Message | `Http failure response for https://admin.karibou.ch/api/v1/orders: 0 Unknown Error` |
| Projet | `kio-admin-v3` (org Sentry `evaletolab`) |
| Première occurrence groupée | 15 novembre 2024 |
| Dernière occurrence | 11 octobre 2026, 15:59 UTC |
| Volume | 159 événements |
| Statut | unresolved, ongoing |
| Dernier événement | Chrome 153, Ubuntu, Lausanne, release `7.0.48`, transaction `/orders`, trace `pageload` (status `unknown`) |
| Stack | aucune |
| Breadcrumbs | aucun sur le dernier événement |
| Utilisateur Sentry | `anonymous@k.ch` — voir plus bas, ce chiffre « 1 user » n’est pas une preuve |

La fenêtre d’exploration Sentry des 90 derniers jours ne contient que l’événement du 11 octobre 2026. Les 158 autres restent dans le compteur de l’issue, hors détail individuel consultable ici. On ne peut donc pas encore dire que le débit a chuté.

## Ce que signifie le status 0

Dans Angular 12.2 (`HttpXhrBackend`), le callback `onError` du `XMLHttpRequest` construit :

```text
status: xhr.status || 0
statusText: xhr.statusText || 'Unknown Error'
url: xhr.responseURL || req.url
```

`onError` est le chemin réseau : le navigateur n’a pas de status HTTP à donner. Un 502, un 504 ou un 401 arriveraient avec ce status. Le status 0 couvre notamment :

- connexion refusée, reset (`ECONNRESET` vu par le client), DNS, TLS ;
- requête annulée (navigation qui décharge le document, `xhr.abort()`, discard d’onglet) ;
- échec CORS (réponse opaque, souvent status 0) ;
- service worker qui échoue le `fetch` sans produire de `Response` ;
- socket keep-alive déjà fermé par le proxy, réutilisé par le navigateur.

Deux limites du message actuel, vérifiées dans le source Angular 12.2.17 :

1. `xhr.responseURL` est vide quand aucune réponse n’est arrivée. Le fallback est `req.url`, **sans** la query string (`req.urlWithParams` est utilisé pour `xhr.open`, pas pour le message d’erreur). Le message Sentry ne dit donc pas si l’appel portait `payment=authorized&padding=true` ou les filtres facture.
2. `HttpErrorResponse` en Angular 12 implémente `Error` sans en hériter. `Kio2AdminErrorHandler.extractError` retombe sur `error.message`, une **chaîne**. `captureException` d’une chaîne n’a pas de stack. L’absence de stack ne veut pas dire que le site d’appel est inconnu : le handler efface la pile.

## Pourquoi « 1 utilisateur » est un artefact

`Kio2AdminErrorHandler` fait `Sentry.setUser({ email: window['sentry.id'] || 'anonymous@k.ch' })`. Rien dans ce dépôt n’assigne `window['sentry.id']`. Tous les événements de production se regroupent sur `anonymous@k.ch`.

Le tag `k-debug` (ex. `fb.1.<timestamp>.<random>`, aussi envoyé en header `k-dbg` et stocké dans `localStorage` sous `meta-fbp`) identifie un navigateur, pas une personne. C’est le bon identifiant pour recouper les access logs nginx. Le commentaire dans `sentry.module.ts` dit déjà « attach handler for nginx ».

## Dépôts fouillés

| Dépôt | Accès | Résultat utile |
|---|---|---|
| [karibou-ch/kio2-admin](https://github.com/karibou-ch/kio2-admin) | clone local, 462 commits depuis le 26 juin 2017, 13 issues, 39 PR | historique principal |
| [karibou-ch/kng2-core](https://github.com/karibou-ch/kng2-core) | clone, 30 issues, 45 PR | client HTTP des commandes |
| [karibou-ch/karibou-seed](https://github.com/karibou-ch/karibou-seed) | historique git | même bascule same-origin, côté boutique |
| [karibou-ch/kio2-client](https://github.com/karibou-ch/kio2-client) | 0 issue | rien |
| `karibou-ch/karibou-api` | **introuvable** avec les droits de ce run (`Could not resolve to a Repository`) | le serveur de `/api/v1/orders` n’a pas pu être lu |

Recherche de messages de commit `Unknown Error`, `timeout`, `nginx`, `keep-alive`, `status 0`, `interceptor`, `proxy` dans kio2-admin : aucun commit ne porte ces mots. Les changements existent, sous d’autres messages (`manage errors and network`, `remove CORS`, `bypass serviceworker`). Les issues GitHub fermées « parce que c’était corrigé » ne sont pas un lot d’issues titrées Unknown Error : le tracker public n’en contient pas. Ce qui a été clos, ce sont des correctifs partiels (commits et une issue CORS laissée ouverte avec le label `done`).

## Chronologie

### 2017 — le client tombe quand l’API ne répond pas

- 27 avril 2017, [kng2-core#2](https://github.com/karibou-ch/kng2-core/issues/2) « faire fonctionner karibou-admin avec karibu-api », fermée le 19 mai 2017. Premier branchement admin ↔ API.
- 8–21 juin 2017, [kng2-core#13](https://github.com/karibou-ch/kng2-core/pull/13) puis [kng2-core#16](https://github.com/karibou-ch/kng2-core/pull/16) : `OrderService.findAllOrders`.
- 26 juin 2017, premier commit de kio2-admin (`a4f5655`).
- 26 juin 2017, [kng2-core#20](https://github.com/karibou-ch/kng2-core/issues/20) **toujours ouverte** : « lorsque l'API n'est pas disponible, le client plante grave ». Le message d’alors est `You provided an invalid object where a stream was expected`, pas le status 0. Même famille : une erreur HTTP non absorbée casse l’écran. Aucun commentaire, aucun correctif référencé sur l’issue.
- 27 juin 2017, [kng2-core#22](https://github.com/karibou-ch/kng2-core/pull/22) « Dg error handling », mergée. Le diff porte sur le header / le module, pas sur un retry du GET commandes.
- 11 septembre 2017, [kio2-admin#9](https://github.com/karibou-ch/kio2-admin/issues/9) « implémenter UX des commandes », toujours ouverte. Sujet produit, pas le status 0.

### 2020-06 — CORS, puis same-origin

Jusque-là la prod pointait vers un autre hôte.

- 3 juin 2020, [a953cd3](https://github.com/karibou-ch/kio2-admin/commit/a953cd37a5aaa4b2212509af43872f14d5e73728) : `environment.prod.ts` passe de `API_SERVER: 'http://api.karibou.ch'` à `API_SERVER: false`.
- 8 juin 2020, [f023164](https://github.com/karibou-ch/kio2-admin/commit/f0231646851f17959149329a319df91f52dce4f4) « new: manage errors and network » :
  - premier `Kio2AdminErrorHandler` et premier init Sentry ;
  - `TryCatch` avec `XMLHttpRequest: false` (le SDK ne trace pas les XHR) ;
  - **les status 0 sont avalés** : si `error.statusText === 'Unknown Error'` ou `error.rejection.status === 0`, le handler pose `window.API_ISSUE = true` et `return` **sans** `captureException` ;
  - toast réseau Cordova toutes les 5 s (`Network.type === 'none'`).
- 11 juin 2020, [kio2-admin#26](https://github.com/karibou-ch/kio2-admin/issues/26) « CORS issue », **toujours ouverte**, labels `bug` + `done`. Le corps décrit un preflight bloqué sur `http://api.admin.beta.karibou.ch/v1/orders/.../collect` depuis `http://admin.beta.karibou.ch`. Le preflight de `admin.karibou.ch` est indiqué comme OK. Aucun commentaire de clôture. Le label `done` est le « on pensait que c’était réglé ».
- 12 juin 2020, [kng2-core 1539e0d4](https://github.com/karibou-ch/kng2-core/commit/1539e0d42a210ba33eb2ec0392dc4aaf37ee8105) « chg: remove CORS for default server » : l’URL par défaut passe de `//api.` + hostname à `//` + hostname + `/api`.
- 12 juin 2020, [kng2-core 2da06476](https://github.com/karibou-ch/kng2-core/commit/2da0647618abc733a29310c2a2b6867ed2e38369) « new: add retry(3) with a delay » : `retryWhen(delay 1s, take 3)` sur `updateItem` (POST `/v1/orders/:oid/items`), pas sur `findAllOrders`.
- 12 juin 2020, [karibou-seed c281b4a](https://github.com/karibou-ch/karibou-seed/commit/c281b4a36c599526479aa8ecf281cc0c17f722f5) « fix: cors issue by using proxy » : la boutique passe de `https://api.karibou.ch` à `https://karibou.ch/api`. Même idée, autre app. Le commit ne contient pas de fichier nginx : il change seulement `API_SERVER`.

Pourquoi c’est partiel : le preflight beta et l’hôte `api.*` sont contournés en same-origin. Le GET liste, lui, peut encore mourir sans status HTTP. Et pendant trois ans le handler **cache** ces morts à Sentry, ce qui permet de croire le problème disparu.

### 2020-08 — le retry est retiré, la PWA arrive

- 25 août 2020, [kng2-core 5984eab6](https://github.com/karibou-ch/kng2-core/commit/5984eab65fa6b1999d19f7848c1a8124830682f6) « new: remove bugs for v3 ». Le retry de `updateItem` est commenté, avec le FIXME encore présent : `retryWhen dont throw Error after the 3`. `take(3)` complétait le flux en succès vide au lieu de repropager l’erreur. Le retry n’a jamais couvert `findAllOrders`.
- 11 août 2020, [08d6196](https://github.com/karibou-ch/kio2-admin/commit/08d61965f6056c8234ae307e96f161d180901959) puis 3 septembre 2020, [PR #28](https://github.com/karibou-ch/kio2-admin/pull/28) / [a962d90](https://github.com/karibou-ch/kio2-admin/commit/a962d90f9cab8d12a112f6eb045568bba62dcf34) : service worker Angular. `ngsw-config.json` ne déclare pas de `dataGroups` (le SW ne met pas en cache les réponses API). Il met en cache le shell (`/*.js`, `/*.css`, `index.html`).
- 3 septembre 2020, [ed21750](https://github.com/karibou-ch/kio2-admin/commit/ed21750cdfb402dea3e5f0af83ddfa06533779b8) (doublon [6b8a5ab](https://github.com/karibou-ch/kio2-admin/commit/6b8a5aba0993197ffafb18ca6b81ecdbdaa0f343)) : rechargement des commandes toutes les 10 minutes. **Ce polling est toujours là** (`orders.page.ts`, `orders-collect.page.ts`).

### 2022-09 — le service worker est écarté des appels API

15 septembre 2022, [kng2-core c7337b23](https://github.com/karibou-ch/kng2-core/commit/c7337b2374f9d40bb49fa01d1f287d66a01bb2dc) « fix: bypass serviceworker on api requests ». Tous les services HTTP, dont `OrderService`, envoient `ngsw-bypass: true`. Angular SW ignore ces requêtes. L’en-tête est toujours posé, avec `k-dbg`, `Cache-Control: no-cache`, `Pragma: no-cache`, `Content-Type: application/json`, et `withCredentials: true`.

Pourquoi c’est partiel : un SW **déjà actif** qui n’a pas encore ce header, ou un SW qui casse pendant une mise à jour, peut encore produire un status 0. Après 2022 le chemin nominal ne passe plus par le cache SW. L’erreur continue en 2026, donc le bypass n’a pas suffi.

### 2023-10 — le filtre qui cachait le status 0 disparaît

4 octobre 2023, [88c10aa](https://github.com/karibou-ch/kio2-admin/commit/88c10aa6c2af14b11599b8542edb3d5a9159c7fb) « new: initial migration for angular-12 », livré par [PR #52](https://github.com/karibou-ch/kio2-admin/pull/52) (mergée le 13 novembre 2023). La migration **supprime** le `return` sur `Unknown Error` / status 0. À partir de ce build, le handler envoie la chaîne à Sentry. Le fichier orphelin `fix.order.service-v1.js` (monkey-patch de `updateItem`, ajouté le 22 avril 2020 dans `c24489c`, jamais référencé par `index.html`) est supprimé dans le même commit. Il ne touchait pas `findAllOrders`.

L’issue Sentry actuelle démarre le 15 novembre 2024, un an après le merge. Entre octobre 2023 et novembre 2024, soit le build n’était pas encore celui qui capture, soit les événements ont été regroupés ailleurs / purgés. Le code de 2020–2023 explique surtout une longue période **sans** trace Sentry, pas l’absence du bug.

### 2025–2026 — corrélation nginx, session longue, SW moins agressif

- 14 mars 2025, [12d46f9](https://github.com/karibou-ch/kio2-admin/commit/12d46f982a0ec0defb6ce8805c9aeea1a3b384de) : Sentry 7, `BrowserTracing` (`tracesSampleRate: 0.7`), Replay, `tracePropagationTargets: [/^https:\/\/admin.karibou/]`, tag `k-debug`. Le commentaire dit « Usefull for CORS api ». Le `TryCatch` qui désactivait les XHR est retiré. Sentry reste importé **au moment de la première erreur** (`import('./sentry/sentry.module')` dans le handler). Le SDK démarre donc trop tard pour avoir les breadcrumbs d’avant l’échec. Ça correspond au dernier événement : trace `pageload` créée à l’init, zéro breadcrumb.
- 28 juin 2025, [kng2-core 4e7faa83](https://github.com/karibou-ch/kng2-core/commit/4e7faa830402737eaea930fe9443368aa315c71f) : si `API_SERVER` est faux, l’URL devient `https://` + hostname + `/api` (avant : protocole relatif `//`). En prod HTTPS ça ne change pas l’origine. `API_SERVER: false` est toujours la valeur de `environment.prod.ts`.
- 31 décembre 2025, [02dbaef](https://github.com/karibou-ch/kio2-admin/commit/02dbaef5aecae8eacc50bc212de17d1b68224443) : reload proposé après 12 h d’onglet ouvert. Le correctif traite la session longue, pas le GET qui meurt.
- 31 décembre 2025, [b30519c](https://github.com/karibou-ch/kio2-admin/commit/b30519cb69db0802fce8689d12642f47edaecabf) : `ngsw` `installMode` de `prefetch` à `lazy`. Toujours aucun `dataGroups`.

`ConfigService.get` (`/v1/config`) a, lui, un `retryWhen` (3 essais, 1 s). `findAllOrders` n’en a pas.

## Chemin client actuel

Prod : `API_SERVER === false` → `UserService` force `https://<hostname>/api`. Depuis `https://admin.karibou.ch` l’URL est same-origin : `https://admin.karibou.ch/api/v1/orders`. Un preflight CORS n’est pas exigé pour une requête same-origin, même avec les headers custom. Ça confirme le constat du propriétaire **pour l’URL nominale**. Un reverse-proxy qui **redirige** vers un autre hôte (`api.karibou.ch`) recréerait un échec opaque en status 0. Rien dans les dépôts publics ne montre la config nginx.

### Qui appelle exactement cette URL

Le message Sentry est `/api/v1/orders` sans segment supplémentaire. Donc :

- oui : `OrderService.findAllOrders` → `GET /v1/orders` ;
- non : `findOrdersByShop` (`/v1/orders/shops`), `findOrdersByUser`, collect, capture, refund.

`EngineService.findAllOrders` choisit la source ainsi : s’il y a `user.shops.length`, il appelle `findOrdersByShop`. Le status 0 de cette issue est le GET admin / logistique **sans** boutique, ou l’appel direct facture.

Paramètres construits dans `EngineService.findAllOrders` :

- `month`, `year` du jour de livraison courant ;
- si le filtre ouvert est actif (`payment: 'authorized'`) : `padding=true` ;
- archives : `fulfillments=fulfilled,partial` à la place du filtre paiement.

Appelants :

| Lieu | Déclencheur |
|---|---|
| `orders.page.ts` `ngAfterViewInit` | un GET immédiat, puis `interval` 10 min |
| `orders-collect.page.ts` `ngOnInit` | un GET immédiat, puis `interval` 10 min |
| `shopper.page.ts` `ngOnInit` | un GET, pas de polling |
| `products.page.ts` `ngOnInit` | un GET, puis écoute `selectedOrders$` |
| `invoice.page.ts` `doLoadInvoices` | `OrderService.findAllOrders` direct (`fulfillments=fulfilled`, `payment=invoice\|invoice_paid`, `closed=false`), sans passer par le subject |
| `EngineService.refresh` / `selectOrderArchives` | relance le même GET |

`ngOnDestroy` des pages orders / collect ne désabonne que l’`interval`. Il ne désabonne pas `selectedOrders$`, et `findAllOrders` ne garde pas la subscription HTTP : un second appel ne cancel pas le premier. La navigation interne Ionic ne fait pas `xhr.abort()` sur ce GET. Un `document.location.reload` le fait.

Reloads qui peuvent couper un GET en vol :

- nouvelle version SW : `alert` puis `activateUpdate` + `location.reload`, filet à 4 s (`app.component.ts`) ;
- chunk lazy manquant : vidage `caches` + reload (`app.module.ts`) ;
- échec de `LoaderService.update()` : reload à 8 s ;
- dialogue « session expirée » après 12 h.

### Comment l’erreur atteint Sentry

1. Le XHR échoue, status 0.
2. `TokenInterceptor` ne traite que le 401, puis rethrow.
3. Le subscriber d’erreur de `EngineService.findAllOrders` fait `selectedOrders$.error(error)`.
4. `ReplaySubject` passe en état stoppé. Les `next` suivants sont ignorés : **un seul status 0 coupe la publication des commandes jusqu’au reload**, même si le GET suivant réussit.
5. Les pages font `selectedOrders$.subscribe(onInitOrders)` **sans** callback d’erreur. RxJS 6 signale ça via `setTimeout(() => { throw err })`, repris par `ErrorHandler`.
6. Chaque page encore abonnée peut émettre **un événement Sentry par échec HTTP**. 159 événements peuvent compter plusieurs fois le même GET.
7. Le handler capture la chaîne du message, en lazy-load Sentry.

La facture n’utilise pas le subject : un status 0 là part quand même dans l’`ErrorHandler` parce que le `subscribe` n’a pas de callback d’erreur. Le message est le même URL sans query, donc on ne distingue pas facture et liste du mois.

### Côté serveur, ce qu’on peut dire sans le dépôt API

Les commentaires de `kng2-core/src/order/order.service.ts` décrivent une API Express du type `app.get` liste et `app.post('/v1/orders/...')` avec `auth.ensureAdmin`, `queued(...)`, `orders.list`. Le corps de `orders.list`, les index, et les timeouts nginx / Node ne sont pas dans les dépôts accessibles. Aucun `proxy.conf`, aucun `nginx.conf`, aucun `keepalive_timeout` dans kio2-admin, kng2-core ou karibou-seed.

Le header `k-dbg` est le point de jointure prévu avec les logs nginx. Il est posé côté client et copié dans le tag Sentry `k-debug`. Sans durée ni query keys dans l’événement, la jointure ne dit pas encore si nginx a vu la requête.

## Causes encore plausibles

Classement pour **le status 0 du GET liste**, pas pour l’écran cassé qui suit.

### 1. Requête longue, ou socket mort, coupé sans status HTTP — forte

Indices pour :

- le GET charge un mois (`month`, `year`) avec `padding=true` sur les commandes ouvertes ;
- aucun timeout RxJS, aucun retry sur ce GET (le retry de 2020 était un POST item, puis il a été retiré) ;
- polling 10 min sur orders **et** collect, plus un GET à chaque entrée de shopper / products : requêtes qui se chevauchent ;
- un proxy qui reset (timeout, `proxy_read_timeout`, keep-alive plus court que l’idle du navigateur) se voit en status 0, alors qu’un 504 propre se verrait 504 ;
- l’app reste ouverte des heures (d’où le garde-fou 12 h) : cas classique de keep-alive périmé sur le premier GET après idle, et le polling à 10 min est plus long qu’un `keepalive_timeout` nginx typique (60–75 s) ;
- same-origin depuis juin 2020, et l’erreur est encore là en octobre 2026.

Indices contre, ou pas encore mesurés :

- le dernier événement est un Chrome desktop à Lausanne pendant la transaction `/orders`, pas un téléphone en veille ;
- on n’a pas la durée. Un échec à 40 ms et un échec à 60 s sont le même message aujourd’hui ;
- `karibou-api` et la conf nginx n’ont pas été lus.

### 2. Annulation du document (reload, veille, discard) pendant le GET — forte, autre population

Indices pour :

- plusieurs `location.reload` forcés (SW, chunk, loader, session 12 h) ;
- `document.wasDiscarded` et `visibilityState` ne sont pas envoyés ;
- le XHR du service n’est pas lié au cycle de vie de la page : seule la décharge du document l’annule. La navigation interne n’explique donc pas le status 0 à elle seule.

Indices contre pour le dernier événement :

- Ubuntu Chrome 153, transaction `/orders`. Ça ressemble à un échec sur l’écran commandes d’un poste fixe, pas à une tablette mise en veille. L’historique complet des OS n’est plus dans la fenêtre 90 jours (l’API de tags ne renvoie que cet événement).

Un échec &lt; 1 s avec `visibilityState=hidden` ou `wasDiscarded=true` irait ici. Un échec &gt; 30 s avec l’onglet visible et `onLine=true` irait plutôt en (1).

### 3. Service worker — faible sur le chemin nominal, pas éliminé pendant les updates

Indices pour :

- PWA depuis septembre 2020 ;
- un SW qui contrôle la page peut faire échouer un `fetch` en status 0 ;
- le passage `prefetch` → `lazy` (décembre 2025) change le moment où le SW s’installe, pas le GET.

Indices contre :

- pas de `dataGroups` dans `ngsw-config.json` (2020 et aujourd’hui) ;
- `ngsw-bypass: true` depuis septembre 2022, toujours présent ;
- l’erreur continue plus de quatre ans après le bypass, donc le SW n’est pas l’unique cause.

À mesurer : tag `net.sw=controlled|none` au moment de l’échec.

### 4. CORS résiduel — faible en nominal, historique fort

Indices pour (passé) :

- [kio2-admin#26](https://github.com/karibou-ch/kio2-admin/issues/26), label `done`, issue toujours ouverte ;
- avant le 3 juin 2020 la prod appelait `http://api.karibou.ch` ;
- les headers custom (`k-dbg`, `ngsw-bypass`, `Content-Type: application/json`) rendraient un **autre** hôte non simple : preflight, et status 0 si l’origine n’est pas renvoyée.

Indices contre (présent) :

- URL de l’événement : `https://admin.karibou.ch/api/v1/orders`, même origine que la page ;
- le propriétaire indique que le cross-origin n’est plus en jeu.

Reste à écarter : une redirection 30x vers un autre hôte. `responseURL` serait vide en status 0, donc l’événement ne le montre pas. Les access logs (`k-dbg`) le montreraient.

### 5. Taille de payload — possible, sans mesure

Un mois de commandes avec `padding` peut être lourd. Une coupure au milieu du body est aussi un status 0 (ou une erreur de parse si le status 200 est déjà arrivé : ce serait un autre message, `Http failure during parsing`). Tant que la durée et le `Content-Length` nginx ne sont pas corrélés, cette cause reste derrière (1).

### 6. Amplificateur, pas la cause du status 0 : `selectedOrders$.error`

Dès qu’un GET échoue, le `ReplaySubject` est mort et chaque subscriber sans handler d’erreur remonte dans Sentry. Ça explique un écran commandes bloqué après un blip, et des événements en double. Ce n’est pas ce qui met `xhr.status` à 0. Le correctif de ce subject serait un autre changement, à faire une fois la cause réseau identifiée, pour ne pas rejouer un « c’est corrigé » sur le symptôme UI.

## Plan de diagnostic

Le but est qu’un prochain événement de KIO-ADMIN-V3-DM porte de quoi choisir entre (1), (2) et (3) sans redéployer l’hypothèse.

### Déjà ajouté dans cette PR (client)

Sur un `HttpErrorResponse` status 0, l’intercepteur attache un contexte (clés de query seulement, pas les valeurs) :

- `elapsedMs` et tag `http.elapsed_bucket` : `<1s`, `1-10s`, `10-30s`, `30-60s`, `60-120s`, `>120s` ;
- `online` au début et à l’échec, tag `net.online_changed` ;
- `visibilityState` début / fin, tag `net.visibility` ;
- `document.wasDiscarded`, tag `net.discarded` si vrai ;
- service worker contrôlant la page, tag `net.sw` ;
- `effectiveType` (API Network Information, Chrome) ;
- `pathname` et **noms** des query params (`month`, `year`, `payment`, `padding`, `fulfillments`, `closed`, …).

Lecture :

| Observation | Lecture |
|---|---|
| bucket `30-60s` ou `60-120s`, onglet visible, online stable, sw `none` | timeout proxy ou reset après travail serveur. Aller voir nginx / Node pour ce `k-debug`. |
| bucket `<1s`, online stable, visible, sw `controlled` | SW ou abort immédiat / socket mort. |
| bucket `<1s`, `net.online=false` ou `online_changed=true` | perte réseau. |
| `net.visibility=hidden` ou `net.discarded=true` | veille, discard, ou page cachée. |
| `queryKeys` contient `payment` + `padding` | liste logistique du mois. |
| `queryKeys` contient `fulfillments` / `closed` | factures, autre requête, même URL. |

Limite : Sentry est toujours initialisé dans le handler, au premier échec. Les breadcrumbs d’avant l’erreur manqueront encore. Le contexte ci-dessus est pris **dans l’intercepteur au moment du fail**, donc il ne dépend pas des breadcrumbs.

### À faire ensuite, hors de ce PR

1. **Logs nginx / API** pour le header `k-dbg` égal au tag `k-debug` de l’événement. Noter : status en amont, durée, bytes envoyés, upstream (`proxy_read_timeout`, `keepalive_timeout`, `send_timeout`), et si la ligne existe. Absence de ligne = le navigateur a abandonné avant que nginx accepte, ou un autre hop a reset. Présence d’un 499 / reset upstream = cause (1) confirmée.
2. **Lire `karibou-api`** (`orders.list`) : durée des requêtes mois+padding, index, timeout HTTP du serveur. Le dépôt n’était pas accessible ici.
3. **Initialiser Sentry au boot** (ou un buffer maison de 20 breadcrumbs : navigation, online/offline, `visibilitychange`, début/fin de `findAllOrders`) pour voir le reload SW juste avant le status 0. Aujourd’hui l’import lazy explique l’absence de breadcrumbs.
4. **Ne plus grouper tout le monde sur `anonymous@k.ch`.** Utiliser `k-debug` comme `Sentry.setUser({ id })` sans email, pour que `userCount` redevienne un nombre de navigateurs.
5. Une fois les buckets lus sur ~20 événements : si la masse est `>30s` + visible, traiter le timeout upstream et le volume du GET mois. Si la masse est `<1s` + hidden/discarded, traiter l’abort et ne pas retry en boucle. Si la masse est `sw=controlled` + `<1s`, isoler une session sans SW.
6. Seulement ensuite, décider d’un retry **sur le GET liste** (le précédent retry ne le couvrait pas, et avalait l’erreur) et de remplacer `selectedOrders$.error` par un canal d’erreur qui ne tue pas le subject.

## Ce que cette PR ne prétend pas

Aucun correctif du status 0. Le same-origin, le bypass SW, le retry sur `updateItem`, et le filtre Sentry de 2020 ont chacun traité une couche. Le GET `/api/v1/orders` peut encore se terminer sans réponse HTTP, et c’est cette réponse absente que Sentry enregistre depuis que le filtre a été retiré.
