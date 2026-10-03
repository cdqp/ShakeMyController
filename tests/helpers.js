const path = require("path");
const { pathToFileURL } = require("url");

const APP_URL = pathToFileURL(path.join(__dirname, "..", "ShakeMyController.html")).href;

/**
 * Installs fake controllers before the page loads:
 * - a Gamepad API pad with a vibration actuator (hidden until window.__padOn = true),
 * - a WebHID device returned by the permission picker.
 * Every haptic call is recorded in window.__fx (Gamepad) and window.__hid (WebHID).
 */
async function installMocks(page, { pad, hid } = {}) {
  await page.addInitScript(({ pad, hid }) => {
    window.__fx = [];
    window.__hid = [];
    window.__padOn = false;

    const actuator = {
      effects: pad.effects,
      playEffect(type, p) {
        window.__fx.push({ t: performance.now(), type, ...p });
        return new Promise(r => setTimeout(() => r("complete"), p.duration));
      },
      reset() {
        window.__fx.push({ t: performance.now(), type: "reset" });
        return Promise.resolve("complete");
      },
    };
    const gamepad = { id: pad.id, index: 0, connected: true, vibrationActuator: actuator, buttons: [], axes: [] };
    navigator.getGamepads = () => [window.__padOn ? gamepad : null];

    if (!hid) return;
    const device = {
      ...hid,
      opened: false,
      collections: [{ outputReports: hid.outputReports.map(reportId => ({ reportId })) }],
      async open() { this.opened = true; },
      async close() { this.opened = false; },
      async sendReport(reportId, data) { window.__hid.push({ reportId, data: Array.from(data) }); },
      async receiveFeatureReport() {
        const b = new Uint8Array(64);
        b[0] = 0x20; b[44] = hid.firmware & 0xff; b[45] = hid.firmware >> 8;
        return new DataView(b.buffer);
      },
    };
    Object.defineProperty(navigator, "hid", {
      value: { requestDevice: async () => [device], getDevices: async () => [], addEventListener() {} },
    });
  }, {
    pad: { id: "Xbox 360 Controller (XInput STANDARD GAMEPAD)", effects: ["dual-rumble", "trigger-rumble"], ...pad },
    hid: hid || null,
  });
}

/** Fails the test on any uncaught page error or console error. */
function collectErrors(page) {
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  return errors;
}

module.exports = { APP_URL, installMocks, collectErrors };
