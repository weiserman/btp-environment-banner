# Store listing

Text to paste into the Chrome Web Store developer dashboard and Microsoft Partner Center (Edge Add-ons).

## Name

Environment Banner for BTP

## Summary (max 132 characters)

Know if you're in DEV, TEST or PRD: coloured banner and toolbar badge for BTP apps. Runs locally, collects no data.

## Description

Many BTP pages look identical whether you are in development, test or production. The only difference is
a GUID buried in the URL. Environment Banner for BTP puts a coloured bar across the top of the page and a
badge on the toolbar icon, so you always know where you are before you click Deploy, Delete or Save.

HOW IT WORKS
• Open a BTP app, click the toolbar icon and choose DEV, TEST or PRD. Optionally give it a name.
• From then on that page shows a green DEV, orange TEST or striped red PRD banner, plus a matching badge.
• The banner pushes the page down instead of covering it, and can be hidden with ×.

WHAT YOU CAN TAG
• BTP cockpit subaccounts (by subaccount ID)
• Mobile Services cockpit (by Cloud Foundry org ID)
• Any other BTP app with its own address per environment, for example Content Agent, Integration Suite,
  SAP Build Work Zone, SAP Build, Datasphere and ABAP environment (by hostname)
• SAP Cloud Identity Services tenants (by tenant hostname)

SETTINGS
• Edit labels, colours, badges and match rules on the settings page.
• Export your rules to a file and share it with your team; they import it in one click.

PRIVACY AND SECURITY
• No data collection, analytics or network requests. Everything runs in your browser.
• Only runs on *.cloud.sap and *.ondemand.com.
• Open source (MIT) with no dependencies or build step: review the code on GitHub.

Not affiliated with, endorsed by or sponsored by SAP SE. SAP and SAP BTP are trademarks or registered
trademarks of SAP SE in Germany and other countries.

## Category

Developer Tools (Chrome) / Developer tools (Edge)

## Single purpose (Chrome "Privacy practices" tab)

Shows which BTP environment (development, test or production) the current page belongs to, using a
coloured banner and toolbar badge based on rules the user creates.

## Permission justifications

| Permission | Justification |
|------------|---------------|
| `storage` | Saves the user's environment rules (label, colour, URL match text) so the banner is shown on later visits and synced across the user's own browsers. |
| Host permission `https://*.cloud.sap/*` | BTP apps (BTP cockpit, Content Agent, SAP Build, Datasphere, S/4HANA Cloud and others) are served from this domain. The content script compares the page URL with the user's rules and draws the banner. No page content is read. |
| Host permission `https://*.ondemand.com/*` | BTP Cloud Foundry apps (Mobile Services cockpit, Integration Suite, Work Zone, custom apps, under hana.ondemand.com) and SAP Cloud Identity Services tenants (accounts.ondemand.com) are served from this domain. Used the same way as above. |
| Remote code | No. All JavaScript is included in the package. |

## Data usage (Chrome "Privacy practices" tab)

- Does the extension collect or use any of the listed user data types? **No** to all categories.
- Certify: does not sell data to third parties; does not use or transfer data for purposes unrelated to the
  single purpose; does not use or transfer data to determine creditworthiness or for lending.
- Privacy policy URL: https://github.com/weiserman/btp-environment-banner/blob/main/PRIVACY.md
- Homepage / support URL: https://github.com/weiserman/btp-environment-banner

## Graphics

- Store icon (128×128, 96px artwork with padding): `store/store-icon-128.png`
- Small promo tile (440×280): `store/promo-small-440x280.png`

## Screenshots to capture (1280×800)

1. A BTP cockpit subaccount page with the striped red PRD banner and PRD badge.
2. The toolbar popup open on a subaccount, showing the DEV / TEST / PRD buttons.
3. The Mobile Services cockpit with the green DEV banner.
4. The settings page with a few rules and the Import / Export buttons.

Blur or use made-up subaccount names, IDs and hostnames in screenshots.

## Edge-specific

Microsoft Partner Center accepts the same `.zip`. Reuse the description, privacy policy URL and
screenshots; Edge asks for a search-terms list: `SAP, BTP, environment, banner, production, cockpit`.
