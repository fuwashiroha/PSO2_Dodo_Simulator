(function(){
'use strict';
window.installCompactUI=function({T,ability,displayName}){
 const $=selector=>document.querySelector(selector),all=selector=>[...document.querySelectorAll(selector)];
 const icon=key=>`<img class="ui-icon" src="icons/${key}.png" width="13" height="13" alt="" aria-hidden="true">`;
 const abilityIcon=a=>a?.special==='sop'?'sop':/^S-ATK[+-]\d+$/.test(a?.effect||'')?'s':/^R-ATK[+-]\d+$/.test(a?.effect||'')?'r':/^T-ATK[+-]\d+$/.test(a?.effect||'')?'t':'ability';
 const heading=(element,key,text)=>{element.replaceChildren();element.insertAdjacentHTML('afterbegin',icon(key));element.append(document.createTextNode(text));};
 const layout=$('.layout'),right=$('.right'),center=$('.center');
 const nav=$('#planTabs');nav.classList.add('app-nav');$('header').after(nav);
 $('#save').after($('#load'),$('#guardianChain'));
 const main=document.createElement('main');main.className='app-main';layout.before(main);main.append(layout);
 const bagPanel=document.createElement('section');bagPanel.className='compact-side-panel inventory-preview';bagPanel.id='inventoryPanel';
 const bagTitle=$('.inventoryTitle'),bagGrid=$('#inventoryGrid');bagPanel.append(bagTitle,bagGrid);
 const ratePanel=document.createElement('section');ratePanel.className='compact-side-panel rate-panel';
 const rateTitle=document.createElement('div');rateTitle.className='panelTitle';heading(rateTitle,'support',T('追加成功率','追加成功率'));ratePanel.append(rateTitle,$('#summary'));
 const candidatesPanel=document.createElement('section');candidatesPanel.className='compact-side-panel candidates-panel';candidatesPanel.append($('#candidateTitle'),$('#candidateBody'),$('#affixActions'));
 const controls=$('.controls'),tools=$('.planTools'),junkTools=$('.junkTools'),lowRarity=$('#lowRarityWeapon').closest('label');
 lowRarity.removeAttribute('style');$('#addItemLabel').classList.remove('sameNameControl');
 controls.replaceChildren($('#support').closest('label'),$('#campaign').closest('label'),$('#addItemLabel'),$('#abilityProtectionLabel'),$('#lifeGuidance').closest('label'),$('#sameNameLabel'),lowRarity);tools.append(junkTools,$('#reset'));$('#materialTitle').append(tools);center.insertBefore(controls,$('#materials'));
 right.replaceChildren(bagPanel,ratePanel,candidatesPanel);
 $('.dragInstructions')?.remove();
 const labels={load:T('我的方案','保存プラン'),guardianChain:T('合成配方','合成レシピ'),save:T('保存','保存'),exportWorkspace:T('导出','書出'),importWorkspace:T('导入','読込'),copy:T('分享方案','プラン共有'),reset:T('清空','クリア'),renamePlan:T('改名','名前変更'),duplicatePlan:T('复制','複製'),undoWorkspace:T('撤销','元に戻す'),junkFillBtn:T('填充','埋める'),junkClearBtn:T('清除占位','ゴミ除去')};
 const compactText={supportText:T('成功率道具','成功率補助'),campaignText:T('奖励期间','報酬期間'),sameNameText:T('装备全部同名','全装備が同名'),lifeGuidanceText:T('生命之引导 +10%','生命の導き +10%'),addItemText:T('追加胶囊','追加アイテム'),abilityProtectionText:T('能力保护','能力保護'),junkFillText:T('占位','ゴミ'),junkFillSuffix:'',lowRarityWeaponText:T('★12 以下武器','★12以下の武器')};
 for(const [id,text] of Object.entries(compactText))$('#'+id).textContent=text;
 $('#lowRarityWeapon').closest('label').title=T('究极克星的继承条件：本体为★12以下武器','アルティメットバスターの継承条件：本体が★12以下の武器');
 $('#search').placeholder=T('搜索名称或效果','名前・効果を検索');$('#search').setAttribute('aria-label',T('搜索特殊能力','特殊能力を検索'));$('#group').setAttribute('aria-label',T('能力分类','能力分類'));
 heading($('#listTitle'),'ability',T('特殊能力','特殊能力'));heading($('#candidateTitle'),'ability',T('追加候选','追加候補'));
 const materialLabel=document.createElement('span');materialLabel.innerHTML=icon('workbench')+T('本体与素材','本体・素材');$('#materialTitle').prepend(materialLabel);
 for(const node of [...$('#materialTitle').childNodes])if(node.nodeType===Node.TEXT_NODE)node.remove();
 for(const [id,key] of [['supportText','support'],['addItemText','capsule'],['abilityProtectionText','protection']])$('#'+id).insertAdjacentHTML('afterbegin',icon(key));
 const bagLabel=[...bagTitle.childNodes].find(node=>node.nodeType===Node.TEXT_NODE);if(bagLabel)bagLabel.textContent=T('道具背包','アイテムバッグ');
 function refreshLabels(){for(const [id,text] of Object.entries(labels))$('#'+id).textContent=text;}
 function paintList(){
  for(const row of all('#abilityList .ability')){
   const a=ability(row.dataset.code);row.querySelector('span')?.insertAdjacentHTML('afterbegin',icon(abilityIcon(a)));
   row.title=[displayName(a),a?.name,T(a?.effectZh||a?.effect,a?.effect)].filter(Boolean).join('\n');row.tabIndex=0;row.setAttribute('role','button');
   row.setAttribute('aria-label',T('添加到本体：','本体へ追加：')+displayName(a));row.onkeydown=e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();row.dispatchEvent(new MouseEvent('dblclick',{bubbles:true}));}};
  }
 }
 function paintSlots(){
  for(const [index,card] of all('.mat').entries()){
   const name=card.querySelector('.matHead>span');name.innerHTML=icon('ability')+(index===0?`<b class="baseBadge">${T('本体','本体')}</b>`:T('素材','素材')+index);
   const empty=card.querySelector('.empty');if(empty)empty.textContent=card.querySelector('.matHead>span:last-child').textContent.includes('0S')?T('0 孔装备','0枠装備'):T('空','空き');
   const caption=card.querySelector('.equipmentCaption');if(caption&&[T('空位置','空き位置'),T('未命名装备','名前なし')].includes(caption.textContent))caption.hidden=true;
   for(const chip of card.querySelectorAll('.chip')){const a=ability(chip.dataset.code);chip.insertAdjacentHTML('afterbegin',icon(chip.classList.contains('factor')?'factor':abilityIcon(a)));chip.title=[displayName(a),T(a?.effectZh||a?.effect,a?.effect)].filter(Boolean).join('\n');}
  }
 }
 function paintSummary(){
  $('#summary').querySelectorAll(':scope>.small').forEach(el=>el.remove());
  const rate=$('#summary>div>strong');if(rate){rate.parentElement.classList.add('success-total');const label=rate.parentElement.querySelector('b');if(label)label.textContent=T('全部成功','全成功');}
  const title=$('#summary .statTitle');if(title)title.textContent=T('属性合计','ステータス合計');
  const keys=['s','r','t','dex','sd','rd','td'];all('#summary .statGrid>div>span').forEach((el,i)=>{if(keys[i]&&!el.querySelector('img'))el.insertAdjacentHTML('afterbegin',icon(keys[i]));});
  for(const name of all('#candidateBody .candName'))if(!name.querySelector('img'))name.insertAdjacentHTML('afterbegin',icon(abilityIcon(ability(name.closest('.cand').querySelector('input').dataset.code))));
  $('#affixActions>.small')?.remove();const hint=$('#affixActions .runHint');if(hint&&!hint.classList.contains('invalid'))hint.remove();
  if($('#startAffix'))$('#startAffix').textContent=T('模拟追加','追加シミュレート');
 }
 function paintInventory(){
  const empty=$('#inventoryGrid>.muted');if(empty)empty.textContent=T('暂无装备','装備なし');
  for(const item of all('.inventoryItem'))if(!item.querySelector('img'))item.insertAdjacentHTML('afterbegin',icon('ability'));
 }
 const oldList=renderList;renderList=function(){oldList();paintList();};
 const oldSlots=renderSlots;renderSlots=function(){oldSlots();paintSlots();};
 const oldSummary=renderSummary;renderSummary=function(){oldSummary();paintSummary();};
 const oldRender=render;render=function(){oldRender();refreshLabels();paintInventory();};
 function resize(){const height=$('header').getBoundingClientRect().height+nav.getBoundingClientRect().height;document.documentElement.style.setProperty('--chrome-height',(height||76)+'px');}
 if(typeof ResizeObserver==='function'){const observer=new ResizeObserver(resize);observer.observe($('header'));observer.observe(nav);}window.addEventListener('resize',resize);
 refreshLabels();resize();
};
})();
