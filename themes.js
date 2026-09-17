/* Appearance is independent from plans, inventory, rates and save files. */
(function(){
'use strict';
const key='pso2-dodo-theme',names={default:['默认 · 原版','標準 · オリジナル'],light:['简洁浅灰','ライトグレー'],green:['柔和灰绿','ソフトグリーン'],warm:['暖白米色','ウォームベージュ'],dark:['深色石墨','ダークグラファイト']};
let current='default';try{const saved=localStorage.getItem(key);if(Object.hasOwn(names,saved))current=saved}catch{}
function apply(value){current=Object.hasOwn(names,value)?value:'default';if(current==='default')delete document.documentElement.dataset.theme;else document.documentElement.dataset.theme=current}
apply(current);
document.addEventListener('DOMContentLoaded',()=>{
const zh=document.documentElement.lang==='zh-CN',label=document.createElement('label');label.className='langLabel themeControl';const title=document.createElement('span');title.textContent=zh?'主题配色':'テーマ配色';const select=document.createElement('select');select.id='themeColor';select.setAttribute('aria-label',zh?'自选主题颜色':'テーマカラーを選択');for(const [value,text] of Object.entries(names)){const o=document.createElement('option');o.value=value;o.textContent=text[zh?0:1];select.append(o)}select.value=current;label.append(title,select);document.querySelector('header .toolbar').prepend(label);select.addEventListener('change',()=>{apply(select.value);try{localStorage.setItem(key,current)}catch{if(window.toast)window.toast(zh?'配色已应用，但浏览器未允许保存偏好':'配色を適用しましたが、設定を保存できませんでした')}});
});
})();
