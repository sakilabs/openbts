![OpenBTS banner](./.github/assets/banner.png)

<h1 align="center"><b>OpenBTS</b></h1>

**OpenBTS** is an improved map of BTSearch that includes aggregated data of Polish BT stations & UKE permits and radiolines.

**OpenBTS** is created by fantastic community in Poland.

## Features

- View stations on simple to use map
- See UKE (Urząd Komunikacji Elektronicznej) data in very simple view which is updated every 30 days
- Very powerful & public REST API
- Create private or public lists with your favorite stations
- Fast & beautiful interface

<sup>and much more...</sup>

## Getting started

todo.

---

### TODO

- [x] Remove exclusive support for NetWorkS!
- [x] Add migrations for drizzle (drizzle-kit)
  - [x] Add migration initialization in server startup
- [ ] Add an option to disable login-only mode
- [ ] Rework admin page & and make it more useful (edit stations etc.)
- [x] Add an option to load stations only for visible boundaries (to not download all stations at start)
- [ ] Add an option to disable comments on station
- [ ] Make sidebar (details of specific station) more modular (e.g. for cells, LAC, eNBID etc.)
- [ ] Add support for UKE (Urząd Komunikacji Elektronicznej)'s data locations of stations
- [ ] Add support to see radiolines (with data from [here](https://bts.mserv.ovh/))
- [ ] Add support for calculating the distance from the marker
- [x] Add docker support (Dockerfile & docker compose)
- [ ] Redesign frontend
  - [ ] Make left sidebar, with search options, sticky or on hover it slides onto screen
  - [ ] Map itself in the container with rounded corners
  - [ ] Use dark colors
  - [ ] Redesign the list UI (move it to left sidebar)
  - [ ] Allow searching via user's GPS in search bar instead of asking for it immediately on visit, or by typing address (could use openstreetmap service for that)
- [ ] Rewrite frontend to React/Next.js (no SSR)

### Stack

- [Fastify 5](https://fastify.dev/)
  - [Drizzle](https://orm.drizzle.team/)
  - [Better Auth](https://better-auth.com/)
- [Leaflet](https://leafletjs.com/)