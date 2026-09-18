/* Transfer uses no affixing probabilities or affixing bonuses. */
window.installTransfer=function(api){
 const {T,ability,displayName,equipmentError,clone,openModal}=api;
 const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const sop=c=>ability(c)?.special==='sop';
 const capsuleOK=c=>!c||ability(c)?.addItemAvailable===true;
 const fee=n=>({passes:[0,5,5,5,5,15,25,50,100][n],meseta:[0,10000,40000,90000,150000,200000,240000,1456000,1920000][n]});
 function prepare(targetId,sourceId,capsule=''){
  const bag=api.inventory(),target=bag.find(x=>x.id===targetId),source=bag.find(x=>x.id===sourceId);
  if(!capsuleOK(capsule))throw Error(T('请选择有效的追加胶囊','有効な追加カプセルを選択してください'));
  if(!target||!source)throw Error(T('请选择背包中的目标和素材装备','バッグからベースと素材を選択してください'));
  if(target.id===source.id)throw Error(T('目标和素材不能是同一件装备','ベースと素材は別の装備を選択してください'));
  if(target.abilities.length<1||target.abilities.length>8)throw Error(T('目标装备必须为1～8孔','ベース装備は1～8枠である必要があります'));
  const locked=target.abilities.filter(sop),options=source.abilities.flatMap((code,i)=>sop(code)?[]:[{key:'source:'+i,code,origin:'source'}]);
  if(!options.length)throw Error(T('素材装备没有可移植的普通能力','素材に移植可能な通常能力がありません'));
  if(capsule)options.push({key:'capsule',code:capsule,origin:'capsule'});
  return {target,source,locked,options,capacity:target.abilities.length,...fee(target.abilities.length)};
 }
 function preview(targetId,sourceId,capsule,keys){
  const p=prepare(targetId,sourceId,capsule);
  if(!Array.isArray(keys)||new Set(keys).size!==keys.length)throw Error(T('能力选择无效','能力の選択が無効です'));
  const chosen=keys.map(k=>p.options.find(x=>x.key===k));
  if(chosen.some(x=>!x))throw Error(T('选择包含不可移植的能力','移植できない能力が選択されています'));
  if(!chosen.length)throw Error(T('请至少选择1个素材或胶囊能力','素材またはカプセルの能力を1つ以上選択してください'));
  const codes=[...p.locked,...chosen.map(x=>x.code)];
  if(codes.length>p.capacity)throw Error(T('超过目标原有孔数；移植不能扩展目标孔数','元のベース枠数を超えています。移植でベースの枠は拡張できません'));
  const error=equipmentError(codes);if(error)throw Error(error);
  const result=clone(p.target),remainder=clone(p.source);
  result.abilities=codes;remainder.abilities=p.source.abilities.filter(sop);
  // Intrinsic factors belong to equipment, not to the transferred abilities.
  for(const item of [result,remainder]){item.innateFactors=[...new Set([...(item.innateFactors||[]),...(item.factors||[])])];item.factors=(item.factors||[]).filter(c=>item.abilities.includes(c))}
  return {...p,result,remainder,capsuleUsed:chosen.some(x=>x.origin==='capsule')};
 }
 let draft=null;
 function start(){draft={step:1,capsule:'',target:'',source:'',keys:[]};draw()}
 function draw(){
  const d=draft,bag=api.inventory(),name=x=>esc(x.name||T('未命名装备','名前なし'));
  const steps=[T('选择胶囊','カプセル選択'),T('选择目标装备','ベース選択'),T('选择素材装备','素材選択'),T('选择能力并移植','能力選択・移植')];
  let body=`<ol class="transferSteps">${steps.map((s,i)=>`<li class="${i+1===d.step?'current':''}" ${i+1===d.step?'aria-current="step"':''}>${i+1}. ${s}</li>`).join('')}</ol>`;
  const target=bag.find(x=>x.id===d.target),source=bag.find(x=>x.id===d.source);
  body+=`<p class="small">${T('移植必定成功，不使用追加成功率、奖励期间或特殊能力保护。费用仅供参考，不设券或美塞塔余额。','移植は必ず成功します。追加成功率・報酬期間・保護は使用しません。費用は参考表示で、所持数の管理はありません。')}</p>`;
  if(d.step===1){body+=`<label>${T('追加胶囊（最多1个，可不使用）','追加カプセル（1個まで・使用なしも可）')} <select id="transferCapsule"><option value="">${T('不使用','使用しない')}</option>${window.ABILITY_DATA.filter(a=>a.addItemAvailable).map(a=>`<option value="${a.code}" ${a.code===d.capsule?'selected':''}>${esc(displayName(a))}</option>`).join('')}</select></label><p class="small">${T('当前胶囊选单使用模拟器已有的普通能力胶囊目录。S能力从目标装备保留，不从素材移入。','カプセル一覧は既存の通常能力追加アイテムです。S級能力はベースに残り、素材からは移植されません。')}</p>`}
  if(d.step===2||d.step===3)body+=`<p><b>${d.step===2?T('点击背包中的装备，作为移植结果的目标。','バッグの装備をクリックし、移植先に指定します。'):T('点击提供普通能力的素材装备。','通常能力を提供する素材をクリックします。')}</b></p>`;
  body+=`<h3>${T('道具背包','アイテムバッグ')} (${bag.length})</h3><div class="transferBag">${bag.map(x=>{const invalid=d.step===2?x.abilities.length===0:d.step===3?(x.id===d.target||!x.abilities.some(c=>!sop(c))):true;return `<button type="button" data-transfer-item="${esc(x.id)}" class="transferItem ${x.id===d.target||x.id===d.source?'chosen':''}" ${invalid?'disabled':''}><strong>${name(x)} · ${x.abilities.length}S</strong>${x.id===d.target?`<b>${T('目标','ベース')}</b>`:x.id===d.source?`<b>${T('素材','素材')}</b>`:''}<span>${x.abilities.map(c=>esc(displayName(ability(c)))).join(' / ')||T('零孔装备','0枠装備')}</span></button>`}).join('')||`<p>${T('背包为空，请先把工作区装备拖入背包。','バッグが空です。ワークスペースから装備をドラッグしてください。')}</p>`}</div>`;
  body+=`<p>${T('目标：','ベース：')}${target?name(target):'—'}　${T('素材：','素材：')}${source?name(source):'—'}</p>`;
  if(target){const cost=fee(target.abilities.length);body+=`<p class="transferCost">${T('所需移植券','必要な移植パス')}：<strong id="transferPasses">${cost.passes}</strong>　${T('美塞塔','メセタ')}：${cost.meseta.toLocaleString()} <span class="small">${T('按目标移植前','移植前のベース')}${target.abilities.length}S${T('计算（含S能力）','で計算（S級能力を含む）')}</span></p>`}
  if(d.step===4){try{const p=prepare(d.target,d.source,d.capsule);body+=`<h3>${T('选择结果能力','結果の能力を選択')}</h3><p class="small">${T('目标S能力固定保留，占用孔位；未选中的素材普通能力也会清空。胶囊未勾选时不使用。','ベースのS級能力は固定で残り、枠を使います。未選択の素材通常能力も消えます。カプセル未選択時は使用しません。')}</p><div class="transferOptions">${p.locked.map(c=>`<label><input type="checkbox" checked disabled>${esc(displayName(ability(c)))} <small>${T('目标S能力 · 保留','ベースS級能力・保持')}</small></label>`).join('')}${p.options.map(o=>`<label><input type="checkbox" data-transfer-option="${o.key}" ${d.keys.includes(o.key)?'checked':''}>${esc(displayName(ability(o.code)))} <small>${o.origin==='capsule'?T('胶囊','カプセル'):T('素材','素材')}</small></label>`).join('')}</div><div id="transferPreview"></div>`}catch(e){body+=`<p>${esc(e.message)}</p>`}}
  body+=`<p id="transferError" role="status"></p><div class="modalActions">${d.step>1?`<button id="transferBack">${T('上一步','戻る')}</button>`:''}${d.step<4?`<button id="transferNext" class="primary">${T('下一步','次へ')}</button>`:`<button id="transferCommit" class="primary">${T('确认移植并保存到背包','移植してバッグに保存')}</button>`}</div>`;
  openModal(T('特殊能力移植','特殊能力移植'),body);
  if(d.step===1)$('#transferCapsule').onchange=e=>{d.capsule=e.target.value;d.keys=[]};
  document.querySelectorAll('[data-transfer-item]').forEach(b=>b.onclick=()=>{if(d.step===2){d.target=b.dataset.transferItem;if(d.source===d.target)d.source=''}else if(d.step===3)d.source=b.dataset.transferItem;d.keys=[];draw()});
  if($('#transferBack'))$('#transferBack').onclick=()=>{d.step--;draw()};
  if($('#transferNext')){$('#transferNext').disabled=d.step===2?!target:d.step===3?!source:false;$('#transferNext').onclick=()=>{d.step++;draw()}}
  if(d.step===4){const update=()=>{try{const p=preview(d.target,d.source,d.capsule,d.keys);$('#transferError').textContent='';$('#transferPreview').textContent=T('结果：','結果：')+p.result.abilities.map(c=>displayName(ability(c))).join(' / ')+` (${p.result.abilities.length}/${p.capacity}S)`;$('#transferCommit').disabled=false}catch(e){$('#transferError').textContent=e.message;$('#transferPreview').textContent='';$('#transferCommit').disabled=true}};document.querySelectorAll('[data-transfer-option]').forEach(i=>i.onchange=()=>{d.keys=[...document.querySelectorAll('[data-transfer-option]:checked')].map(x=>x.dataset.transferOption);update()});$('#transferCommit').onclick=()=>{try{const p=preview(d.target,d.source,d.capsule,d.keys);api.commit(p);draft=null;openModal(T('移植完成','移植完了'),`<p>${T('结果已保存到背包中的目标装备，素材普通能力已清空。','結果をバッグのベース装備に保存し、素材の通常能力を消去しました。')}</p><div class="resultColumns"><section><h3>${name(p.result)} · ${p.result.abilities.length}S</h3><ul>${p.result.abilities.map(c=>`<li>${esc(displayName(ability(c)))}</li>`).join('')}</ul></section><section><h3>${T('素材剩余能力','素材に残る能力')}</h3><ul>${p.remainder.abilities.map(c=>`<li>${esc(displayName(ability(c)))}</li>`).join('')||`<li>${T('无（零孔装备仍留在背包）','なし（0枠装備はバッグに残ります）')}</li>`}</ul></section></div><p>${T('所需移植券','必要な移植パス')}：${p.passes}　${T('美塞塔','メセタ')}：${p.meseta.toLocaleString()}</p><p class="small">${T('可关闭窗口后使用“撤销上一步”还原两件装备。工作区中的已有副本不变。','閉じた後「元に戻す」で両装備を復元できます。ワークスペースの既存コピーは変わりません。')}</p>`)}catch(e){$('#transferError').textContent=e.message}};update()}
 }
 return {start,prepare,preview,fee};
};
