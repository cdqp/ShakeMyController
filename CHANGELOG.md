# Changelog

## 1.1.0

### Fixed
- Gamepad API rumble no longer drops out every ~230 ms: effects are chained every 40 ms.
- DualSense output reports only flag the motors, so the controller's audio, lightbar and LEDs are left untouched.
- Switch Pro Controller USB handshake sends the correct `0x80 0x03` command.
- HD Rumble amplitude is clamped and rounded, so low intensities no longer produce out-of-range or corrupted frames.
- Switch Pro and other controllers are identified by vendor/product ID in Chrome and Firefox Gamepad ids.
- SHAKE and TEST can no longer run at the same time, and no vibration can be sent after STOP.
- The page title no longer overflows on narrow phones.
- Insecure contexts are reported correctly; storage access is guarded.

### Added
- Live output meters, Esc to stop, remembered settings, system theme without flash.
- Optional Impulse Triggers (`trigger-rumble`) when the browser supports them.
- Improved rumble emulation on DualSense firmware 2.24+.
- Automatic reconnection of previously authorized WebHID controllers.
- Automated tests (Playwright) and GitHub Actions CI, issue templates, GitHub Pages entry point.

## 1.0.0
- Initial release.
