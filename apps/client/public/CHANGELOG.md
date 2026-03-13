Changelog is only provided in English language.
If you found some bugs or want us to add new feature, please do so via [our GitHub Tracker](https://github.com/sakilabs/openbts/issues/new) or send me an email [ririxi@sakilabs.com](mailto:ririxi@sakilabs.com)

# 2026-03-13

### 🩹 Fixes

- Fixed horizontal scroll hook not working correctly with trackpad. Native horizontal swipes (`deltaX`) now pass through to the browser instead of being swallowed
- Fixed WCO sidebar on macOS overlapping the traffic light buttons. Sidebar now reserves a drag-region spacer matching the titlebar height
- Fixed region filter on `/admin/locations` having no effect; server was matching region codes against the `name` column instead of `code`

# 2026-03-12

### 🩹 Fixes

- Fixed `POST /search` crashing with a PostgreSQL error when searching by city or address - `SELECT DISTINCT` with a `word_similarity` `ORDER BY` is now correctly handled
- Fixed search results and autocomplete dropdown appearing behind map controls on the mapview

### 🚀 Enhancements

- Search results and autocomplete dropdown now float as a separate panel (matching the filter panel style) instead of being visually attached to the search input
- Result section headers now show a split-pill badge with the match count highlighted in the accent color

# 2026-03-11

### 🩹 Fixes

- Fixed map view search clear button on mobile being unclickable; tapping it no longer collapses the search instead of clearing it
- Fixed filters sheet on `/stations` auto-focusing the search input on open, which caused the autocomplete list to appear immediately
- Fixed stale `photos.length` closure in lightbox prev/next callbacks across multiple components

### 🚀 Enhancements

- UKE importer now uses the date from the imported file name as `createdAt` and `updatedAt` for permits and radiolines instead of the current timestamp

# 2026-03-10

### 🩹 Fixes

- Fixed `/stations` page discarding the `q` query parameter on load — navigating to `/stations?q=...` now correctly pre-fills and preserves the search query
- Fixed missing `takenAts`/`onTakenAtsChange` props on the photo upload section of the admin station create page
- Fixed searching via longcid/ecid/nci without explicit filter

### 🚀 Enhancements

- Added ability for submitters to select photos to the station from the already uploaded ones on `/submission`

# 2026-03-09

### 🩹 Fixes

- Fixed `operator_id` missing from submission payload when editing extra identificators on a station loaded from the station detail page, causing a validation error on `POST /submissions`

### 🚀 Enhancements

- User lists can now be renamed - use the new **Rename** option in the list's dropdown menu on `/lists` to edit the name and description
- Added two-factor authentication (TOTP) setup flow at `/account/two-factor`
- Sign-in now detects a pending 2FA challenge and routes directly to the TOTP verification step without a full page reload
- Admins can force TOTP on any user - users with **Force 2FA** enabled are blocked from the API with `403 TWO_FACTOR_REQUIRED` until 2FA is active; toggle is available on the admin user detail page
- API key management is now live on `/account/settings` (again) - create, view, and revoke personal API keys; rate-limit usage bar shows consumption per window
- Users can go passwordless. New **Remove password** option in Security settings removes your password once at least one passkey is registered
- `GET /account/api-keys` returns the authenticated user's API keys including per-key rate-limit usage (used / max / reset)
- `GET /account/password` returns whether the current user (or a target user for admins via `?userId=`) has a password-based credential
- `DELETE /account/password` removes the credential-based password; requires at least one passkey to be registered
- `POST /search`: city matching now uses PostgreSQL trigram similarity (`word_similarity`) scored and ordered, and also matches against the `address` column
- Added `address:` filter keyword for explicit address partial-match filtering on the map and stations page
- PWA (desktop): sidebar logo is hidden and the header becomes a native title-bar drag region when the Window Controls Overlay is active

# 2026-03-08

### 🩹 Fixes

- Deleting a submission now also deletes its attached photos and frees the files from disk
- "Add to List" popover now only shows lists owned by the current user, consistent with the `/lists` page
- Opening a station or UKE permit dialog while already on the list map view no longer shows a redundant "Show on Map" button
- Fixed UKE source popup on the list map view triggering an unnecessary internal location fetch
- Fixed location detail filter query so band, RAT and IoT filters are evaluated independently instead of requiring a single cell to match all at once
- Fixed backdrop blur on station dialog disappearing when switching to the `Comments` tab

### 🚀 Enhancements

- User lists are now limited to 10 per user
- Station popup list height increased so 4+ stations no longer trigger a scrollbar
- Station map popups now show a photo count button in the footer - click it to browse all photos at that location in a lightbox
- Audit log action filter is now a multi-select dropdown - pick any combination of actions to filter by instead of only one at a time
- **UKE locations can now be saved to user lists** - "Add to List" button now appears in UKE location popups on the map
- List map view source switcher is re-enabled - toggle between internal and UKE to see only your list's stations or UKE locations
- Cell editor tables now support horizontal mouse-wheel scrolling so all columns remain accessible on narrow screens
- Theme provider now automatically detects system theme changes when set to "System"
- Cells export endpoint rewritten to use explicit JOINs instead of correlated EXISTS subqueries, improving query performance
- Station comments now support up to 5 image attachments per comment
- Users can now delete their own comments in the station Comments tab

# 2026-03-07

### 🩹 Fixes

- Lightbox overlays in photo galleries no longer leave a small uncovered gap at the bottom of the screen

### 🚀 Enhancements

- Added **User Lists** - create and manage curated collections of stations and radiolines
  - Lists can be public or private; public lists are shareable via a link and have a dedicated map view at `/lists/$uuid`
  - Lists appear in the sidebar with collapsible quick-access navigation; create new lists directly from there
  - "Add to list" button now appears in station and radioline map popups
  - Admins can view and manage all user lists at `/admin/lists` (requires `enableUserLists` setting to be enabled)
- My Submissions page now uses virtualised rendering with paginated API fetching instead of loading all submissions at once
- Accepted submissions are now fully locked. Photos can no longer be edited or deleted once a submission is approved
- Admin station edit page now supports editing photo notes and taken-at dates, matching the locations page
- Photo cards on the station edit page now display the author, upload date, taken-at date and note, matching the locations page
- Page headers on `/admin/stations/$id` and `/admin/locations/$id` now blend into the page when at the top and gain a background and shadow when scrolled

# 2026-03-06

### 🩹 Fixes

- Fixed PWA app badge showing stale unread count after tapping a push notification
- Fixed notification mark-as-read optimistic update not decrementing badge correctly
- Rate-limited responses (HTTP 429) are no longer retried and now show a single toast notification

### 🚀 Enhancements

- Photos are now stored per **location** instead of per station - no more uploading the same photo to multiple stations at the same location
- Each station can independently select which location photos to display, with one marked as main
- Photos can be uploaded directly from the admin station edit page and are automatically assigned to that station; the first photo at a new location is auto-set as main
- Photo grids are now scrollable when there are many images
- Added a quick "Edit location" link inside the location picker on the station edit page
- Search on `/admin/locations` now uses API instead of being client-side
- Added region name to location's hover and popup

### 🏡 Chore

- Audit log updated to track `location_photos` actions
- Added missing i18n keys for photo selection UI

# 2026-03-05

### 🩹 Fixes

- Submission approval no longer updates `location_id` on station when it was not changed by submitter
- Fixed marking notification as read
- UKE importer now checks for bands with duplex `null` instead of selecting one with duplex
- `/stats` endpoint now returns the UKE permit update date correctly

### 🚀 Enhancements

- Renamed `NB-IoT` to just `IoT` in LTE since it's implemented like this, Orange: `LTE-M` & `NB-IoT`, T-Mobile: `NB-IoT`, Plus: `NB-IoT` and Play has no LPWAN. This just clarifies things.
- Resized Poland Bounds so you can see stations at Baltic Sea

# 2026-03-04

### 🩹 Fixes

- Some routes no longer re-throw the error, so the stack is kept

### 🚀 Enhancements

- Added photo gallery tab in station details dialog with lightbox viewer
- Added main photo panel shown alongside the station details dialog (desktop only)
- Added photo upload support in submissions; up to 5 photos per submission
- Added per-band station count bar charts on `/statistics`

# 2026-03-03

### 🩹 Fixes

- Fixed `MapCursorInfo` HUD overlapping the search/filter bar on narrower screens

### 🚀 Enhancements

- Added optional coverage circle around the measurement reference point (enable in preferences)
- Press `Space` while measuring to pin/save the current line & circle as a persistent snapshot on the map; multiple snapshots can be stacked
- Press `Escape` to clear all saved snapshots
- The HUD overlay (REF, Dist, Azm, TA) remains visible after pinning a measurement so you can still read the saved values
- Added two new map preferences: **Measure from any location** (right-click anywhere to set reference) and **Coverage circle** (draws a circle whose radius matches the measurement line)

# 2026-03-02

### 🩹 Fixes

- Locations now filter by station `updatedAt`/`createdAt`
- Stations in the popup are also being filtered by `new` filter right now
- `editor` role now has proper API rate limiting
- Fixed layout overflow issues on the submissions list on mobile
- Audit log detail sheet now takes full width on mobile
- Station detail header operator info is hidden on small screens to prevent overflow
- UKE permit dialog is now scrollable on small screens and uses `dvh` instead of `vh`
- Fixed `x-api-key` header not being read due to casing mismatch
- Fixed rate limit race condition with concurrent requests
- Fixed location filter query so band, RAT and IoT filters are evaluated independently instead of requiring a single cell to match all at once

### 🚀 Enhancements

- Made the stroke line for new markers a little wider
- Added chart with stations per operator on `/statistics` for internal db
- The "new" filter also works for radiolines now
- Various rendering optimizations - O(1) operator lookups, memoized date formatters, shared query options
- Station popup now opens immediately with basic data and updates in the background once station details are loaded
- Added in-app notification system with bell icon in the header
- Added push notifications support
- Users get notified when their submissions are approved or rejected
- Staff (admin/moderator/editor) get notified about new submissions
- Added "mark all read" and per-notification read tracking
- Added PWA app badge showing unread notification count (or pending submissions for staff)
- Added Wake Lock on the map view to prevent screen from turning off
- Added PWA share target to share coordinates from Google Maps, Apple Maps etc. to open them on the map
- Added PWA shortcuts for Map, Stations and My Submissions
- Replaced `next-themes` with a custom lightweight theme provider
- Switched service worker to `injectManifest` strategy with custom push notification handling
- Optimized `useClickOutside` and `useEscapeKey` hooks to use a single shared global listener instead of one per instance
- Daily UKE import job now runs at a consistent midnight UTC instead of drifting based on server start time
- Redis connection is now awaited before the server starts accepting requests

# 2026-02-28

### 🩹 Fixes

- Made expand button visible when announcement is truncated
- `/search` server route now takes sort option so the sorting will work on `/stations` page

### 🚀 Enhancements

- Made `uke-importer` import only new files
- Added reload prompt to clear cache etc.
- `0 MHz` band is now shown as `Unknown`
- Added tooltips to cell table headers that show the full name of e.g. `PCI`, `NCI`, `LongCID` etc
- Instead of the email, navbar now shows the username instead. To see your email, click on the `user` button

# 2026-02-27

### 🚀 Enhancements

- Added markers to the map (See `/preferences` page to switch between dots & markers)
- Added ability to add MNO names to `Plus` stations

# 2026-02-26

### 🚀 Enhancements

- Added support to add MNO name for `Plus` stations
- Added markers which are very similar to the dots

# 2026-02-26

### 🩹 Fixes

- Fixed some React Compiler stuff
- Fixed adding data to all CLF exports
- Fixed associating the stations with permits

### 🚀 Enhancements

- Redesigned radioline dialog
- Redesigned headers of station, UKE station & radioline dialogs
- Changed operator dots to rounded boxes
- Added option to enable tooltips for station "dots" in the preferences
- Added icons for all items on navbar
- Redesigned badges across whole app

# 2026-02-25

### 🩹 Fixes

- Autocomplete now properly parses filters that are unquoted
- UKE-Importer now uses regex to catch a date when it's provided as string

### 🚀 Enhancements

- History trends on `/statistics` has been redesigned to show all bands better etc.
- Added sheet with detailed information on what was removed on `/deleted-entries`
- Resized dots by 1px
- Search now also looks in city column by default
- Changed operator colors

# 2026-02-24

### 🩹 Fixes

- Properly show the numbers for total stations etc.

### 🚀 Enhancements

- You can now quickly add new station from existing UKE station by using `Create` button from the dialog
- Do not show the "radiolines" amount when its layer is disabled
- Add submissions cleanup option for admins
- Map can be opened in the fullscreen mode
- Added support for adding NetWorks ID & name & internal operator's name for T-Mobile & Orange
- Added announcement banner

# 2026-02-23

### 🩹 Fixes

- Fixed double `stations.update` audit log when creating new cell
- Fixed some UI bugs on mobile
- The station is now marked with status `active` when submission is approved
- Fixed focus on filter button
- The filters panel properly show the station count when search is used on `/station` & `/admin/stations`

### 🚀 Enhancements

- Added support for batch patching cells
- Added button in the dialogs to show the location on the main map
- Added `extra_address` to each station
- Added button for si2pem link
- Added submission/station link in the audit log sheet
- Changed how the `RedCap` & `NB-IoT` is shown in the cell table
- Removed "cells" and "added", "changed", "deleted" texts in cell tables on mobile
- Made user search work by name
- Used lazy loading for `recharts` components so they won't end up in initial bundle

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
