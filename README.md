# Environment Banner for SAP BTP

A Chrome and Microsoft Edge extension that shows a coloured **DEV / TEST / PRD banner** at the top of SAP BTP
apps and a matching **toolbar badge**, so you always know which environment you are working in.

Many BTP pages, such as the Mobile Services cockpit or the BTP cockpit, look identical in every environment;
only a GUID in the URL differs. This extension makes the difference obvious.

- Runs locally. **No data collection, no network requests**, no analytics. See [PRIVACY.md](PRIVACY.md).
- No dependencies, no build step, about 500 lines of JavaScript. See [SECURITY.md](SECURITY.md).
- Not affiliated with, endorsed by or sponsored by SAP SE.

## Install

- **Chrome Web Store:** _link once published_
- **Microsoft Edge Add-ons:** _link once published_
- **From source:** download the zip from [Releases](https://github.com/weiserman/sap-btp-environment-banner/releases) and unzip it, or clone this repository; then open `chrome://extensions` (or `edge://extensions`),
  turn on **Developer mode**, click **Load unpacked** and choose the folder.

Pin the extension so the badge is always visible.

## Use

### Tag a page

Open the app, click the toolbar icon, optionally enter a name, and pick **DEV**, **TEST** or **PRD**. The banner
appears straight away and is remembered. Click the icon again to change the type or **Remove tag**.

What gets tagged depends on the URL:

| Page | Tagged by | Example URL part |
|------|-----------|------------------|
| BTP cockpit subaccount | subaccount ID | `…/subaccount/<subaccount GUID>/…` |
| Mobile Services cockpit | Cloud Foundry org ID | `…/org/<org GUID>/…` |
| Cloud Identity Services (IAS) admin console | tenant hostname | `mytenant.accounts.ondemand.com` |
| Any other BTP app (Content Agent, Integration Suite, Work Zone, SAP Build, …) | hostname | `dev-myapp.ap10.content-agent.cloud.sap` |

Hosts shared by every environment (BTP cockpit, Mobile Services cockpit) can only be tagged on a
subaccount or org page.

### Settings, export and import

Click the toolbar icon → **All settings…** (or right-click the icon → **Options**). Each rule has a label,
description, badge (max 4 characters), colour, optional stripes, and a **URL match**: any text that appears
in the page URL. The first enabled matching rule wins, and changes apply to open tabs straight away.

- **Export** saves your rules to a `.json` file, for backup or to share with your team.
- **Import** reads such a file. Rules with the same URL match are replaced; new ones are added.

The **×** on the banner hides it until the page is reloaded.

Rules are stored with `chrome.storage.sync`, which allows roughly 40–50 rules.

## Permissions

| Permission | Why |
|------------|-----|
| `storage` | Save your rules. |
| `https://*.cloud.sap/*`, `https://*.ondemand.com/*` | Show the banner on SAP BTP apps. Only the page URL is compared with your rules; page content is never read. |

## Development

```text
manifest.json     extension manifest (MV3)
rules.js          rule model: environment types, validation, import/export
tagging.js        works out what to tag on a page (subaccount / org / host)
content.js        draws the banner (Shadow DOM) on matching pages
banner.css        pushes the page down while the banner is shown
background.js     sets the toolbar badge
popup.*           toolbar popup for tagging
options.*         settings page
test/             unit tests and preview pages
tools/            packaging script and the list of packaged files
```

- **Unit tests:** `node test/run-tests.js` (Node 18+, no install needed).
- **Visual preview without installing:** serve the folder (for example `python -m http.server 8765`) and open
  `http://localhost:8765/test/preview.html?env=prd` for the banner or
  `http://localhost:8765/test/popup-preview.html?url=sub` for the popup. Both stub the extension APIs.
- **After editing:** click the reload icon on the extension card in `chrome://extensions`, then refresh the
  BTP tab.

## Releasing

1. Bump `version` in `manifest.json` and commit.
2. Tag and push: `git tag v2.0.0 && git push origin v2.0.0`.
3. The **Release** workflow runs the tests, checks that the tag matches the manifest version, builds
   `sap-btp-environment-banner-<version>.zip` with a SHA-256 checksum, and attaches both to a GitHub release.
4. Upload that zip to the Chrome Web Store and Edge Add-ons. Listing text is in
   [STORE_LISTING.md](STORE_LISTING.md).

To build a zip locally: `powershell -File tools/package.ps1`.

## License

[MIT](LICENSE). SAP and SAP BTP are trademarks or registered trademarks of SAP SE in Germany and other
countries.
