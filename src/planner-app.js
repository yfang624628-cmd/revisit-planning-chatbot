import {examples} from './examples.js';

const root=document.querySelector('#newBody');root.id='planner';
const emptyState=()=>({sessionId:null,slots:null,revisit:null,phase:'collecting',proposals:[],selectedProposal:null,plan:null,lockedDays:[],confirmed:false,baseBudget:null,answer:''});
let state=emptyState();
let busy=false,error='',draft='',budgetDraft=null,localAction=false;
let cardNotice=null,noticeTimer=null;
let routes={},routeLoading=null,routeErrors={};
const storageKey='travel-revisit-session-v1';
try{const saved=JSON.parse(sessionStorage.getItem(storageKey)||'null');if(saved?.sessionId)state=saved;}catch{}
const escape=value=>String(value??'').replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const money=value=>'¥'+Number(value).toLocaleString('zh-CN');
const daySignature=day=>JSON.stringify(day||null);
const dayCost=day=>day?Object.values(day.cost).reduce((sum,value)=>sum+value,0):0;
function dayChangeNotice(before,after){
  if(daySignature(before)===daySignature(after))return '本次安排没有变化。';
  const changes=[];
  if(before.stops.length!==after.stops.length)changes.push(`${before.stops.length} 站变为 ${after.stops.length} 站`);
  if(before.hotel!==after.hotel)changes.push('住宿建议已更新');
  if(before.food!==after.food)changes.push('餐饮建议已更新');
  const costChange=dayCost(after)-dayCost(before);
  if(costChange)changes.push(`当天估算${costChange>0?'增加':'减少'} ${money(Math.abs(costChange))}`);
  return '这一天已调整：'+(changes.length?changes.join('，'):'地点或时间安排已更新')+'。';
}
function showCardNotice(day,text){
  clearTimeout(noticeTimer);cardNotice={day,text};
  noticeTimer=setTimeout(()=>{cardNotice=null;root.querySelectorAll('.card-notice').forEach(element=>element.remove());},8000);
}
function displayTime(value){
  const match=value.match(/^\+(\d{2}):(\d{2})\s*[–—-]\s*\+(\d{2}):(\d{2})$/);
  return match?'现在起 '+(Number(match[1])*60+Number(match[2]))+'–'+(Number(match[3])*60+Number(match[4]))+' 分钟':value;
}
function worldPoint(lon,lat,zoom){
  const scale=256*2**zoom;
  const clipped=Math.max(-85.0511,Math.min(85.0511,lat))*Math.PI/180;
  return {x:(lon+180)/360*scale,y:(1-Math.log(Math.tan(clipped)+1/Math.cos(clipped))/Math.PI)/2*scale};
}
function routeMap(route){
  const width=640,height=300,padding=42;
  const coordinates=route.geometry.length?route.geometry:route.points.map(point=>[point.lon,point.lat]);
  if(!coordinates.length)return '';
  let zoom=1;
  let initialPixels=coordinates.map(([lon,lat])=>worldPoint(lon,lat,zoom));
  let bounds={left:Math.min(...initialPixels.map(point=>point.x)),right:Math.max(...initialPixels.map(point=>point.x)),top:Math.min(...initialPixels.map(point=>point.y)),bottom:Math.max(...initialPixels.map(point=>point.y))};
  for(let candidate=16;candidate>=2;candidate--){
    const pixels=coordinates.map(([lon,lat])=>worldPoint(lon,lat,candidate));
    const xs=pixels.map(point=>point.x),ys=pixels.map(point=>point.y);
    const candidateBounds={left:Math.min(...xs),right:Math.max(...xs),top:Math.min(...ys),bottom:Math.max(...ys)};
    if(candidateBounds.right-candidateBounds.left<=width-padding*2&&candidateBounds.bottom-candidateBounds.top<=height-padding*2){zoom=candidate;bounds=candidateBounds;break;}
  }
  const centerX=(bounds.left+bounds.right)/2,centerY=(bounds.top+bounds.bottom)/2;
  const left=centerX-width/2,top=centerY-height/2;
  const tileSize=256,tiles=[];
  const maxTile=2**zoom;
  for(let tileY=Math.floor(top/tileSize);tileY<=Math.floor((top+height)/tileSize);tileY++){
    if(tileY<0||tileY>=maxTile)continue;
    for(let tileX=Math.floor(left/tileSize);tileX<=Math.floor((left+width)/tileSize);tileX++){
      const wrapped=(tileX%maxTile+maxTile)%maxTile;
      tiles.push(`<image href="https://tile.openstreetmap.org/${zoom}/${wrapped}/${tileY}.png" x="${Math.round(tileX*tileSize-left)}" y="${Math.round(tileY*tileSize-top)}" width="256" height="256"></image>`);
    }
  }
  const line=route.geometry.map(([lon,lat])=>{const point=worldPoint(lon,lat,zoom);return `${(point.x-left).toFixed(1)},${(point.y-top).toFixed(1)}`;}).join(' ');
  const markers=route.points.map(point=>{const pixel=worldPoint(point.lon,point.lat,zoom);return `<g transform="translate(${(pixel.x-left).toFixed(1)} ${(pixel.y-top).toFixed(1)})"><circle r="13"></circle><text y="5">${point.stopNumber}</text></g>`;}).join('');
  return `<div class="route-map" role="img" aria-label="当天已匹配地点${route.geometry.length?'的步行连接路线':'的位置'}"><svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">${tiles.join('')}${line?`<polyline points="${line}"></polyline>`:''}${markers}</svg><span class="map-attribution">© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a></span></div>`;
}
function routePanel(index){
  if(routeLoading===index)return `<div class="route-panel" id="route-panel-${index}"><p>正在匹配当天地点…</p></div>`;
  if(routeErrors[index])return `<div class="route-panel route-error" id="route-panel-${index}"><p>${escape(routeErrors[index])}</p>${button('重试','route',`data-day="${index}"`)}</div>`;
  const route=routes[index];
  if(!route)return '';
  const coverage=`已匹配 ${route.points.length}/${route.totalStops} 站`;
  if(!route.points.length)return `<div class="route-panel route-error" id="route-panel-${index}"><p>这几个地点暂时没匹配到，行程仍可查看。</p><p class="route-warning">未匹配：${escape(route.unresolved.join('、'))}</p>${button('重试','route',`data-day="${index}"`)}</div>`;
  const summary=route.distance!==null?`<div class="route-summary"><strong>${coverage}</strong><span>按步行路线连接约 ${(route.distance/1000).toFixed(1)} 公里 · ${Math.max(1,Math.round(route.duration/60))} 分钟${route.includesFerry?' · 含渡轮路段':''}</span></div>`:`<div class="route-summary"><strong>${coverage}</strong><span>${route.routeUnavailable?'暂未找到这些地点间的步行连接':'至少匹配两站后显示步行距离'}</span></div>`;
  const matched=`<details class="matched-places"><summary>查看地图匹配结果</summary><ol class="located-list">${route.points.map(point=>`<li><b>${point.stopNumber}</b><span>${escape(point.name)}</span><small>${escape(point.displayName)}</small></li>`).join('')}</ol></details>`;
  return `<div class="route-panel" id="route-panel-${index}">${routeMap(route)}${summary}${route.unresolved.length?`<p class="route-warning">未匹配：${escape(route.unresolved.join('、'))}。上方距离不包含这些地点。</p>`:''}${matched}<p class="map-note">用于理解已匹配地点怎样连接，不是实时导航。</p></div>`;
}
const button=(text,action,extra='')=>`<button type="button" data-action="${action}" ${extra}>${escape(text)}</button>`;
function revisitSummary(){
  if(!state.revisit)return '';
  const parts=[];
  if(state.revisit.avoid?.length)parts.push('不重复：'+state.revisit.avoid.join('、'));
  if(state.revisit.revisit?.length)parts.push('还想去：'+state.revisit.revisit.join('、'));
  if(state.revisit.liked?.length)parts.push('上次喜欢：'+state.revisit.liked.join('、'));
  if(state.revisit.interests?.length)parts.push('这次想试：'+state.revisit.interests.join('、'));
  if(state.revisit.pace)parts.push('节奏：'+state.revisit.pace);
  if(state.revisit.mobility)parts.push('体力：'+state.revisit.mobility);
  return parts.length?`<div class="revisit-summary"><strong>这次已知道</strong><p>${escape(parts.join(' · '))}</p></div>`:'';
}
function slotsView(){
  const fields=[['destination',state.slots.mode==='now'?'你现在在哪':'目的地'],['people','人数'],['budget','当地行程预算（人民币）'],[state.slots.mode==='now'?'hours':'days',state.slots.mode==='now'?'还剩几小时':'玩几天'],...(state.slots.mode==='now'?[]:[['origin','出发地（可选）'],['date','日期（可选）']])];
  return `<section><h2>核对一下，再看玩法</h2><p class="scope-note">预算用于住宿、餐饮、当地交通和游玩${state.slots.mode==='now'?'。':'，不含从出发地往返的机票或火车。'}</p>${revisitSummary()}<form id="confirm"><div class="fields">${fields.map(([key,label])=>`<label>${label}<input name="${key}" type="${['people','budget','days','hours'].includes(key)?'number':'text'}" value="${escape(state.slots[key])}" ${['origin','date'].includes(key)?'':'required'} ${key==='hours'?'min="0.5" step="0.5"':['people','budget','days'].includes(key)?'min="1" step="1"':''}></label>`).join('')}<label>预算口径<select name="scope"><option value="total" ${state.slots.scope==='total'?'selected':''}>所有人合计</option><option value="person" ${state.slots.scope==='person'?'selected':''}>每人</option></select></label></div><button class="primary">确认，看看这次怎么玩</button></form></section>`;
}
function proposalsView(){
  if(state.phase!=='exploring'||!state.proposals?.length)return '';
  return `<section class="proposal-section"><span class="eyebrow">${escape(state.slots.destination)} · 换一种玩法</span><h2>选一个有点心动的方向</h2>${revisitSummary()}<div class="proposal-grid">${state.proposals.map(item=>`<article class="proposal-card"><span>${escape(item.effort)} · 费用${escape(item.cost)}</span><h3>${escape(item.title)}</h3><strong>${escape(item.anchor)}</strong><p>${escape(item.supporting.join(' · '))}</p><p>${escape(item.novelty)}</p><small>${escape(item.tradeoff)}</small>${button('按这个方向安排','proposal',`data-proposal-id="${escape(item.id)}"`)}</article>`).join('')}</div><div class="proposal-footer">${button('这几个都不太对','explain')}<span>说说是内容、距离还是体力不合适，我再换。</span></div></section>`;
}
function budgetOutputText(value){
  const amount=money(value)+(state.slots.scope==='person'?'/人':' 全员');
  if(value===state.slots.budget)return amount;
  return `${money(state.slots.budget)} → ${amount}`;
}
function planView(){
  const plan=state.plan;
  const budgetText=state.slots.scope==='person'?`每人 ${money(state.slots.budget)} · 全员 ${money(plan.budgetTotal)}`:`全员 ${money(plan.budgetTotal)}`;
  const budgetValue=budgetDraft??state.slots.budget;
  return `<section class="overview"><span class="eyebrow">${state.slots.mode==='now'?'接下来的 '+state.slots.hours+' 小时':state.slots.days+' 天 · '+state.slots.people+' 人'}</span><h2>${escape(plan.title)}</h2>${state.selectedProposal?`<p class="selected-proposal"><strong>这次主线</strong>${escape(state.selectedProposal.title)} · ${escape(state.selectedProposal.anchor)}</p>`:''}<div class="budgetline"><strong>当地行程估算 ${money(plan.estimatedTotal)}</strong><span>当地预算 ${budgetText}</span></div><p class="note">住宿、餐饮、当地交通和游玩的粗估${state.slots.mode==='now'?'。':'，不含从出发地往返的机票或火车。'}地点、价格与营业信息仍需确认。</p>${plan.estimatedTotal>plan.budgetTotal?'<p class="error">当前估算超出当地预算 '+money(plan.estimatedTotal-plan.budgetTotal)+'，可以选择“省一点”调整。</p>':''}<details><summary>微调当地预算</summary><input id="budget" aria-label="当地预算微调" type="range" min="${Math.max(1,state.baseBudget-500)}" max="${state.baseBudget+500}" value="${budgetValue}" step="50"><output id="budget-value">${budgetOutputText(budgetValue)}</output>${button('按这个预算调整','budget')}</details><div class="chips">${button('轻松一点','adjust','data-message="未锁定的日程减少步行和景点，轻松一点"')}${button('省一点','adjust','data-message="在当地预算内让未锁定的日程更省钱，不靠编造低价"')}${state.slots.mode==='now'?'':button('住好一点','adjust','data-message="当地预算不变，未锁定的日程住好一点，可减少其他消费"')}</div></section><div class="days">${plan.days.map((day,index)=>`<article class="day"><div class="dayhead"><span>${state.slots.mode==='now'?'现在出发':'DAY '+(index+1)} · ${escape(day.city)}</span>${button(state.lockedDays.includes(index)?'已保留 🔒':'保留这一天','lock',`data-day="${index}" aria-pressed="${state.lockedDays.includes(index)}"`)}</div>${cardNotice?.day===index?'<p class="card-notice" role="status">'+escape(cardNotice.text)+'</p>':''}<h3>${escape(day.title)}</h3><ol>${day.stops.map(stop=>`<li><span class="time">${escape(displayTime(stop.time))}</span><strong>${escape(stop.name)}</strong><p>${escape(stop.note)}</p></li>`).join('')}</ol><details><summary>${state.slots.mode==='now'?'吃什么 · 怎么走':'住哪里 · 吃什么 · 怎么走'}</summary><dl>${state.slots.mode==='now'?'':`<dt>住宿建议</dt><dd>${escape(day.hotel)}</dd>`}<dt>餐饮建议</dt><dd>${escape(day.food)}</dd><dt>交通建议</dt><dd>${escape(day.transport)}</dd><dt>当天全员费用粗估</dt><dd>${Object.entries(day.cost).map(([key,value])=>({stay:'住宿',food:'餐饮',transport:'交通',activities:'游玩'}[key])+' '+money(value)).join(' · ')}</dd></dl></details><div class="day-actions">${routes[index]?'':button('查看路线','route',`data-day="${index}" ${routeLoading===index?'disabled':''}`)}<div class="chips">${button('这天轻松点','day',`data-day="${index}" data-message="减少这一天的步行和景点，保持城市和住宿不变" ${state.lockedDays.includes(index)?'disabled':''}`)}${button('换个安排','day',`data-day="${index}" data-message="同一城市换一组不同的游览地点，住宿不变" ${state.lockedDays.includes(index)?'disabled':''}`)}</div></div>${routePanel(index)}</article>`).join('')}</div>`;
}
function render(){
  const intro=!state.sessionId;
  const showChat=intro||state.phase!=='confirming';
  const staleReply=state.plan&&state.reply==='信息够了，核对一下就能生成第一版。';
  const feedback=busy&&!localAction?'正在回复，请稍候；原方案会保留。':error||(staleReply?'':state.reply)||'';
  const heading=intro?'这次，想换个玩法吗？':state.plan?'想改哪里，或者有什么想问的？':state.phase==='exploring'?'这几个方向哪里对，哪里不对？':'补充一下，就能开始安排';
  const placeholder=state.plan?'例如：第二天太赶了；这个安排适合带爸妈吗？':state.phase==='exploring'?'例如：第二个不错，但不想逛展；或者：选第二个':'说说去哪、玩多久、几个人、当地预算，以及哪些不想重复…';
  const chat=showChat?`<div class="${intro?'welcome':'conversation'}"><h2 id="chat-heading">${heading}</h2>${intro?'<div class="chips examples">'+examples.map(example=>button(example.label,'example','data-message="'+escape(example.message)+'"')).join('')+'</div>':''}<div id="feedback" role="status" aria-live="polite" ${!feedback?'hidden':''}>${escape(feedback)}</div><form id="chat" aria-labelledby="chat-heading"><textarea aria-labelledby="chat-heading" name="message" rows="2" maxlength="1800" required placeholder="${placeholder}">${escape(draft)}</textarea><button class="primary">发送</button></form></div>`:'';
  root.innerHTML=`${state.sessionId?'<div class="topline">'+button('重新开始','reset')+'</div>':''}${chat}${state.slots&&!state.confirmed?slotsView():''}${proposalsView()}${state.plan?planView():''}`;
  if(busy)root.querySelectorAll('button,input,select,textarea').forEach(element=>element.disabled=true);
}
async function request(action,extra={}){
  if(busy)return;busy=true;error='';localAction=['lock','resume','day'].includes(action);
  if(action==='day'){clearTimeout(noticeTimer);cardNotice={day:extra.day,text:'正在调整这一天…'};}
  render();
  if(!localAction)root.querySelector('#feedback')?.scrollIntoView({block:'nearest'});
  try{
    const response=await fetch('/api/planner',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:state.sessionId,action,...extra}),signal:AbortSignal.timeout(90000)});
    const result=await response.json();if(!response.ok)throw new Error(result.error||'请求失败');
    const previousReply=state.reply||'';
    const previousPlan=state.plan;
    state={...result,reply:localAction?previousReply:result.answer};
    for(const key of new Set([...Object.keys(routes),...Object.keys(routeErrors)]))if(daySignature(previousPlan?.days[key])!==daySignature(state.plan?.days[key])){delete routes[key];delete routeErrors[key];}
    if(action==='message')draft='';
    if(action!=='lock'&&action!=='resume')budgetDraft=null;
    if(action==='lock')showCardNotice(extra.day,result.lockedDays.includes(extra.day)?'已保留，后续调整不会改动这一天。':'已取消保留，可以调整这一天。');
    if(action==='day')showCardNotice(extra.day,dayChangeNotice(previousPlan.days[extra.day],state.plan.days[extra.day]));
    try{sessionStorage.setItem(storageKey,JSON.stringify(state));}catch{}
  }catch(problem){
    const message=problem.name==='TimeoutError'?'请求超时，原方案没有改变，请重试。':problem.message;
    if(action==='day')showCardNotice(extra.day,message);else error=message;
  }
  finally{busy=false;render();if(!localAction&&(error||state.reply))root.querySelector('#feedback')?.scrollIntoView({block:'nearest'});localAction=false;}
}
async function requestRoute(day){
  if(routeLoading!==null)return;
  const requestedSession=state.sessionId,requestedDay=daySignature(state.plan.days[day]);
  routeLoading=day;delete routeErrors[day];render();
  try{
    const response=await fetch('/api/planner',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:state.sessionId,action:'route',day}),signal:AbortSignal.timeout(90000)});
    const result=await response.json();if(!response.ok)throw new Error(result.error||'路线查询失败');
    if(state.sessionId===requestedSession&&daySignature(state.plan?.days[day])===requestedDay)routes[day]=result.route;
  }catch(problem){routeErrors[day]=problem.name==='TimeoutError'?'路线查询超时，请稍后重试。':problem.message;}
  finally{routeLoading=null;render();document.querySelector('#route-panel-'+day)?.scrollIntoView({block:'nearest'});}
}
root.addEventListener('input',event=>{if(event.target.name==='message')draft=event.target.value;if(event.target.id==='budget'){budgetDraft=Number(event.target.value);root.querySelector('#budget-value').textContent=budgetOutputText(budgetDraft);}});
root.addEventListener('change',event=>{if(event.target.closest('#confirm')&&state.slots){const field=event.target;state.slots[field.name]=field.type==='number'?(field.value===''?null:Number(field.value)):field.value;}});
root.addEventListener('submit',event=>{event.preventDefault();if(busy)return;const values=Object.fromEntries(new FormData(event.target));if(event.target.id==='chat')request('message',{message:values.message});if(event.target.id==='confirm'){for(const key of ['days','hours','people','budget'])if(key in values)values[key]=Number(values[key]);request('confirm',{slots:values});}});
root.addEventListener('click',event=>{
  const target=event.target.closest('[data-action]');if(!target||busy)return;const {action,message,day,proposalId}=target.dataset;
  if(action==='example'){draft=message;render();root.querySelector('textarea').focus();}
  if(action==='adjust')request('message',{message});
  if(action==='day')request('day',{day:Number(day),message});
  if(action==='lock')request('lock',{day:Number(day)});
  if(action==='budget')request('budget',{budget:budgetDraft??state.slots.budget});
  if(action==='route')requestRoute(Number(day));
  if(action==='proposal')request('proposal',{proposalId});
  if(action==='explain'){draft='这几个都不太对，因为 ';render();root.querySelector('textarea').focus();}
  if(action==='reset'){clearTimeout(noticeTimer);cardNotice=null;routes={};routeErrors={};state=emptyState();error='';draft='';budgetDraft=null;try{sessionStorage.removeItem(storageKey);}catch{}render();}
});
render();
if(state.sessionId)request('resume',{snapshot:state});
