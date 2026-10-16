# Security policy

## Reporting a vulnerability

Please **do not open a public issue** for security problems. Instead, use GitHub's private reporting:
**Security** tab → **Report a vulnerability** in this repository.

Include the extension version, browser and version, and steps to reproduce. You should get a reply within
7 days. Fixes are released as a new version in the Chrome Web Store and Microsoft Edge Add-ons, and credited
in the release notes unless you prefer otherwise.

## Supported versions

Only the latest published version is supported.

## Security design

The extension is deliberately small so it can be reviewed quickly. There is no build step and there are no
dependencies: the published package contains exactly the files in this repository listed in
[`tools/package-files.txt`](tools/package-files.txt).

| Area | Design |
|------|--------|
| Network | No network requests of any kind. The extension pages' content security policy sets `connect-src 'none'` and `default-src 'none'`. |
| Permissions | `storage` only, plus host access to `*.cloud.sap` and `*.ondemand.com`, the domains BTP apps run on. No `tabs`, `cookies`, `webRequest`, `scripting` or `<all_urls>`. |
| Page access | The content script reads only `location.href` and adds its own banner element in a Shadow DOM. It does not read page content, forms, cookies or storage. |
| Untrusted input | Rules can come from imported files or browser sync. Every rule goes through `sanitizeRule()` in `rules.js`: text is length-limited, colours must match `#rrggbb` or fall back to grey. The banner never interpolates rule values into HTML or CSS text; text is set with `textContent`, colours through `element.style`. |
| Messaging | The background worker only accepts messages from this extension's own content scripts (`sender.id` check) and only uses them to set the toolbar badge. |
| Extension pages | Strict CSP: `script-src 'self'`, no inline scripts, no `eval`, `object-src 'none'`, `frame-ancestors 'none'`. |
| Releases | Store packages are built by the GitHub Actions workflow in `.github/workflows/release.yml` from a tagged commit. Each release includes a SHA-256 checksum, so you can compare the store package with the release. |

## Verifying a release yourself

1. Download the `.zip` from the GitHub release and check its SHA-256 against the `.sha256` file.
2. Unzip it and compare it with the source at the release tag. The files must be identical.
3. Search the code for network APIs; there should be no matches outside comments:
   ```bash
   grep -rnE "fetch\(|XMLHttpRequest|WebSocket|sendBeacon|EventSource|importScripts" --include=*.js .
   ```
