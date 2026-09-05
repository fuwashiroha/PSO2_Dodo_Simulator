// PSO2 swiki 特殊能力追加 (2026-09-05), including ※1–15 and bonus footnotes.
// Shared by Japanese and Chinese UIs. No DOM dependencies.
(function(){
const DATA=window.ABILITY_DATA, ROM='ⅠⅡⅢⅣⅤⅥ';
const byName=n=>DATA.find(a=>a.name===n);
function countName(counts,n){return counts[byName(n)?.code]||0;}
const BASIC=['パワー','シュート','テクニック','アーム','スタミナ','スピリタ','ボディ','リアクト','マインド'];
const STATUS=['バーン','フリーズ','ショック','ミラージュ','パニック','ポイズン'];
const ELEMENT=['フレイムレジスト','アイスレジスト','ショックレジスト','ウィンドレジスト','ライトレジスト','グルームレジスト'];
const RESIST=['ブロウレジスト','ショットレジスト','マインドレジスト',...ELEMENT];
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

  if(n==='オメガ・メモリア' && ['ファーブラ・ソール','イストリア・ソール','オメガ・レヴリー'].every(x=>countName(counts,x)>0))return 10;
  if(a.special==='ax_max'){const c=countName(counts,'アクス・フィーバー');if(c>=2)return c>=3?60:40;}
  if(a.group==='アビリティ' && a.rank<=3){
    const r=ROM[a.rank-1];
    if([['パワー','シュート','テクニック'],['ボディ','リアクト','マインド']].some(g=>g.every(x=>countName(counts,x+r)>0)))return [80,70,60][a.rank-1];
  }
  if(a.special==='all_resist' && a.rank<=3){
    const r=ROM[a.rank-1];
    if([['ブロウレジスト','ショットレジスト','マインドレジスト'],['フレイムレジスト','アイスレジスト','ショックレジスト'],['ウィンドレジスト','ライトレジスト','グルームレジスト']].some(g=>g.every(x=>countName(counts,x+r)>0)))return [80,70,60][a.rank-1];
  }
  if(a.special==='ji_soul'){
    const old=['グンネ','ジグモル','ヴォル','クォーツ','ファング','ネプト','スノウ','エクス','ヴァーダー','シュレイダ','メデューナ','リンガ','バル'];
    if(old.some(x=>countName(counts,x+'・ソール')>0)){
      const ix={'アクト・ジ・ソール':'イクスアクト・ソール','ティル・ジ・ソール':'イクスティル・ソール','マギー・ジ・ソール':'イクスマギー・ソール','アレス・ジ・ソール':'イクスアレス・ソール'};
      if(countName(counts,ix[n])>0)return 90;
      if(['トウオウ','フルベガス','エスカード','ファーブラ','イストリア'].some(x=>countName(counts,x+'・ソール')>0))return 70;
    }
  }
  return 0;
}
function rawRate(a,counts,all,isFactor=false,lowRarityWeapon=false){
  // ※8 / ※15: five copies AND a <=12-star weapon, never a unit.
  if(a.special==='ultimate_buster')return lowRarityWeapon && (counts[a.code]||0)>=5?100:0;
  if(isFactor)return 100;
  const count=counts[a.code]||0;
  const inputs=all.map(c=>DATA.find(x=>x.code===c)).filter(Boolean);
  const has=sp=>inputs.some(x=>x.special===sp);
  const named=n=>countName(counts,n)>0;
  const boostSoul=inputs.some(x=>(x.soulBoostTargets||[]).some(t=>t===a.group||t===a.name));
  const clamp=r=>Math.min(100,r);
  const boost=(r,b)=>r>0?clamp(r+b):0; // bonus never creates a missing route
  let transfer=count?(a.inherit?.[Math.min(count,3)-1]||0):0;
  let synthesis=recipeRate(a,counts);
  if(a.special==='sop')return count?100:0;
  if(a.special==='junk')return count?100:0;
  if(a.group==='レセプター'||a.special==='photon_collect')return 0;
  // ※14: upper-tier transfer requires a receptor, fixed 10%, no material bonus.
  const upper={guardian_soul:'soul_receptor',astral_soul:'soul_receptor',ether_factor:'factor_receptor',mana_reverie:'reverie_receptor',absolute_glare:'glare_receptor'};
  if(upper[a.special])return Math.max(synthesis,count&&has(upper[a.special])?10:0);
  const receptor={mark:'mark_receptor',divine_will:'divine_receptor',divine_order:'divine_receptor',exceed_energy:'exceed_receptor',phrase:'phrase_receptor',sentence:'sentence_receptor'};
  if(receptor[a.special])return count&&has(receptor[a.special])?100:0;
  if(a.special==='ev')return synthesis;
  if(['soul_catalyst','factor_catalyst','reverie_catalyst','glare_catalyst'].includes(a.special)){
    // ※7: glare catalyst has no ordinary transfer route.
    if(a.special==='glare_catalyst')transfer=0;
    if(count&&has('catalyst_receptor'))transfer=100;
    return Math.max(transfer,synthesis);
  }
  if(a.special==='ji_soul')return Math.max(transfer,synthesis,count&&has('soul_receptor')?50:0);
  if(['soul','soul_standard','ether_soul','ix_soul'].includes(a.special)||a.group==='ソール')return Math.max(transfer,synthesis,count&&has('soul_receptor')?100:0);
  if(a.special==='factor'||a.special==='reverie'){
    const b=boostSoul||(a.special==='reverie'&&named('オメガ・メモリア'))?20:0;
    transfer=boost(transfer,b);
    if(count&&has(a.special==='factor'?'factor_receptor':'reverie_receptor'))transfer=100;
    return Math.max(transfer,synthesis);
  }
  if(a.special==='glare'){
    transfer=boost(transfer,has('divine_order')?30:has('divine_will')?20:0);
    if(count&&has('glare_receptor'))transfer=100;
    // Divine only modifies transfer, never Photoner's 10% synthesis.
    return Math.max(transfer,synthesis);
  }
  if(a.special==='gift'){
    // ※2: both routes gated, and an existing rank cannot replace previous rank.
    if(!has('gift_receptor'))return 0;
    const previous=DATA.find(x=>x.group===a.group&&x.rank===a.rank-1);
    if(previous&&(counts[previous.code]||0)>=3)synthesis=a.rank===2?60:a.rank===3?40:0;
    return Math.max(transfer,synthesis);
  }
  if(a.special==='spirita_alpha')return count?([0,30,50,60,80,100][Math.min(count,5)]):0; // ※12
  if(a.group==='ミューテーション'||a.group==='ドゥーム'){
    // ※10 counts up to five, unlike standard three-copy tables.
    const previous=DATA.find(x=>x.group===a.group&&x.rank===a.rank-1);
    const pc=previous?(counts[previous.code]||0):0;
    if(pc>=3)synthesis=Math.max(synthesis,pc>=5?50:pc===4?30:10);
    return Math.max(transfer,synthesis);
  }
  if(a.group==='アビリティ'||a.special==='all_resist'){
    // ※1: NO same-name rank-up. Bonus belongs to each valid route separately.
    let bonus=0;
    if(a.rank===3){
      if(a.group==='アビリティ')bonus=named('ドゥームブレイクⅢ')?40:named('ドゥームブレイクⅡ')?30:named('ドゥームブレイクⅠ')?20:0;
      else if(boostSoul)bonus=20;
    }
    return Math.max(boost(transfer,bonus),boost(synthesis,bonus));
  }
  if(['ウィンクルム','スティグマ','モデュレイター'].includes(a.name))transfer=boost(transfer,boostSoul?(a.name==='モデュレイター'?10:20):0);
  if(['アルター','フリクト'].includes(a.group)&&count&&has('ext_receptor'))transfer=100;
  const graded=BASIC.includes(a.group)||STATUS.includes(a.group)||RESIST.includes(a.group)||['lesser','returner','crack'].includes(a.special);
  if(graded){
    const previous=DATA.find(x=>x.group===a.group&&x.rank===a.rank-1);
    const pc=previous?(counts[previous.code]||0):0;
    if(pc)synthesis=Math.max(synthesis,a.combine?.[Math.min(pc,3)-1]||0);
    let tb=0,sb=0;
    const basic=BASIC.includes(a.group)||RESIST.includes(a.group),status=STATUS.includes(a.group);
    if(basic||status){
      if(boostSoul){
        if(a.rank===3){tb=status?60:20;sb=status?30:20;}
        if(a.rank===4)sb=20;
      }
      if(a.rank===3){
        if(named('ミューテーションⅠ'))sb=Math.max(sb,status?40:30);
        if(named('ミューテーションⅡ'))sb=Math.max(sb,status?50:40);
      }
      if(a.rank===4&&named('ミューテーションⅡ'))sb=Math.max(sb,30);
      // Bonus table ※1: EXT +20 applies only to <=2 exact target copies.
      if(BASIC.includes(a.group)&&a.rank>=4&&a.rank<=6&&count<=2&&has('ext_receptor'))tb=Math.max(tb,20);
    }
    if(a.special==='returner'&&[3,4].includes(a.rank)&&named('ダークネス・ソール')){tb=Math.max(tb,10);sb=Math.max(sb,10);}
    transfer=boost(transfer,tb);synthesis=boost(synthesis,sb);
    if(count){
      if(has('attack_receptor')&&['パワー','シュート','テクニック','アーム'].includes(a.group)&&[5,6].includes(a.rank))transfer=100;
      if(has('photon_receptor')&&['スタミナ','スピリタ'].includes(a.group)&&[5,6].includes(a.rank))transfer=100;
      if(has('guard_receptor')&&['ボディ','リアクト','マインド'].includes(a.group)&&a.rank===5)transfer=100;
    }
    if(pc>=2&&has('photon_collect')&&(status||ELEMENT.includes(a.group))&&[3,4,5].includes(a.rank))synthesis=Math.max(synthesis,{3:100,4:70,5:50}[a.rank]);
  }
  return Math.max(transfer,synthesis);
}
window.PSO2_RULES={rawRate,recipeRate};
})();
