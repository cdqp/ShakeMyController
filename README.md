🎮 ShakeMyController
ShakeMyController is a lightweight, self-contained web application designed to test, control, and trigger haptic rumble/vibrations on various game controllers directly from your web browser.

The app runs entirely locally in your browser — no data is ever sent to an external server.

✨ Features
🔌 Multi-Protocol Support: Leverages standard browser Gamepad Haptics API alongside direct WebHID control (for Sony & Nintendo hardware).

🎮 Broad Controller Compatibility:

PlayStation: DualSense (PS5) and DualShock 4 (PS4) with independent dual-motor control via Sony WebHID (USB & Bluetooth).

Nintendo: Switch Pro Controller and Joy-Cons with HD Rumble tuning (low & high frequency adjustments).

Xbox & PC: Xbox Wireless Controller, Xbox Elite Series 2, 8BitDo, Razer Wolverine, SCUF Envision Pro, etc., via standard Gamepad API / XInput.

🌊 Customizable Vibration Patterns:

Continuous

Pulses

Heartbeat

Left / Right Alternating

Progressive Wave

Ramp Up

Random Pattern

🎛️ Precision Tuning:

Independent power sliders for Left (Heavy / Low frequency) and Right (Light / High frequency) motors.

Adjust speed/rhythm interval and quick-test duration.

Dedicated frequency controls (Hz) for HD Rumble compatible hardware.

🌓 Modern & Responsive UI: Clean interface with native Dark / Light mode support, optimized for both desktop and mobile views.

🚀 Technical Requirements
Recommended Browsers: Google Chrome or Microsoft Edge (Desktop) for full WebHID API support.

Connections: USB Cable, Bluetooth, or 2.4 GHz Wireless Adapters (depending on OS driver exposure).

Security Context: Must be served over HTTPS or localhost to grant browser HID device permissions.

🛠️ Built With
Frontend: HTML5, Plain CSS3 (CSS Variables, Responsive Layouts, Native Theme Switching).

JavaScript: Vanilla JS (Zero external dependencies).

Web APIs:

Gamepad API (Haptic Actuators / Dual-Rumble)

WebHID API (Direct Output Reports & CRC32 checksum calculations for Sony/Nintendo hardware)
