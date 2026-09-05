(function(){
  const texts={
    ja:{title:"PSO2 特殊能力追加シミュレーター V21",lang:"言語",save:"保存",load:"読込",copy:"URLコピー",reset:"クリア",
        list:"特殊能力一覧",search:"能力名を検索",all:"全分類",material:"本体 / 素材",support:"能力追加成功率",none:"無し",
        campaign:"報酬期間",same:"本体・使用素材はすべて同名",tip:"本体と、現在使用している全素材が完全に同じ装備名の場合のみ有効",addItem:"追加アイテム",addItemTip:"使用する特殊能力追加アイテムを1つ選択します",junkFill:"全本体・素材をゴミで",junkFillSuffix:"まで埋める",junkFillBtn:"実行",junkClear:"全ゴミ削除",candidate:"追加候補 / 成功率"},
    "zh-CN":{title:"PSO2 特殊能力追加模拟器 V21",lang:"语言",save:"保存",load:"读取",copy:"复制URL",reset:"清空",
        list:"特殊能力列表",search:"搜索能力名（中文/日文）",all:"全部分类",material:"本体 / 素材",support:"能力追加成功率",none:"无",
        campaign:"奖励期间",same:"本体·使用素材全部同名",tip:"仅当本体与当前使用的全部素材装备名完全相同时生效",addItem:"追加道具",addItemTip:"从下拉列表选择1个特殊能力追加道具，仅将该能力加入追加候选",junkFill:"所有本体和素材用垃圾能力填充至",junkFillSuffix:"孔",junkFillBtn:"执行",junkClear:"删除全部垃圾能力",candidate:"追加候选 / 成功率"}
  };
  let lang=localStorage.getItem("pso2-dodo-language")||"ja";
  if(!texts[lang])lang="ja";
  const t=texts[lang];
  document.documentElement.lang=lang;
  const $=s=>document.querySelector(s);
  $("#language").value=lang; $("#appTitle").textContent=t.title; $("#langText").textContent=t.lang;
  $("#save").textContent=t.save; $("#load").textContent=t.load; $("#copy").textContent=t.copy; $("#reset").textContent=t.reset;
  $("#listTitle").textContent=t.list; $("#search").placeholder=t.search; $("#group").options[0].textContent=t.all;
  $("#materialTitle").textContent=t.material; $("#supportText").textContent=t.support; $("#campaignText").textContent=t.campaign;
  $("#support").options[0].textContent=t.none; $("#campaign").options[0].textContent=t.none;
  $("#sameNameText").textContent=t.same; $("#sameNameLabel").title=t.tip; $("#addItemText").textContent=t.addItem; $("#addItemLabel").title=t.addItemTip; $("#junkFillText").textContent=t.junkFill; $("#junkFillSuffix").textContent=t.junkFillSuffix; $("#junkFillBtn").textContent=t.junkFillBtn; $("#junkClearBtn").textContent=t.junkClear; $("#candidateTitle").textContent=t.candidate;
  $("#language").addEventListener("change",function(){localStorage.setItem("pso2-dodo-language",this.value);location.reload();});
  $("#lowRarityWeaponText").textContent=lang==="zh-CN"?"本体为★12以下武器（究极克星适用条件）":"本体は★12以下の武器（アルティメットバスター用）";
  const s=document.createElement("script"); s.src=lang==="zh-CN"?"app_zh.js":"app_ja.js"; document.body.appendChild(s);
})();