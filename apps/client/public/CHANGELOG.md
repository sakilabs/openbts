Changelog is only provided in English language.
If you found some bugs or want us to add new feature, please do so via [our GitHub Tracker](https://github.com/sakilabs/openbts/issues/new) or send me an email [ririxi@sakilabs.com](mailto:ririxi@sakilabs.com)

# 2026-02-23

### 🩹 Fixes

- Fixed double `stations.update` audit log when creating new cell
- Fixed some UI bugs on mobile
- The station is now marked with status `active` when submission is approved

### 🚀 Enhancements

- Added support for batch patching cells
- Added button in the dialogs to show the location on the main map
- Added `extra_address` to each station
- Added button for si2pem link
- Added submission/station link in the audit log sheet
- Changed how the `RedCap` & `NB-IoT` is shown in the cell table

# 2026-02-22

### 🩹 Fixes

- Removed `cid` & `clid` from the checking function to calculate `longCID` or `eCID`
- The "unauthorized" page is now displayed for users without the required role
- ARFCN -> UARFCN (UMTS)
- Properly show the table on `/admin/uke-permits`
- Fixed calculating the total stations on `/statistics` page

### 🚀 Enhancements

- Added checking for duplicated CID in GSM/UMTS
- Added checking for duplicated enBID + CLID in LTE
- Added `editor` role
- Calculate the speed of radiolines and show total speed
- Added more checks on the server for duplicates per operator etc
- Optimized `/uke/locations` even more
- Added support for searching via city

# 2026-02-21

### 🩹 Fixes

- Fixed calculating preview `eCID`, `LongCID` & `NCI` on `/submission`, `/admin/submissions/$id` & `/admin/stations/$id`
- Fixed adding or modifying GSM cells on `/submission` page by fixing the name of `e_gsm` property
- Fixed check for GSM1800 so you can select it again on `/submission` page

### 🚀 Enhancements

- When adding new cells to already existing set of cells, the new cell will inherit fields like `LAC`, `RNC`, `TAC`, `eNBID`, `NRTAC` & `gnBID`
- Added new `/statistics` page with all data from UKE & internal db
- Added ability to select a range of new stations (max. 30 days) by a slider
- Added a new page with orphaned UKE permits to see which stations still need to be added etc.
- Change the NTM format to match the old exports

### 🏡 Chore

- Added missing i18n keys to `en-US` language

# 2026-02-20

### 🩹 Fixes

- Fixed changing location on the admin page. It did not register any location change, even the existing one
- `PATCH /stations/$id` now deletes old location when it's orphaned (no stations at that location)
- `/stations`, `/admin/stations` and `/admin/locations` now properly refetches new data on each re-mount (after switching pages back and forth etc.)
- Notes field on each cell on `/submission` is now properly debounced which fixes lag while typing
- Making small changes (like adding notes etc.) on `/submission` is not a problem anymore since `unique` check on `submissions.proposed_cells` has been simplified from `submission_id`, `station_id`, `band_id`, `rat` to just `submission_id`, `target_cell_id`
- The table on `/stations`, `/admin/stations` & `/admin/locations` will no longer reset to page `1` when fetching more stations (after viewing ~80 records)
- Fixed showing XPIC radiolines in `tooltip`, `popup` & `dialog` (2 with diff polarization TX -> 2 RX)
- Fixed grouping FDD radiolines in the dialog
- Reject & Approve route of submissions now properly save old submission value(s)
- Fixed applying `new` status on new cells/permits

### 🚀 Enhancements

- Map saves your zoom and lat,lng in local storage. The state persists between pages reloads, switching pages etc.
- LocationPicker (on `/submission` and `/admin/stations/$id`, `/admin/submissions/$id`, `/admin/locations/$id`) does not automatically fill data from Nominatim after creating new location
- Added ability to remove existing location on `/admin/locations/$id`
- Orphaned locations are now included for admins, editors & moderators in LocationPicker and `/admin/locations`
- Added more checks on `POST /submissions` regarding changed station & location
- Added support for NR Type (NSA, SA) everywhere
- Added support for sharing radiolines (opens the dialog)
- Added page with deleted records from `device-registry`, `radiolines` & `permits`
- Admin on `/admin/stations/$id` when adding new cell(s) will have it automatically confirmed
- Added more audit logging to `POST /submissions/$id/approve`
- **Added PWA support**

### 🏡 Chore

- Changes to existing components to satisfy React Compiler rules
- Removed `ml-1` from cellTable's cells count (station dialog)

# 2026-02-19

### 🩹 Fixes

- Made `gnBID` optional on `/submission` page
- Fixed checking the `existingLocation` on the server on submission submit
- Fixed sending `details` object in the cells on admin station edit page
- Fixed overlapping radiolines tooltip hovers by unmouting the container on `onMouseLeave`
- Fixed setting `operator` on admin station edit page

### 🚀 Enhancements

- Added ability to see new cells or permits in the last 30 days
- Added support for PCI in LTE
- Redesigned radiolines tooltip and popup
- Properly started to identify and group radiolines (XPIC, FDD, FDD 2+0)
- Added antenna height from `device-registry` in sectors
- Added a check for any changes on admin station edit page

### 🏡 Chore

- Made (tried to make) the `/uke/locations` route faster (or so I think...)
- Refactored some functions there and there
