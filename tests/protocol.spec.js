// Pure protocol logic, exercised through the read-only window.ShakeMyController hooks.
const { test, expect } = require("@playwright/test");
const { APP_URL } = require("./helpers");

test.beforeEach(async ({ page }) => {
  await page.goto(APP_URL);
});

test("CRC32 matches the standard check value", async ({ page }) => {
  const crc = await page.evaluate(() => ShakeMyController.crc32(new TextEncoder().encode("123456789")));
  expect(crc).toBe(0xcbf43926);
});

test("HD Rumble encoding matches the reference table", async ({ page }) => {
  const enc = (lo, hi, amp) => page.evaluate(a => ShakeMyController.encodeNintendoRumble(...a), [lo, hi, amp]);
  // Amplitude 0 is the neutral frame.
  expect(await enc(160, 320, 0)).toEqual([0x00, 0x01, 0x40, 0x40]);
  // Amplitude 1.0 → hf_amp 0xC8, lf_amp 0x0072 (+1 carried from the 320 Hz high-band bit).
  expect(await enc(160, 320, 1)).toEqual([0x00, 0xc9, 0x40, 0x72]);
});

test("HD Rumble amplitudes stay valid for every intensity", async ({ page }) => {
  const bad = await page.evaluate(() => {
    const out = [];
    for (let i = 0; i <= 2000; i++) {
      const amp = i / 2000;
      // 200 Hz keeps the high-band carry bit at 0, so byte 1 is the raw amplitude.
      const b = ShakeMyController.encodeNintendoRumble(160, 200, amp);
      if (b[1] > 0xc8 || b[1] % 2 || b.some(x => x < 0 || x > 255)) out.push([amp, b]);
    }
    return out;
  });
  expect(bad).toEqual([]);
});

test("Sony reports only flag the motors as valid", async ({ page }) => {
  const reports = await page.evaluate(() => ({
    dsUsb: ShakeMyController.sonyReport("dualsense", 10, 20, false),
    ds4Usb: ShakeMyController.sonyReport("ds4", 10, 20, false),
    ds4Bt: ShakeMyController.sonyReport("ds4", 10, 20, true),
  }));
  const [dsId, ds] = reports.dsUsb;
  expect(dsId).toBe(0x02);
  expect(Object.values(ds).slice(0, 4)).toEqual([0x03, 0x00, 20, 10]);
  const [ds4Id, ds4] = reports.ds4Usb;
  expect(ds4Id).toBe(0x05);
  expect(Object.values(ds4).slice(0, 5)).toEqual([0x01, 0, 0, 20, 10]);
  const [btId, bt] = reports.ds4Bt;
  expect(btId).toBe(0x11);
  expect(Object.keys(bt)).toHaveLength(77);
});

test("Sony Bluetooth reports carry a valid CRC32", async ({ page }) => {
  const ok = await page.evaluate(() => {
    const [id, data] = ShakeMyController.sonyReport("dualsense", 100, 200, true);
    const body = data.slice(0, -4);
    const crc = ShakeMyController.crc32([0xa2, id, ...body]);
    const tail = data[73] | (data[74] << 8) | (data[75] << 16) | (data[76] << 24);
    return (tail >>> 0) === crc;
  });
  expect(ok).toBe(true);
});

test("controllers are identified from Gamepad ids and HID devices", async ({ page }) => {
  const cases = {
    "DualSense Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 0ce6)": "dualsense",
    "Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 09cc)": "ds4",
    "Pro Controller (STANDARD GAMEPAD Vendor: 057e Product: 2009)": "switchpro",
    "Joy-Con (L) (STANDARD GAMEPAD Vendor: 057e Product: 2006)": "joycon",
    "Xbox 360 Controller (XInput STANDARD GAMEPAD)": "xbox",
    "Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b00)": "elite2",
    "Logitech Gamepad F310 (STANDARD GAMEPAD Vendor: 046d Product: c21d)": "f310",
    "54c-ce6-DualSense Wireless Controller": "dualsense",
    "Some unknown pad": "other",
  };
  const got = await page.evaluate(ids => Object.fromEntries(ids.map(id => [id, ShakeMyController.identifyGamepad(id)])), Object.keys(cases));
  expect(got).toEqual(cases);
  expect(await page.evaluate(() => ShakeMyController.identifyHID({ vendorId: 0x057e, productId: 0x2007, productName: "" }))).toBe("joycon");
});
