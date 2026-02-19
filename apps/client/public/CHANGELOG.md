Changelog is only provided in English language.
If you found some bugs or want us to add new feature, please do so via [our GitHub Tracker](https://github.com/sakilabs/openbts/issues/new) or send me an email [ririxi@sakilabs.com](mailto:ririxi@sakilabs.com)

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

Working on:

- Statistics page
- Sharing radioline
- Page with deleted records from `device-registry`, `radiolines` & `permits`
