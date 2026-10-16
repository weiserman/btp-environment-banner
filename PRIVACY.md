# Privacy policy

_Environment Banner for BTP – last updated 16 October 2026_

**Short version: the extension collects nothing and sends nothing anywhere.**

## What the extension does with data

| Data | Used for | Where it goes |
|------|----------|---------------|
| The address (URL) of BTP pages you open (`*.cloud.sap`, `*.ondemand.com`) | Compared, inside your browser, against your own rules to decide which banner to show | Nowhere. It is not stored or transmitted. |
| The rules you create (label, description, colour, URL match text such as a subaccount ID or hostname) | Showing the banner and badge | Saved with `chrome.storage.sync` in your browser. If you have browser sync turned on, your browser vendor (Google or Microsoft) syncs it between your own devices, as it does for other extension settings. |
| Rules files you export or import | Backup and sharing, only when you click Export or Import | A local file you choose. |

## What the extension does not do

- It makes **no network requests**. There are no servers, APIs, analytics, telemetry, crash reporting or ads.
- It does **not read page content**, form fields, cookies, tokens or credentials.
- It does **not run on any site** other than `*.cloud.sap` and `*.ondemand.com`.
- It does not load or run remote code. All code is in the published package and in this repository.
- It does not sell, share or transfer any data, because it has none.

## Removing your data

Uninstalling the extension deletes its stored rules. You can also delete them at any time on the settings page with **Delete all**.

## Contact

Questions: open an issue at <https://github.com/weiserman/btp-environment-banner/issues>. Security issues: see [SECURITY.md](SECURITY.md).
