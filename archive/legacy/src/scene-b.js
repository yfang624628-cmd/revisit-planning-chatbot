import { esc, yuan, addMin } from './util.js';
import { tierOf, solve, floorOf, sumOf } from './solve.js';
import { cardsHTML, totalsHTML, tradeHTML, dayBlock, LEGEND } from './render.js';

/* 场景 B：人已经在路上。跟场景 A 不共享任何状态，所以整个搬过来就是一个独立模块。 */
/* ---------- 场景 B：已经在路上 ---------- */
export const B_NOW = '15:20';

export const B_COMPONENTS = {
  meal: { label:'这一顿', tiers:[
    { id:'ngo', name:'一乐烧鹅', price:184, minutes:0, note:'人均 ¥184，要等位', dur:60 },
    { id:'gau', name:'九记牛腩', price:82,  minutes:0, note:'人均 ¥82，周日休息', dur:45 },
    { id:'zim', name:'沾仔记',   price:64,  minutes:0, note:'人均 ¥64，只卖三样', dur:40 },
    { id:'tai', name:'泰昌饼家', price:23,  minutes:0, note:'人均 ¥23，19:30 关', dur:20 }
  ]},
  ticket: { label:'买不买票', tiers:[
    { id:'wheel', name:'中环摩天轮', price:18, minutes:0, note:'转 3 圈约 15 分钟', dur:15 },
    { id:'ferry', name:'天星小轮',   price:5,  minutes:0, note:'10 分钟横渡维港',   dur:20 },
    { id:'none',  name:'不买票',     price:0,  minutes:0, note:'改走嘉咸街涂鸦墙',  dur:20 }
  ]}
};

export const B_SEQ = [
  { key:'meal',   to:'gau',   cost:'不吃烧鹅，也不用等位了' },
  { key:'ticket', to:'ferry', cost:'不上摩天轮，改坐船过海' },
  { key:'meal',   to:'zim',   cost:'从牛腩降到云吞面' },
  { key:'ticket', to:'none',  cost:'不过海，这三小时留在港岛这边' },
  { key:'meal',   to:'tai',   cost:'没有正餐了，只有一个蛋挞' }
];

export const B_ROUTES = {
  walk: {
    q:'想走走', qs:'全程步行',
    t:'三小时，一条线走完，不走回头路',
    stops:[
      {k:'stop',   n:'半山扶梯', m:30, why:'从中环街市起点上。10:20 之后是上行，此刻正好顺着走。'},
      {k:'stop',   n:'大馆', m:60, why:'扶梯中途下来就是。免费，不用预约，走累了院子里能坐。'},
      {k:'stop',   n:'中环街市', m:25, why:'下坡顺路，二楼小店。20:00 关，来得及。'},
      {k:'ticket'},
      {k:'meal'}
    ]
  },
  sit: {
    q:'想坐着', qs:'少走路',
    t:'三小时，能坐着就不站着',
    stops:[
      {k:'stop',   n:'大馆', m:60, why:'院子里有位子，不买票也不赶人，坐多久都行。'},
      {k:'ticket'},
      {k:'stop',   n:'中环街市', m:30, why:'室内有空调，二楼可以坐。'},
      {k:'meal'}
    ]
  },
  eat: {
    q:'想吃点东西', qs:'围着吃排',
    t:'三小时，围着吃的排，中间用走路消食',
    stops:[
      {k:'stop',   n:'石板街', m:20, why:'百年石板阶梯，多部港片取景地。二十分钟够了。'},
      {k:'stop',   n:'半山扶梯', m:30, why:'从石板街上来就是，顺路。'},
      {k:'stop',   n:'大馆', m:55, why:'免费，走累了院子里坐。'},
      {k:'ticket'},
      {k:'meal'}
    ]
  }
};

/* 现状：实测回答 */

export const B_TOP = { meal:'ngo', ticket:'wheel' };

export const B_ORDER = ['meal','ticket'];

export const B_CAP = 180;

export const B_MEAL_WHY = {
  ngo:'中环步行圈内，10:00–20:30。要等位，这条线给它留了一小时。',
  gau:'清汤牛腩汤头鲜甜，12:30–22:30。饭点前到，不用排长队。',
  zim:'只卖三样浇头，点云吞面就对了。11:00–21:30，此刻不用等位。',
  tai:'牛油皮蛋挞，站着吃完就走。这一档不是正餐，是垫一下。'
};

export const B_TICKET_WHY = {
  wheel:'码头出来步行 5 分钟。转 3 圈约 15 分钟，傍晚光线最好。',
  ferry:'中环码头上船，十分钟横渡维港，几块钱看两岸天际线。',
  none:'不买票也有得看——从大馆步行下来顺路经过，港风街拍。'
};

export function bRows(sel,mood){
  return B_ROUTES[mood].stops.map(function(it){
    if (it.k === 'ticket'){
      const t = tierOf(B_COMPONENTS,'ticket',sel.ticket);
      return { k:'stop', n: t.id==='none' ? '嘉咸街涂鸦墙' : t.name, m:t.dur, why:B_TICKET_WHY[t.id] };
    }
    if (it.k === 'meal'){
      const m = tierOf(B_COMPONENTS,'meal',sel.meal);
      return { k:'meal', n:'这一顿 · ' + m.name, m:m.dur, why:B_MEAL_WHY[m.id], mealId:m.id };
    }
    return { k:it.k, n:it.n, m:it.m, why:it.why };
  });
}
/* 营业时间在这里真正参与计算：算出到店时刻，再跟关门时间比 */

/* 营业时间在这里真正参与计算：算出到店时刻，再跟关门时间比 */
export function bApplyHours(rows){
  let t = B_NOW;
  rows.forEach(function(r){
    const at = t; t = addMin(t, r.m);
    if (r.mealId === 'tai')  r.hint = '到店 ' + at + '，泰昌 19:30 关 — 来得及';
    if (r.mealId === 'gau')  r.hint = '到店 ' + at + '，九记 22:30 关；周日休息，那天换沾仔记';
    if (r.mealId === 'zim')  r.hint = '到店 ' + at + '，沾仔记 21:30 关 — 来得及';
    if (r.mealId === 'ngo')  r.hint = '到店 ' + at + '，一乐 20:30 关；要等位，别卡最后一刻';
  });
  return rows;
}

export function bStatusHTML(budget,r){
  const floor = floorOf(B_COMPONENTS,B_TOP,B_SEQ);
  if (r.exhausted){
    return '<div class="status st-over"><span class="badge">装不下</span><div class="status-body">' +
      '<div>' + yuan(budget) + ' 装不下这三小时里的任何一顿。最便宜的一份是泰昌的蛋挞，' + yuan(floor) + '。</div>' +
      '<div style="margin-top:5px">但这条线本身还成立——半山扶梯、大馆、中环街市、涂鸦墙全都免费，' +
      '三小时够走完。要不要看只走免费的那条？</div>' +
      '<div class="btnrow"><button class="btn" type="button" id="freeBtn" data-need="' + floor +
      '">看 ' + yuan(floor) + ' 的走法</button></div></div></div>';
  }
  const slack = budget - r.total;
  if (slack > 40){
    if (!r.steps.length){
      return '<div class="status st-slack"><span class="badge">有富余</span><div class="status-body">' +
        '<div>还剩 ' + yuan(slack) + '。这三小时里能花钱的地方就这两处，花不完。</div></div></div>';
    }
    const last = r.steps[r.steps.length-1];
    const gap = last.saved - slack;
    return '<div class="status st-slack"><span class="badge">有富余</span><div class="status-body">' +
      '<div>还剩 ' + yuan(slack) + '。下一档是' + B_COMPONENTS[last.key].label + '升回' + esc(last.from.name) +
      '，要多 ' + yuan(last.saved) + '，还差 ' + yuan(gap) + '。</div>' +
      '<div class="btnrow"><button class="btn" type="button" id="upBtn" data-need="' + (r.total+last.saved) +
      '">补 ' + yuan(gap) + '，升到' + esc(last.from.name) + '</button></div></div></div>';
  }
  return '<div class="status st-fit"><span class="badge">刚好</span><div class="status-body"><div>' +
    (r.total===floor ? '已经到底。' + yuan(floor) + ' 是这三小时里最便宜的一种过法。'
                     : yuan(r.total) + ' 的走法，' + (slack===0?'正好用完。':'还剩 ' + yuan(slack) + '，不够升下一档。')) +
    '</div></div></div>';
}

/* 组装与接线 */

export function bRouteHTML(sel, bMood){
  const R = B_ROUTES[bMood];
  const rows = bApplyHours(bRows(sel,bMood));
  const used = rows.reduce(function(s,r){ return s+r.m; },0);
  let h = '<div class="pad"><div class="sec-h">这三小时怎么走</div><div class="route">';
  h += dayBlock('15:20 起', R.t, rows, B_CAP, B_NOW);
  h += '</div>' + LEGEND;
  h += '<div style="font-size:12.5px;color:var(--dim);margin-top:11px;padding-top:10px;border-top:1px dashed var(--line)">' +
    (used > B_CAP
      ? '这条线 <b class="num" style="color:var(--warn)">' + used + '</b> 分钟，比你有的三小时多 ' + (used-B_CAP) +
        ' 分。'
      : '这条线 <b class="num" style="color:var(--accent)">' + used + '</b> 分钟，' + B_NOW + ' 出发，' +
        addMin(B_NOW,used) + ' 结束。') + '</div>';
  return h + '</div>';
}

export function shellB(bMood){
  const opts = Object.keys(B_ROUTES).map(function(k){
    return '<button class="opt" type="button" data-mood="' + k + '" aria-pressed="' + (k===bMood) + '">' +
      B_ROUTES[k].q + '<span class="op-sub">' + B_ROUTES[k].qs + '</span></button>';
  }).join('');
  return '<div class="ask">我现在在香港中环，下午有<b>三个小时</b></div>' +
    '<p class="narrow-q">三小时，够走三四个地方。<b>你现在想走走，还是想坐着？</b></p>' +
    '<p class="narrow-why">此刻 15:20 · 周六</p>' +
    '<div class="opts" id="bOpts">' + opts + '</div>' +
    '<div class="stick"><div class="ctl"><span class="ctl-label">兜里还剩</span>' +
    '<span class="readout"><span class="cur num" id="budgetOutB">¥120</span></span>' +
    '<div class="slider-line"><input type="range" id="budgetB" min="20" max="220" step="10" value="120" ' +
    'aria-label="剩余现金，单位人民币"><div class="scale"><span>¥20</span><span>¥220</span></div></div></div></div>' +
    '<div id="planOut"></div>';
}

/* 场景 B 的一次求解 + 渲染。宿主只管把结果塞进容器。 */
export function renderB(budget, bMood, prev, expanded){
  const r = solve(B_COMPONENTS, B_TOP, B_SEQ, budget);
  return { sel:r.sel, html:
    bStatusHTML(budget,r) +
    cardsHTML(B_COMPONENTS, r.sel, prev, null, B_ORDER) +
    totalsHTML(r.total, budget, sumOf(B_COMPONENTS,B_TOP)) +
    '<div class="divider"></div>' + tradeHTML(r.steps, B_COMPONENTS, expanded) +
    '<div class="divider"></div>' + bRouteHTML(r.sel, bMood) };
}
