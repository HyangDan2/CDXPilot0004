import {Mascot} from '../js/mascot.js';
import {CHARACTERS} from '../js/characters.js';
const report=document.querySelector('#report');
const assert=(condition,message)=>{if(!condition)throw new Error(message);};
try {
  const response=await fetch(new URL('../index.html',import.meta.url));
  assert(response.ok,'Cannot load production markup');
  const source=new DOMParser().parseFromString(await response.text(),'text/html');
  const section=source.querySelector('#results');section.hidden=false;
  const stylesheet=new URL('../css/style.css',import.meta.url).href;
  const lines=[];
  for(const [width,height] of [[320,568],[390,844],[620,800],[844,390],[1280,900]]) {
    const frame=document.createElement('iframe');
    frame.title=`Results ${width} by ${height}`;frame.style.cssText=`width:${width}px;height:${height}px;border:1px solid gray;display:block`;
    const loaded=new Promise(resolve=>frame.addEventListener('load',resolve,{once:true}));
    frame.srcdoc=`<!doctype html><html><head></head><body><main>${section.outerHTML}</main></body></html>`;
    document.querySelector('#frames').append(frame);await loaded;
    const doc=frame.contentDocument,win=frame.contentWindow;
    const link=doc.createElement('link');
    link.rel='stylesheet';link.href=stylesheet;
    await new Promise((resolve,reject)=>{
      link.onload=resolve;
      link.onerror=()=>reject(new Error('Cannot load production stylesheet'));
      doc.head.append(link);
    });
    const element=doc.querySelector('#result-mascot'),view=new Mascot(element);
    for(const character of CHARACTERS)for(const state of ['clear','failed']) {
      view.setCharacter(character.id);view.draw(state,100,0);
      doc.querySelector('#result-heading').textContent=state==='clear'?'Your frequency. Found.':'A little static. Try again.';
      // Freeze animation to make the bounds deterministic; animation remains clipped by its frame.
      view.sprite.style.animation='none';
      const outer=element.getBoundingClientRect(),inner=view.sprite.getBoundingClientRect();
      assert(win.getComputedStyle(element).position!=='static','Sprite frame must establish its containing block');
      assert(Math.abs(outer.width-outer.height)<1,'Character frame must remain square');
      assert(inner.left>=outer.left && inner.right<=outer.right && inner.top>=outer.top && inner.bottom<=outer.bottom,'Sprite escaped its own frame');
      if(width<=620) {
        assert(Math.abs(outer.width-200)<1,'Mobile frame must be 200px');
        assert(doc.querySelector('#result-heading').getBoundingClientRect().bottom<=outer.top,'Character overlaps title');
        assert(outer.bottom<=doc.querySelector('.result-card').getBoundingClientRect().top,'Character overlaps score card');
      } else {
        assert(Math.abs(outer.width-(width<=900?210:260))<1,'Desktop result frame size');
        assert(doc.querySelector('#result-heading').getBoundingClientRect().right<=outer.left,'Desktop character overlaps title');
        assert(outer.bottom<=doc.querySelector('.result-card').getBoundingClientRect().top,'Desktop character overlaps score card');
      }
    }
    view.draw('clear',100,0,false);assert(win.getComputedStyle(element).display==='none','Hidden preference must be respected');
    view.draw('clear',100,0,true);
    lines.push(`PASS ${width}x${height}: both characters, clear/fail, bounded sprite, mobile flow, visibility`);
  }
  report.textContent=lines.join('\n');
} catch(error) {report.textContent='FAIL: '+error.message;throw error;}
