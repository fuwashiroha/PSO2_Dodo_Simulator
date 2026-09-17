// Shared by the explanation dialog and recipeRate. Names resolve against data.js.
window.GUARDIAN_RECIPES = [
 {name:'ガーディアン・ソール',rate:10,parts:[{names:['アストラル・ソール']},{names:['エーテル・ファクター']},{names:['マナ・レヴリー']},{names:['アブソリュート・グレア']}]},
 {name:'アストラル・ソール',rate:60,parts:[{names:['ソール・カタリスト'],count:4},{names:['ダークネス・ソール']}]},
 {name:'ソール・カタリスト',rate:10,parts:['エルダー・ソール','ルーサー・ソール','アプレンティス・ソール','ダブル・ソール','ペルソナ・ソール'].map(n=>({names:[n]}))},
 {name:'エーテル・ファクター',rate:60,parts:[{names:['ファクター・カタリスト'],count:4},{names:['エーテル・ソール']}]},
 {name:'ファクター・カタリスト',rate:10,parts:['ヤマト・ファクター','マザー・ファクター','デウス・ファクター'].map(n=>({names:[n]}))},
 {name:'エーテル・ソール',rate:10,parts:[{names:['トウオウ・ソール','フルベガス・ソール','エスカード・ソール'],choose:2}]},
 {name:'マナ・レヴリー',rate:60,parts:[{names:['レヴリー・カタリスト'],count:4},{names:['オメガ・メモリア']}]},
 {name:'レヴリー・カタリスト',rate:10,parts:['エルダー・レヴリー','ルーサー・レヴリー','アプレジナ・レヴリー','ダブル・レヴリー','ペルソナ・レヴリー'].map(n=>({names:[n]}))},
 {name:'オメガ・メモリア',rate:10,parts:['ファーブラ・ソール','イストリア・ソール','オメガ・レヴリー'].map(n=>({names:[n]}))},
 {name:'アブソリュート・グレア',rate:60,parts:[{names:['グレア・カタリスト'],count:4},{names:['フォトナー・グレア']}]},
 {name:'グレア・カタリスト',rate:10,parts:[...['ベルージュ・グレア','フォードルス・グレア','エクゼクル・グレア'].map(n=>({names:[n]})),{names:['アンジュール・グレア','ドゥミヌス・グレア']}]},
 {name:'フォトナー・グレア',rate:10,parts:['ヴァルナ・グレア','ミトラ・グレア','シバ・グレア','オリジン・グレア'].map(n=>({names:[n]}))}
];
