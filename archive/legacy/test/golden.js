/* 黄金集：把一组固定输入的求解结果快照下来，每次改动跑一遍 diff。
   纯 import，不需要浏览器——这是拆分之后才做得到的事。
   跑：node test/golden.js        对比快照
       node test/golden.js --save 重新录制（确认改动是预期的之后才做） */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { HK } from '../src/data.js';
import { byId, areaName } from '../src/util.js';
import { tierOf, sumOf, withPin, solve, floorOf, buildSeq } from '../src/solve.js';
import { A_RHYTHM, anchorSight, sightPick, layDay, dayTheme } from '../src/plan.js';
import { anchorCands, anchorScore, constraintOf, anchorTags } from '../src/anchor.js';
import { B_COMPONENTS, B_TOP, B_SEQ } from '../src/scene-b.js';

const SNAP = new URL('./golden.json', import.meta.url);

/* 跟 app.js 里 initA 一致的组件表 —— 求解器要的就是这个形状 */
function comps(){
  return {
    transport:{ label:'往返交通', tiers:HK.transports.map(t=>({id:t.id,name:t.n,price:t.price,minutes:t.extra,note:t.note,down:t.down})) },
    stay:{ label:'住宿', tiers:HK.stays.map(s=>({id:s.id,name:s.n,price:s.price,minutes:s.commute*2,area:s.area,note:s.note,down:s.down})) },
    food:{ label:'餐饮', tiers:HK.foods.map(f=>({id:f.id,name:f.n,price:f.price,minutes:0,note:f.note,down:f.down})) },
    sights:{ label:'逛多少', tiers:HK.sightPlans.map(p=>({id:p.id,name:p.n,price:0,minutes:0,down:p.down})) },
    anchor:{ label:'锚点', tiers:[{id:'__picked',name:'',price:0,minutes:0}] }
  };
}
const BANDS = { lux:[900,1e9], mid:[400,900], econ:[0,400] };
function bandIds(C,band){
  const [lo,hi] = BANDS[band];
  const ids = C.stay.tiers.filter(t=>t.price>=lo&&t.price<hi).map(t=>t.id);
  if (band==='econ' && !ids.includes('none')) ids.push('none');
  return ids;
}

/* ---- 每条用例：所有 slot 已填满的一次完整求解 ---- */
const CASES = [
  { n:'默认 · M+ ＋ 大馆 · 正常作息 · 舒适型 · 茶餐厅 · 1500',
    anchors:['mplus','daikwun'], rhythm:'normal', stay:'mid', food:'cha', budget:1500 },
  { n:'预算砍到 1000',            anchors:['mplus','daikwun'], rhythm:'normal', stay:'mid',  food:'cha',  budget:1000 },
  { n:'预算放到 2000',            anchors:['mplus','daikwun'], rhythm:'normal', stay:'mid',  food:'cha',  budget:2000 },
  { n:'高档型 + 讲究一顿（装不下）', anchors:['mplus','daikwun'], rhythm:'normal', stay:'lux',  food:'fine', budget:1500 },
  { n:'经济型 + 便利店',           anchors:['mplus','daikwun'], rhythm:'normal', stay:'econ', food:'cvs',  budget:1500 },
  { n:'早出早归（夜市排不进）',     anchors:['mplus','daikwun'], rhythm:'early',  stay:'mid',  food:'cha',  budget:1500 },
  { n:'晚出晚归',                 anchors:['mplus','daikwun'], rhythm:'late',   stay:'mid',  food:'cha',  budget:1500 },
  { n:'一近一远 · M+ ＋ 大澳',     anchors:['mplus','taio'],    rhythm:'normal', stay:'mid',  food:'cha',  budget:1500 },
  { n:'山顶 ＋ 庙街',             anchors:['peaktram','temple'],rhythm:'normal', stay:'mid',  food:'cha',  budget:1500 },
  { n:'雨天（默认预报）',          anchors:['mplus','daikwun'], rhythm:'normal', stay:'mid',  food:'cha',  budget:1500, wx:true },
  { n:'不挑餐饮，交给求解器',       anchors:['mplus','daikwun'], rhythm:'normal', stay:'mid',  food:null,   budget:1200 },
  { n:'八号风球（缆车渡轮停运）',   anchors:['peaktram','temple'],rhythm:'normal', stay:'mid', food:'cha',  budget:1500, wind8:true }
];

function run(c){
  const C = comps();
  const R = byId(A_RHYTHM, c.rhythm);
  const wx = c.wind8 ? [{rain:80,wind8:true},{rain:30,wind8:true}]
           : c.wx    ? [HK.weather.d1, HK.weather.d2] : [null,null];
  /* 「逛多少」各档的价格 = 该档实际排进去的门票和 */
  C.sights.tiers.forEach(t=>{
    t.price = sightPick(c.anchors, t.id, c.rhythm, wx[0], wx[1]).paidSum;
  });
  const L = c.anchors.map(id=>anchorSight(id));
  C.anchor.tiers[0].price = L.reduce((n,s)=>n+(s.price||0),0);
  C.anchor.tiers[0].name  = L.map(s=>s.n).join(' ＋ ');

  const allow = { stay:bandIds(C,c.stay), food:null };
  const top = { transport:C.transport.tiers[0].id, stay:allow.stay[0],
                food:C.food.tiers[0].id, sights:C.sights.tiers[0].id, anchor:'__picked' };
  const pin = { stay:null, food:c.food };
  const seq = buildSeq(C, ['food','stay','sights','transport'], allow);
  const r = solve(C, top, seq, c.budget, pin);
  const P = sightPick(c.anchors, r.sel.sights, c.rhythm, wx[0], wx[1]);

  return {
    total:r.total, exhausted:r.exhausted,
    floor:floorOf(C, top, seq, pin),
    sel:{ transport:r.sel.transport, stay:r.sel.stay, food:r.sel.food, sights:r.sel.sights },
    anchorPrice:C.anchor.tiers[0].price,
    steps:r.steps.map(s=>`${s.key}:${s.from.id}→${s.to.id}(-${s.saved})`),
    d1:P.d1.map(s=>s.id), d2:P.d2.map(s=>s.id),
    paid:P.paidSum, start:R.start, end:R.end
  };
}

const got = {};
for (const c of CASES) got[c.n] = run(c);

/* 场景 B 也进快照 */
got['场景B · 兜里 120'] = (()=>{ const r=solve(B_COMPONENTS,B_TOP,B_SEQ,120);
  return { total:r.total, sel:r.sel, steps:r.steps.map(s=>`${s.key}:${s.to.id}`) }; })();
got['场景B · 兜里 30']  = (()=>{ const r=solve(B_COMPONENTS,B_TOP,B_SEQ,30);
  return { total:r.total, sel:r.sel, exhausted:r.exhausted }; })();

if (process.argv.includes('--save') || !existsSync(SNAP)){
  writeFileSync(SNAP, JSON.stringify(got,null,2));
  console.log(`录了 ${Object.keys(got).length} 条快照 → test/golden.json`);
  process.exit(0);
}

const want = JSON.parse(readFileSync(SNAP,'utf8'));
let bad = 0;
for (const k of Object.keys(got)){
  const a = JSON.stringify(want[k]), b = JSON.stringify(got[k]);
  if (a !== b){
    bad++;
    console.log(`\n✗ ${k}`);
    const A = want[k]||{}, B = got[k];
    for (const f of new Set([...Object.keys(A),...Object.keys(B)])){
      const x = JSON.stringify(A[f]), y = JSON.stringify(B[f]);
      if (x !== y) console.log(`    ${f}\n      旧 ${x}\n      新 ${y}`);
    }
  }
}
for (const k of Object.keys(want)) if (!(k in got)){ bad++; console.log(`✗ 用例没了：${k}`); }
console.log(bad ? `\n${bad} 条不一致。确认是预期改动再 --save 重录。`
                : `${Object.keys(got).length} 条全过。`);
process.exit(bad ? 1 : 0);
