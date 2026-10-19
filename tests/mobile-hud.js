const report = document.querySelector('#report');
const assert = (value, message) => { if (!value) throw new Error(message); };
try {
  const response = await fetch(new URL('../index.html', import.meta.url));
  assert(response.ok, 'Cannot load production markup');
  const source = new DOMParser().parseFromString(await response.text(), 'text/html');
  const play = source.querySelector('#play');
  play.hidden = false;
  const lines = [];
  for (const [width, height] of [[320, 568], [390, 844], [844, 390]]) {
    const frame = document.createElement('iframe');
    frame.title = `Mobile HUD ${width}x${height}`;
    frame.style.cssText = `width:${width}px;height:${height}px;display:block`;
    const loaded = new Promise(resolve => frame.addEventListener('load', resolve, { once: true }));
    frame.srcdoc = `<!doctype html><html><head></head><body class="compact-play in-play"><main>${play.outerHTML}</main></body></html>`;
    document.querySelector('#frames').append(frame);
    await loaded;
    const doc = frame.contentDocument;
    doc.documentElement.style.setProperty('--play-height', `${height}px`);
    const link = doc.createElement('link');
    link.rel = 'stylesheet';
    link.href = new URL('../css/style.css', import.meta.url).href;
    await new Promise((resolve, reject) => {
      link.onload = resolve;
      link.onerror = () => reject(new Error('Cannot load stylesheet'));
      doc.head.append(link);
    });
    const combo = doc.querySelector('#combo');
    for (const value of ['0', '999', '9999', '99999']) {
      combo.textContent = value;
      const style = frame.contentWindow.getComputedStyle(combo);
      assert(parseFloat(style.fontSize) === (height <= 430 ? 12 : 15), 'Compact font override failed');
      const box = combo.getBoundingClientRect();
      const panel = combo.parentElement.getBoundingClientRect();
      assert(box.height <= 20, 'Combo exceeds its grid row');
      assert(box.left >= panel.left && box.right <= panel.right && box.top >= panel.top && box.bottom <= panel.bottom, 'Combo escapes HUD');
      assert(combo.scrollWidth <= combo.clientWidth, 'Combo text overflows');
    }
    lines.push(`PASS ${width}x${height}: compact font and one-to-five-digit combos`);
  }
  report.textContent = lines.join('\n');
} catch (error) {
  report.textContent = `FAIL: ${error.message}`;
  throw error;
}
