import { escapeHtml, readableTextColor } from "./utils";

export interface CountdownData {
  targetDateTime: string; // ISO 8601, UTC
  text: string;
  color: string; // hex
  createdAt: string;
}

const BASE_STYLES = `
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
`;

export function homePage(): string {
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Countdown erstellen</title>
<style>
${BASE_STYLES}
body {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f172a, #1e293b);
  color: #f8fafc;
  padding: 24px;
}
.card {
  width: 100%;
  max-width: 460px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 32px;
  backdrop-filter: blur(8px);
}
h1 {
  font-size: 1.5rem;
  margin: 0 0 4px;
}
p.subtitle {
  margin: 0 0 24px;
  color: #94a3b8;
  font-size: 0.9rem;
}
label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  margin: 18px 0 6px;
  color: #cbd5e1;
}
input[type="text"], input[type="datetime-local"] {
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(15, 23, 42, 0.6);
  color: #f8fafc;
  font-size: 1rem;
}
input[type="color"] {
  width: 56px;
  height: 40px;
  padding: 2px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: transparent;
  cursor: pointer;
}
.color-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.color-hex {
  font-family: ui-monospace, monospace;
  color: #94a3b8;
  font-size: 0.9rem;
}
button {
  margin-top: 26px;
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  background: #6366f1;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;
}
button:hover { background: #4f46e5; }
button:disabled { opacity: 0.6; cursor: default; }
.error {
  margin-top: 14px;
  color: #fca5a5;
  font-size: 0.9rem;
  display: none;
}
.result {
  margin-top: 22px;
  display: none;
}
.result.visible, .error.visible { display: block; }
.link-row {
  display: flex;
  gap: 8px;
}
.link-row input {
  flex: 1;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(15, 23, 42, 0.6);
  color: #f8fafc;
  font-family: ui-monospace, monospace;
  font-size: 0.85rem;
}
.link-row button {
  margin-top: 0;
  width: auto;
  padding: 10px 16px;
}
.open-link {
  display: inline-block;
  margin-top: 12px;
  color: #a5b4fc;
  font-size: 0.9rem;
  text-decoration: none;
}
.open-link:hover { text-decoration: underline; }
</style>
</head>
<body>
<div class="card">
  <h1>Countdown erstellen</h1>
  <p class="subtitle">Zieldatum, Text und Hintergrundfarbe festlegen &ndash; danach bekommst du einen teilbaren Link.</p>
  <form id="countdown-form">
    <label for="targetDateTime">Zieldatum &amp; Uhrzeit</label>
    <input type="datetime-local" id="targetDateTime" name="targetDateTime" required>

    <label for="text">Text</label>
    <input type="text" id="text" name="text" maxlength="200" placeholder="z. B. Bis zum Urlaub!" required>

    <label for="color">Hintergrundfarbe</label>
    <div class="color-row">
      <input type="color" id="color" name="color" value="#4338ca">
      <span class="color-hex" id="color-hex">#4338ca</span>
    </div>

    <button type="submit" id="submit-btn">Countdown aktivieren</button>
    <div class="error" id="error"></div>
  </form>

  <div class="result" id="result">
    <label>Dein Countdown-Link</label>
    <div class="link-row">
      <input type="text" id="link-input" readonly>
      <button type="button" id="copy-btn">Kopieren</button>
    </div>
    <a href="#" target="_blank" rel="noopener" class="open-link" id="open-link">Countdown in neuem Tab &ouml;ffnen &rarr;</a>
  </div>
</div>
<script>
(function () {
  var colorInput = document.getElementById('color');
  var colorHex = document.getElementById('color-hex');
  colorInput.addEventListener('input', function () {
    colorHex.textContent = colorInput.value;
  });

  var form = document.getElementById('countdown-form');
  var errorEl = document.getElementById('error');
  var resultEl = document.getElementById('result');
  var submitBtn = document.getElementById('submit-btn');

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    errorEl.classList.remove('visible');
    resultEl.classList.remove('visible');

    var localValue = document.getElementById('targetDateTime').value;
    var text = document.getElementById('text').value;
    var color = colorInput.value;

    if (!localValue) {
      errorEl.textContent = 'Bitte ein Zieldatum wählen.';
      errorEl.classList.add('visible');
      return;
    }

    var isoTarget = new Date(localValue).toISOString();

    submitBtn.disabled = true;
    submitBtn.textContent = 'Wird erstellt …';

    try {
      var response = await fetch('/api/countdowns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetDateTime: isoTarget, text: text, color: color })
      });

      if (!response.ok) {
        var body = await response.json().catch(function () { return {}; });
        throw new Error(body.error || 'Countdown konnte nicht erstellt werden.');
      }

      var data = await response.json();
      var url = new URL(data.url, window.location.origin).toString();

      document.getElementById('link-input').value = url;
      document.getElementById('open-link').href = url;
      resultEl.classList.add('visible');
    } catch (err) {
      errorEl.textContent = err.message || 'Etwas ist schiefgelaufen.';
      errorEl.classList.add('visible');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Countdown aktivieren';
    }
  });

  document.getElementById('copy-btn').addEventListener('click', function () {
    var input = document.getElementById('link-input');
    input.select();
    navigator.clipboard && navigator.clipboard.writeText(input.value);
  });
})();
</script>
</body>
</html>`;
}

export function countdownPage(data: CountdownData): string {
  const color = data.color;
  const textColor = readableTextColor(color);
  const safeText = escapeHtml(data.text);
  const safeTitle = data.text.trim() ? escapeHtml(data.text.trim()) : "Countdown";
  const targetIsoJson = JSON.stringify(data.targetDateTime);

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<title>${safeTitle}</title>
<style>
${BASE_STYLES}
html, body {
  height: 100%;
  width: 100%;
  overflow: hidden;
}
.stage {
  height: 100vh;
  width: 100vw;
  height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${color};
}
.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(16px, 4vh, 40px);
  padding: 5vw;
  text-align: center;
  width: 100%;
}
.countdown {
  display: flex;
  gap: clamp(12px, 3vw, 40px);
  flex-wrap: wrap;
  justify-content: center;
}
.unit {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 4ch;
}
.value {
  font-size: clamp(2.5rem, 12vw, 9rem);
  font-weight: 800;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.label {
  margin-top: 0.5em;
  font-size: clamp(0.7rem, 1.8vw, 1.1rem);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.75;
}
.text {
  font-size: clamp(1.25rem, 4vw, 3rem);
  font-weight: 600;
  max-width: 90vw;
  word-wrap: break-word;
}
.text.done {
  font-size: clamp(2rem, 6vw, 5rem);
}
</style>
</head>
<body>
<div class="stage" style="background-color: ${color};">
  <div class="content" style="color: ${textColor};">
    <div class="countdown" id="countdown">
      <div class="unit"><span class="value" id="days">--</span><span class="label">Tage</span></div>
      <div class="unit"><span class="value" id="hours">--</span><span class="label">Std</span></div>
      <div class="unit"><span class="value" id="minutes">--</span><span class="label">Min</span></div>
      <div class="unit"><span class="value" id="seconds">--</span><span class="label">Sek</span></div>
    </div>
    ${safeText ? `<div class="text" id="customText">${safeText}</div>` : ""}
  </div>
</div>
<script>
(function () {
  var target = new Date(${targetIsoJson}).getTime();
  var daysEl = document.getElementById('days');
  var hoursEl = document.getElementById('hours');
  var minutesEl = document.getElementById('minutes');
  var secondsEl = document.getElementById('seconds');
  var countdownEl = document.getElementById('countdown');
  var textEl = document.getElementById('customText');
  var pad = function (n) { return String(n).padStart(2, '0'); };

  function tick() {
    var diff = target - Date.now();
    if (diff <= 0) {
      countdownEl.style.display = 'none';
      if (textEl) textEl.classList.add('done');
      clearInterval(timer);
      return;
    }
    var totalSeconds = Math.floor(diff / 1000);
    var days = Math.floor(totalSeconds / 86400);
    var hours = Math.floor((totalSeconds % 86400) / 3600);
    var minutes = Math.floor((totalSeconds % 3600) / 60);
    var seconds = totalSeconds % 60;

    daysEl.textContent = days;
    hoursEl.textContent = pad(hours);
    minutesEl.textContent = pad(minutes);
    secondsEl.textContent = pad(seconds);
  }

  var timer = setInterval(tick, 250);
  tick();
})();
</script>
</body>
</html>`;
}

export function notFoundPage(): string {
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Countdown nicht gefunden</title>
<style>
${BASE_STYLES}
body {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0f172a;
  color: #f8fafc;
  text-align: center;
  padding: 24px;
}
a { color: #a5b4fc; }
</style>
</head>
<body>
<div>
  <h1>Countdown nicht gefunden</h1>
  <p>Dieser Link ist ung&uuml;ltig oder der Countdown wurde gel&ouml;scht.</p>
  <p><a href="/">Neuen Countdown erstellen</a></p>
</div>
</body>
</html>`;
}
