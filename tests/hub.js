import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { HUB_URL, connectHubLinks } from '../js/hub.js';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const html = read('index.html'), main = read('js/main.js');
assert.equal(HUB_URL, 'https://hyangdan2.github.io/GameHub/');
const anchors = html.match(/<a\b[^>]*data-game-hub[^>]*>/g);
assert.equal(anchors.length, 2);
assert(anchors.every(tag => !/target=|download=/.test(tag)));
assert(html.includes('aria-describedby="hub-exit-warning"'));
assert(html.includes('discards this unfinished run'));
const links = anchors.map(() => ({ addEventListener(type, fn) { this[type] = fn; } }));
const page = { addEventListener(type, fn) { this[type] = fn; } };
let cleanups = 0;
connectHubLinks(links, () => cleanups++, page);
for (const link of links) assert.equal(link.href, HUB_URL);
const click = () => ({ defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } });
let event = click();
links[0].click(event);
assert.equal(cleanups, 1);
assert.equal(event.defaultPrevented, false, 'Native same-tab navigation remains enabled');
event = click(); links[1].click(event);
assert.equal(event.defaultPrevented, true, 'Duplicate navigation is blocked');
assert.equal(cleanups, 1);
page.pageshow();
event = click(); links[0].click(event);
assert.equal(event.defaultPrevented, false, 'Back restores usable links');
assert.equal(cleanups, 2);
const leave = main.match(/function leavePage\(\) \{[\s\S]*?\n\}/)[0];
for (const initial of ['paused', 'preparing', 'results', 'playing']) {
  const calls = [];
  const context = vm.createContext({
    navigationSequence: 0, pendingRecord: initial === 'results', state: initial,
    savePending(name) { calls.push('save:' + name); context.pendingRecord = null; },
    pause() { calls.push('pause'); if (context.state === 'playing') context.state = 'paused'; },
    screen(id) { calls.push('screen:' + id); },
    ...Object.fromEntries(['audio', 'countdown', 'input', 'calibration', 'sfx'].map(name => [name, {
      pause() { calls.push(name); }, cancel() { calls.push(name); },
      clear() { calls.push(name); }, stop() { calls.push(name); },
    }])),
  });
  vm.runInContext(leave + '\nleavePage();', context);
  assert.equal(context.navigationSequence, 1, 'Invalidates asynchronous start/resume');
  assert.equal(context.state, initial === 'preparing' ? 'menu' : initial === 'playing' ? 'paused' : initial);
  for (const name of ['audio', 'countdown', 'input', 'calibration', 'sfx']) assert(calls.includes(name));
  if (initial === 'results') assert.equal(calls[0], 'save:PLAYER');
}
assert(main.includes('window.addEventListener("pagehide", leavePage)'));
console.log('PASS Game Hub: destinations, native activation, duplicate guard, Back reset, mocked cleanup and pending record ordering');
