const DATA = window.ABILITY_DATA || [];
const SLOTS = ["本体","素材1","素材2","素材3","素材4","素材5"];
const SLOT_LABEL = {"本体":"本体","素材1":"素材1","素材2":"素材2","素材3":"素材3","素材4":"素材4","素材5":"素材5"};
function displayName(a){return a?.nameZh||a?.name||''}
function displayCategory(a){return a?.categoryZh||a?.group||''}
function displayEffect(a){return a?.effectZh||a?.effect||''}
function jpNote(a){return `日文名：${a?.name||''}`;}
let state = { slots:Object.fromEntries(SLOTS.map(x=>[x,[]])), factor:Object.fromEntries(SLOTS.map(x=>[x,[]])), support:0, campaign:0, sameName:false, addItem:false, selected:[] };
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
function esc(s){return String(s).replace(/[&<>\"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));}
function ability(code){return DATA.find(x=>x.code===code)}
function byName(name){return DATA.find(x=>x.name===name)}
function countByName(counts,name){return DATA.filter(x=>x.name===name).reduce((sum,a)=>sum+(counts[a.code]||0),0)}
function saveHash(){const mini={s:state.slots,f:state.factor,b:state.support,c:state.campaign,n:!!state.sameName,i:!!state.addItem,x:state.selected};const raw=encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(mini)))));history.replaceState(null,"","#"+raw)}
function loadHash(){if(!location.hash)return;try{const o=JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(location.hash.slice(1))))));if(o.s)state.slots=o.s;if(o.f)state.factor=o.f;if(Number.isFinite(o.b))state.support=o.b;if(Number.isFinite(o.c))state.campaign=o.c;if(typeof o.n==="boolean")state.sameName=o.n;if(typeof o.i==="boolean")state.addItem=o.i;if(Array.isArray(o.x))state.selected=o.x;normalizeState()}catch(e){}}
function normalizeState(){
  const alias={SO046:"CF01"};
  for(const s of SLOTS){
    state.slots[s]=(state.slots?.[s]||[]).map(c=>alias[c]||c).filter(c=>ability(c));
    state.factor[s]=(state.factor?.[s]||[]).map(c=>alias[c]||c).filter(c=>ability(c)&&state.slots[s].includes(c));
  }
  state.selected=(state.selected||[]).map(c=>alias[c]||c).filter((c,i,a)=>ability(c)&&a.indexOf(c)===i);
}
function saveLocal(){localStorage.setItem("pso2-dodo-offline-v9",JSON.stringify(state));toast("已保存到本地")}
function loadLocal(){try{const o=JSON.parse(localStorage.getItem("pso2-dodo-offline-v9")||localStorage.getItem("pso2-dodo-offline-v8")||localStorage.getItem("pso2-dodo-offline-v7")||localStorage.getItem("pso2-dodo-offline-v6")||localStorage.getItem("pso2-dodo-offline-v5")||localStorage.getItem("pso2-dodo-offline-v4")||localStorage.getItem("pso2-dodo-offline-v3")||localStorage.getItem("pso2-dodo-offline-v2")||localStorage.getItem("pso2-dodo-offline"));if(o){state=o;state.selected=state.selected||[];state.sameName=!!state.sameName;state.addItem=!!state.addItem;normalizeState();render();toast("已读取保存数据")}}catch(e){}}
function resetAll(){state={slots:Object.fromEntries(SLOTS.map(x=>[x,[]])),factor:Object.fromEntries(SLOTS.map(x=>[x,[]])),support:0,campaign:0,sameName:false,addItem:false,selected:[]};render()}

function fillAllWithJunk(target){
  target=Math.max(1,Math.min(8,Number(target)||1));
  for(const slot of SLOTS){
    while(state.slots[slot].length<target)state.slots[slot].push('JUNK00');
  }
  render();
  toast(`已将所有本体和素材填充至至少${target}孔`)
}
function clearAllJunk(){
  let removed=0;
  for(const slot of SLOTS){
    const before=state.slots[slot].length;
    state.slots[slot]=state.slots[slot].filter(c=>ability(c)?.special!=='junk');
    removed+=before-state.slots[slot].length;
    state.factor[slot]=state.factor[slot].filter(c=>ability(c)?.special!=='junk'&&state.slots[slot].includes(c));
  }
  state.selected=state.selected.filter(c=>ability(c)?.special!=='junk');
  render();
  toast(removed?`已删除${removed}个垃圾能力`:'当前没有垃圾能力')
}

function familyKey(a){
  if(!a)return '';
  if(a.special==='sop')return 'sop:'+a.sopSlot;
  const basic=["パワー","シュート","テクニック","アーム","スタミナ","スピリタ","ボディ","リアクト","マインド","バーン","フリーズ","ショック","ミラージュ","パニック","ポイズン"];
  if(basic.includes(a.group))return 'basic:'+a.group;
  if(['soul','soul_standard','ether_soul','astral_soul','guardian_soul','ji_soul','ix_soul'].includes(a.special) || a.group==='ソール')return 'soul';
  if(['glare','absolute_glare'].includes(a.special))return 'glare';
  if(['factor','ether_factor'].includes(a.special))return 'factor';
  if(['reverie','mana_reverie'].includes(a.special))return 'reverie';
  if(['soul_catalyst','factor_catalyst','reverie_catalyst','glare_catalyst'].includes(a.special))return 'catalyst';
  if(a.special==='lesser')return 'lesser:'+a.lesserFamily;
  if(a.special==='ev')return 'lesser:'+a.lesserFamily;
  if(a.special==='returner')return 'returner';
  if(a.special==='crack')return 'crack';
  if(a.special==='mark')return 'mark';
  if(a.group==='フィーバー')return 'fever';
  if(a.group==='センテンス')return 'sentence';
  if(a.special==='phrase'||a.group==='フレイズ')return 'phrase';
  if(a.group==='アルター'||a.group==='フリクト'||a.name==='スティグマ')return 'alter_flict_stigma';
  if(a.name==='ウィンクルム'||a.name==='アクス・MAX'||a.name==='モデュレイター')return 'wink_mod_ax';
  if(['divine_will','divine_order'].includes(a.special))return 'divine';
  if(a.addItemAvailable||a.group==='追加アイテム')return 'add_item';
  if(a.group==='ドゥーム')return 'doom';
  if(/^アビリティ[ⅠⅡⅢⅣⅤⅥ]+$/.test(a.name))return 'ability';
  if(/^ミューテーション[ⅠⅡⅢⅣⅤⅥ]+$/.test(a.name))return 'mutation';
  return '';
}
function renderList(){
  const q=$("#search").value.trim().toLowerCase(),g=$("#group").value;
  const list=DATA.filter(a=>!a.addItemOnly&&(!g||displayCategory(a)===g)&&(!q||(`${displayName(a)} ${a.name} ${displayEffect(a)} ${displayCategory(a)}`).toLowerCase().includes(q)));
  $("#abilityList").innerHTML=list.map(a=>`<div class="ability" draggable="true" data-code="${a.code}" title="${esc(jpNote(a))}"><span>${esc(displayName(a))}</span><small>${esc(displayEffect(a)||displayCategory(a))}</small></div>`).join('');
  $$("#abilityList .ability").forEach(el=>{
    el.addEventListener("dragstart",e=>{e.dataTransfer.effectAllowed="copy";e.dataTransfer.setData("text/plain",JSON.stringify({type:"library",code:el.dataset.code}))});
    el.addEventListener("dblclick",()=>addToSlot("本体",el.dataset.code))
  })
}
function addToSlot(slot,code){const a=ability(code);if(!a)return;if(a.addItemOnly){toast("追加道具能力请通过“使用追加道具”选择");return}if(a.special!=='junk'&&state.slots[slot].includes(code))return;if(state.slots[slot].length>=8){toast("最多8槽");return}const fk=familyKey(a);if(fk){const old=state.slots[slot].find(c=>familyKey(ability(c))===fk);if(old){state.slots[slot]=state.slots[slot].filter(c=>c!==old);state.factor[slot]=state.factor[slot].filter(c=>c!==old)}}state.slots[slot].push(code);render()}
function removeOneFromArray(arr,code,indexHint){
  if(Number.isInteger(indexHint)&&indexHint>=0&&indexHint<arr.length&&arr[indexHint]===code){
    arr.splice(indexHint,1);return true
  }
  const i=arr.indexOf(code);
  if(i>=0){arr.splice(i,1);return true}
  return false
}
function moveBetweenSlots(source,target,code,indexHint){
  if(!SLOTS.includes(source)||!SLOTS.includes(target)||source===target)return;
  const a=ability(code);if(!a)return;
  const sourceIndex=(Number.isInteger(indexHint)&&state.slots[source][indexHint]===code)?indexHint:state.slots[source].indexOf(code);
  if(sourceIndex<0)return;
  if(a.special!=='junk'&&state.slots[target].includes(code)){toast("目标位置已有相同能力");return}
  if(state.slots[target].length>=8){toast("目标位置最多8槽");return}
  const fk=familyKey(a);
  if(a.special!=='junk'&&fk&&state.slots[target].some(c=>familyKey(ability(c))===fk)){toast("目标位置已有同系能力");return}

  const wasFactor=state.factor[source].includes(code);
  state.slots[source].splice(sourceIndex,1);
  if(wasFactor&&a.special!=='junk')removeOneFromArray(state.factor[source],code);
  state.slots[target].push(code);
  if(wasFactor&&a.special!=='junk')state.factor[target].push(code);
  render()
}
function copyBetweenSlots(source,target,code,indexHint){
  if(!SLOTS.includes(source)||!SLOTS.includes(target))return;
  const a=ability(code);if(!a)return;
  const sourceIndex=(Number.isInteger(indexHint)&&state.slots[source][indexHint]===code)?indexHint:state.slots[source].indexOf(code);
  if(sourceIndex<0)return;
  if(a.special!=='junk'&&state.slots[target].includes(code)){toast("复制目标已有相同能力");return}
  if(state.slots[target].length>=8){toast("复制目标最多8槽");return}
  const fk=familyKey(a);
  if(a.special!=='junk'&&fk&&state.slots[target].some(c=>familyKey(ability(c))===fk)){toast("复制目标已有同系能力");return}
  state.slots[target].push(code);
  render()
}
function removeFromSlot(slot,code,indexHint){
  const a=ability(code);
  const idx=(Number.isInteger(indexHint)&&state.slots[slot][indexHint]===code)?indexHint:state.slots[slot].indexOf(code);
  if(idx<0)return;
  state.slots[slot].splice(idx,1);
  if(a?.special!=='junk'&&!state.slots[slot].includes(code))state.factor[slot]=state.factor[slot].filter(c=>c!==code);
  render()
}
function toggleFactor(slot,code){
  const a=ability(code);
  if(a?.special==='junk'){toast("占位能力不能设为因子");return}
  if(state.factor[slot].includes(code))state.factor[slot]=state.factor[slot].filter(c=>c!==code);
  else state.factor[slot].push(code);
  render()
}
function renderSlots(){
  $("#materials").innerHTML=SLOTS.map(slot=>`<div class="mat" data-slot="${slot}"><div class="matHead">${SLOT_LABEL[slot]}<span>${state.slots[slot].length}S</span></div><div class="matBody">${state.slots[slot].map((c,idx)=>{const a=ability(c),fac=a?.special!=='junk'&&state.factor[slot].includes(c);return `<div class="chip ${fac?'factor':''}" draggable="true" data-code="${c}" data-index="${idx}" data-source-slot="${slot}" title="${esc(jpNote(a))}"><span>${esc(displayName(a)||c)}</span>${fac?'<b>因子</b>':''}<div class="chipBtns">${a?.special==='junk'?'':`<button data-act="factor">${fac?'解除因子':'设为因子'}</button>`}<button data-act="del">×</button></div></div>`}).join('')||'<div class="empty">将能力拖放到这里</div>'}</div></div>`).join('');
  $$('.mat').forEach(m=>{
    m.addEventListener('dragover',e=>{e.preventDefault();m.classList.add('over')});
    m.addEventListener('dragleave',()=>m.classList.remove('over'));
    m.addEventListener('drop',e=>{
      e.preventDefault();m.classList.remove('over');
      const raw=e.dataTransfer.getData('text/plain');
      let payload;
      try{payload=JSON.parse(raw)}catch(_){payload={type:'library',code:raw}}
      if(!payload||!payload.code)return;
      if(payload.type==='chip'&&payload.source){
        if(payload.copy||e.ctrlKey)copyBetweenSlots(payload.source,m.dataset.slot,payload.code,payload.index);
        else moveBetweenSlots(payload.source,m.dataset.slot,payload.code,payload.index)
      }else addToSlot(m.dataset.slot,payload.code)
    })
  });
  $$('.chip').forEach(ch=>{
    ch.addEventListener('dragstart',e=>{
      e.dataTransfer.effectAllowed='copyMove';
      e.dataTransfer.setData('text/plain',JSON.stringify({
        type:'chip',
        code:ch.dataset.code,
        source:ch.dataset.sourceSlot,
        index:Number(ch.dataset.index),
        copy:!!e.ctrlKey
      }));
      ch.classList.add('dragging')
    });
    ch.addEventListener('dragend',()=>ch.classList.remove('dragging'));
    ch.querySelector('[data-act="del"]').onclick=()=>removeFromSlot(
      ch.closest('.mat').dataset.slot,
      ch.dataset.code,
      Number(ch.dataset.index)
    );
    const factorBtn=ch.querySelector('[data-act="factor"]');
    if(factorBtn)factorBtn.onclick=()=>toggleFactor(ch.closest('.mat').dataset.slot,ch.dataset.code)
  })
}

function countName(counts,n){return countByName(counts,n)}
function hasSpecial(all,sp){return all.some(c=>ability(c)?.special===sp)}
function recipeRate(a,counts){
  const n=a.name;
  // EV系: 対応するレッサー攻撃Ⅴ + レッサースタミナⅤ/スピリタⅤ の2種類で50%特殊合成。
  if(a.special==='ev' && Array.isArray(a.recipe) && a.recipe.length===2 &&
     countName(counts,a.recipe[0])>=1 && countName(counts,a.recipe[1])>=1)return 50;
  if(n==='ガーディアン・ソール' && countName(counts,'アストラル・ソール')>=1 && countName(counts,'エーテル・ファクター')>=1 && countName(counts,'マナ・レヴリー')>=1 && countName(counts,'アブソリュート・グレア')>=1)return 10;
  if(n==='アストラル・ソール' && countName(counts,'ソール・カタリスト')>=4 && countName(counts,'ダークネス・ソール')>=1)return 60;
  if(n==='マナ・レヴリー' && countName(counts,'レヴリー・カタリスト')>=4 && countName(counts,'オメガ・メモリア')>=1)return 60;
  if(n==='アブソリュート・グレア' && countName(counts,'グレア・カタリスト')>=4 && countName(counts,'フォトナー・グレア')>=1)return 60;
  if(n==='フォトナー・グレア' && ['ヴァルナ・グレア','ミトラ・グレア','シバ・グレア','オリジン・グレア'].every(x=>countName(counts,x)>=1))return 10;
  if(n==='グレア・カタリスト' && countName(counts,'ベルージュ・グレア')>=1 && countName(counts,'フォードルス・グレア')>=1 && countName(counts,'エクゼクル・グレア')>=1 && (countName(counts,'アンジュール・グレア')>=1||countName(counts,'ドゥミヌス・グレア')>=1))return 10;
  if(n==='ソール・カタリスト' && ['エルダー・ソール','ルーサー・ソール','アプレンティス・ソール','ダブル・ソール','ペルソナ・ソール'].every(x=>countName(counts,x)>=1))return 10;
  if(n==='ファクター・カタリスト' && ['ヤマト・ファクター','マザー・ファクター','デウス・ファクター'].every(x=>countName(counts,x)>=1))return 10;
  if(n==='レヴリー・カタリスト' && ['エルダー・レヴリー','ルーサー・レヴリー','アプレジナ・レヴリー','ダブル・レヴリー','ペルソナ・レヴリー'].every(x=>countName(counts,x)>=1))return 10;
  if(n==='エーテル・ソール'){
    const ep4=['トウオウ・ソール','フルベガス・ソール','エスカード・ソール'].filter(x=>countName(counts,x)>=1).length;
    if(ep4>=2)return 10;
  }
  if(n==='エーテル・ファクター' && countName(counts,'ファクター・カタリスト')>=4 && countName(counts,'エーテル・ソール')>=1)return 60;
  return 0;
}
function rawRate(a,counts,all){
  if(SLOTS.some(s=>state.factor[s].includes(a.code)))return 100;
  if(a.special==='sop' && (counts[a.code]||0)>0)return 100;
  const count=counts[a.code]||0;
  const soulR=hasSpecial(all,'soul_receptor'), factorR=hasSpecial(all,'factor_receptor'), revR=hasSpecial(all,'reverie_receptor'), glareR=hasSpecial(all,'glare_receptor'), catR=hasSpecial(all,'catalyst_receptor'), markR=hasSpecial(all,'mark_receptor'), attackR=hasSpecial(all,'attack_receptor'), guardR=hasSpecial(all,'guard_receptor'), photonR=hasSpecial(all,'photon_receptor'), extR=hasSpecial(all,'ext_receptor'), photonCollect=hasSpecial(all,'photon_collect'), divineR=hasSpecial(all,'divine_receptor'), exceedR=hasSpecial(all,'exceed_receptor'), phraseR=hasSpecial(all,'phrase_receptor');
  let r=recipeRate(a,counts);
  // Receptors never create a target from nothing. The target ability itself must exist.
  if(a.group==='レセプター')return r;
  // マーク系は通常継承不可。マークレセプターがあり、対象マーク自体が素材に存在する時のみ100%。
  if(a.special==='mark'){
    return (count>0 && markR) ? 100 : r;
  }

  // アタックレセプター: パワー/シュート/テクニック/アーム V・VI の同ランク継承を100%。
  if(attackR && count>0 && ['パワー','シュート','テクニック','アーム'].includes(a.group) && a.rank>=5){
    r=Math.max(r,100);
  }

  // ガードレセプター: ボディ/リアクト/マインド V の同ランク継承を100%。
  if(guardR && count>0 && ['ボディ','リアクト','マインド'].includes(a.group) && a.rank===5){
    r=Math.max(r,100);
  }

  // フォトンレセプター: スタミナ/スピリタ V・VI の同ランク継承を100%。
  if(photonR && count>0 && ['スタミナ','スピリタ'].includes(a.group) && a.rank>=5){
    r=Math.max(r,100);
  }

  // エクストレセプター: アルター/フリクト系を100%継承。
  if(extR && count>0 && ['アルター','フリクト'].includes(a.group)){
    r=Math.max(r,100);
  }

  // ディバイン系 / イクシード系は通常継承不可。対応レセプターがあり、対象能力自体が素材に存在する時のみ100%。
  if(a.special==='divine_will' || a.special==='divine_order'){
    return (count>0 && divineR) ? 100 : r;
  }
  if(a.special==='exceed_energy'){
    return (count>0 && exceedR) ? 100 : r;
  }

  // 言灵系通常无法继承。存在言灵保护，且对应言灵能力本身位于本体/素材时，继承率为100%。
  if(a.special==='phrase'){
    return (count>0 && phraseR) ? 100 : r;
  }

  // フォトンコレクト: 6種状態異常のランクアップだけを強化。
  // II→III 100%, III→IV 70%, IV→V 50%。
  if(photonCollect && ['バーン','フリーズ','ショック','ミラージュ','パニック','ポイズン'].includes(a.group) && a.rank>=3){
    const prev=DATA.find(x=>x.group===a.group&&x.rank===a.rank-1);
    const pc=prev?(counts[prev.code]||0):0;
    if(pc>=2){
      const pr = a.rank===3 ? 100 : (a.rank===4 ? 70 : (a.rank===5 ? 50 : 0));
      r=Math.max(r,pr);
    }
  }

  // レッサー系:
  // 継承 I: 2個80% / 3個100%
  //      II: 2個70% / 3個100%
  //     III: 2個50% / 3個100%
  //      IV: 2個40% / 3個100%
  //       V: 2個30% / 3個100%
  // 合成は1ランク下を3個: II 70% / III 50% / IV 30% / V 20%。
  if(a.special==='lesser'){
    const count=counts[a.code]||0;
    if(count>0) r=Math.max(r,a.inherit[Math.min(count,3)-1]||0);
    if(a.rank>1){
      const prev=DATA.find(x=>x.special==='lesser'&&x.lesserFamily===a.lesserFamily&&x.rank===a.rank-1);
      const pc=prev?(counts[prev.code]||0):0;
      if(pc>0) r=Math.max(r,a.combine?.[Math.min(pc,3)-1]||0);
    }
    return r;
  }

  // EV系は通常継承不可。候補は上記の特殊合成（または特殊能力因子）でのみ生成。
  if(a.special==='ev') return r;

  // リターナー / クラック: exact transfer/generation rules.
  if(a.special==='returner' || a.special==='crack'){
    const count=counts[a.code]||0;
    if(count>0) r=Math.max(r,a.inherit[Math.min(count,3)-1]||0);
    if(a.rank>1){
      const prev=DATA.find(x=>x.group===a.group&&x.rank===a.rank-1);
      const pc=prev?(counts[prev.code]||0):0;
      if(pc>0) r=Math.max(r,a.combine?.[Math.min(pc,3)-1]||0);
    }
    // Darkness Soul is a +10% catalyst only for Returner III/IV transfer/generation.
    if(a.special==='returner' && (a.rank===3 || a.rank===4) && countName(counts,'ダークネス・ソール')>=1 && r>0){
      r=Math.min(100,r+10);
    }
    return r;
  }
  // Doom Break II/III generation uses 3/4/5 copies of the previous tier -> 10/30/50.
  if(a.special==='doom2' || a.special==='doom3'){
    const count=counts[a.code]||0;
    if(count>0) r=Math.max(r,a.inherit[Math.min(count,3)-1]||0);
    const prev=DATA.find(x=>x.group==='ドゥーム'&&x.rank===a.rank-1);
    const pc=prev?(counts[prev.code]||0):0;
    if(pc>=3) r=Math.max(r, pc>=5?50:(pc===4?30:10));
    return r;
  }
  if(a.special==='ether_soul'){
    if(count>0) r=Math.max(r,a.inherit[Math.min(count,3)-1]||0);
    if(count>0&&soulR) r=Math.max(r,100);
    return r;
  }
  if(a.special==='guardian_soul')return Math.max(r,(count>0&&soulR)?10:0);
  if(a.special==='astral_soul')return Math.max(r,(count>0&&soulR)?10:0);
  if(a.special==='ether_factor')return Math.max(r,(count>0&&factorR)?10:0);
  if(a.special==='mana_reverie')return Math.max(r,(count>0&&revR)?10:0);
  if(a.special==='absolute_glare')return Math.max(r,(count>0&&glareR)?10:0);
  if(a.special==='glare'){
    if(count>0)r=Math.max(r,count>=2?50:30);
    // ディバイン系触媒: ウィル +20%、オーダー +30%。両方ある場合はオーダーの+30%のみ適用。
    if(count>0){
      const divineBonus = hasSpecial(all,'divine_order') ? 30 : (hasSpecial(all,'divine_will') ? 20 : 0);
      if(divineBonus) r=Math.min(100,r+divineBonus);
    }
    if(count>0&&glareR)r=Math.max(r,100);
    return r;
  }
  if(a.special==='factor'){
    if(count>0)r=Math.max(r,a.inherit[Math.min(count,3)-1]||0);
    if(count>0&&factorR)r=Math.max(r,100);return r;
  }
  if(a.special==='reverie'){
    if(count>0)r=Math.max(r,a.inherit[Math.min(count,3)-1]||0);
    if(count>0&&revR)r=Math.max(r,100);return r;
  }
  if(['soul_catalyst','factor_catalyst','reverie_catalyst','glare_catalyst'].includes(a.special)){
    // カタリストレセプターは対象カタリストそのものが素材に1個以上存在する場合のみ100%。
    // レセプター単独では候補を生成しない。
    if(count>0 && catR) return 100;
    // グレア・カタリストは通常継承不可。その他3種は2個10% / 3個30%。
    if(a.special==='glare_catalyst') return r;
    if(count>0) r=Math.max(r,a.inherit[Math.min(count,3)-1]||0);
    return r;
  }
  if(a.special==='ji_soul'){
    if(count>0)r=Math.max(r,a.inherit[Math.min(count,3)-1]||0);
    if(count>0&&soulR)r=Math.max(r,50);return r;
  }
  if(a.special==='ix_soul'){
    if(count>0)r=Math.max(r,a.inherit[Math.min(count,3)-1]||0);
    if(count>0&&soulR)r=Math.min(100,r+10);return r;
  }
  if(a.special==='soul'||a.special==='soul_standard'||a.group==='ソール'){
    if(count>0)r=Math.max(r,a.inherit[Math.min(count,3)-1]||0);
    if(count>0&&soulR)r=Math.max(r,100);return r;
  }
  if(count>0)r=Math.max(r,a.inherit[Math.min(count,3)-1]||0);
  if(a.rank>1){const prev=DATA.find(x=>x.group===a.group&&x.rank===a.rank-1);const pc=prev?(counts[prev.code]||0):0;if(pc>0)r=Math.max(r,a.combine?.[Math.min(pc,3)-1]||0)}
  return r;
}
function validationError(){const bs=state.slots['本体'].length;const used=SLOTS.slice(1).filter(s=>state.slots[s].length>0);if(!used.length)return '请至少设置1件素材';const bad=used.find(s=>state.slots[s].length<bs);if(bad)return `${SLOT_LABEL[bad]}需要至少与本体相同的槽位数（${bs}S）`;return ''}
function candidates(){const err=validationError();if(err)return {list:[],err};const all=SLOTS.flatMap(s=>state.slots[s]);const counts={};all.forEach(c=>counts[c]=(counts[c]||0)+1);const out=[];DATA.forEach(a=>{let base=rawRate(a,counts,all),fromAddItem=false;if(state.addItem&&a.addItemAvailable){base=100;fromAddItem=true}if(base>0)out.push({...a,base,fromAddItem})});return {list:out.sort((a,b)=>b.base-a.base||a.group.localeCompare(b.group,'ja')||a.name.localeCompare(b.name,'ja')),err:''}}
function slotPenalty(selectedCount){const bs=state.slots['本体'].length;if(selectedCount<=bs)return 1;const mats=SLOTS.slice(1).filter(s=>state.slots[s].length>0).length;const multi=mats>=2;const t=multi?[1,1,.90,.85,.70,.60,.55,.40,.30]:[1,1,.85,.75,.60,.50,.45,.35,.30];return t[Math.min(bs+1,8)]||.30}
function sameNameMultiplier(){
  if(!state.sameName)return 1;
  const mats=SLOTS.slice(1).filter(s=>state.slots[s].length>0).length;
  if(mats===1)return 1.10;
  if(mats>=2)return 1.15;
  return 1;
}
function guidanceBonus(){
  return state.slots['本体'].some(c=>ability(c)?.special==='guidance') ? 5 : 0
}
function finalRate(base,n,a=null){
  // S级特殊能力继承固定100%，扩槽时也不受成功率降低影响。
  if(a?.special==='sop' && base>0)return 100;
  // 同名装备补正为乘算；成功率道具、报酬期间、炼成之引导随后以加算处理。
  return Math.min(100,Math.floor(base*slotPenalty(n)*sameNameMultiplier()+state.support+state.campaign+guidanceBonus()))
}
function renderCandidates(){
  const res=candidates(),list=res.list;
  state.selected=state.selected.filter(c=>list.some(x=>x.code===c));
  const n=state.selected.length;
  if(res.err){$("#candidateBody").innerHTML=`<div class="noCand warnbox">${esc(res.err)}</div>`;renderSummary();return}
  $("#candidateBody").innerHTML=list.map(a=>{
    const checked=state.selected.includes(a.code),fin=finalRate(a.base,n||1,a);
    return `<label class="cand ${checked?'sel':''}" title="${esc(jpNote(a))}"><input type="checkbox" data-code="${a.code}" ${checked?'checked':''}><span class="candName">${esc(displayName(a))}${a.fromAddItem?'<em class="itemTag">追加道具</em>':''}</span><span class="base">${a.base}%</span><strong>${fin}%</strong></label>`
  }).join('')||'<div class="noCand">没有可追加的候选能力</div>';
  $$('#candidateBody input').forEach(i=>i.onchange=()=>{
    if(i.checked){
      const max=Math.min(8,state.slots['本体'].length+1);
      if(state.selected.length>=max){i.checked=false;toast(`最多可选择${max}个能力（单次追加最多扩张+1S）`);return}
      const fk=familyKey(ability(i.dataset.code));
      if(fk)state.selected=state.selected.filter(c=>familyKey(ability(c))!==fk);
      state.selected.push(i.dataset.code)
    }else state.selected=state.selected.filter(c=>c!==i.dataset.code);
    renderCandidates();renderSummary()
  });
  renderSummary()
}

function selectedBaseStats(){
  const totals={"S-ATK":0,"R-ATK":0,"T-ATK":0,"DEX":0,"S-DEF":0,"R-DEF":0,"T-DEF":0,"HP":0,"PP":0};
  const add=(key,val)=>{if(Object.prototype.hasOwnProperty.call(totals,key))totals[key]+=val};
  state.selected.forEach(code=>{
    const a=ability(code); const statText=a?.statEffect||a?.effect; if(!a||!statText)return;
    String(statText).split(',').map(x=>x.trim()).forEach(part=>{
      let m=part.match(/^ALL([+-]\d+)$/i);
      if(m){const v=Number(m[1]);["S-ATK","R-ATK","T-ATK","DEX","S-DEF","R-DEF","T-DEF"].forEach(k=>add(k,v));return}
      m=part.match(/^S\/R\/T-ATK([+-]\d+)$/i);
      if(m){const v=Number(m[1]);["S-ATK","R-ATK","T-ATK"].forEach(k=>add(k,v));return}
      m=part.match(/^S\/R\/T-DEF([+-]\d+)$/i);
      if(m){const v=Number(m[1]);["S-DEF","R-DEF","T-DEF"].forEach(k=>add(k,v));return}
      m=part.match(/^(S-ATK|R-ATK|T-ATK|DEX|S-DEF|R-DEF|T-DEF|HP|PP)([+-]\d+)$/i);
      if(m)add(m[1].toUpperCase(),Number(m[2]));
    })
  });
  return totals
}
function renderSummary(){
  const n=state.selected.length,res=candidates();
  const rates=state.selected.map(c=>{const a=res.list.find(x=>x.code===c);return a?finalRate(a.base,n,a):0});
  const total=rates.length?rates.reduce((p,x)=>p*x/100,1)*100:0;
  const nm=sameNameMultiplier();
  const stats=selectedBaseStats();
  const statLabels={"S-ATK":"打击力","R-ATK":"射击力","T-ATK":"法击力","DEX":"技量","S-DEF":"打击防御","R-DEF":"射击防御","T-DEF":"法击防御","HP":"HP","PP":"PP"};
  const statHtml=Object.entries(statLabels).map(([k,label])=>`<div><span>${label}</span><strong>${stats[k]>=0?'+':''}${stats[k]}</strong></div>`).join('');
  $("#summary").innerHTML=`<div><b>已选：</b> ${n}个 ${n>state.slots['本体'].length?'<span class="warn">扩张</span>':''}</div>${state.sameName?`<div><b>同名装备补正：</b> ×${nm.toFixed(2)}</div>`:''}<div><b>综合成功率：</b> <strong>${total.toFixed(2)}%</strong></div><div class="small">按各能力独立判定计算全部成功的概率</div><div class="statSummary"><div class="statTitle">所选能力基础属性合计</div><div class="statGrid">${statHtml}</div></div>`
}
function render(){$("#support").value=state.support;$("#campaign").value=state.campaign;$("#sameName").checked=!!state.sameName;$("#addItem").checked=!!state.addItem;renderList();renderSlots();renderCandidates();saveHash()}
function toast(t){const x=$("#toast");x.textContent=t;x.classList.add('show');setTimeout(()=>x.classList.remove('show'),1600)}
function initApp(){loadHash();[...new Set(DATA.map(a=>displayCategory(a)))].sort((a,b)=>a.localeCompare(b,'zh-CN')).forEach(g=>$("#group").insertAdjacentHTML('beforeend',`<option>${esc(g)}</option>`));$("#search").oninput=renderList;$("#group").onchange=renderList;$("#support").onchange=e=>{state.support=+e.target.value;render()};$("#campaign").onchange=e=>{state.campaign=+e.target.value;render()};$("#sameName").onchange=e=>{state.sameName=!!e.target.checked;render()};$("#addItem").onchange=e=>{state.addItem=!!e.target.checked;if(!state.addItem)state.selected=state.selected.filter(c=>!ability(c)?.addItemAvailable);render()};$("#junkFillBtn").onclick=()=>fillAllWithJunk($("#junkFillSlots").value);$("#junkClearBtn").onclick=clearAllJunk;$("#save").onclick=saveLocal;$("#load").onclick=loadLocal;$("#reset").onclick=()=>{if(confirm('确定要全部清空吗？'))resetAll()};$("#copy").onclick=()=>navigator.clipboard?.writeText(location.href).then(()=>toast('URL已复制')).catch(()=>toast('受浏览器限制，无法复制'));render()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initApp);else initApp();
