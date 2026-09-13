import { HK } from './data.js';
import { byId, areaName, sideOf, hopMin, mins, addMin } from './util.js';
import { tierOf } from './solve.js';

/* 排程器：选逛哪些、怎么串、几点到几点。天气在这里参与召回和排序。 */
/* ---------- 作息：一天的边界条件。决定能塞几个点、夜里的点进不进得来 ---------- */
export const A_RHYTHM = [
  { id:'early', n:'早出早归', sub:'08:30 出门 · 19:30 收', start:'08:30', end:'19:30',
    night:-1, m1:'17:30', m2:'12:00',
    a:'08:30 出门，19:30 收工。早市是活的，代价是庙街和跑马地排不进来。' },
  { id:'normal', n:'正常', sub:'09:30 – 21:00', start:'09:30', end:'21:00',
    night:0, m1:'18:00', m2:'12:30',
    a:'09:30 出门，21:00 收工。夜市能赶上，跑马地赶不上。' },
  { id:'late', n:'晚出晚归', sub:'11:00 出门 · 23:00 收', start:'11:00', end:'23:00',
    night:2, m1:'19:00', m2:'13:00',
    a:'11:00 出门，23:00 收工。庙街十点才热闹、幻彩咏香江八点、煤气灯天黑才点——都在这一档里。' }
];

export function dayMinutes(R){ return mins(R.end) - mins(R.start); }

/* ---------- 规划器：锚点 → 逛什么 → 排成两天 ---------- */

/* ---------- 规划器：锚点 → 逛什么 → 排成两天 ---------- */
export function anchorSight(id, customName){
  if (id === 'custom') return { id:'custom', n:(customName||'自己填的地方'), area:'tst', price:0, dur:60,
    from:'00:00', to:'23:59', cat:'外', w:9, tags:[],
    why:'你自己填的，排在最前面，其余按顺路排。', tip:'' };
  return byId(HK.sights,id) || byId(HK.sights,'daikwun');
}

const SP_CACHE = {};
export function clearPlanCache(){ for (const k in SP_CACHE) delete SP_CACHE[k]; }
/* 选逛哪些：同侧优先、离锚点近的优先、权重高的优先，付费的受配额卡着 */
/* 天气打分：下雨把露天的往后压，晴天把露天的往前提；8 号风球直接砍掉停运的 */

/* 天气打分：下雨把露天的往后压，晴天把露天的往前提；8 号风球直接砍掉停运的 */
export function wxScore(s,wx){
  if (!wx) return 0;
  const c = s.cover || 'half';
  if (wx.rain >= 70) return c==='in' ? 20 : (c==='half' ? 6 : -26);
  if (wx.rain >= 40) return c==='in' ? 7  : (c==='half' ? 2 : -8);
  return c==='open' ? 8 : 0;
}

export function wxDrop(s,wx){ return !!(wx && wx.wind8 && s.wind); }

export function sightPick(anchorIds, planId, rhythmId, wx1, wx2, customName, lessWalking = false){
  const ids = [].concat(anchorIds);
  const wk = function(w){ return w ? (w.rain + (w.wind8?'T':'')) : '-'; };
  const key = String(lessWalking) + '|' + ids.join(',') + '|' + planId + '|' + rhythmId + '|' + wk(wx1) + '|' + wk(wx2) + '|' +
              (ids.indexOf('custom')>=0 ? (customName||'') : '');
  if (SP_CACHE[key]) return SP_CACHE[key];
  const A = anchorSight(ids[0], customName);
  const A2 = ids[1] ? anchorSight(ids[1], customName) : null;
  const R = byId(A_RHYTHM, rhythmId) || A_RHYTHM[1];
  const endM = mins(R.end), dayM = dayMinutes(R);
  const plan = byId(HK.sightPlans, planId) || HK.sightPlans[0];
  const quota = { left: plan.max };
  const used = A2 ? [A.id, A2.id] : [A.id];
  function isNight(s){ return !!(s.tags && s.tags.indexOf('night')>=0); }

  function gather(seedArea, side, cap, wx){
    const out = []; let spent = 0, cur = seedArea;
    const cands = HK.sights.filter(function(s){
      if (used.indexOf(s.id) >= 0 || sideOf(s.area) !== side) return false;
      if (lessWalking && ((s.tags || []).includes('walk') || s.area !== seedArea)) return false;
      if (wxDrop(s,wx)) return false;                  /* 风球下停运的，不排 */
      /* 开门太晚 → 这个作息下根本逛不完，直接不考虑（留 30 分钟回程） */
      return mins(s.from) + s.dur <= endM - 30;
    }).map(function(s){
      let sc = s.pop*10 - hopMin(seedArea,s.area)/2;
      if (isNight(s)) sc += R.night * 12;              /* 晚归加权，早出降权 */
      if (mins(s.from) <= 540) sc += (R.id==='early' ? 10 : 0);  /* 早出：早开门的点更值 */
      sc += wxScore(s,wx);
      return { s:s, score: sc };
    }).sort(function(x,y){ return y.score - x.score; });
    cands.forEach(function(c){
      const s = c.s;
      if (out.length >= (lessWalking ? 2 : 4)) return;
      const cost = s.dur + hopMin(cur, s.area);
      if (spent + cost > cap) return;
      if (s.price > 0){ if (quota.left <= 0) return; quota.left--; }
      out.push(s); used.push(s.id); spent += cost; cur = s.area;
    });
    return out;
  }

  const side1 = sideOf(A.area);
  const d1 = gather(A.area, side1, Math.round(dayM*0.58) - A.dur, wx1).concat([A]);

  /* 第二天：有第二个锚点就围着它排，没有就换一侧 */
  const side2 = A2 ? sideOf(A2.area) : (side1 === 'kln' ? 'hk' : 'kln');
  const seed2 = A2 ? A2.area : (side2==='kln' ? 'tst' : 'central');
  const cap2 = Math.round(dayM*0.55) - (A2 ? A2.dur : 0);
  const d2 = gather(seed2, side2, cap2, wx2).concat(A2 ? [A2] : []);

  const anchorIdSet = ids.slice();
  const paid = d1.concat(d2).filter(function(s){
    return anchorIdSet.indexOf(s.id) < 0 && s.price > 0; });
  const res = {
    d1: orderStops(A.area, d1), d2: orderStops(seed2, d2), a2: A2,
    seed2: seed2,
    paidSum: paid.reduce(function(t,s){ return t + s.price; },0),
    paidNames: paid.map(function(s){ return s.n; })
  };
  SP_CACHE[key] = res;
  return res;
}

/* 排序：同区的排一起，区之间最近邻串，夜里的排最后 */

/* 排序：同区的排一起，区之间最近邻串，夜里的排最后 */
export function nightRank(s){ return (s.tags && s.tags.indexOf('night')>=0) ? 2 : (s.cat==='市' ? 1 : 0); }

export function orderStops(seedArea, list){
  const groups = {}, areas = [];
  list.forEach(function(s){
    if (!groups[s.area]){ groups[s.area] = []; areas.push(s.area); }
    groups[s.area].push(s);
  });
  const chain = []; let cur = seedArea, left = areas.slice();
  while (left.length){
    let bi = 0, bd = 1e9;
    left.forEach(function(a,i){ const d = hopMin(cur,a); if (d < bd){ bd = d; bi = i; } });
    cur = left[bi]; chain.push(cur); left.splice(bi,1);
  }
  chain.sort(function(a,b){
    function mx(g){ return g.reduce(function(t,s){ return Math.max(t,nightRank(s)); },0); }
    return mx(groups[a]) - mx(groups[b]);
  });
  const out = [];
  chain.forEach(function(a){
    groups[a].sort(function(x,y){ return nightRank(x)-nightRank(y) || mins(x.to)-mins(y.to); });
    groups[a].forEach(function(s){ out.push(s); });
  });
  return out;
}

/* 把一串站点排成带时刻的行：走过去、等开门、该吃饭了、逛 */

/* 把一串站点排成带时刻的行：走过去、等开门、该吃饭了、逛 */
export function layDay(startClock, seedArea, stops, anchorId, meal, mealAt){
  const rows = []; let t = mins(startClock), area = seedArea, ate = false;
  function pushMeal(){
    rows.push({ k:'meal', n:meal.cap, m:meal.m, why:meal.why, opts:meal.opts, hint:meal.hint });
    t += meal.m; ate = true;
  }
  stops.forEach(function(s){
    const hop = hopMin(area, s.area);
    if (hop >= 8){ rows.push({ k:'move', n:'前往 ' + areaName(s.area), m:hop, why:'' }); t += hop; }
    else t += hop;
    area = s.area;
    const open = mins(s.from);
    if (t < open){
      rows.push({ k:'gap', m:open-t, n:'等 ' + s.n + ' 开门',
        why: s.n + ' ' + s.from + ' 才开门——这段空档是这个作息换来的。' });
      t = open;
    }
    if (!ate && t >= mins(mealAt)) pushMeal();
    rows.push({ k: s.id===anchorId ? 'anchor' : 'stop', n:s.n, m:s.dur, why:s.why, hint:s.tip });
    t += s.dur;
  });
  if (!ate) pushMeal();
  return rows;
}

export function dayTheme(stops){
  const seen = [];
  stops.forEach(function(s){ if (seen.indexOf(s.area)<0) seen.push(s.area); });
  return seen.map(areaName).join(' → ') + '，不走回头路';
}

/* ---------- 场景 B：已经在路上 ---------- */
