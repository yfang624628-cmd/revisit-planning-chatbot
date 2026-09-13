import { HK } from './data.js';
import { askPlanner, validateChanges } from './conversation.js';
import { byId, areaName, sideOf, hopMin, mins, addMin, esc, yuan, money } from './util.js';
import { tierOf, tierIdx, sumOf, withPin, solve, floorOf, buildSeq } from './solve.js';
import { A_RHYTHM, dayMinutes, anchorSight, sightPick, layDay, dayTheme, wxScore } from './plan.js';
import { anchorCands, anchorSearch, anchorTags, constraintOf, anchorScore } from './anchor.js';
import { cardsHTML, pickHTML, totalsHTML, barHTML, stopsHTML, dayBlock, LEGEND } from './render.js';
import { renderB, shellB, B_ROUTES } from './scene-b.js';

/* 场景 A 的编排与状态。所有 let 都集中在这里，别的模块一个全局都没有。 */
/* ---------- 场景 A：组件全部由 hk-data.js 生成 ---------- */
let A_COMPONENTS = null, A_SEQ = null, A_TOP = null;

function initA(){
  A_COMPONENTS = {
    transport: { label:'往返交通', tiers: HK.transports.map(function(t){
      return { id:t.id, name:t.n, price:t.price, minutes:t.extra, note:t.note, down:t.down }; }) },
    stay: { label:'住宿', tiers: HK.stays.map(function(s){
      return { id:s.id, name:s.n, price:s.price, minutes:s.commute*2, area:s.area,
               note:s.note + ' · ' + areaName(s.area), down:s.down }; }) },
    food: { label:'餐饮', tiers: HK.foods.map(function(f){
      return { id:f.id, name:f.n, price:f.price, minutes:0, note:f.note, down:f.down }; }) },
    sights: { label:'逛多少', tiers: HK.sightPlans.map(function(p){
      return { id:p.id, name:p.n, price:0, minutes:0, note:'', down:p.down }; }) },
    anchor: { label:'锚点', tiers: HK.sights.map(function(s){
        return { id:s.id, name:s.n, price:s.price, minutes:0, area:s.area, book:!!s.book, cat:s.cat,
                 note:(s.price?money(s.price):'免费') + (s.book?' · 需预约':'') + ' · ' + areaName(s.area) };
      }).concat([
        { id:'custom', name:'自己填的地方', price:0, minutes:0, cat:'其他', note:'费用没算进总价' },
        { id:'__picked', name:'（还没选）', price:0, minutes:0, cat:'其他', note:'' }
      ]) }
  };
  A_TOP = { transport:HK.transports[0].id, stay:HK.stays[0].id, food:HK.foods[0].id,
            sights:HK.sightPlans[0].id, anchor:'__picked' };
  A_SEQ = buildSeq(A_COMPONENTS,['food','stay','sights','transport']);
}

/* ---------- 档位：住宿三档、吃饭三档。选了档位＝只在这档里排 ---------- */

/* ---------- 档位：住宿三档、吃饭三档。选了档位＝只在这档里排 ---------- */
const A_BANDS = {
  stay: [
    { id:'lux',  n:'高档型', lo:900,  hi:1e9, sub:'¥900 起' },
    { id:'mid',  n:'舒适型', lo:400,  hi:900, sub:'¥400–900' },
    { id:'econ', n:'经济型', lo:0,    hi:400, sub:'¥400 以下' }
  ],
  food: [
    { id:'fine',   n:'讲究一顿', lo:350, hi:1e9, sub:'老字号 / 烧鹅 / 点心' },
    { id:'proper', n:'正经吃饭', lo:150, hi:350, sub:'茶餐厅 / 大排档' },
    { id:'light',  n:'垫一下就行', lo:0, hi:150, sub:'街边小食 / 便利店' }
  ]
};

const A_BAND_Q = {
  stay:'住哪一档？<b>先定价位，再挑具体哪一家。</b>',
  food:'两天四顿。<b>吃饭想吃到什么程度？</b>'
};

function bandOf(key,id){ return byId(A_BANDS[key],id); }
/* 该档里有哪些具体选项（保留原顺序＝按价降序）。'none'（不住）永远留着当兜底 */

/* 该档里有哪些具体选项（保留原顺序＝按价降序）。'none'（不住）永远留着当兜底 */
function bandIds(key,bandId){
  const b = bandOf(key,bandId);
  if (!b) return null;
  const ids = A_COMPONENTS[key].tiers.filter(function(t){
    return t.price >= b.lo && t.price < b.hi;
  }).map(function(t){ return t.id; });
  if (key==='stay' && b.id==='econ' && ids.indexOf('none')<0) ids.push('none');
  return ids.length ? ids : null;
}

function bandCount(key,bandId){ const a = bandIds(key,bandId); return a ? a.length : 0; }

/* 降级序列：按「先吃、再住、再景点、最后交通」轮着往下降一档，直到全部见底。
   allow 限定了某个部件只能在这些档里动——用户选了价位，降级就不许跳出这个价位。 */

const $ = function(id){ return document.getElementById(id); };

let scene = 'plan', bMood = 'walk';

const A_DAYS = 2;              /* 几天行程就要几个锚点。天数以后由 slot 填 */

let aAnchors = [];

let aCustom = '', aPin = { stay:null, food:null };

let aBand = { stay:null, food:null };

let aRhythm = null, aIgnoreWx = false;

let aThemes = [], aSearch = '', aThemePicked = false;

let lastSel = null;
let lessWalking = false;
let conversation = [];
let pendingChanges = null;
let conversationBusy = false;
let planRevision = 0;
let showPreferences = true;

const A_ASKED = 1500;                     /* 用户原话里就给了的预算 */

let aStep = 0, aBudget = A_ASKED, aFirstRun = true;

let aPrev = null, bPrev = null, expanded = false;

function rhythmOf(){ return byId(A_RHYTHM, aRhythm) || A_RHYTHM[1]; }

function wxNow(){ return aIgnoreWx ? [null,null] : [HK.weather.d1, HK.weather.d2]; }

const A_ORDER = ['transport','anchor'];

const A_ANCHOR_KEYS  = ['mplus','peaktram','daikwun','custom','nope'];

const A_ANCHOR_LABEL = { mplus:'M+ 博物馆', peaktram:'太平山顶', daikwun:'大馆',
                         custom:'其他', nope:'没想法' };

const A_ANCHOR_SUB   = { mplus:'¥159 · 需预约', peaktram:'¥80 · 往返缆车', daikwun:'免费 · 不用订',
                         custom:'自己填一个', nope:'我们替你定' };

/* 「逛多少」这一档的价格＝这一档下实际排进行程的付费景点门票和。
   选哪些景点只看锚点/作息/配额，不看预算，所以能先算出来再交给求解器。 */

/* 「逛多少」这一档的价格＝这一档下实际排进行程的付费景点门票和。
   选哪些景点只看锚点/作息/配额，不看预算，所以能先算出来再交给求解器。 */
function syncSightPrices(){
  const rid = rhythmOf().id, W = wxNow();
  A_COMPONENTS.sights.tiers.forEach(function(t){
    const P = sightPick(aAnchors, t.id, rid, W[0], W[1], customName(), lessWalking);
    t.price = P.paidSum;
    t.note  = P.paidSum ? '门票 ' + yuan(P.paidSum) + ' · ' + P.paidNames.join('、') : '不买门票';
  });
}

function aAllow(){
  return { stay: aBand.stay ? bandIds('stay',aBand.stay) : null,
           food: aBand.food ? bandIds('food',aBand.food) : null };
}
/* 起点＝所选档位里最贵的那个；序列＝只在档位内降 */

/* 起点＝所选档位里最贵的那个；序列＝只在档位内降 */
function aCtx(anchorId){
  const al = aAllow(), top = Object.assign({},A_TOP,{anchor:anchorId});
  ['stay','food'].forEach(function(k){ if (al[k] && al[k].length) top[k] = al[k][0]; });
  return { top:top, seq:buildSeq(A_COMPONENTS,['food','stay','sights','transport'],al), allow:al };
}
/* 约束强度：越是"必须围着它排"的，越该先定——这就是锚点的本义 */

/* 锚点是用户定的，不参与降级；但门票得进总价 */
function anchorList(){ return aAnchors.map(function(id){ return anchorSight(id, customName()); }).filter(Boolean); }

function syncAnchorTier(){
  const t = tierOf(A_COMPONENTS,'anchor','__picked'), L = anchorList();
  t.price = L.reduce(function(n,s){ return n + (s.price||0); },0);
  t.name  = L.length ? L.map(function(s){ return s.n; }).join(' ＋ ') : '（还没选）';
  t.note  = L.length
    ? L.map(function(s){ return (s.price?yuan(s.price):'免费') + ' · ' + areaName(s.area); }).join(' / ')
    : '';
}

function customName(){ return (aCustom||'').trim() || '自己填的地方'; }

function anchorLabel(id){
  if (id === 'custom') return customName();
  const s = byId(HK.sights,id);
  return s ? s.n : (A_ANCHOR_LABEL[id] || id);
}

function aTop(anchorId){ return aCtx(anchorId).top; }

function aFloor(anchorId){ const c = aCtx(anchorId); return floorOf(A_COMPONENTS,c.top,c.seq,aPin); }

function aStatusHTML(budget,r,anchorId){
  const floor = aFloor(anchorId);
  if (r.exhausted){
    const alts = anchorCands(aThemes,6,anchorList(),wxNow()[0],aAnchors).map(function(s){ return s.id; }).slice(0,2);
    let body = '<div>' + yuan(budget) + ' 装不下香港两天 + ' + anchorLabel(anchorId) +
      '。这个锚点的最低总价是 ' + yuan(floor) + '。</div>';
    if (alts.length){
      body += '<div style="margin-top:5px">换个锚点还有得谈：' +
        alts.map(function(a){ return anchorLabel(a) + ' 最低 ' + yuan(aFloor(a)); }).join(' · ') + '。</div>' +
        '<div class="btnrow">' + alts.map(function(a){
          return '<button class="btn" type="button" data-anchor="' + a + '">改成' + anchorLabel(a) + '</button>';
        }).join('') + '</div>';
    } else if (!aBand.stay && !aBand.food){
      body += '<div style="margin-top:5px">三个锚点都装不下。' + yuan(aFloor('daikwun')) +
        ' 是这套部件的底——再低就不是省钱，是不去了。</div>';
    }
    if (aBand.stay || aBand.food){
      const locked = [];
      if (aBand.stay) locked.push(bandOf('stay',aBand.stay).n + '住宿');
      if (aBand.food) locked.push(bandOf('food',aBand.food).n);
      body += '<div style="margin-top:5px">真正卡住的是你定的档位：' + locked.join(' + ') +
        '。这两档里最便宜的组合就是 ' + yuan(floor) + '。</div>' +
        '<div class="btnrow"><button class="btn ghost" type="button" data-relax="all">' +
        '放开档位，让它自己往下降</button></div>';
    }
    return '<div class="status st-over"><span class="badge">装不下</span><div class="status-body">' + body + '</div></div>';
  }
  const slack = budget - r.total;
  if (slack > 200){
    if (!r.steps.length){
      return '<div class="status st-slack"><span class="badge">有富余</span><div class="status-body">' +
        '<div>还剩 ' + yuan(slack) + '。方案已经是最高档，这笔钱花不完。</div></div></div>';
    }
    const last = r.steps[r.steps.length-1];
    const need = last.saved, gap = need - slack;
    return '<div class="status st-slack"><span class="badge">有富余</span><div class="status-body">' +
      '<div>还剩 ' + yuan(slack) + '。下一档是' + A_COMPONENTS[last.key].label + '升回' + esc(last.from.name) +
      '，要多 ' + yuan(need) + '，还差 ' + yuan(gap) + '。</div>' +
      '<div class="btnrow"><button class="btn" type="button" id="upBtn" data-need="' + (r.total+need) +
      '">补 ' + yuan(gap) + '，升到' + esc(last.from.name) + '</button></div></div></div>';
  }
  return '<div class="status st-fit"><span class="badge">刚好</span><div class="status-body"><div>' +
    (r.total===floor
      ? '已经到底。' + yuan(floor) + ' 是保住' + anchorLabel(anchorId) + '的前提下能拼出的最低价。'
      : yuan(r.total) + ' 的方案，' + (slack===0?'正好用完预算。':'还剩 ' + yuan(slack) + '，不够升下一档。')) +
    '</div></div></div>';
}

/* 场景 B：已经在路上 */

function anchorCardHTML(s){
  const i = aAnchors.indexOf(s.id);
  return '<button class="pcard acard' + (i>=0?' picked':'') + '" type="button" data-anchor="' + s.id +
    '" aria-pressed="' + (i>=0) + '">' +
    (i>=0 ? '<span class="daytag">DAY ' + (i+1) + '</span>' : '') +
    '<span class="atags">' + anchorTags(s).map(function(t){
      return '<span class="atag t-' + t[0] + '">' + t[1] + '</span>'; }).join('') + '</span>' +
    '<span class="pn">' + esc(s.n) + '</span>' +
    '<span class="pnote">' + esc((s.why||'').split('。')[0]) + '。</span>' +
    '<span class="pp num' + (s.price===0?' zero':'') + '">' +
      (s.price ? yuan(s.price) : '免费') + '</span>' +
    '<span class="pm none">' + s.dur + ' 分钟 · ' + areaName(s.area) + '</span></button>';
}

function candsHTML(){
  const hits = anchorSearch(aSearch);
  if (hits.length){
    return '<div class="pick">' + hits.map(anchorCardHTML).join('') + '</div>';
  }
  if ((aSearch||'').trim()){
    return '<div class="nohit">库里没有「' + esc(aSearch.trim()) + '」。' +
      '<button class="unpin" type="button" id="useCustom">就按这个名字排</button>' +
      '<span class="nh-w">费用和时长算不进总价。</span></div>';
  }
  return '<div class="pick">' + anchorCands(aThemes,8,anchorList(),wxNow()[0],aAnchors).map(anchorCardHTML).join('') + '</div>';
}

/* 锚点是用户定的，不参与降级；但门票得进总价 */

/* 餐饮只有 6 档，不需要"先选档位再挑具体的"这层。直接摆出来按每顿人均比。 */
function foodPickHTML(sel){
  const cur = aPin.food || sel.food;
  const cards = HK.foods.map(function(f){
    const per = Math.round(f.price/4);
    const on = aPin.food === f.id;
    return '<button class="pcard fcard" type="button" data-food="' + f.id +
      '" aria-pressed="' + on + '">' +
      (on ? '<span class="ptag">你选的</span>'
          : (f.id===cur ? '<span class="ptag auto">当前</span>' : '')) +
      '<span class="pn">' + esc(f.n) + '</span>' +
      '<span class="pnote">' + esc(f.note) + '</span>' +
      '<span class="pp num">' + yuan(f.price) + '</span>' +
      '<span class="pm none">每顿约 ' + yuan(per) + ' · 四顿</span></button>';
  }).join('');
  const auto = '<button class="pcard fcard auto-card" type="button" data-food="__auto"' +
    ' aria-pressed="' + (!aPin.food) + '">' +
    (!aPin.food ? '<span class="ptag">你选的</span>' : '') +
    '<span class="pn">不挑，看预算排</span>' +
    '<span class="pnote">钱不够时这一项先降，把预算让给住宿和景点。</span>' +
    '<span class="pp num zero">按预算</span>' +
    '<span class="pm none">现在是' + esc(tierOf(A_COMPONENTS,'food',sel.food).name) + '</span></button>';
  return '<div class="pick">' + cards + auto + '</div>';
}

function aRows(sel){
  const A  = anchorSight(aAnchors[0], customName());
  const R  = rhythmOf();
  const W  = wxNow();
  const P  = sightPick(aAnchors, sel.sights, R.id, W[0], W[1], customName(), lessWalking);
  const F  = byId(HK.foods, sel.food) || HK.foods[0];
  const tr = tierOf(A_COMPONENTS,'transport',sel.transport);
  const st = tierOf(A_COMPONENTS,'stay',sel.stay);
  const legT = tr.minutes/2, legS = st.minutes/2;
  const dayTrip = sel.stay === 'none';
  const aid  = aAnchors[0]==='custom' ? 'custom' : A.id;
  const aid2 = P.a2 ? P.a2.id : null;

  let d1 = [];
  if (legT>0) d1.push({k:'move', n:'口岸接驳 · 抵港', m:legT,
    why:'比高铁直达多出来的那一段，省下的钱就在这里。'});
  d1 = d1.concat(layDay(addMin(R.start,legT), A.area, P.d1, aid, F.d1, R.m1));
  if (dayTrip){
    if (legT>0) d1.push({k:'move', n:'口岸接驳 · 返程', m:legT, why:'当天来回，回程这一段也得算进去。'});
    return { d1:d1, d2:null, dayTrip:true,
      d1t: dayTheme(P.d1), d2t:'' };
  }
  if (legS>0) d1.push({k:'move', n:'回 ' + areaName(st.area||'tst'), m:legS,
    why: st.name + '比住市区多出来的通勤。'});
  let d2 = [];
  if (legS>0) d2.push({k:'move', n:'从酒店出门', m:legS, why:'同样一段，早上再走一次。'});
  d2 = d2.concat(layDay(addMin(R.start,legS), st.area || P.seed2, P.d2, aid2, F.d2, R.m2));
  if (legT>0) d2.push({k:'move', n:'口岸接驳 · 返程', m:legT, why:'比高铁直达多出来的那一段。'});
  return { d1:d1, d2:d2, dayTrip:false, d1t:dayTheme(P.d1), d2t:dayTheme(P.d2) };
}

/* 拿「有天气」和「当没天气」两次召回做 diff——换掉了谁必须说出来 */
function wxHTML(sel){
  const R = rhythmOf(), W = wxNow();
  const d1 = HK.weather.d1, d2 = HK.weather.d2;
  const line = function(lb,w){
    return '<span class="wx-day"><b>' + lb + '</b> ' + w.sky + ' · 降雨 ' + w.rain +
      '% · ' + w.temp + '<span class="wx-note">' + esc(w.note) + '</span></span>';
  };
  let swap = '';
  if (!aIgnoreWx){
    const withWx = sightPick(aAnchors, sel.sights, R.id, W[0], W[1], customName(), lessWalking);
    const noWx   = sightPick(aAnchors, sel.sights, R.id, null, null, customName(), lessWalking);
    const ids = function(P){ return P.d1.concat(P.d2).map(function(s){ return s.id; }); };
    const A = ids(withWx), B = ids(noWx);
    const dropped = B.filter(function(i){ return A.indexOf(i)<0; })
      .map(function(i){ const x = byId(HK.sights,i); return x ? x.n : i; });
    const added = A.filter(function(i){ return B.indexOf(i)<0; })
      .map(function(i){ const x = byId(HK.sights,i); return x ? x.n : i; });
    if (dropped.length || added.length){
      swap = '<div class="wx-swap">因为这个天气：' +
        (dropped.length ? '撤掉了 <b>' + dropped.join('、') + '</b>' : '') +
        (dropped.length && added.length ? '，' : '') +
        (added.length ? '换上了 <b>' + added.join('、') + '</b>' : '') + '。</div>';
    } else {
      swap = '<div class="wx-swap">这套安排本来就以室内为主，天气没改动它。</div>';
    }
  }
  return '<div class="wxbar' + (aIgnoreWx ? ' off' : '') + '">' +
    '<div class="wx-top">' + line('DAY 1',d1) + line('DAY 2',d2) +
    '<button class="wx-btn" type="button" id="wxBtn">' +
      (aIgnoreWx ? '按天气重排' : '就当没雨') + '</button></div>' +
    (aIgnoreWx ? '<div class="wx-swap">已忽略天气，按晴天排。</div>' : swap) +
    '<div class="wx-src">' + esc(HK.weather.src) + '</div></div>';
}

function aRouteHTML(sel){
  const rows = aRows(sel), R = rhythmOf(), cap = dayMinutes(R);
  const totalCom = rows.d1.concat(rows.d2||[]).filter(function(r){ return r.k==='move'; })
                    .reduce(function(s,r){ return s+r.m; },0);
  let h = '<div class="pad"><div class="sec-h">每日路线</div>' + wxHTML(sel) + '<div class="route">';
  h += dayBlock('DAY 1', rows.d1t, rows.d1, cap, R.start);
  if (rows.d2){
    h += dayBlock('DAY 2', rows.d2t, rows.d2, cap, R.start);
  } else {
    h += '<div class="day-block"><div class="day-cap"><span class="d">DAY 2</span>' +
      '<span class="theme">没有第二天了</span></div><div class="day-dead"><div class="k">取 消</div>' +
      '<div class="w">取消住宿换来的不是通勤时间，是一整天。</div></div></div>';
  }
  h += '</div>' + LEGEND;
  h += '<div style="font-size:12.5px;color:var(--dim);margin-top:11px;padding-top:10px;border-top:1px dashed var(--line)">' +
    (rows.dayTrip
      ? '当天来回。Day 1 两头都要算口岸接驳，这条线从 ' + R.start + ' 走到晚上。'
      : (totalCom===0
        ? '通勤增量 <b class="num" style="color:var(--accent)">0</b> 分钟。'
        : '两天多出 <b class="num" style="color:var(--warn)">' + totalCom + '</b> 分钟通勤，全部从富余里扣。')) + '</div>';
  return h + '</div>';
}

/* 一步一问：答完这一步，下一步才出现。内容是问出来的，不是一次性倒出来的。 */
function stepHTML(i,q,bodyHTML,answered,answerLine){
  const cls = 'step' + (answered ? ' done' : '') + (i===aStep ? ' reveal' : '');
  return '<div class="' + cls + '">' +
    '<div class="step-h"><span class="step-n">' + (i+1) + ' / 5</span>' +
    '<p class="step-q">' + q + '</p></div>' + bodyHTML +
    (answered && answerLine ? '<p class="step-a">' + answerLine + '</p>' : '') +
  '</div>';
}

function stepsHTML(){
  let h = '';

  /* 第一步：先问偏好，再据此推锚点。两段在同一步里，答完才进第二步 */
  const th = HK.themes.map(function(t){
    return '<button class="opt" type="button" data-theme="' + t.id +
      '" aria-pressed="' + (aThemes.indexOf(t.id)>=0) + '">' + t.n +
      '<span class="op-sub">' + t.sub + '</span></button>';
  }).join('') +
    '<button class="opt" type="button" data-theme="__none" aria-pressed="' +
    (aThemePicked && !aThemes.length) + '">没想法<span class="op-sub">给我推人气的</span></button>';

  let seg2 = '';
  if (aThemePicked){
    const left = A_DAYS - aAnchors.length;
    const chosen = aAnchors.length
      ? '<div class="chosen">已定：' + anchorList().map(function(s,i){
          return '<button class="chip" type="button" data-unanchor="' + s.id + '">' +
            '<b>DAY ' + (i+1) + '</b> ' + esc(s.n) + ' ✕</button>'; }).join('') + '</div>'
      : '';
    seg2 = '<div class="subq">' + chosen +
      (left > 0
        ? (aAnchors.length
            ? '还差 <b>' + left + ' 个</b>。第二天换一边走，所以下面优先推另一侧的：'
            : (aThemes.length
               ? '<b>' + A_DAYS + ' 天挑 ' + A_DAYS + ' 个</b>，一天一个主心骨。越靠前的越"必须围着它排"：'
               : '那就按人气推。<b>' + A_DAYS + ' 天挑 ' + A_DAYS + ' 个：</b>'))
        : '<b>两天的锚点都定了。</b>其余全部按顺路排在它们周围。') +
      '</div>' +
      (left > 0 ? '<div id="anchorCands">' + candsHTML() + '</div>' +
        '<input class="custom-in" id="anchorSearch" type="search" value="' +
        esc(aSearch).replace(/"/g,'&quot;') +
        '" placeholder="都不想去？搜一个：庙街、大澳、跑马地…">' : '');
  }
  h += stepHTML(0, A_DAYS + ' 天。<b>你旅行时更想看什么？</b>',
    '<div class="opts" id="aThemes">' + th + '</div>' + seg2,
    aStep > 0, aAnchors.length >= A_DAYS
      ? '锚点：' + anchorList().map(function(s,i){
          return 'DAY' + (i+1) + ' <b>' + esc(s.n) + '</b>'; }).join('，') + '。' : '');
  if (aStep < 1) return h;

  /* 第二步：作息。一天从几点到几点，是排路线的前提，所以排在钱之前 */
  const rh = A_RHYTHM.map(function(R){
    return '<button class="bandbtn" type="button" data-rhythm="' + R.id +
      '" aria-pressed="' + (aRhythm===R.id) + '">' + R.n +
      '<span class="bs">' + R.sub + '</span></button>';
  }).join('');
  h += stepHTML(1, '一天从几点算起？<b>早出早归，还是晚出晚归？</b>',
    '<div class="band">' + rh + '</div>',
    aStep > 1, aRhythm ? rhythmOf().a : '');
  if (aStep < 2) return h;

  /* 第三步：住宿。13 家，所以先定价位再挑具体哪一家 */
  if (aStep >= 2){
    const bands = A_BANDS.stay.map(function(b){
      return '<button class="bandbtn" type="button" data-band="stay" data-id="' + b.id +
        '" aria-pressed="' + (aBand.stay===b.id) + '">' + b.n +
        '<span class="bs">' + b.sub + ' · ' + bandCount('stay',b.id) + ' 家</span></button>';
    }).join('');
    const pk = aBand.stay ? bandOf('stay',aBand.stay) : null;
    h += stepHTML(2, A_BAND_Q.stay, '<div class="band">' + bands + '</div>',
      aStep > 2, pk ? '在' + pk.n + '这一档里挑，' + bandCount('stay',pk.id) +
        ' 家备选，下面可以左右滑。' : '');
  }
  if (aStep < 3) return h;

  /* 第四步：吃饭。只有 6 档，不绕档位，直接摆价格让人比 */
  const fsel = aPin.food ? byId(HK.foods,aPin.food) : null;
  h += stepHTML(3, '两天四顿。<b>吃这一块打算怎么花？</b>',
    foodPickHTML(lastSel || A_TOP),
    aStep > 3, fsel
      ? '选了' + esc(fsel.n) + '，两天四顿 ' + yuan(fsel.price) + '，每顿约 ' +
        yuan(Math.round(fsel.price/4)) + '。'
      : '没挑具体的——预算不够时这一项会先降。');
  if (aStep < 4) return h;

  /* 第五步：预算不是问句——它已经在第一句话里给过了。这里是拨给你看代价 */
  const d = aBudget - A_ASKED;
  h += stepHTML(4, '预算你一开始就说了 <b>' + yuan(A_ASKED) + ' 以内</b>。' +
    '<b>上下拨几百试试——多给一点能换回什么，少给一点先掉哪个。</b>',
    '<div class="ctl"><span class="ctl-label">预算 / 单人</span>' +
    '<span class="readout"><span class="cur num" id="budgetOutA">' + yuan(aBudget) + '</span>' +
    '<span class="vs' + (d===0?' same':'') + '" id="budgetVs">' +
      (d===0 ? '你说的数' : (d>0?'比你说的多 ':'比你说的少 ') + yuan(Math.abs(d))) + '</span></span>' +
    '<div class="slider-line"><input type="range" id="budgetA" min="1000" max="2000" step="50" value="' +
    aBudget + '" aria-label="预算，单位人民币">' +
    '<div class="scale"><span>¥1000</span><span class="said">↑ 你说的 ' + yuan(A_ASKED) +
    '</span><span>¥2000</span></div></div></div>', false, '');
  return h;
}

function shellA(){
  return '<div class="pad" style="padding-bottom:0"><div class="ask">' +
    '下周六去香港玩两天，一个人 <b>1500 以内</b></div></div>' +
    '<section class="dialogue"><h2>这趟旅行，一起慢慢定</h2>' +
    '<button class="btn" id="defaultPlan" type="button">没想法，先给我一版</button> ' +
    '<button class="btn" id="preferences" type="button">选择 / 收起偏好</button>' +
    '<div id="conversationLog" aria-live="polite"></div>' +
    '<form id="conversationForm"><label for="conversationInput">也可以直接说你的想法</label>' +
    '<div class="conversation-input"><input id="conversationInput" maxlength="1200" placeholder="比如：想睡到自然醒，酒店别换" required>' +
    '<button class="btn" type="submit">发送</button></div></form>' +
    '<div class="dialogue-actions"><button class="btn" data-adjust="late" type="button">晚点出门</button> ' +
    '<button class="btn" data-adjust="walking" type="button">少安排一点</button></div>' +
    '<div id="changePreview"></div></section>' +
    '<div id="aSteps"></div><div id="planOut"></div>';
}

function currentContext(){
  return {
    city:'香港', days:A_DAYS, budget:aBudget, rhythm:rhythmOf().id,
    anchors:aAnchors.slice(), stay:aPin.stay, food:aPin.food, lessWalking,
    selected:lastSel, route:lastSel && aAnchors.length === A_DAYS ? aRows(lastSel) : null,
    dataStatus:'所有地点描述、价格、天气、通勤均为未核验的演示资料，不能当成真实信息'
  };
}

function renderConversation(){
  if (!$('conversationLog')) return;
  $('conversationLog').innerHTML = conversation.map(entry => '<p class="message ' + entry.role + '"><b>' +
    (entry.role === 'user' ? '你' : '助手') + '</b> ' + esc(entry.content) + '</p>').join('');
  $('conversationForm').querySelector('button').disabled = conversationBusy;
  $('changePreview').innerHTML = pendingChanges
    ? '<div class="change-preview"><b>待确认的调整</b><ul>' + changeLabels(pendingChanges.changes).map(label => '<li>' + esc(label) + '</li>').join('') +
      '</ul><button class="btn" id="applyConversation" type="button">应用调整</button> ' +
      '<button class="btn" id="cancelConversation" type="button">先不改</button></div>' : '';
  if ($('applyConversation')) $('applyConversation').onclick = applyConversation;
  if ($('cancelConversation')) $('cancelConversation').onclick = () => { pendingChanges = null; renderConversation(); };
}

function changeLabels(changes){
  const labels = [];
  if ('rhythm' in changes) labels.push('出门时间：' + byId(A_RHYTHM, changes.rhythm).sub);
  if ('budget' in changes) labels.push('预算：' + yuan(aBudget) + ' → ' + yuan(changes.budget));
  if ('lessWalking' in changes) labels.push(changes.lessWalking ? '减少附加景点，优先安排当天重点附近的地点；已选重点保留' : '恢复正常游览密度');
  if ('anchors' in changes) labels.push('每天的重点：' + changes.anchors.map(anchorLabel).join('、'));
  for (const key of ['stay','food']) if (key in changes) labels.push((key === 'stay' ? '住宿：' : '餐饮：') +
    (changes[key] === null ? '交给预算安排' : tierOf(A_COMPONENTS,key,changes[key]).name));
  return labels;
}

function applyConversation(){
  if (!pendingChanges) return;
  if (pendingChanges.revision !== planRevision){
    pendingChanges = null;
    conversation.push({role:'assistant',content:'行程刚有变化，请重新提出这次调整。'});
    renderConversation(); return;
  }
  const changes = validateChanges(pendingChanges.changes, HK);
  const labels = changeLabels(changes);
  if ('rhythm' in changes) aRhythm = changes.rhythm;
  if ('budget' in changes) aBudget = changes.budget;
  if ('lessWalking' in changes) lessWalking = changes.lessWalking;
  if ('anchors' in changes) aAnchors = changes.anchors.slice();
  for (const key of ['stay','food']) if (key in changes){ aPin[key] = changes[key]; aBand[key] = null; }
  pendingChanges = null;
  if (aAnchors.length < A_DAYS) fillDefaultPlan();
  aStep = 4; showPreferences = false;
  renderSteps();
  conversation.push({role:'assistant', content:'已应用：' + labels.join('；') + '。其余已选偏好保留，费用与路线已重新计算。'});
  renderConversation();
}

function fillDefaultPlan(){
  while (aAnchors.length < A_DAYS){
    const candidates = anchorCands(aThemes,36,anchorList(),wxNow()[0],aAnchors).filter(sight =>
      !/只有周/.test(sight.tip || '') && mins(sight.from) + sight.dur + 90 <= mins(rhythmOf().end));
    if (!candidates.length) break;
    aAnchors.push(candidates[0].id);
  }
  aRhythm ||= 'normal';
  aThemePicked = true; aStep = 4;
}

function wireConversation(){
  $('defaultPlan').onclick = () => {
    fillDefaultPlan(); showPreferences = false; renderSteps();
    conversation.push({role:'assistant',content:'先按人气推荐补齐每天的重点，默认 09:30 出门；住宿和餐饮按预算安排。你已经选过的内容会保留。'});
    renderConversation();
  };
  $('preferences').onclick = () => { showPreferences = !showPreferences; $('aSteps').hidden = !showPreferences; };
  document.querySelectorAll('[data-adjust]').forEach(button => {
    button.onclick = () => {
      pendingChanges = {revision:planRevision, changes:button.dataset.adjust === 'late' ? {rhythm:'late'} : {lessWalking:true}};
      renderConversation();
    };
  });
  $('conversationForm').onsubmit = async event => {
    event.preventDefault();
    const input = $('conversationInput');
    const message = input.value.trim();
    if (!message || conversationBusy) return;
    const revision = planRevision;
    const history = conversation.slice();
    conversation.push({role:'user',content:message});
    input.value = ''; conversationBusy = true; pendingChanges = null; renderConversation();
    try {
      const result = await askPlanner(message, currentContext(), history);
      const changes = validateChanges(result.changes, HK);
      conversation.push({role:'assistant',content:result.answer});
      if (Object.keys(changes).length && revision === planRevision) pendingChanges = {revision, changes};
      else if (Object.keys(changes).length) conversation.push({role:'assistant',content:'你刚调整了卡片，这次建议没有应用；可以按最新行程再问一次。'});
    } catch (error){ conversation.push({role:'assistant',content:error.name === 'TimeoutError' ? '回复超时，行程没有变化，请重试。' : error.message}); }
    finally { conversationBusy = false; renderConversation(); }
  };
  renderConversation();
}

function wire(){
  const fold = $('foldBtn');
  if (fold) fold.onclick = function(){ expanded = !expanded; update(); };
  const up = $('upBtn') || $('freeBtn');
  if (up) up.onclick = function(){
    const el = scene==='plan' ? $('budgetA') : $('budgetB');
    const step = parseInt(el.step,10), min = parseInt(el.min,10), max = parseInt(el.max,10);
    let v = min + Math.ceil((parseInt(up.dataset.need,10)-min)/step)*step;
    if (v > max) v = max;
    el.value = v;
    el.dispatchEvent(new Event('input',{bubbles:true}));
  };
  Array.prototype.forEach.call(document.querySelectorAll('.status [data-anchor]'), function(b){
    b.onclick = function(){ aAnchors[0] = b.dataset.anchor; aPrev = null; aFirstRun = true; renderSteps(); };
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-pick]'), function(b){
    b.onclick = function(){
      const k = b.dataset.pick;
      aPin[k] = (aPin[k] === b.dataset.id) ? null : b.dataset.id;
      expanded = false; update();
    };
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-unpin]'), function(b){
    b.onclick = function(){ aPin[b.dataset.unpin] = null; expanded = false; update(); };
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-relax]'), function(b){
    b.onclick = function(){ relaxBands(); };
  });
  const wxb = $('wxBtn');
  if (wxb) wxb.onclick = function(){ aIgnoreWx = !aIgnoreWx; aPrev = null; update(); };
}

function update(){
  if (scene === 'plan'){
    planRevision++;
    pendingChanges = null;
    if ($('changePreview')) $('changePreview').innerHTML = '';
    /* 没问完就不铺内容——方案是问出来的 */
    if (aStep < 4 || aAnchors.length < A_DAYS){
      $('planOut').innerHTML = ''; $('planOut').className = ''; return; }
    const budget = aBudget;
    tierOf(A_COMPONENTS,'anchor','custom').name = customName();
    syncAnchorTier();
    syncSightPrices();
    const c = aCtx('__picked');
    const r = solve(A_COMPONENTS, c.top, c.seq, budget, aPin);
    const stayT = '住宿' + (aBand.stay ? ' · ' + bandOf('stay',aBand.stay).n : '');
    const preview = aRows(r.sel);
    const routeSummary = [preview.d1,preview.d2].map((rows,index) => '<p><b>第 ' + (index+1) + ' 天</b> ' +
      (rows ? rows.filter(row => row.k === 'anchor' || row.k === 'stop').map(row => esc(row.n)).join(' → ') : '当天往返，无第二天') + '</p>').join('');
    $('planOut').className = aFirstRun ? 'first-run' : '';
    $('planOut').innerHTML =
      aStatusHTML(budget,r,aAnchors[0]) +
      cardsHTML(A_COMPONENTS, r.sel, aPrev, 'anchor', A_ORDER, '你定的') +
      '<details class="plan-details"><summary>住宿：' + esc(tierOf(A_COMPONENTS,'stay',r.sel.stay).name) + ' · 换一家</summary>' +
      pickHTML(A_COMPONENTS,'stay',r.sel,aPin.stay,stayT,c.allow.stay) + '</details>' +
      totalsHTML(r.total, budget, sumOf(A_COMPONENTS,withPin(c.top,aPin))) +
      '<section class="pad">' + routeSummary + '</section>' +
      '<details class="plan-details"><summary>展开时间安排与天气</summary>' + aRouteHTML(r.sel) + '</details>';
    aFirstRun = false;
    lastSel = r.sel;
    aPrev = Object.assign({}, r.sel);
  } else {
    const budget = parseInt($('budgetB').value,10);
    const out = renderB(budget, bMood, bPrev, expanded);
    $('planOut').innerHTML = out.html;
    bPrev = Object.assign({}, out.sel);
  }
  wire();
}

function setAnchor(a){
  if (aAnchors.indexOf(a) >= 0 || aAnchors.length >= A_DAYS) return;
  aAnchors.push(a);
  aSearch = '';
  aPrev = null; expanded = false; aFirstRun = true;
  if (aAnchors.length >= A_DAYS && aStep < 1) aStep = 1;
  renderSteps();
  const last = $('aSteps') && $('aSteps').lastElementChild;
  if (aAnchors.length >= A_DAYS && last && last.scrollIntoView) last.scrollIntoView({block:'nearest'});
}

function unsetAnchor(id){
  const i = aAnchors.indexOf(id);
  if (i < 0) return;
  aAnchors.splice(i,1);
  if (aAnchors.length < A_DAYS) aStep = 0;
  aPrev = null; aFirstRun = true;
  renderSteps();
}

function setTheme(id){
  aThemePicked = true;
  aSearch = '';
  if (id === '__none'){ aThemes = []; }
  else {
    const i = aThemes.indexOf(id);
    if (i >= 0) aThemes.splice(i,1); else aThemes.push(id);
  }
  aPrev = null; aFirstRun = true;
  renderSteps();
}

function setFood(id){
  aPin.food = (id === '__auto') ? null : id;
  aBand.food = null;
  aPrev = null; expanded = false; aFirstRun = true;
  if (aStep < 4) aStep = 4;
  renderSteps();
}

function setRhythm(id){
  aRhythm = (aRhythm === id) ? null : id;
  aPrev = null; expanded = false; aFirstRun = true;
  if (aRhythm && aStep < 2) aStep = 2;
  renderSteps();
}

function setBand(key,id){
  aBand[key] = (aBand[key] === id) ? null : id;
  aPin[key] = null;               /* 换了档位，之前钉的那一家可能不在这档里 */
  aPrev = null; expanded = false; aFirstRun = true;
  if (aBand[key] && aStep < 3) aStep = 3;
  renderSteps();
}

function relaxBands(){
  aBand.stay = null; aBand.food = null; aPin.stay = null; aPin.food = null;
  aPrev = null; expanded = false; renderSteps();
}

/* 候选区单独接线：搜索时只换这一块，输入框不重建，焦点不丢 */

/* 候选区单独接线：搜索时只换这一块，输入框不重建，焦点不丢 */
function wireCands(){
  Array.prototype.forEach.call(document.querySelectorAll('#anchorCands [data-anchor]'), function(b){
    b.onclick = function(){ setAnchor(b.dataset.anchor); };
  });
  const uc = $('useCustom');
  if (uc) uc.onclick = function(){ aCustom = aSearch.trim(); setAnchor('custom'); };
  Array.prototype.forEach.call(document.querySelectorAll('[data-unanchor]'), function(b){
    b.onclick = function(){ unsetAnchor(b.dataset.unanchor); };
  });
}

function renderSteps(){
  const box = $('aSteps');
  if (!box) return;
  box.innerHTML = stepsHTML();
  box.hidden = !showPreferences;
  Array.prototype.forEach.call(box.querySelectorAll('[data-theme]'), function(b){
    b.onclick = function(){ setTheme(b.dataset.theme); };
  });
  wireCands();
  const sb = $('anchorSearch');
  if (sb) sb.oninput = function(){
    aSearch = sb.value;
    const c = $('anchorCands');
    if (c){ c.innerHTML = candsHTML(); wireCands(); }
  };
  Array.prototype.forEach.call(box.querySelectorAll('[data-rhythm]'), function(b){
    b.onclick = function(){ setRhythm(b.dataset.rhythm); };
  });
  Array.prototype.forEach.call(box.querySelectorAll('[data-band]'), function(b){
    b.onclick = function(){ setBand(b.dataset.band, b.dataset.id); };
  });
  Array.prototype.forEach.call(box.querySelectorAll('[data-food]'), function(b){
    b.onclick = function(){ setFood(b.dataset.food); };
  });
  const ci = $('anchorText');
  if (ci) ci.oninput = function(){ aCustom = ci.value; update(); };
  const el = $('budgetA'), out = $('budgetOutA');
  if (el && out){
    el.value = aBudget;
    out.textContent = yuan(aBudget);
    el.addEventListener('input', function(){
      aBudget = parseInt(el.value,10);
      out.textContent = yuan(aBudget);
      const vs = $('budgetVs'), dd = aBudget - A_ASKED;
      if (vs){
        vs.textContent = dd===0 ? '你说的数'
          : (dd>0 ? '比你说的多 ' : '比你说的少 ') + yuan(Math.abs(dd));
        vs.className = 'vs' + (dd===0 ? ' same' : '');
      }
      expanded = false; update();
    });
  }
  update();
}

function setMood(m){
  bMood = m;
  Array.prototype.forEach.call(document.querySelectorAll('#bOpts .opt'), function(b){
    b.setAttribute('aria-pressed', String(b.dataset.mood===m));
  });
  update();
}

/* 一步一问：答完这一步，下一步才出现。内容是问出来的，不是一次性倒出来的。 */

function show(s){
  scene = s; expanded = false; aPrev = null; bPrev = null;
  Array.prototype.forEach.call(document.querySelectorAll('#tabs button'), function(b){
    b.setAttribute('aria-current', String(b.dataset.s===s));
  });
  const isPlan = s === 'plan';
  $('newBody').innerHTML = isPlan ? shellA() : shellB(bMood);
  $('newBody').scrollTop = 0;

  if (isPlan){
    renderSteps();
    wireConversation();
    return;
  }

  const el = $('budgetB'), out = $('budgetOutB');
  el.addEventListener('input', function(){
    out.textContent = yuan(parseInt(el.value,10));
    expanded = false;
    update();
  });
  out.textContent = yuan(parseInt(el.value,10));
  Array.prototype.forEach.call(document.querySelectorAll('#bOpts .opt'), function(b){
    b.onclick = function(){ setMood(b.dataset.mood); };
  });
  update();
}

Array.prototype.forEach.call(document.querySelectorAll('#tabs button'), function(b){
  b.onclick = function(){ show(b.dataset.s); };
});
initA();
show('plan');
