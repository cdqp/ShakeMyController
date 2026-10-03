# Contributing

Thanks for helping! Real-hardware reports are the most valuable contribution: every controller, firmware and connection behaves a little differently.

## Reporting a controller

Open a [bug report](https://github.com/cdqp/ShakeMyController/issues/new?template=bug_report.yml) with:

- the exact controller model and connection (USB, Bluetooth, 2.4 GHz dongle);
- the browser and OS;
- the status line and badge shown at the top of the page;
- any error from the browser console (F12).

## Working on the code

- Keep `ShakeMyController.html` **self-contained**: no external scripts, styles or fonts, no network requests.
- The UI is in French; keep new strings consistent with the existing ones.
- Run `npm test` before opening a pull request. Add a test for protocol changes (`tests/protocol.spec.js`) or new behaviour (`tests/app.spec.js`).
- Internal functions used by the tests are exposed read-only on `window.ShakeMyController`.

## Adding a controller

1. Add its USB vendor/product IDs to `VENDORS` (or a name pattern to `identifyByName`).
2. Add a profile entry to `PROFILES` and an `<option>` to the "Type de manette" menu.
3. If it needs a raw WebHID protocol, add it to `HID_KINDS` and write its report builder next to the Sony and Nintendo ones.
4. Add an identification case to `tests/protocol.spec.js`.

Please cite your protocol source (Linux `hid-*` driver, SDL, reverse-engineering notes) in the pull request.
