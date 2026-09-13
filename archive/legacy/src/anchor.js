import { HK } from './data.js';
import { byId, areaName, sideOf, mins, yuan, esc } from './util.js';
import { wxScore } from './plan.js';

/* 锚点：一天一个主心骨。这里只管「推荐谁、排在前面」，选完就不再参与任何计算。 */
/* 约束强度：越是"必须围着它排"的，越该先定——这就是锚点的本义 */
export function constraintOf(s){
  let c = 0;
  if (s.book) c += 3;                              /* 要预约 */
  if (/只有周三/.test(s.tip||'')) c += 5;           /* 一周只有一天 */
  if (s.wind) c += 2;                              /* 大风会停 */
  if (/闭馆|休息/.test(s.tip||'')) c += 1;          /* 有闭馆日 */
  return c;
}
/* 锚点排序：选了偏好走「不可替代性」，没想法走「人气」。
   两种情况都叠加：约束强度（越受限越该先定）、时间占用（越吃时间越该先定）、天气。 */

/* 锚点排序：选了偏好走「不可替代性」，没想法走「人气」。
   两种情况都叠加：约束强度（越受限越该先定）、时间占用（越吃时间越该先定）、天气。 */
export function anchorScore(s,themes,wx){
  let sc;
  if (!themes.length){
    sc = s.pop*3 + s.uniq;
  } else {
    const hit = s.themes.filter(function(t){ return themes.indexOf(t)>=0; }).length;
    if (!hit) return -1;
    sc = s.uniq*2.5 + hit*4;
  }
  return sc + constraintOf(s)*2 + Math.min(s.dur,300)/60*2.5 + wxScore(s,wx)*0.15;
}

export function anchorSearch(q){
  const k = (q||'').trim().toLowerCase();
  if (!k) return [];
  return HK.sights.filter(function(s){
    return s.n.toLowerCase().indexOf(k) >= 0 || (s.why||'').toLowerCase().indexOf(k) >= 0;
  }).slice(0,6);
}
/* 卡片上的徽章：说清这个锚点会对行程造成什么 */

/* 卡片上的徽章：说清这个锚点会对行程造成什么 */
export function anchorTags(s){
  const t = [];
  if (s.dur >= 240) t.push(['whole','吃掉整天']);
  if (s.book || /只有周三/.test(s.tip||'')) t.push(['book','得提前定']);
  if (s.uniq >= 9) t.push(['uniq','别处没有']);
  else if (s.pop >= 8) t.push(['pop','人气']);
  return t;
}

export function anchorCands(themes, limit, picked, wx, exclude){
  picked = picked || []; exclude = exclude || [];
  return HK.sights.map(function(s){
      let sc = anchorScore(s,themes,wx);
      if (sc >= 0 && picked.length){
        /* 已经定了一天的锚点，另一天该去另一边——同侧的往后压 */
        const sameSide = picked.some(function(p){ return sideOf(p.area) === sideOf(s.area); });
        sc += sameSide ? -14 : 8;
      }
      return { s:s, sc:sc };
    })
    .filter(function(x){ return x.sc >= 0 && exclude.indexOf(x.s.id) < 0; })
    .sort(function(x,y){ return y.sc - x.sc; })
    .slice(0, limit || 8).map(function(x){ return x.s; });
}
