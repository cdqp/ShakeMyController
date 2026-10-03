// End-to-end behaviour with simulated controllers.
const { test, expect } = require("@playwright/test");
const { APP_URL, installMocks, collectErrors } = require("./helpers");

const DUALSENSE_BT = {
  vendorId: 0x054c, productId: 0x0ce6, productName: "DualSense Wireless Controller",
  outputReports: [0x31], firmware: 0x0230,
};

test("Gamepad API: continuous shake has no gaps and stops cleanly", async ({ page }) => {
  const errors = collectErrors(page);
  await installMocks(page);
  await page.goto(APP_URL);
  await page.evaluate(() => { window.__padOn = true; });

  await page.click("#connectBtn");
  await expect(page.locator("#driverPill")).toHaveText("GAMEPAD HAPTICS");
  await expect(page.locator("#triggerToggle")).toBeVisible();

  await page.click("#shakeBtn");
  await expect(page.locator("#shakeBtn")).toHaveText("STOP");
  await page.waitForTimeout(1000);
  await page.click("#shakeBtn");
  await expect(page.locator("#shakeBtn")).toHaveText("SHAKE");

  const fx = await page.evaluate(() => window.__fx);
  const plays = fx.filter(f => f.type === "dual-rumble");
  expect(plays.length).toBeGreaterThan(15);
  // Each effect must outlast the gap to the next one, so the motor never drops out.
  for (let i = 1; i < plays.length; i++) {
    expect(plays[i].t - plays[i - 1].t).toBeLessThan(plays[i - 1].duration);
  }
  expect(fx.at(-1).type).toBe("reset");
  expect(errors).toEqual([]);
});

test("Impulse Triggers option switches to trigger-rumble", async ({ page }) => {
  await installMocks(page);
  await page.goto(APP_URL);
  await page.evaluate(() => { window.__padOn = true; });
  await page.click("#connectBtn");
  await page.check("#triggers");
  await page.click("#testBtn");
  await expect(page.locator("#toast")).toHaveText("Test terminé.", { timeout: 5000 });
  const types = await page.evaluate(() => [...new Set(window.__fx.map(f => f.type))]);
  expect(types).toContain("trigger-rumble");
});

test("TEST stops a running SHAKE instead of running alongside it", async ({ page }) => {
  await installMocks(page);
  await page.goto(APP_URL);
  await page.evaluate(() => { window.__padOn = true; });
  await page.click("#connectBtn");
  await page.fill("#testDuration", "300");
  await page.click("#shakeBtn");
  await page.waitForTimeout(200);
  await page.click("#testBtn");
  await expect(page.locator("#toast")).toHaveText("Test terminé.", { timeout: 5000 });
  await expect(page.locator("#shakeBtn")).toHaveText("SHAKE");
  const count = await page.evaluate(() => window.__fx.length);
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.__fx.length)).toBe(count);
});

test("WebHID DualSense over Bluetooth: motor-only reports, sent on change, Esc stops", async ({ page }) => {
  const errors = collectErrors(page);
  await installMocks(page, { hid: DUALSENSE_BT });
  await page.goto(APP_URL);

  await page.click("#connectBtn");
  await expect(page.locator("#driverPill")).toHaveText("WEBHID SONY");
  await expect(page.locator("#statusSub")).toContainText("Bluetooth");

  await page.selectOption("#pattern", "pulse");
  await page.click("#shakeBtn");
  await page.waitForTimeout(900);
  await page.keyboard.press("Escape");
  await expect(page.locator("#shakeBtn")).toHaveText("SHAKE");

  const reports = await page.evaluate(() => window.__hid);
  // 300 ms pulses over 900 ms: a handful of state changes, not one report per tick.
  expect(reports.length).toBeGreaterThan(2);
  expect(reports.length).toBeLessThan(10);
  for (const { reportId, data } of reports) {
    expect(reportId).toBe(0x31);
    expect(data).toHaveLength(77);
    expect(data[2]).toBe(0x03); // valid_flag0: motors only
    expect(data[3]).toBe(0x00); // valid_flag1: lightbar / LEDs / audio untouched
    expect(data[40]).toBe(0x04); // firmware 2.30 → improved rumble emulation
  }
  expect(reports.some(r => r.data[4] === 179 && r.data[5] === 179)).toBe(true); // 70 %
  expect(reports.at(-1).data.slice(4, 6)).toEqual([0, 0]);
  expect(errors).toEqual([]);
});

test("settings and theme persist across reloads", async ({ page }) => {
  await page.goto(APP_URL);
  await page.selectOption("#pattern", "heartbeat");
  await page.click("#themeLight");
  // Storage commits asynchronously in Chromium: retry the reload until the values are there.
  await expect(async () => {
    await page.reload();
    await expect(page.locator("#pattern")).toHaveValue("heartbeat", { timeout: 300 });
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light", { timeout: 300 });
  }).toPass({ timeout: 5000 });
});

for (const width of [320, 360, 414]) {
  test(`layout has no horizontal scroll at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(APP_URL);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
}
