import { HK } from './data.js';

/* 通用小工具：查表、时间、金额。没有状态，谁都能 import。 */

export function byId(list,id){ for (let i=0;i<list.length;i++){ if (list[i].id===id) return list[i]; } return null; }
export function areaName(a){ return HK.areas[a] ? HK.areas[a].n : a; }
export function sideOf(a){ return HK.areas[a] ? HK.areas[a].side : 'kln'; }

export function hopMin(a,b){
  if (a===b) return 0;
  const h = HK.hop[a+'|'+b] || HK.hop[b+'|'+a];
  if (h) return h;
  const sa = sideOf(a), sb = sideOf(b);
  if (sa==='out' || sb==='out') return 70;
  return sa===sb ? 25 : 40;
}

export function hhmm(m){
  m = ((m%1440)+1440)%1440;
  return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
}
export function mins(hhmmStr){ const p=hhmmStr.split(':'); return parseInt(p[0],10)*60+parseInt(p[1],10); }
export function addMin(hhmmStr,m){
  const p = hhmmStr.split(':');
  const t = (parseInt(p[0],10)*60 + parseInt(p[1],10) + m) % 1440;
  return String(Math.floor(t/60)).padStart(2,'0') + ':' + String(t%60).padStart(2,'0');
}

export function money(n){ return '¥' + n.toLocaleString('en-US'); }
export const yuan = money;
export const esc = function(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
};

export const REDUCED = typeof window !== 'undefined' && window.matchMedia
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;
