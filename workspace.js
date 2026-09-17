// Search only: keep stored ability names and codes unchanged.
window.normalizeAbilitySearch=value=>String(value??'').normalize('NFKC').toLowerCase().replace(/[ァ-ヶ]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60));
/* V27 workspace. Calculation stays in rules.js; this module owns plans/items/results. */
window.safeStorageGet = key => {try{return localStorage.getItem(key)}catch{return null}};
window.installWorkspace = function(){
 const zh=document.documentElement.lang==='zh-CN';
 const T=(cn,ja)=>zh?cn:ja;
 const displayName=a=>zh?(a?.nameZh||a?.name||''):(a?.name||'');
 const clone=o=>JSON.parse(JSON.stringify(o));
 const uid=()=>globalThis.crypto?.randomUUID?.()||'item-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
 const KEY='pso2-dodo-workspace-v27', DRAFT=KEY+'-draft', SAVES='pso2-dodo-save-list';
 const original={render,renderSlots,renderSummary,initApp,toggleFactor};
 let ws,ready=false,rendering=false,undo=null,drag=null,press=null,lastFocused=null,storageWarned=false;
 const blank=()=>({slots:Object.fromEntries(SLOTS.map(s=>[s,[]])),factor:Object.fromEntries(SLOTS.map(s=>[s,[]])),equipment:{},support:0,campaign:15,sameName:false,lifeGuidance:false,lowRarityWeapon:false,abilityProtection:'',addItemCode:'',selected:[]});
 const active=()=>ws.tabs.find(t=>t.id===ws.activeId);
 function meta(name=''){return {id:uid(),name,lifeGuidance:false,lowRarityWeapon:false,innateFactors:[]}}
 function cleanCodes(codes){return Array.isArray(codes)?codes.map(c=>c==='SO046'?'CF01':c).filter(c=>typeof c==='string'&&ability(c)):[]}
 function cleanMeta(m){return {id:uid(),name:typeof m?.name==='string'?m.name.slice(0,80):'',lifeGuidance:m?.lifeGuidance===true,lowRarityWeapon:m?.lowRarityWeapon===true,innateFactors:[...new Set(cleanCodes(m?.innateFactors))].filter(c=>ability(c)?.special!=='junk')}}
 function cleanState(o){
  if(!o||typeof o!=='object')throw Error(T('方案格式无效','無効なプラン形式'));
  const s=blank(),source=o.slots||o.s||{};
  for(const key of SLOTS){
   const codes=cleanCodes(source[key]);
   if(codes.length>8)throw Error(T('装备不能超过8孔','装備は8枠までです'));
   const seen=new Set(),families=new Set();
   for(const c of codes){const a=ability(c),f=familyKey(a);if(a.special!=='junk'&&(seen.has(c)||(f&&families.has(f))))throw Error(T('装备包含重复或互斥能力','装備に重複・競合する能力があります'));seen.add(c);if(f)families.add(f)}
   s.slots[key]=codes;
   s.factor[key]=[...new Set(cleanCodes((o.factor||o.f||{})[key]))].filter(c=>codes.includes(c)&&ability(c)?.special!=='junk');
   if(o.equipment?.[key]||codes.length)s.equipment[key]=cleanMeta(o.equipment?.[key]);
  }
  s.support=[0,5,10,20,30,40,45,50,55,60].includes(o.support??o.b)?(o.support??o.b):0;
  s.campaign=[0,5,10,15,20].includes(o.campaign??o.c)?(o.campaign??o.c):15;
  s.sameName=(o.sameName??o.n)===true;
  s.abilityProtection=String(o.abilityProtection??o.p??'');if(!['4','5','6','7','8'].includes(s.abilityProtection))s.abilityProtection='';
  s.selected=[...new Set(cleanCodes(o.selected||o.x))];
  const item=o.addItemCode??o.i;s.addItemCode=typeof item==='string'&&ability(item)?.addItemAvailable?item:'';
  if(item===true||o.addItem===true)s.addItemCode=s.selected.find(c=>ability(c)?.addItemAvailable)||'';
  s.lifeGuidance=(o.lifeGuidance??o.l)===true;s.lowRarityWeapon=(o.lowRarityWeapon??o.w)===true;
  if(s.equipment['本体']){
   if(o.equipment?.['本体']){s.lifeGuidance=s.equipment['本体'].lifeGuidance;s.lowRarityWeapon=s.equipment['本体'].lowRarityWeapon}
   else Object.assign(s.equipment['本体'],{lifeGuidance:s.lifeGuidance,lowRarityWeapon:s.lowRarityWeapon});
  }else{s.lifeGuidance=false;s.lowRarityWeapon=false}
  return s;
 }
 function sync(){
  state.equipment ||= {};
  for(const s of SLOTS){if(state.slots[s].length&&!state.equipment[s])state.equipment[s]=meta();}
  if(state.equipment['本体'])Object.assign(state.equipment['本体'],{lifeGuidance:!!state.lifeGuidance,lowRarityWeapon:!!state.lowRarityWeapon});
  else {state.lifeGuidance=false;state.lowRarityWeapon=false}
  if(ws)active().state=state;
 }
 function restoreBase(){state.lifeGuidance=!!state.equipment['本体']?.lifeGuidance;state.lowRarityWeapon=!!state.equipment['本体']?.lowRarityWeapon}
 function itemAt(index){const s=SLOTS[index],m=state.equipment[s];return m?{...clone(m),abilities:[...state.slots[s]],factors:[...state.factor[s]]}:null}
 function putAt(index,item,fresh=false){const s=SLOTS[index];state.slots[s]=item?[...item.abilities]:[];state.factor[s]=item?[...item.factors]:[];if(item){const m=clone(item);delete m.abilities;delete m.factors;if(fresh)m.id=uid();state.equipment[s]=m}else delete state.equipment[s]}
 function cleanItem(o){if(!o||!Array.isArray(o.abilities))throw Error(T('背包装备格式无效','無効な装備形式'));const s=cleanState({slots:{'本体':o.abilities},factor:{'本体':o.factors||[]},equipment:{'本体':o}});return {...s.equipment['本体'],abilities:s.slots['本体'],factors:s.factor['本体']}}
 function newTab(name,s=blank()){return {id:uid(),name:name||T('方案','プラン')+(ws?ws.tabs.length+1:1),state:s,lastResult:null}}
 function parseWorkspace(o){
  if(!o||typeof o!=='object')throw Error(T('存档格式无效','無効な保存形式'));
  if(o.version!==undefined&&![26,27].includes(o.version))throw Error(T('不支持此存档版本','未対応の保存バージョン'));
  if(!o.tabs){if(!o.slots&&!o.s)throw Error(T('不是模拟器存档','シミュレーターの保存データではありません'));const t=newTab(T('导入方案','読込プラン'),cleanState(o));return {version:27,tabs:[t],activeId:t.id,inventory:[],counter:0}}
  if(!Array.isArray(o.tabs)||!o.tabs.length||!Array.isArray(o.inventory))throw Error(T('存档缺少标签页或背包','プランまたはバッグがありません'));
  const tabs=o.tabs.map(t=>newTab(typeof t.name==='string'?t.name.slice(0,80):'',cleanState(t.state)));
  const i=o.tabs.findIndex(t=>t.id===o.activeId);
  const out={version:27,tabs,activeId:tabs[Math.max(0,i)].id,inventory:o.inventory.map(cleanItem),counter:Number.isSafeInteger(o.counter)&&o.counter>=0?o.counter:0};
  // Result history is informational, never a new random draw or a second inventory insertion.
  tabs.forEach((t,i)=>{const r=o.tabs[i].lastResult;if(r&&Array.isArray(r.entries)&&r.entries.every(e=>ability(e.code)&&Number.isFinite(e.rate)&&e.rate>=0&&e.rate<=100&&typeof e.success==='boolean'))t.lastResult={name:String(r.name||''),entries:clone(r.entries),protection:['4','5','6','7','8'].includes(r.protection)?r.protection:'',time:String(r.time||''),inventoryStatus:['stored','protected'].includes(r.inventoryStatus)?r.inventoryStatus:'stored'}});
  return out;
 }
 function snapshot(){sync();return clone(ws)}
 function store(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch{toast(T('保存失败：浏览器存储不可用或已满，请导出文件备份','保存失敗：ストレージが使えません。ファイルにエクスポートしてください'));return false}}
 function persist(){if(!ready)return;sync();try{localStorage.setItem(DRAFT,JSON.stringify({...ws,shareHash:location.hash}));storageWarned=false}catch{if(!storageWarned){storageWarned=true;toast(T('自动保存失败，请导出文件备份','自動保存失敗。ファイルにエクスポートしてください'))}}}
 saveHash=function(){sync();try{const raw=encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify({version:27,plan:state})))));history.replaceState(null,'','#'+raw)}catch{}persist()};
 function decodeHash(){return JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(location.hash.slice(1))))))}
 let booted=false;
 loadHash=function(){
  if(booted){if(location.hash){const o=decodeHash();state=cleanState(o.plan||o);active().state=state;}return}
  booted=true;
  const t=newTab();ws={version:27,tabs:[t],activeId:t.id,inventory:[],counter:0};
  const raw=window.safeStorageGet(DRAFT)||window.safeStorageGet('pso2-dodo-workspace-v26-draft');let prevHash='';
  if(raw){try{const old=JSON.parse(raw);prevHash=old.shareHash||'';ws=parseWorkspace(old)}catch{toast(T('自动存档无法读取，未覆盖手动存档','自動保存を読み込めません。手動保存は保持されています'))}}
  if(location.hash&&(!raw||location.hash!==prevHash)){
   try{const o=decodeHash();if(o.version!==undefined&&![26,27].includes(o.version))throw Error();const imported=newTab(T('链接方案','URLプラン'),cleanState(o.plan||o));if(raw)ws.tabs.push(imported);else ws.tabs=[imported];ws.activeId=imported.id}catch{toast(T('网址中的方案无效','URL内のプランが無効です'))}
  }
  state=active().state;
 };
 // Named snapshots are separate from the current workspace: no recursive save history.
 function timeName(date){const pad=(n,w=2)=>String(n).padStart(w,'0');return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(),3)}`}
 function readArchive(){
  const raw=window.safeStorageGet(SAVES);
  let archive=raw?JSON.parse(raw):{version:1,entries:[],migrated:[]};
  if(archive.version!==1||!Array.isArray(archive.entries)||!Array.isArray(archive.migrated)||archive.entries.some(e=>!e||typeof e.id!=='string'||typeof e.name!=='string'||!e.workspace))throw Error(T('存档列表损坏，未覆盖原数据','保存リストが破損しています。元のデータは上書きしません'));
  let dirty=false;
  const legacyKeys=['pso2-dodo-workspace-v26','pso2-dodo-offline-v9','pso2-dodo-offline-v8','pso2-dodo-offline-v7','pso2-dodo-offline-v6','pso2-dodo-offline-v5','pso2-dodo-offline-v4','pso2-dodo-offline-v3','pso2-dodo-offline-v2','pso2-dodo-offline'];
  for(const key of legacyKeys){
   if(archive.migrated.includes(key))continue;
   const old=window.safeStorageGet(key);if(!old)continue;
   const workspace=parseWorkspace(JSON.parse(old)),date=new Date();
   archive.entries.push({id:'legacy:'+key,name:timeName(date)+' · '+T('旧存档','旧データ'),createdAt:date.toISOString(),workspace});archive.migrated.push(key);dirty=true;
  }
  if(dirty&&!store(SAVES,archive))throw Error(T('旧存档迁移未保存','旧データの移行を保存できません'));
  return archive;
 }
 saveLocal=function(){try{const archive=readArchive(),date=new Date(),base=timeName(date);let name=base,k=2;while(archive.entries.some(e=>e.name===name))name=base+' ('+(k++)+')';const entry={id:uid(),name,createdAt:date.toISOString(),workspace:snapshot()};archive.entries.push(entry);if(!store(SAVES,archive))return null;toast(T('已新增存档：','保存しました：')+name);return entry.id}catch(e){toast(T('保存失败：','保存失敗：')+e.message);return null}};
 loadLocal=function(id){try{const archive=readArchive(),entry=id?archive.entries.find(e=>e.id===id):archive.entries.at(-1);if(!entry){toast(T('没有可读取的存档','読み込む保存データがありません'));return false}const next=parseWorkspace(entry.workspace);cancelDrag();closeModal();ws=next;state=active().state;undo=null;render();toast(T('已读取：','読み込みました：')+entry.name);return true}catch(e){toast(T('读取失败：','読込失敗：')+e.message);return false}};
 function deleteSave(id){try{const archive=readArchive();if(!archive.entries.some(e=>e.id===id))return false;archive.entries=archive.entries.filter(e=>e.id!==id);if(!store(SAVES,archive))return false;return true}catch(e){toast(e.message);return false}}
 function showSaves(){try{const archive=readArchive();openModal(T('存档列表','保存データ一覧'),`<p>${T('每次保存新增一个以本地时间命名的完整存档，包含全部方案和背包。读取会替换当前工作区；删除存档不影响当前内容。','保存ごとにローカル時刻を名前にした全プラン・バッグのスナップショットを追加します。読込は現在の内容を置き換えます。削除は現在の内容に影響しません。')}</p><div class="saveList">${[...archive.entries].reverse().map(e=>`<div class="saveEntry"><div><b>${esc(e.name)}</b><small>${e.workspace.tabs?.length||1} ${T('个方案','プラン')} · ${e.workspace.inventory?.length||0} ${T('件装备','装備')}</small></div><div><button data-load-save="${esc(e.id)}">${T('读取','読込')}</button><button data-delete-save="${esc(e.id)}">${T('删除','削除')}</button></div></div>`).join('')||`<p class="muted">${T('暂无存档，请点击顶部“保存”。','保存データがありません。上部の「保存」を押してください。')}</p>`}</div>`);$$('[data-load-save]').forEach(b=>b.onclick=()=>{if(confirm(T('读取此存档并替换当前全部方案和背包？','この保存データで全プランとバッグを置き換えますか？')))loadLocal(b.dataset.loadSave)});$$('[data-delete-save]').forEach(b=>b.onclick=()=>{if(confirm(T('删除这个存档？当前方案和背包不会改变。','この保存データを削除しますか？現在のプランとバッグは変更しません。'))&&deleteSave(b.dataset.deleteSave))showSaves()})}catch(e){toast(T('无法打开存档列表：','保存リストを開けません：')+e.message)}}
 resetAll=function(){cancelDrag();state=blank();active().state=state;active().lastResult=null;undo=null;render()};
 normalizeState=function(){state=cleanState(state);if(ws)active().state=state};
 window.prepareLanguageChange=function(lang){if(!store(DRAFT,{...snapshot(),shareHash:location.hash})){ $('#language').value=zh?'zh-CN':'ja';return false}try{localStorage.setItem('pso2-dodo-language',lang);return true}catch{toast(T('无法保存语言设置','言語設定を保存できません'));return false}};
 function recordUndo(){sync();undo={tab:ws.activeId,state:clone(state),inventory:clone(ws.inventory)}}
 function undoLast(){if(!undo||undo.tab!==ws.activeId)return;state=undo.state;active().state=state;ws.inventory=undo.inventory;undo=null;render();toast(T('已撤销上一步','元に戻しました'))}
 function changedEquipment(){state.sameName=false;restoreBase();render();toast(T('装备已更新；同名加成已取消，请按需要重新勾选','装備を更新。同名補正を解除しました。必要に応じて再設定してください'))}
 function equipmentAction(source,target,mode){
  if(!Number.isInteger(source)||!Number.isInteger(target)||source<0||source>=6||target<0||target>(mode==='insert'?6:5))return false;
  sync();if(source===target||(mode==='insert'&&target===source+1))return false;
  if(!['copy','swap','insert'].includes(mode))return false;
  if(mode==='copy'&&!itemAt(source))return false;
  recordUndo();
  const all=SLOTS.map((_,i)=>itemAt(i));
  if(mode==='copy'){if(!all[source])return false;all[target]=clone(all[source]);all[target].id=uid()}
  if(mode==='swap')[all[source],all[target]]=[all[target],all[source]];
  if(mode==='insert'){const [item]=all.splice(source,1);all.splice(target>source?target-1:target,0,item)}
  all.forEach((item,i)=>putAt(i,item));changedEquipment();return true;
 }
 function inventoryToSlot(id,index){if(!SLOTS[index])return false;const item=ws.inventory.find(x=>x.id===id);if(!item)return false;recordUndo();putAt(index,item,true);changedEquipment();return true}
 function activate(id){if(!ws.tabs.some(t=>t.id===id))return;cancelDrag();sync();ws.activeId=id;state=active().state;undo=null;render()}
 function addTab(copy=false){sync();const t=newTab(undefined,copy?cleanState(state):blank());ws.tabs.push(t);activate(t.id)}
 function closeTab(id){if(ws.tabs.length===1){toast(T('至少保留一个方案','最低1つのプランが必要です'));return}const t=ws.tabs.find(t=>t.id===id);if(!t)return;if((Object.keys(t.state.equipment).length||t.state.selected.length)&&!confirm(T('关闭此方案？背包中的装备会保留。','このプランを閉じますか？バッグは保持されます。')))return;cancelDrag();const i=ws.tabs.indexOf(t);ws.tabs.splice(i,1);if(ws.activeId===id){ws.activeId=ws.tabs[Math.max(0,i-1)].id;state=active().state}undo=null;render()}
 function renameTab(){const n=prompt(T('方案名称','プラン名'),active().name);if(n?.trim()){active().name=n.trim().slice(0,80);render()}}
 function renderTabs(){
  $('#planTabs').innerHTML=ws.tabs.map(t=>`<div class="planTab ${t.id===ws.activeId?'active':''}"><button role="tab" aria-selected="${t.id===ws.activeId}" data-tab="${esc(t.id)}">${esc(t.name)}</button><button class="tabClose" data-close="${esc(t.id)}" aria-label="${T('关闭','閉じる')}">×</button></div>`).join('')+`<button id="addPlan" title="${T('新增空白方案','新規プラン')}" aria-label="${T('新增方案','プラン追加')}">＋</button>`;
  $$('#planTabs [data-tab]').forEach(b=>b.onclick=()=>activate(b.dataset.tab));$$('#planTabs [data-close]').forEach(b=>b.onclick=()=>closeTab(b.dataset.close));$('#addPlan').onclick=()=>addTab();$('#undoWorkspace').disabled=!undo||undo.tab!==ws.activeId;
 }
 validationError=function(){
  if(!state.equipment?.['本体']&&!state.slots['本体'].length)return T('请在第一个位置放入本体','先頭の位置に本体を置いてください');
  const n=state.slots['本体'].length;
  const used=SLOTS.slice(1).filter(s=>state.equipment?.[s]||state.slots[s].length);
  if(!used.length)return T('请至少设置1件素材','素材を1つ以上設定してください');
  const bad=used.find(s=>state.slots[s].length<n);
  return bad?T(`第${SLOTS.indexOf(bad)+1}位置的素材需要至少${n}孔`,`位置${SLOTS.indexOf(bad)+1}の素材は${n}枠以上必要です`):'';
 };
 const usedCount=()=>SLOTS.slice(1).filter(s=>state.equipment?.[s]||state.slots[s].length).length;
 slotPenalty=function(n){const bs=state.slots['本体'].length;if(n<=bs)return 1;const table=usedCount()>=2?[1,1,.90,.85,.70,.60,.55,.40,.30]:[1,1,.85,.75,.60,.50,.45,.35,.30];return table[Math.min(bs+1,8)]||.30};
 sameNameMultiplier=function(){return state.sameName?(usedCount()>=2?1.15:usedCount()===1?1.10:1):1};
 rawRate=function(a,counts,all){const factor=SLOTS.some(s=>state.factor[s].includes(a.code)||state.equipment?.[s]?.innateFactors?.includes(a.code));return window.PSO2_RULES.rawRate(a,counts,all,factor,state.lowRarityWeapon===true)};
 toggleFactor=function(slot,code){undo=null;if(ability(code)?.group==='レセプター'){toast(T('受体不能设置为可继承的固有因子','レセプターは継承用の固有因子に指定できません'));return}if(state.equipment?.[slot]?.innateFactors?.includes(code)){state.equipment[slot].innateFactors=state.equipment[slot].innateFactors.filter(c=>c!==code);state.factor[slot]=state.factor[slot].filter(c=>c!==code);render()}else original.toggleFactor(slot,code)};
 function checkRun(){
  const c=candidates();if(c.err)return c.err;
  if(!state.selected.length)return T('请选择要追加的能力','追加する能力を選択してください');
  if(state.selected.length>Math.min(8,state.slots['本体'].length+1))return T('选择数量超限：一次最多扩孔1孔，请取消多余能力','選択数超過：拡張は1枠までです。能力を減らしてください');
  const seen=new Set(),families=new Set();
  for(const code of state.selected){const a=ability(code),f=familyKey(a);if(seen.has(code)||(f&&families.has(f)))return T('已选能力重复或互斥','選択した能力が重複・競合しています');seen.add(code);if(f)families.add(f);if(!c.list.some(a=>a.code===code))return T('部分已选能力不再可用，请取消无效能力','選択した能力に無効な候補があります。解除してください');}
  return '';
 }
 function makeResult(random=Math.random){
  sync();const err=checkRun();if(err)throw Error(err);
  const n=state.selected.length,c=candidates();
  const entries=state.selected.map(code=>{const a=c.list.find(a=>a.code===code);return {code,rate:finalRate(a.base,n,a)}});
  for(const e of entries)e.success=e.rate>=100||(e.rate>0&&random()<e.rate/100);
  const base=itemAt(0),name=T('追加结果','追加結果')+String(ws.counter+1).padStart(3,'0');
  const intrinsic=[...new Set([...base.innateFactors,...base.factors])];
  const item={...base,id:uid(),name,abilities:entries.filter(e=>e.success).map(e=>e.code),factors:[],innateFactors:intrinsic};
  const inventoryStatus=state.abilityProtection&&entries.some(e=>!e.success)?'protected':'stored';
  return {item,result:{name,entries,protection:state.abilityProtection,time:new Date().toISOString(),inventoryStatus}};
 }
 let running=false;
 function startAffix(){if(running)return;try{running=true;const {item,result}=makeResult();ws.counter++;if(result.inventoryStatus==='stored')ws.inventory.push(item);active().lastResult=result;undo=null;render();showResult(result)}catch(e){toast(e.message);running=false}}
 function resultList(entries,success){const rows=entries.filter(e=>e.success===success);return rows.length?`<ul class="resultList">${rows.map(e=>`<li><span>${esc(displayName(ability(e.code)))}</span><b>${e.rate}%</b></li>`).join('')}</ul>`:`<p class="muted">${T('无','なし')}</p>`}
 function showResult(r){if(!r)return;openModal(T('追加结果','追加結果'),`<p><b>${esc(r.name)}</b> · ${T('成功','成功')} ${r.entries.filter(e=>e.success).length}/${r.entries.length}</p><div class="resultColumns"><section class="success"><h3>${T('成功的能力','成功した能力')}</h3>${resultList(r.entries,true)}</section><section class="failure"><h3>${T('失败的能力','失敗した能力')}</h3>${resultList(r.entries,false)}</section></div><p>${r.inventoryStatus==='protected'?T('本次存在失败，已按能力保护设置取消入库。','失敗があるため、保護設定によりバッグへの保存を取り消しました。'):T('本次结果已存入背包。','今回の結果はバッグに保存済みです。')} ${T('本体和素材不消耗；重新查看不会再次抽取。','本体・素材は消費しません。再表示しても再抽選しません。')}</p><p class="notice">${T('能力保护：','特殊能力保護：')}${r.protection?T(r.protection+'孔以下',r.protection+'枠以下'):T('不使用','使用しない')} — ${T('不改变成功率；选择任一保护时，存在失败的结果不存入背包。','成功率は変わりません。いずれかの保護を使用した場合、失敗のある結果はバッグに保存しません。')}</p>`)}
 function renderRunControls(){
  const box=$('#affixActions');if(!box)return;
  const err=checkRun(),res=candidates();
  const invalid=state.selected.filter(c=>!res.list.some(a=>a.code===c));
  box.innerHTML=`${invalid.length?`<div class="invalidSelected">${invalid.map(c=>`<button data-invalid="${esc(c)}">× ${esc(displayName(ability(c)))} ${T('（无效）','（無効）')}</button>`).join('')}</div>`:''}<div class="runHint ${err?'invalid':''}">${esc(err||T('可开始追加；各项概率独立判定','追加可能。能力ごとに独立判定'))}</div><div class="runButtons"><button id="startAffix" class="primary" ${err?'disabled':''}>${T('开始追加','能力追加を開始')}</button><button id="lastResult" ${active()?.lastResult?'':'disabled'}>${T('上次结果','前回の結果')}</button></div><div class="small">${T('练习模式 · 不消耗素材 · 使用保护时有失败不入库','練習モード · 素材消費なし · 保護使用時の失敗結果は保存しません')}</div>`;
  $('#startAffix').onclick=startAffix;$('#lastResult').onclick=()=>showResult(active().lastResult);
  $$('[data-invalid]').forEach(b=>b.onclick=()=>{state.selected=state.selected.filter(c=>c!==b.dataset.invalid);render()});
 }
 renderSummary=function(){original.renderSummary();renderRunControls();if(ready&&!rendering)saveHash()};
 function describeItem(item){return [item.name||T('未命名装备','名前なし'),`${item.abilities.length}S`,...item.abilities.map(c=>displayName(ability(c))),...(item.innateFactors.length?[T('固有因子：','固有因子：')+item.innateFactors.map(c=>displayName(ability(c))).join(' / ')]:[]),...(item.lifeGuidance?[T('生命之引导 +10%','生命の導き +10%')]:[]),...(item.lowRarityWeapon?[T('★12以下武器','★12以下の武器')]:[])].join('\n')}
 function copyInventory(id){const item=ws.inventory.find(x=>x.id===id);if(!item)return;recordUndo();const copy=clone(item);copy.id=uid();copy.name=(copy.name||T('装备','装備'))+T(' 副本',' コピー');ws.inventory.push(copy);render()}
 function deleteInventory(id){if(!ws.inventory.some(x=>x.id===id))return;recordUndo();ws.inventory=ws.inventory.filter(x=>x.id!==id);closeModal();render()}
 function showItem(id){const item=ws.inventory.find(x=>x.id===id);if(!item)return;openModal(item.name||T('装备详情','装備の詳細'),`<p>${item.abilities.length}S</p><ul>${item.abilities.map(c=>`<li>${esc(displayName(ability(c)))}</li>`).join('')||`<li>${T('零孔装备（无能力）','0枠装備（能力なし）')}</li>`}</ul>${item.innateFactors.length?`<p>${T('本体固有因子：','本体の固有因子：')}${item.innateFactors.map(c=>esc(displayName(ability(c)))).join(' / ')}</p>`:''}<div class="modalActions"><button id="renameItem">${T('重命名','名前変更')}</button><button id="editItem">${T('编辑能力','能力を編集')}</button><button id="copyItem">${T('复制','コピー')}</button><button id="deleteItem">${T('删除','削除')}</button></div>`);$('#renameItem').onclick=()=>{const n=prompt(T('装备名称','装備名'),item.name);if(n?.trim()){item.name=n.trim().slice(0,80);render();showItem(id)}};$('#editItem').onclick=()=>editItemDialog(id);$('#copyItem').onclick=()=>{copyInventory(id);toast(T('已复制到背包','バッグにコピーしました'))};$('#deleteItem').onclick=()=>deleteInventory(id)}
 function equipmentError(codes){
  if(!Array.isArray(codes)||codes.length>8)return T('孔数必须为0～8孔','スロット数は0～8枠です');
  const seen=new Set(),families=new Set();
  for(const c of codes){const a=ability(c);if(!a)return T('请为每个孔位选择有效能力','各スロットに有効な能力を選択してください');const f=familyKey(a);if(a.special!=='junk'&&(seen.has(c)||(f&&families.has(f))))return T('不能同时放入重复或互斥能力：','重複・競合する能力は配置できません：')+displayName(a);seen.add(c);if(f)families.add(f)}
  return '';
 }
 function updateInventoryItem(id,codes,innate){
  const item=ws.inventory.find(x=>x.id===id);if(!item)throw Error(T('装备已不存在','装備が見つかりません'));
  const error=equipmentError(codes);if(error)throw Error(error);
  const next=clone(item);next.abilities=[...codes];next.factors=item.factors.filter(c=>codes.includes(c));
  if(innate!==undefined){if(!Array.isArray(innate)||innate.some(c=>!item.innateFactors.includes(c)))throw Error(T('固有因子设置无效','固有因子の指定が無効です'));next.innateFactors=[...new Set(innate)];next.factors=next.factors.filter(c=>!item.innateFactors.includes(c)||next.innateFactors.includes(c))}
  recordUndo();ws.inventory[ws.inventory.findIndex(x=>x.id===id)]=next;render();return clone(next);
 }
 function editItemDialog(id){
  const item=ws.inventory.find(x=>x.id===id);if(!item)return;
  let codes=[...item.abilities],innate=[...item.innateFactors];
  openModal(T('编辑背包装备能力','バッグ装備の能力編集'),`<p><b>${esc(item.name||T('未命名装备','名前なし'))}</b></p><div class="editorToolbar"><label>${T('孔数','スロット数')} <select id="editSlots">${Array.from({length:9},(_,i)=>`<option value="${i}" ${i===codes.length?'selected':''}>${i}S</option>`).join('')}</select></label><label class="editorSearchLabel">${T('筛选能力','能力検索')} <input id="editAbilitySearch" placeholder="${T('搜索中文 / 日文（支持平假名）','日本語・中国語名で検索（ひらがな可）')}"></label></div><p class="small">${T('可选全部能力，包括追加道具专属能力和受体。编辑不会自动赋予继承资格；新增能力不会自动变成因子。','追加アイテム専用能力・レセプターを含む全能力を選択できます。編集で継承条件や因子属性は付与されません。')}</p><div id="equipmentEditorRows"></div><div id="editorIntrinsic">${innate.length?`<p>${T('原装备固有因子（取消勾选可移除）：','元の固有因子（チェック解除で削除）：')}</p>`+innate.map(c=>`<label><input type="checkbox" data-keep-factor="${esc(c)}" checked>${esc(displayName(ability(c)))}</label>`).join(''):''}</div><p id="editorError" role="status"></p><div class="modalActions"><button id="saveItemEdit" class="primary">${T('保存修改','変更を保存')}</button><button id="cancelItemEdit">${T('取消','キャンセル')}</button></div>`);
  const updateError=()=>{const error=equipmentError(codes);$('#editorError').textContent=error;$('#saveItemEdit').disabled=!!error};
  const renderRows=()=>{
   const q=$('#editAbilitySearch').value.trim();
   const query=window.normalizeAbilitySearch(q);
   const all=DATA.filter(a=>!query||window.normalizeAbilitySearch(`${a.name} ${a.nameZh||''}`).includes(query)).sort((a,b)=>displayName(a).localeCompare(displayName(b),zh?'zh-CN':'ja'));
   $('#equipmentEditorRows').innerHTML=codes.length?codes.map((code,i)=>{const choices=all.some(a=>a.code===code)?all:[ability(code),...all].filter(Boolean);return `<label class="editorRow"><b>${i+1}</b><select data-edit-slot="${i}" aria-label="${T('第','スロット')}${i+1}${T('孔能力','の能力')}">${choices.map(a=>`<option value="${esc(a.code)}" ${a.code===code?'selected':''}>${esc(displayName(a))}${zh&&displayName(a)!==a.name?' / '+esc(a.name):''}</option>`).join('')}</select><span>${esc(ability(code)?.effectZh&&zh?ability(code).effectZh:ability(code)?.effect||'')}</span></label>`}).join(''):`<p class="muted">${T('零孔装备：不带任何能力，仍可拖入本体或素材位置。','0枠装備：能力はありませんが、本体・素材欄へ配置できます。')}</p>`;
   $$('[data-edit-slot]').forEach(select=>select.onchange=()=>{codes[+select.dataset.editSlot]=select.value;renderRows()});updateError();
  };
  $('#editSlots').onchange=e=>{const n=Number(e.target.value);codes=codes.slice(0,n);while(codes.length<n)codes.push('JUNK00');renderRows()};
  $('#editAbilitySearch').oninput=renderRows;
  $$('[data-keep-factor]').forEach(i=>i.onchange=()=>{innate=$$('[data-keep-factor]:checked').map(x=>x.dataset.keepFactor)});
  $('#cancelItemEdit').onclick=()=>showItem(id);
  $('#saveItemEdit').onclick=()=>{try{updateInventoryItem(id,codes,innate);showItem(id);toast(T('已修改背包装备；方案中已有副本保持不变','バッグ装備を変更しました。プラン内の既存コピーは変更しません'))}catch(e){$('#editorError').textContent=e.message}};
  renderRows();
 }

 function equipmentToInventory(index){
  if(!Number.isInteger(index)||index<0||index>=SLOTS.length)return false;
  sync();const item=itemAt(index);
  if(!item){toast(T('空位置没有可存入的装备','空き位置には保存できる装備がありません'));return false}
  recordUndo();item.id=uid();if(!item.name)item.name=T('素材','素材')+(index+1)+' · '+item.abilities.length+'S';
  ws.inventory.push(item);render();toast(T('已复制到道具背包，原素材保留','バッグへコピーしました。元の素材はそのままです'));return true;
 }
 function renderInventory(){
  $('#inventoryCount').textContent=ws.inventory.length;
  $('#inventoryGrid').innerHTML=ws.inventory.map(item=>`<div class="inventoryTile"><button class="inventoryItem" draggable="true" data-item="${esc(item.id)}" title="${esc(describeItem(item))}" aria-label="${esc(describeItem(item))}"><strong>${item.abilities.length}S</strong><span>${esc(item.name||T('装备','装備'))}</span></button><button type="button" class="inventoryDelete" data-delete-item="${esc(item.id)}" title="${T('删除装备','装備を削除')}" aria-label="${T('删除装备：','装備を削除：')}${esc(item.name||T('未命名装备','名前なし'))}">×</button></div>`).join('')||`<p class="muted">${T('拖动素材标题到这里可生成装备副本；追加结果也会存入这里。','素材タイトルをここへドラッグすると装備をコピーできます。追加結果も保存します。')}</p>`;
  $$('.inventoryDelete').forEach(b=>{b.onclick=e=>{e.preventDefault();e.stopPropagation();deleteInventory(b.dataset.deleteItem)};b.ondragstart=e=>e.preventDefault()});
  $$('.inventoryItem').forEach(b=>{b.onclick=()=>showItem(b.dataset.item);b.ondragstart=e=>{drag={type:'inventory',id:b.dataset.item,tab:ws.activeId};e.dataTransfer.effectAllowed='copy';e.dataTransfer.setData('text/plain',JSON.stringify(drag));document.body.classList.add('equipmentDragging')};b.ondragend=cancelDrag});
 }
 function openModal(title,html){lastFocused=document.activeElement;$('#workspaceDialogTitle').textContent=title;$('#workspaceDialogBody').innerHTML=html;const d=$('#workspaceDialog');if(!d.open)d.showModal();$('#closeDialog').focus()}
 function closeModal(){const d=$('#workspaceDialog');if(d.open)d.close()}
 function guardianDialog(){
  const name=n=>{const label=displayName(byName(n))||n;return `<span class="recipeAbility" title="${esc(n)}">${esc(label)}${zh&&label!==n?`<small class="recipeJP">${esc(n)}</small>`:''}</span>`};
  const rows=window.GUARDIAN_RECIPES.map(r=>{
   const recipe=r.parts.map(p=>p.names.length===1?name(p.names[0])+` ×${p.count||1}`:`〔${p.names.map(name).join(' / ')}〕${T('中任选','から')}${p.choose||1}${T('种，各1个','種類を各1個')}`).join(' ＋ ');
   return `<tr><th>${name(r.name)}</th><td>${recipe}</td><td>${r.rate}%</td></tr>`;
  }).join('');
  const transfer=[
   ['ガーディアン・ソール','—','ソールレセプター',10,'※14'],['アストラル・ソール','—','ソールレセプター',10,'※14'],['エーテル・ファクター','—','ファクターレセプター',10,'※14'],['マナ・レヴリー','—','レヴリーレセプター',10,'※14'],['アブソリュート・グレア','—','グレアレセプター',10,'※14'],
   ['ソール・カタリスト','— / 10% / 30%','カタリストレセプター',100,'※7・11'],['ファクター・カタリスト','— / 10% / 30%','カタリストレセプター',100,'※7・11'],['レヴリー・カタリスト','— / 10% / 30%','カタリストレセプター',100,'※7・11'],['グレア・カタリスト','—','カタリストレセプター',100,'※7・11'],
   ['エーテル・ソール','— / 50% / 80%','ソールレセプター',100,'※11'],['オメガ・メモリア','— / 50% / 80%','',0,''],['フォトナー・グレア','30% / 50% / 50%','グレアレセプター',100,'※11']
  ].map(([n,rate,receptor,value,note])=>`<tr><th>${name(n)}</th><td>${rate}</td><td>${receptor?`${name(receptor)} → ${value}%`:'—'} ${note}</td></tr>`).join('');
  openModal(T('守护魂完整合成链','ガーディアン・ソール 合成レシピ'),`<p>${T('先分别制作中间能力，再制作四个上位能力，最后合成守护魂。每行是独立的一次追加；不能在同一轮自动连锁合成。','中間能力、4つの上位能力、ガーディアン・ソールの順に作成します。各行は別の追加操作です。同じ操作内で連鎖合成はできません。')}</p><p>${T('以下为基础概率，未计扩孔、同名补正或成功率辅助。×4表示同名能力需要在4件装备上分别存在；同系互斥能力需分开放置。','以下は基礎確率です。拡張・同名補正・補助を含みません。×4は4つの装備に同じ能力が必要です。競合する能力は別々の装備に配置します。')}</p><div class="tableScroll"><table><thead><tr><th>${T('产物','生成能力')}</th><th>${T('材料配方','必要素材')}</th><th>${T('合成','合成')}</th></tr></thead><tbody>${rows}</tbody></table></div><h3>${T('已有能力的继承（与合成配方分开）','既存能力の継承（合成とは別）')}</h3><div class="tableScroll"><table><thead><tr><th>${T('能力','能力')}</th><th>${T('同名1 / 2 / 3个以上','同名1 / 2 / 3個以上')}</th><th>${T('对应受体＋该能力至少1个','対応レセプター＋能力1個以上')}</th></tr></thead><tbody>${transfer}</tbody></table></div><ul><li>※7 ${T('闪触媒不适用其他触媒的普通继承概率。','グレア・カタリストには他のカタリストの通常継承確率を適用しません。')}</li><li>※11 ${T('“—”表示不能普通继承；有对应受体时按受体路线处理，受体本身不能代替目标能力。','「—」は通常継承不可。対応レセプターで継承可能になりますが、対象能力も必要です。')}</li><li>※14 ${T('上位能力需要对应受体才能继承，基础10%；不会因增加同名能力或素材能力加成而提高此路线。成功率道具、报酬期间等最终补正仍按模拟器计算。','上位能力は対応レセプターで基礎10%継承。同名数・素材能力によるボーナスはありません。成功率補助などの最終補正は適用されます。')}</li><li>${T('光子闪的神性加成只提高继承，不提高10%的特殊合成；欧米伽记忆没有本表中的专用受体继承路线。','フォトナー・グレアのディバイン補正は継承のみで、10%の特殊合成には適用しません。オメガ・メモリアには本表の専用レセプター継承ルートはありません。')}</li></ul><p><a href="https://pso2.swiki.jp/index.php?%E7%89%B9%E6%AE%8A%E8%83%BD%E5%8A%9B%E8%BF%BD%E5%8A%A0" target="_blank" rel="noopener">PSO2 swiki · 特殊能力追加</a></p>`);
 }
 function clearHighlights(){$$('.dropHint,.insertActive,.dropSwap,.dropCopy,.inventoryReceiving').forEach(x=>x.classList.remove('dropHint','insertActive','dropSwap','dropCopy','inventoryReceiving'))}
 function cancelDrag(){if(press){clearTimeout(press.timer);try{press.el.releasePointerCapture(press.pointer)}catch{}press=null}drag=null;clearHighlights();document.body.classList.remove('equipmentDragging');$('#dragGhost')?.remove();}
 function targetAt(x,y,ctrl){const el=document.elementFromPoint(x,y);if(!el)return null;if(el.closest('#inventoryGrid,.inventoryTitle'))return {mode:'inventory',el:$('#inventoryGrid')};const gap=el.closest('.insertTarget');if(gap)return ctrl?null:{mode:'insert',index:+gap.dataset.insert,el:gap};const m=el.closest('.mat');return m?{mode:ctrl?'copy':'swap',index:SLOTS.indexOf(m.dataset.slot),el:m}:null}
 function highlight(target){clearHighlights();if(!target)return;target.el.classList.add(target.mode==='inventory'?'inventoryReceiving':target.mode==='insert'?'insertActive':target.mode==='copy'?'dropCopy':'dropSwap')}
 function setupHeaderDrag(head,index){
  head.onpointerdown=e=>{
   if(e.button!==0||e.target.closest('button'))return;
   cancelDrag();const el=e.currentTarget;
   press={el,pointer:e.pointerId,x:e.clientX,y:e.clientY,index,armed:false};
   try{el.setPointerCapture(e.pointerId)}catch{}

  };
  head.onpointermove=e=>{
   if(!press||press.pointer!==e.pointerId)return;
   if(!press.armed){
    if(Math.hypot(e.clientX-press.x,e.clientY-press.y)<4)return;
    press.armed=true;drag={type:'equipment',index:press.index,tab:ws.activeId};document.body.classList.add('equipmentDragging');
    const ghost=document.createElement('div');ghost.id='dragGhost';ghost.textContent=T('拖动素材 · Ctrl复制','素材を移動 · Ctrlでコピー');document.body.appendChild(ghost);
   }
   e.preventDefault();const g=$('#dragGhost');if(g){g.style.left=(e.clientX+12)+'px';g.style.top=(e.clientY+12)+'px'}highlight(targetAt(e.clientX,e.clientY,e.ctrlKey));
  };
  head.onpointerup=e=>{
   if(!press||press.pointer!==e.pointerId)return;
   const from=press.index,armed=press.armed,target=armed?targetAt(e.clientX,e.clientY,e.ctrlKey):null,tab=drag?.tab;
   cancelDrag();if(armed&&target&&tab===ws.activeId){if(target.mode==='inventory')equipmentToInventory(from);else equipmentAction(from,target.index,target.mode)}
  };
  head.onpointercancel=cancelDrag;
  head.oncontextmenu=e=>e.preventDefault();
 }
 renderSlots=function(){
  original.renderSlots();
  $$('.mat').forEach((m,index)=>{
   const s=SLOTS[index],item=itemAt(index),h=m.querySelector('.matHead');
   h.innerHTML=`<span>${T('素材','素材')} <small>${index+1}</small> ${index===0?`<b class="baseBadge">${T('本体','本体')}</b>`:''}</span><span>${item?state.slots[s].length+'S':T('空','空')} <button class="equipmentMenu" title="${T('装备操作','装備操作')}" aria-label="${T('装备操作','装備操作')}">⋯</button></span>`;
   h.title=T('按住标题直接拖动；Ctrl复制；间隙插入排序','タイトルを押してドラッグ。Ctrlでコピー、隙間へ挿入');
   m.classList.toggle('baseMaterial',index===0);
   const caption=document.createElement('div');caption.className='equipmentCaption';caption.textContent=item?(item.name||T('未命名装备','名前なし')):T('空位置','空き位置');
   if(item?.lifeGuidance)caption.textContent+=' · '+T('生命+10%','生命+10%');if(item?.lowRarityWeapon)caption.textContent+=' · ★≤12';h.after(caption);
   if(item&&state.slots[s].length===0)m.querySelector('.empty').textContent=T('零孔装备 · 可继续添加能力','0枠装備 · 能力を追加できます');
   const intrinsic=item?.innateFactors||[];
   if(intrinsic.length){const box=document.createElement('div');box.className='intrinsicFactors';box.innerHTML=T('固有因子：','固有因子：')+intrinsic.map(c=>`<button data-intrinsic="${esc(c)}" title="${T('点击取消因子标记','クリックで因子指定を解除')}">${esc(displayName(ability(c)))} ×</button>`).join('');m.appendChild(box);box.querySelectorAll('button').forEach(b=>b.onclick=()=>{undo=null;toggleFactor(s,b.dataset.intrinsic)})}
   m.querySelectorAll('.chip').forEach(ch=>{if(intrinsic.includes(ch.dataset.code)){ch.classList.add('factor');const b=ch.querySelector('[data-act="factor"]');if(b)b.textContent=T('解除因子','因子解除')}});
   const wrap=document.createElement('div');wrap.className='matWrap';m.before(wrap);wrap.appendChild(m);
   const gap=(pos,cls)=>{const g=document.createElement('div');g.className='insertTarget '+cls;g.dataset.insert=pos;g.dataset.label=T(`插入到位置${pos+1}${pos===0?' · 新本体':''}`,`位置${pos+1}へ挿入${pos===0?' · 新本体':''}`);wrap.appendChild(g)};
   gap(index,'before');gap(index,'above');if(index===5)gap(6,'after');
   setupHeaderDrag(h,index);
   h.querySelector('button').onclick=()=>{
    openModal(T(`位置${index+1} · 装备操作`,`位置${index+1} · 装備操作`),`<p>${item?esc(describeItem(item)).replace(/\n/g,'<br>'):T('此位置为空','この位置は空です')}</p><div class="modalActions">${item?`<button id="renameEquipment">${T('重命名','名前変更')}</button><button id="removeEquipment">${T('移除整件装备','装備を外す')}</button>`:`<button id="createEquipment">${T('放入零孔装备','0枠装備を置く')}</button>`}</div>`);
    if(item){$('#renameEquipment').onclick=()=>{const n=prompt(T('装备名称','装備名'),item.name);if(n?.trim()){state.equipment[s].name=n.trim().slice(0,80);closeModal();render()}};$('#removeEquipment').onclick=()=>{recordUndo();putAt(index,null);closeModal();changedEquipment()}}
    else $('#createEquipment').onclick=()=>{recordUndo();putAt(index,{...meta(),abilities:[],factors:[]});closeModal();changedEquipment()};
   };
   m.addEventListener('dragover',e=>{if(drag?.type!=='inventory')return;e.preventDefault();e.stopImmediatePropagation();highlight({mode:'copy',el:m});e.dataTransfer.dropEffect='copy'},true);
   m.addEventListener('drop',e=>{let p;try{p=JSON.parse(e.dataTransfer.getData('text/plain'))}catch{return}if(p.type!=='inventory'&&p.type!=='equipment')return;e.preventDefault();e.stopImmediatePropagation();cancelDrag();if(p.type==='inventory')inventoryToSlot(p.id,index)},true);
  });
 };
 render=function(){if(!ws)return;sync();rendering=true;try{renderTabs();original.render();renderInventory();$('#lifeGuidance').disabled=!state.equipment['本体'];$('#lowRarityWeapon').disabled=!state.equipment['本体']}finally{rendering=false}};
 function exportWorkspace(){const data=JSON.stringify(snapshot(),null,2),url=URL.createObjectURL(new Blob([data],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='PSO2_V27_workspace.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 async function importFile(file){if(!file)return;if(file.size>10*1024*1024){toast(T('存档超过10MB，请检查文件','保存ファイルが10MBを超えています'));return}try{const next=parseWorkspace(JSON.parse(await file.text()));if(!confirm(T('导入将替换全部方案和背包，继续吗？','全プランとバッグを置き換えますか？')))return;ws=next;state=active().state;undo=null;render();toast(T('导入完成','インポートしました'))}catch(e){toast(T('导入失败，原内容未改变：','読込失敗。元の内容は保持されています：')+e.message)}}
 function addUI(){
  $('#materialTitle').textContent=T('素材工作区 · 第一位置为本体','素材ワークスペース · 先頭が本体');
  $('#materialTitle').insertAdjacentHTML('afterend',`<div id="planTabs" role="tablist" aria-label="${T('追加方案','追加プラン')}"></div><div class="planTools"><button id="renamePlan">${T('重命名方案','プラン名変更')}</button><button id="duplicatePlan">${T('复制方案','プラン複製')}</button><button id="undoWorkspace" disabled>${T('撤销上一步','元に戻す')}</button></div><div class="dragInstructions">${T('按住标题拖动：中央交换 · Ctrl覆盖复制 · 间隙插入。第一位置始终是本体；拖到背包可生成副本。','タイトルをドラッグ：中央で交換 · Ctrlで上書きコピー · 隙間へ挿入。先頭は常に本体。バッグへドラッグでコピー。')}</div>`);
  $('#load').insertAdjacentHTML('afterend',`<button id="guardianChain">${T('守护魂合成链','ガーディアン合成')}</button><button id="exportWorkspace">${T('导出文件','エクスポート')}</button><button id="importWorkspace">${T('导入文件','インポート')}</button><input id="workspaceFile" type="file" accept=".json,application/json" hidden>`);
  $('#candidateTitle').insertAdjacentHTML('beforebegin',`<div class="panelTitle inventoryTitle">${T('道具背包','アイテムバッグ')} <span id="inventoryCount">0</span></div><div id="inventoryGrid" data-drop-label="${T('松开以复制到背包','離してバッグにコピー')}"></div>`);
  $('#summary').insertAdjacentHTML('afterend','<div id="affixActions"></div>');
  document.body.insertAdjacentHTML('beforeend',`<dialog id="workspaceDialog" aria-labelledby="workspaceDialogTitle"><div class="dialogHead"><h2 id="workspaceDialogTitle"></h2><button id="closeDialog" aria-label="${T('关闭','閉じる')}">×</button></div><div id="workspaceDialogBody"></div></dialog>`);
  $('#closeDialog').onclick=closeModal;$('#workspaceDialog').addEventListener('close',()=>{running=false;lastFocused?.isConnected&&lastFocused.focus()});
  $('#renamePlan').onclick=renameTab;$('#duplicatePlan').onclick=()=>addTab(true);$('#undoWorkspace').onclick=undoLast;
  $('#guardianChain').onclick=guardianDialog;$('#exportWorkspace').onclick=exportWorkspace;$('#importWorkspace').onclick=()=>$('#workspaceFile').click();$('#workspaceFile').onchange=e=>{const f=e.target.files[0];e.target.value='';importFile(f)};
  document.addEventListener('keydown',e=>{if(e.key==='Escape')cancelDrag()});window.addEventListener('blur',cancelDrag);
  document.addEventListener('dragend',cancelDrag);
  document.addEventListener('change',e=>{if(!e.target.closest('#workspaceDialog')&&e.target.id!=='workspaceFile'){undo=null;if($('#undoWorkspace'))$('#undoWorkspace').disabled=true}},true);
 }
 initApp=function(){addUI();original.initApp();ready=true;
  $('#reset').onclick=()=>{if(confirm(T('清空当前方案？其他方案和背包会保留。','現在のプランをクリアしますか？他のプランとバッグは保持されます。')))resetAll()};
  $('#load').onclick=showSaves;$('#load').textContent=T('存档列表 / 读取','保存一覧 / 読込');
  $('#copy').onclick=async()=>{saveHash();try{if(!navigator.clipboard)throw Error();await navigator.clipboard.writeText(location.href);toast(T('已复制当前方案URL（不含其他标签页和背包）','現在のプランURLをコピーしました（他のプラン・バッグは含みません）'))}catch{openModal(T('当前方案URL','現在のプランURL'),`<p>${T('请复制下方网址。换电脑建议使用导出文件。','下のURLをコピーしてください。別のPCではファイルのエクスポートを推奨します。')}</p><textarea readonly class="urlText">${esc(location.href)}</textarea>`);$('#workspaceDialog textarea').select()}};
  render();
 };
 // Clear stale undo snapshots when editing individual abilities rather than whole equipment.
 const edits={addToSlot,removeFromSlot,moveBetweenSlots,copyBetweenSlots,fillAllWithJunk,clearAllJunk};
 addToSlot=(...args)=>{undo=null;edits.addToSlot(...args)};
 removeFromSlot=(...args)=>{undo=null;edits.removeFromSlot(...args)};
 moveBetweenSlots=(...args)=>{undo=null;edits.moveBetweenSlots(...args)};
 copyBetweenSlots=(...args)=>{undo=null;edits.copyBetweenSlots(...args)};
 fillAllWithJunk=(...args)=>{undo=null;edits.fillAllWithJunk(...args)};
 clearAllJunk=(...args)=>{undo=null;const placeholders=SLOTS.filter(s=>state.slots[s].length&&state.slots[s].every(c=>ability(c)?.special==='junk')&&!state.equipment?.[s]?.innateFactors?.length);edits.clearAllJunk(...args);for(const s of placeholders)delete state.equipment[s];restoreBase();render()};
 window.Workspace={snapshot,parseWorkspace,equipmentAction,equipmentToInventory,inventoryToSlot,addTab,activate,closeTab,undoLast,checkRun,makeResult,startAffix,copyInventory,deleteInventory,showItem,guardianDialog,closeModal,importFile,showSaves,deleteSave,readArchive,editItemDialog,updateInventoryItem};
};
