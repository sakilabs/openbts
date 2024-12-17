# bts finder

Why it exists?
----

This project was initially made for private database of NetWorkS! (Polish company for managing infrastructure for Orange & T-Mobile), however with time I realized this project can be modular and handle all of the operators including Plus (Polkomtel) - including, Aero etc. and Play (P4).

How it works?
----

The project was made in Nuxt 3 and Leaflet on the frontend, while using Fastify on the backend with Drizzle ORM & PostgreSQL. Backend and frontend is optimized for the fastest access to the data:
 - Frontend on the initial load, after logging in, downloads initial list of all BTSes and saves them to IndexedDB.
 - MarkerCluster that is used with Leaflet, adds all of the markers on the map (depending on the size, but shouldn't take more than couple of hundreds of miliseconds) and combines them into groups (clusters).
 - Every other visit, loads the BTSes as markers from IndexedDB for the fastest access.
This project also includes lists, which user can create, add the interesting BTSes, then share the link with the list ID. Lists can be named with limit of >3 & <50 chars. The project at this moment is sign-up only but after cleaning it up could be with the switch in the admin panel. Frontend has some workarounds for "interactive" popups etc using Vue 3 functions.
Performance of it is actually pretty good. I can achieve ~2ms DB queries with Drizzle, and the rest is network - I'm getting ~60ms on each request to server that is behind Cloudflare and runs Nginx (with some perf tweaks).

Why open-source it?
----

Per first point, it could be used for greater good. There's a BTS finder for all of the operators in Poland called [BTSearch](https://beta.btsearch.pl) but it's abandoned - this project could change that, or some private personas could use it for their greater good. Possibilities are endless.

What's need to be done to achieve that?
----

- [ ] Remove exclusive support for NetWorkS!
- [ ] Add migrations for drizzle (drizzle-kit)
- [ ] Add an option to disable login-only mode
- [ ] Rework admin page & and make it more useful (edit stations etc.)
- [ ] Add an option to load stations only for visible boundaries (to not download all stations at start)
- [ ] Add an option to disable comments on station
- [ ] Make sidebar (details of specific station) more modular (e.g. for cells, LAC, eNBID etc.)
- [ ] Add support for UKE (Urząd Komunikacji Elektronicznej)'s data locations of stations
- [ ] Add support to see radiolines (with data from [here](https://bts.mserv.ovh/))
- [ ] Add docker support (Dockerfile & docker compose)

Stack
----

- [Nuxt 3](https://github.com/nuxt/nuxt)
  - [Nuxt UI 3](https://ui3.nuxt.dev/)
  - [Vite PWA](https://vite-pwa-org.netlify.app/)
  - and more...
- [Fastify 5](https://fastify.dev)
- [Leaflet](https://leafletjs.com/)
- [MarkerCluster for Leaflet (our fork)](https://github.com/sakilabs/Leaflet.markercluster)