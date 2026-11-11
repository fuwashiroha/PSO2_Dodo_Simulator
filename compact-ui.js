(function(){
'use strict';
window.installCompactUI=function({T,ability,displayName,planName}){
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
 const statsPanel=document.createElement('section');statsPanel.className='compact-side-panel stats-panel';
 const statsTitle=document.createElement('div');statsTitle.className='panelTitle';heading(statsTitle,'dex',T('属性合计','ステータス合計'));const statsBody=document.createElement('div');statsBody.id='attributeSummary';statsPanel.append(statsTitle,statsBody);
 const candidatesPanel=document.createElement('section');candidatesPanel.className='compact-side-panel candidates-panel';const candidateColumns=document.createElement('div');candidateColumns.className='candidate-columns';candidateColumns.setAttribute('aria-hidden','true');candidateColumns.innerHTML=`<span></span><span>${T('能力','能力')}</span><span>${T('基础','基本')}</span><span>${T('最终','最終')}</span>`;candidatesPanel.append($('#candidateTitle'),candidateColumns,$('#candidateBody'),$('#summary'),$('#affixActions'));
 const controls=$('.controls'),tools=$('.planTools'),junkTools=$('.junkTools'),lowRarity=$('#lowRarityWeapon').closest('label');
 lowRarity.removeAttribute('style');$('#addItemLabel').classList.remove('sameNameControl');
 controls.replaceChildren($('#support').closest('label'),$('#campaign').closest('label'),$('#addItemLabel'),$('#abilityProtectionLabel'),$('#lifeGuidance').closest('label'),$('#sameNameLabel'),lowRarity);tools.append(junkTools,$('#reset'));const footer=document.createElement('div');footer.className='workspace-footer';footer.append(tools,controls);center.append(footer);
 right.replaceChildren(bagPanel,candidatesPanel,statsPanel);
 $('.dragInstructions')?.remove();
 const labels={load:T('我的方案','保存プラン'),guardianChain:T('合成配方','合成レシピ'),save:T('保存','保存'),exportWorkspace:T('导出','書出'),importWorkspace:T('导入','読込'),copy:T('分享方案','プラン共有'),reset:T('清空','クリア'),renamePlan:T('改名','名前変更'),duplicatePlan:T('复制','複製'),undoWorkspace:T('撤销','元に戻す'),junkFillBtn:T('填充','埋める'),junkClearBtn:T('清除占位','ゴミ除去')};
 const compactText={supportText:T('成功率道具','成功率補助'),campaignText:T('奖励期间','報酬期間'),sameNameText:T('装备全部同名','全装備が同名'),lifeGuidanceText:T('生命之引导 +10%','生命の導き +10%'),addItemText:T('追加胶囊','追加アイテム'),abilityProtectionText:T('能力保护','能力保護'),junkFillText:T('占位','ゴミ'),junkFillSuffix:'',lowRarityWeaponText:T('★12 以下武器','★12以下の武器')};
 for(const [id,text] of Object.entries(compactText))$('#'+id).textContent=text;
 $('#lowRarityWeapon').closest('label').title=T('究极克星的继承条件：本体为★12以下武器','アルティメットバスターの継承条件：本体が★12以下の武器');
 $('#search').placeholder=T('搜索名称或效果','名前・効果を検索');$('#search').setAttribute('aria-label',T('搜索特殊能力','特殊能力を検索'));$('#group').setAttribute('aria-label',T('能力分类','能力分類'));
 heading($('#listTitle'),'ability',T('特殊能力','特殊能力'));heading($('#candidateTitle'),'ability',T('追加候选','追加候補'));
 const materialLabel=document.createElement('span');materialLabel.className='workspace-name';const titleActions=document.createElement('div');titleActions.className='workspace-title-actions';titleActions.append($('#renamePlan'),$('#duplicatePlan'),$('#undoWorkspace'));$('#materialTitle').prepend(materialLabel);$('#materialTitle').append(titleActions);
 for(const node of [...$('#materialTitle').childNodes])if(node.nodeType===Node.TEXT_NODE)node.remove();
 for(const [id,key] of [['supportText','support'],['addItemText','capsule'],['abilityProtectionText','protection']])$('#'+id).insertAdjacentHTML('afterbegin',icon(key));
 const bagLabel=[...bagTitle.childNodes].find(node=>node.nodeType===Node.TEXT_NODE);if(bagLabel)bagLabel.textContent=T('道具背包','アイテムバッグ');
 function refreshLabels(){for(const [id,text] of Object.entries(labels))$('#'+id).textContent=text;const name=planName();heading(materialLabel,'workbench',name);materialLabel.title=name;}
 function paintList(){
  for(const row of all('#abilityList .ability')){
   const a=ability(row.dataset.code),name=row.querySelector('span'),text=document.createElement('span');text.className='ability-name';text.textContent=name.textContent;name.replaceChildren();name.insertAdjacentHTML('afterbegin',icon(abilityIcon(a)));name.append(text);
   row.title=[displayName(a),a?.name,T(a?.effectZh||a?.effect,a?.effect)].filter(Boolean).join('\n');row.tabIndex=0;row.setAttribute('role','button');
   row.setAttribute('aria-label',T('添加到本体：','本体へ追加：')+displayName(a));row.onkeydown=e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();row.dispatchEvent(new MouseEvent('dblclick',{bubbles:true}));}};
  }
 }
 function paintSlots(){
  for(const [index,card] of all('.mat').entries()){
   const name=card.querySelector('.matHead>span');name.innerHTML=icon('ability')+(index===0?`<b class="baseBadge">${T('本体','本体')}</b>`:T('素材','素材')+index);
   const body=card.querySelector('.matBody');body.querySelector('.empty')?.remove();const usedSlots=body.querySelectorAll('.chip').length;for(let slot=usedSlots;slot<8;slot++)body.insertAdjacentHTML('beforeend',`<div class="slot-placeholder" aria-disabled="true"><span class="slot-ability">${T('未启用','未使用')}</span></div>`);
   const caption=card.querySelector('.equipmentCaption');if(caption&&[T('空位置','空き位置'),T('未命名装备','名前なし')].includes(caption.textContent))caption.hidden=true;
   for(const chip of card.querySelectorAll('.chip')){const a=ability(chip.dataset.code);chip.querySelector(':scope>span').classList.add('slot-ability');chip.insertAdjacentHTML('afterbegin',icon(chip.classList.contains('factor')?'factor':abilityIcon(a)));chip.title=[displayName(a),T(a?.effectZh||a?.effect,a?.effect)].filter(Boolean).join('\n');}
  }
 }
 function paintSummary(){
  $('#summary').querySelectorAll(':scope>.small').forEach(el=>el.remove());
  const rate=$('#summary>div>strong');if(rate){rate.parentElement.classList.add('success-total');const label=rate.parentElement.querySelector('b');if(label)label.textContent=T('全部成功','全成功');}
  const keys=['s','r','t','dex','sd','rd','td'];all('#summary .statGrid>div>span').forEach((el,i)=>{if(keys[i]&&!el.querySelector('img'))el.insertAdjacentHTML('afterbegin',icon(keys[i]));});
  const stats=$('#summary .statSummary');if(stats){stats.querySelector('.statTitle')?.remove();statsBody.replaceChildren(stats);}
  for(const name of all('#candidateBody .candName')){const row=name.closest('.cand'),a=ability(row.querySelector('input').dataset.code);if(!name.querySelector('img'))name.insertAdjacentHTML('afterbegin',icon(abilityIcon(a)));row.title=[displayName(a),T(a?.effectZh||a?.effect,a?.effect)].filter(Boolean).join('\n');row.querySelector('.base').title=T('基础成功率','基本成功率');row.querySelector('strong').title=T('最终成功率','最終成功率');}
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
