import { HK } from './data.js';
import { esc, yuan, areaName, addMin, REDUCED } from './util.js';
import { tierOf, tierIdx } from './solve.js';

/* 渲染：把算好的东西变成 HTML。这里不做任何判断，判断都在 solve / plan / anchor 里做完了。 */
export function cardsHTML(comps,sel,prev,lockKey,order,lockLabel){
  return '<div class="cards ' + (order.length>2?'c4':'c2') + '">' + order.map(function(key){
    const t = tierOf(comps,key,sel[key]);
    const i = tierIdx(comps,key,sel[key]);
    const n = comps[key].tiers.length;
    const changed = prev && prev[key] !== sel[key] && !REDUCED;
    const locked = key === lockKey;
    return '<div class="card' + (changed?' flash':'') + (locked?' locked':'') + '">' +
      '<div class="card-top"><span class="card-label">' + comps[key].label + '</span>' +
      (locked ? '<span class="card-lock">' + (lockLabel||'你定的') + '</span>'
              : '<span class="card-tier">' + (i+1) + '/' + n + ' 档</span>') + '</div>' +
      '<div class="card-name">' + esc(t.name) + '</div>' +
      '<div class="card-note">' + (t.note ? esc(t.note) : '—') + '</div>' +
      '<div class="card-price num' + (t.price===0?' zero':'') + '">' + yuan(t.price) + '</div>' +
      '<div class="card-time' + (t.minutes>0?'':' none') + '">' +
        (t.minutes>0 ? '+' + t.minutes + ' 分钟 / 两天' : (locked?'最后才动':'不加时间')) + '</div>' +
    '</div>';
  }).join('') + '</div>';
}

/* 餐饮只有 6 档，不需要"先选档位再挑具体的"这层。直接摆出来按每顿人均比。 */

export function pickHTML(comps,key,sel,pinned,title,allowIds){
  const cur = sel[key];
  const list = allowIds
    ? comps[key].tiers.filter(function(t){ return allowIds.indexOf(t.id)>=0; })
    : comps[key].tiers;
  return '<div class="pad" style="padding:14px 18px 0"><div class="sec-h pick-h"><span>' + title + '</span>' +
    (pinned ? '<button class="unpin" type="button" data-unpin="' + key + '">交给它排</button>' : '') +
    '</div></div><div class="pick">' + list.map(function(t){
      const on = t.id === cur;
      return '<button class="pcard" type="button" data-pick="' + key + '" data-id="' + t.id +
        '" aria-pressed="' + on + '">' +
        (on ? '<span class="ptag' + (pinned?'':' auto') + '">' + (pinned?'你选的':'当前') + '</span>' : '') +
        '<span class="pn">' + esc(t.name) + '</span>' +
        '<span class="pnote">' + (t.note ? esc(t.note) : '—') + '</span>' +
        '<span class="pp num' + (t.price===0?' zero':'') + '">' + yuan(t.price) + '</span>' +
        '<span class="pm' + (t.minutes>0?'':' none') + '">' +
          (t.minutes>0 ? '+' + t.minutes + ' 分钟 / 两天' : '不加时间') + '</span></button>';
    }).join('') + '</div>';
}

export function totalsHTML(total,budget,topTotal){
  const gap = budget - total;
  return '<div class="totals">' +
    '<div class="tcell"><div class="k">方案总价</div><div class="v num">' + yuan(total) + '</div></div>' +
    '<div class="tcell"><div class="k">与预算的差额</div><div class="v num ' + (gap>=0?'pos':'neg') + '">' +
      (gap>=0?'+':'−') + yuan(Math.abs(gap)) + '</div></div>' +
    '<div class="tcell"><div class="k">相对全高档省下</div><div class="v num">' + yuan(topTotal-total) + '</div></div>' +
  '</div>';
}

/* 取舍说明——每一条都必须说出代价 */

/* 取舍说明——每一条都必须说出代价 */
export function tradeHTML(steps,comps,expanded){
  let h = '<div class="trade"><div class="sec-h">取舍说明</div><ul class="trade-list">';
  if (!steps.length){
    h += '<li><span class="trade-txt trade-empty">没有降级。这笔预算装得下现在这套。</span></li>';
  } else {
    const LIMIT = 3;
    const show = expanded ? steps : steps.slice(0,LIMIT);
    show.forEach(function(s,i){
      const what = s.to.id==='none' && s.key==='stay'
        ? '取消住宿，改当天来回'
        : comps[s.key].label + '从' + s.from.name + '换成' + s.to.name;
      h += '<li><span class="trade-idx">' + String(i+1).padStart(2,'0') + '</span>' +
           '<span class="trade-txt">为了省 <span class="save">' + yuan(s.saved) + '</span>，' +
           esc(what) + '，代价是<span class="cost">' + esc(s.cost) + '</span>。</span></li>';
    });
  }
  h += '</ul>';
  const rest = steps.length - 3;
  if (rest > 0){
    h += '<div class="more"><button type="button" id="foldBtn">' +
         (expanded ? '收起后 ' + rest + ' 项' : '…还调整了 ' + rest + ' 项') + '</button></div>';
  }
  return h + '</div>';
}

/* 行程条：站点时长固定，只有通勤增量随降级变长——富余被吃掉这件事要肉眼可见 */

/* 行程条：站点时长固定，只有通勤增量随降级变长——富余被吃掉这件事要肉眼可见 */
export function barHTML(rows,cap){
  let used = 0;
  const segs = rows.map(function(r){
    used += r.m;
    const cls = r.k==='move' ? 'seg-com' : (r.k==='gap' ? 'seg-slk'
      : (r.k==='meal' ? 'seg-meal' : (r.k==='anchor' ? 'seg-act seg-anchor' : 'seg-act')));
    return { cls:cls, m:r.m };
  });
  const over = Math.max(0, used - cap);
  const slack = Math.max(0, cap - used);
  const denom = Math.max(cap, used);
  let h = '<div class="bar">';
  segs.forEach(function(s){
    h += '<div class="seg ' + s.cls + '" style="flex:0 0 ' + (s.m/denom*100) + '%"><span class="sm">' + s.m + '</span></div>';
  });
  if (over > 0) h += '<div class="seg seg-over" style="flex:0 0 ' + (over/denom*100) + '%"><span class="sm">+' + over + '</span></div>';
  if (slack > 0) h += '<div class="seg seg-slk" style="flex:1 1 ' + (slack/denom*100) + '%"><span class="sm">' + slack + '</span></div>';
  return h + '</div>';
}

export function stopsHTML(rows,startClock){
  let t = startClock;
  return '<ul class="stops">' + rows.map(function(r){
    const at = t; t = addMin(t, r.m);
    const cls = r.k==='move' ? 'is-move' : (r.k==='gap' ? 'is-gap'
      : (r.k==='meal' ? 'is-meal' : (r.k==='anchor' ? 'is-anchor' : '')));
    let nm = '<span class="snm">' + esc(r.n) + '<span class="dur">' + r.m + ' 分</span>' +
             (r.k==='anchor' ? '<span class="pin">锚点</span>' : '') + '</span>';
    let extra = '';
    if (r.opts && r.opts.length){
      extra += '<div class="opts2">' + r.opts.map(function(o){
        return '<span class="o">' + esc(o[0]) + ' <b>' + esc(o[1]) + '</b></span>';
      }).join('') + '<span class="o" style="border-style:dashed">二选一</span></div>';
    }
    if (r.hint) extra += '<div class="hint">' + esc(r.hint) + '</div>';
    return '<li class="stop ' + cls + '"><span class="clock num">' + at + '</span>' +
      '<span class="rail"></span><span class="sbody">' + nm +
      (r.why ? '<div class="swhy">' + esc(r.why) + '</div>' : '') + extra + '</span></li>';
  }).join('') + '</ul>';
}

/* 场景 A：出发之前 */

export const LEGEND = '<div class="legend">' +
  '<span><i class="lg-act"></i>站点</span><span><i class="lg-meal"></i>吃饭</span>' +
  '<span><i class="lg-com"></i>通勤增量</span><span><i class="lg-slk"></i>空档 / 自由时间</span></div>';

export function dayBlock(label,theme,rows,cap,start){
  const used = rows.reduce(function(s,r){ return s+r.m; },0);
  const com  = rows.filter(function(r){ return r.k==='move'; }).reduce(function(s,r){ return s+r.m; },0);
  const gap  = rows.filter(function(r){ return r.k==='gap'; }).reduce(function(s,r){ return s+r.m; },0);
  const over = used - cap;
  return '<div class="day-block"><div class="day-cap">' +
    '<span class="d">' + label + '</span><span class="theme">' + esc(theme) + '</span>' +
    '<span class="s">' + start + '–' + addMin(start,used) + ' · 通勤 +' + com +
      (over>0 ? ' · 超 ' + over + ' 分' : ' · 空档 ' + (gap + (cap-used))) + '</span></div>' +
    stopsHTML(rows,start) + barHTML(rows,cap) + '</div>';
}

/* 拿「有天气」和「当没天气」两次召回做 diff——换掉了谁必须说出来 */
