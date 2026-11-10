(function(){
'use strict';
const key='pso2-dodo-theme',allowed=['system','light','dark'],media=window.matchMedia('(prefers-color-scheme: dark)');
let choice='system';
try{const saved=localStorage.getItem(key);if(allowed.includes(saved))choice=saved;}catch{}
function apply(value){choice=allowed.includes(value)?value:'system';document.documentElement.dataset.theme=choice==='system'?(media.matches?'dark':'light'):choice;document.documentElement.dataset.themeChoice=choice;}
apply(choice);
media.addEventListener('change',()=>{if(choice==='system')apply(choice)});
document.addEventListener('DOMContentLoaded',()=>{
 const zh=document.documentElement.lang==='zh-CN',label=document.createElement('label');label.className='langLabel themeControl';
 const select=document.createElement('select');select.id='themeColor';select.setAttribute('aria-label',zh?'主题配色':'テーマ');
 const names={system:zh?'跟随系统':'システム',light:zh?'浅色':'ライト',dark:zh?'深色':'ダーク'};
 for(const [value,name] of Object.entries(names)){const option=document.createElement('option');option.value=value;option.textContent=name;select.append(option)}
 select.value=choice;label.append(select);document.querySelector('header .toolbar').prepend(label);
 select.addEventListener('change',()=>{apply(select.value);try{localStorage.setItem(key,choice)}catch{}});
},{once:true});
})();
