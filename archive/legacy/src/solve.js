/* 求解器。纯函数，不碰 DOM、不碰全局状态——这是整个项目最该被测的一块。 */
export function tierOf(comps,key,id){
  const ts = comps[key].tiers;
  for (let i=0;i<ts.length;i++){ if (ts[i].id===id) return ts[i]; }
  return ts[0];
}

export function tierIdx(comps,key,id){
  const ts = comps[key].tiers;
  for (let i=0;i<ts.length;i++){ if (ts[i].id===id) return i; }
  return 0;
}

export function sumOf(comps,sel){
  return Object.keys(sel).reduce(function(s,k){ return s + tierOf(comps,k,sel[k]).price; },0);
}
/* 从最高档开始，按序列依次降一档，直到装得下或序列耗尽 */

/* 从最高档开始，按序列依次降一档，直到装得下或序列耗尽 */
export function withPin(top,pin){
  const sel = Object.assign({},top);
  if (pin) Object.keys(pin).forEach(function(k){ if (pin[k]) sel[k] = pin[k]; });
  return sel;
}

export function solve(comps,top,seq,budget,pin){
  const sel = withPin(top,pin), steps = [];
  let total = sumOf(comps,sel);
  for (let i=0;i<seq.length && total>budget;i++){
    const s = seq[i];
    if (pin && pin[s.key]) continue;
    const from = tierOf(comps,s.key,sel[s.key]);
    const to   = tierOf(comps,s.key,s.to);
    sel[s.key] = s.to;
    total = total - from.price + to.price;
    steps.push({ key:s.key, from:from, to:to, saved:from.price-to.price, cost:s.cost });
  }
  return { sel:sel, steps:steps, total:total, exhausted:(total>budget) };
}

export function floorOf(comps,top,seq,pin){
  const sel = withPin(top,pin);
  seq.forEach(function(s){ if (!(pin && pin[s.key])) sel[s.key] = s.to; });
  return sumOf(comps,sel);
}

/* 降级序列：按「先吃、再住、再景点、最后交通」轮着往下降一档，直到全部见底。
   allow 限定了某个部件只能在这些档里动——用户选了价位，降级就不许跳出这个价位。 */
export function buildSeq(comps,order,allow){
  const idx = {}, seq = [];
  order.forEach(function(k){ idx[k] = 0; });
  let moved = true;
  while (moved){
    moved = false;
    order.forEach(function(k){
      const ts = (allow && allow[k])
        ? comps[k].tiers.filter(function(t){ return allow[k].indexOf(t.id)>=0; })
        : comps[k].tiers;
      if (idx[k] < ts.length-1){
        idx[k]++; moved = true;
        seq.push({ key:k, to:ts[idx[k]].id, cost:ts[idx[k]].down || '' });
      }
    });
  }
  return seq;
}

/* ---------- 作息：一天的边界条件。决定能塞几个点、夜里的点进不进得来 ---------- */
