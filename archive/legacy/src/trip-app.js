import {emptySlots,defaultPreferences,slotErrors,SLOT_LABELS,THEMES,RHYTHMS,totalBudget,spendingPlan,rankPlaces,recommendedAnchors,clock,distance} from './trip-core.js';

const stylesheet = document.createElement('link');
stylesheet.rel = 'stylesheet'; stylesheet.href = '/src/trip.css'; document.head.append(stylesheet);
document.querySelector('.masthead .kicker')?.remove();
document.querySelector('#tabs').remove();
const root = document.querySelector('#newBody');
root.id = 'trip';
const state = {slots:emptySlots(),preferences:defaultPreferences(),confirmed:false,preferencesConfirmed:false,stage:0,cities:[],catalog:null,anchors:[],selections:{hotel:null,meals:[]},plan:null,history:[],pending:null,baseBudget:null,busy:false,query:''};
const escape = value => String(value ?? '').replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const money = value => '¥'+Number(value).toLocaleString('zh-CN');
const button = (label,action,attributes='') => `<button type="button" data-action="${action}" ${attributes}>${escape(label)}</button>`;
async function api(path,input){
  const response = await fetch('/api/trip/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input),signal:AbortSignal.timeout(path==='generate'?540000:80000)});
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || '请求失败，请重试');
  return result;
}
function payload(){return {slots:state.slots,preferences:state.preferences,confirmed:state.confirmed,preferencesConfirmed:state.preferencesConfirmed,catalogId:state.catalog?.id,anchors:state.anchors,selections:state.selections};}
function conversationState(){return {...payload(),plan:state.plan?{priceStatus:state.plan.priceStatus,routeStatus:state.plan.routeStatus,days:state.plan.days.map(day=>({date:day.date,hotel:day.hotel?.name,restaurant:day.restaurant?.name,stops:day.stops.map(stop=>({name:stop.place.name,arrival:stop.arrival,travel:stop.travel,issue:stop.issue,wheelchair:stop.place.wheelchair}))}))}:null};}
function resetPlan(){state.plan=null;state.pending=null;}
function resetSlots(){state.confirmed=false;state.preferencesConfirmed=false;state.catalog=null;state.cities=[];state.stage=0;state.anchors=[];state.selections={hotel:null,meals:[]};resetPlan();}
function field(key,type='text'){
  return `<label>${SLOT_LABELS[key]}${key==='budget'?'（人民币）':''}<input name="${key}" type="${type}" value="${escape(state.slots[key])}" ${type==='number'?'step="1" min="'+(key==='children'?0:1)+'"':''}></label>`;
}
function options(key,values){return `<div class="options">${Object.entries(values).map(([value,label])=>button(label,'pref',`data-key="${key}" data-value="${value}" aria-pressed="${key==='themes'?state.preferences.themes.includes(value):state.preferences[key]===value}"`)).join('')}</div>`;}
function slotView(){return `<section><h2>这次准备去哪里？</h2><form id="slots"><div class="grid">${field('origin')}${field('destination')}${field('startDate','date')}${field('days','number')}${field('adults','number')}${field('children','number')}${field('rooms','number')}${field('budget','number')}<label>预算口径<select name="budgetScope"><option value="total" ${state.slots.budgetScope==='total'?'selected':''}>全员总预算</option><option value="person" ${state.slots.budgetScope==='person'?'selected':''}>每人预算</option></select></label></div><button class="primary next">确认信息，查找城市</button></form>${state.cities.length?'<h3>确认目的地</h3><div class="options">'+state.cities.map(city=>button([city.name,city.region,city.country].filter(Boolean).join(' · '),'city',`data-id="${city.id}"`)).join('')+'</div>':''}</section>`;}
function preferenceView(){return `<section><h2>想怎样度过这几天？</h2><h3>旅行偏好 · 可多选</h3>${options('themes',THEMES)}<p>${button('没想法，推荐地标','noidea',`aria-pressed="${!state.preferences.themes.length}"`)}</p><h3>出门与回去的时间</h3>${options('rhythm',Object.fromEntries(Object.entries(RHYTHMS).map(([key,value])=>[key,value.name+' '+clock(value.start)+'–'+clock(value.end)])))}<h3>节奏</h3>${options('pace',{normal:'多逛一些',relaxed:'轻松一点'})}<h3>市内交通</h3>${options('mode',{walking:'步行',driving:'驾车 / 出租车'})}<h3>住宿偏好</h3>${options('stayTier',{any:'不限',economy:'经济型',comfort:'舒适型',premium:'高档型'})}<h3>吃饭偏好</h3>${options('mealStyle',{value:'实惠简餐',local:'当地风味',restaurant:'坐下吃顿正餐'})}<p class="muted">住宿档位只作偏好；没有报价的酒店不会被认定为符合你的价位。</p>${button('选每天最想去的地方','preferences','class="primary next"')}</section>`;}
function card(place,action,selected,extra=''){
  return `<article class="place ${selected?'selected':''}"><strong>${escape(place.name)}</strong><p>${escape(place.address||place.cuisine||place.themes.map(theme=>THEMES[theme]).join(' · '))}</p><p>${escape(place.hours||'营业时间待确认')}</p>${place.kind!=='sight'?'<p>价格待查询'+(place.stars?' · 地图标注 '+place.stars+' 星':'')+'</p>':''}<a href="${escape(place.source)}" target="_blank" rel="noopener noreferrer">查看地图资料 ↗</a>${button(selected?'已选择':'选择',action,`data-id="${escape(place.id)}" ${extra} aria-pressed="${selected}"`)}</article>`;
}
function anchorView(){
  const places = rankPlaces(state.catalog.sights,state.preferences,state.catalog.city,state.query);
  return `<section><h2>每天一个最想去的地方</h2><p>${state.anchors.map((id,index)=>button('第'+(index+1)+'天 · '+state.catalog.sights.find(place=>place.id===id).name+' ×','anchor',`data-id="${escape(id)}"`)).join(' ')||'按选择顺序安排每天的重点'}</p><form id="search"><input name="query" value="${escape(state.query)}" placeholder="搜索已召回的景点"><button>搜索</button> ${button('没想法，帮我选','auto')}</form><p class="muted">已选 ${state.anchors.length} / ${state.slots.days} · 共 ${state.catalog.sights.length} 个真实地点，市中心周边 ${state.catalog.radiusKm} km</p><div class="rail">${places.map(place=>card(place,'anchor',state.anchors.includes(place.id))).join('')||'没有匹配地点，换个关键词试试。'}</div>${button('继续选住宿与餐厅','anchors',`class="primary" ${state.anchors.length!==state.slots.days?'disabled':''}`)}</section>`;
}
function selectionView(){
  const center = state.catalog.sights.find(place=>place.id===state.anchors[0]);
  const hotelScore = place => {
    const tier = state.preferences.stayTier;
    return (tier==='economy' && (place.tourism==='hostel'||place.stars&&place.stars<=2) || tier==='comfort'&&place.stars===3 || tier==='premium'&&place.stars>=4 ? 20:0)-distance(center,place);
  };
  const hotels = [...state.catalog.hotels].sort((first,second)=>hotelScore(second)-hotelScore(first));
  return `<section><h2>选好住处和每天的一顿饭</h2>${state.slots.days>1?'<h3>住宿 · 优先靠近首日重点、参考地图星级</h3><div class="rail">'+hotels.map(place=>card(place,'hotel',state.selections.hotel===place.id)).join('')+(hotels.length?'':'暂无住宿资料，不能生成完整住宿方案。')+'</div>':''}${state.anchors.map((id,index)=>{
    const anchor = state.catalog.sights.find(place=>place.id===id);
    const score = place => (state.preferences.mealStyle==='value'&&['fast_food','food_court'].includes(place.amenity)||state.preferences.mealStyle==='restaurant'&&place.amenity==='restaurant'||state.preferences.mealStyle==='local'&&place.cuisine?5:0)-distance(anchor,place);
    const meals = [...state.catalog.restaurants].sort((first,second)=>score(second)-score(first));
    return '<h3>第'+(index+1)+'天 · '+escape(anchor.name)+' 附近</h3><div class="rail">'+meals.map(place=>card(place,'meal',state.selections.meals[index]===place.id,`data-day="${index}"`)).join('')+(meals.length?'':'暂无餐厅资料，请重新载入城市。')+'</div>';
  }).join('')}<p class="muted">这里只选择每天一顿推荐餐；其他餐费留在预算中。未接实时报价，换卡片不会伪造花费变化。</p>${button('生成行程','generate','class="primary"')}</section>`;
}
function routeMap(day){
  const coordinates=day.route?.geometry?.coordinates;
  if (!coordinates?.length) return '';
  const longitude=coordinates.map(point=>point[0]),latitude=coordinates.map(point=>point[1]);
  const left=Math.min(...longitude),bottom=Math.min(...latitude),width=Math.max(...longitude)-left||.001,height=Math.max(...latitude)-bottom||.001;
  const points=coordinates.map(point=>`${20+(point[0]-left)/width*760},${180-(point[1]-bottom)/height*160}`).join(' ');
  return `<svg viewBox="0 0 800 200" role="img" aria-label="当天道路路径示意，非等比例地图"><polyline points="${points}" fill="none" stroke="#0b6157" stroke-width="3"/></svg><p class="muted">道路路径示意 · 非等比例地图</p>`;
}
function resultView(){return `<section><h2>${escape(state.catalog.city.name)} · ${state.slots.days} 天行程</h2><p class="notice">未核价：尚不能保证总花费符合预算。出发地往返交通尚未查询；市内仅支持步行或驾车路线。</p>${state.plan.warnings.map(warning=>'<p class="notice">'+escape(warning)+'</p>').join('')}${state.plan.days.map((day,index)=>`<h3>第 ${index+1} 天 · ${day.date}</h3><p class="muted">${day.weather?`降雨概率 ${day.weather.rain}% · ${day.weather.min}–${day.weather.max}°C`:'该日期暂无天气预报'}</p>${day.hotel?'<p>出发住处：'+escape(day.hotel.name)+'</p>':''}${day.stops.map(stop=>`<div class="timeline"><strong>${clock(stop.arrival)} · ${escape(stop.place.name)} ${stop.anchor?'★':''}</strong><div>游览约 ${stop.place.duration} 分钟 · 路上约 ${stop.travel} 分钟</div><a href="${escape(stop.place.source)}" target="_blank" rel="noopener noreferrer">地图 ↗</a>${!stop.hoursVerified?'<span class="muted"> · 营业时间待确认</span>':''}</div>`).join('')}<p>餐厅：${escape(day.restaurant?.name||'未选择')}${day.mealArrival?' · '+clock(day.mealArrival)+' 用餐':''}</p><p>${day.finish?clock(day.finish)+(day.hotel?' 回到酒店':' 结束行程'):'餐厅及返程时间尚未验证'}</p>${routeMap(day)}<p class="muted">${day.route?'道路路段合计 '+(day.route.distance/1000).toFixed(1)+' km':'路程为直线距离估算，非导航'}</p>`).join('')}${button('调整选择','editchoices')}</section>`;}
function budgetView(){const allocation=spendingPlan(state.slots);return `<section><div class="summary"><strong>预算微调 · ${money(totalBudget(state.slots))} 全员</strong><span>${state.slots.budgetScope==='person'?'每人':'全员'} ${money(state.slots.budget)}</span></div><input aria-label="预算微调" id="budget" type="range" min="${Math.max(1,state.baseBudget-500)}" max="${state.baseBudget+500}" step="1" value="${state.slots.budget}"><div class="budget-grid">${[['住宿',allocation.stay],['餐饮',allocation.food],['交通',allocation.transport],['游玩',allocation.activities],['预留',allocation.reserve]].map(([name,value])=>'<span>'+name+' '+money(value)+'</span>').join('')}</div><p class="muted">以上为预算分配，不是商家报价。约 ${money(allocation.perRoom)}/间夜、${money(allocation.perMeal)}/人餐。</p></section>`;}
function chatView(){return `<section><h3>也可以直接告诉我</h3><div aria-live="polite">${state.history.slice(-6).map(item=>'<div class="bubble '+item.role+'">'+escape(item.content)+'</div>').join('')}</div>${state.pending?'<div class="bubble">建议调整：'+escape(Object.entries(state.pending.slots).map(([key,value])=>(SLOT_LABELS[key]||key)+'：'+value).join('；'))+(Object.keys(state.pending.preferences).length?' 旅行偏好将更新':'')+'</div>'+button('确认这些调整','apply'):''}<form id="chat"><textarea name="message" rows="2" maxlength="1500" required placeholder="例如：两个人从上海去京都，玩三天，总预算六千；或问这条路线适不适合带爸妈"></textarea><button class="primary">发送</button></form></section>`;}
function render(){
  root.innerHTML=`<div class="summary"><span>出发之前</span><a href="/?scene=now">在路上 · 保留的场景 B</a></div><div class="steps">${['出行信息','偏好','每日重点','住宿餐饮','行程'].map((label,index)=>index===state.stage?'● '+label:label).join(' → ')}</div><div id="status" role="status"></div>${state.confirmed?'<div class="summary"><strong>'+escape(state.slots.origin)+' → '+escape(state.catalog.city.name)+' · '+state.slots.startDate+' · '+state.slots.days+' 天 · '+(state.slots.adults+state.slots.children)+' 人</strong>'+button('修改出行信息','edit')+'</div>'+budgetView():''}${[slotView,preferenceView,anchorView,selectionView,resultView][state.stage]()}${chatView()}<footer class="muted">地点 © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a> · <a href="https://www.openstreetmap.org/fixthemap" target="_blank" rel="noopener noreferrer">纠正地图</a> · 城市与天气 <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a> · 路线 <a href="https://routing.openstreetmap.de/about.html" target="_blank" rel="noopener noreferrer">FOSSGIS</a></footer>`;
}
async function run(work,message='处理中…'){
  if(state.busy)return;
  state.busy=true;
  const status=root.querySelector('#status');
  status.textContent=message;status.scrollIntoView({block:'nearest',behavior:'smooth'});
  root.querySelectorAll('button,input,select,textarea').forEach(element=>element.disabled=true);
  try{await work();render();}catch(error){render();const notice=root.querySelector('#status');notice.setAttribute('role','alert');notice.textContent=error.name==='TimeoutError'?'查询超时，请重试。你填写的信息仍然保留。':error.message;notice.scrollIntoView({block:'center',behavior:'smooth'});}finally{state.busy=false;}
}
root.addEventListener('submit',event=>{
  event.preventDefault();if(state.busy)return;
  const form=event.target,values=Object.fromEntries(new FormData(form));
  if(form.id==='slots'){
    for(const key of ['days','adults','children','rooms','budget'])values[key]=values[key]===''?null:Number(values[key]);
    state.slots=values;resetSlots();
    run(async()=>{const errors=slotErrors(state.slots);if(errors.length)throw new Error(errors.join('；'));state.cities=await api('cities',{query:state.slots.destination});if(!state.cities.length)throw new Error('未找到城市，请试试英文名称或更具体的名称');});
  }
  if(form.id==='search'){state.query=values.query;render();}
  if(form.id==='chat')run(async()=>{
    const result=await api('message',{message:values.message,state:conversationState(),history:state.history});
    state.history.push({role:'user',content:values.message},{role:'assistant',content:result.answer});
    state.pending=Object.keys(result.slots).length||Object.keys(result.preferences).length?result:null;
  },'DeepSeek 正在回复…');
});
root.addEventListener('change',event=>{
  if(state.busy)return;
  if(event.target.id==='budget'){state.slots.budget=Number(event.target.value);if(state.plan)state.plan.budget=spendingPlan(state.slots);state.pending=null;render();}
  else if(event.target.closest('#slots')){const element=event.target;state.slots[element.name]=element.type==='number'?(element.value===''?null:Number(element.value)):element.value;state.cities=[];state.pending=null;}
});
root.addEventListener('click',event=>{
  const target=event.target.closest('[data-action]');if(!target||state.busy)return;
  const {action,id,key,value,day}=target.dataset;
  if(action==='city')return run(async()=>{state.catalog=await api('catalog',{slots:state.slots,confirmed:true,cityId:Number(id)});state.confirmed=true;state.baseBudget=state.slots.budget;state.stage=1;},'正在查询真实景点、酒店、餐厅与天气，可能需要几十秒…');
  if(action==='generate')return run(async()=>{state.plan=await api('generate',payload());state.stage=4;},'正在逐日计算道路路线…');
  if(action==='edit')resetSlots();
  if(action==='pref'){if(key==='themes')state.preferences.themes=state.preferences.themes.includes(value)?state.preferences.themes.filter(theme=>theme!==value):[...state.preferences.themes,value];else state.preferences[key]=value;resetPlan();}
  if(action==='noidea'){state.preferences.themes=[];resetPlan();}
  if(action==='preferences'){state.preferencesConfirmed=true;state.stage=2;}
  if(action==='anchor'){if(state.anchors.includes(id))state.anchors=state.anchors.filter(anchor=>anchor!==id);else if(state.anchors.length<state.slots.days)state.anchors.push(id);state.selections.meals=[];resetPlan();}
  if(action==='auto'){state.anchors=recommendedAnchors(state.catalog,state.slots,state.preferences);state.selections.meals=[];resetPlan();}
  if(action==='anchors'&&state.anchors.length===state.slots.days)state.stage=3;
  if(action==='hotel'){state.selections.hotel=id;resetPlan();}
  if(action==='meal'){state.selections.meals[Number(day)]=id;resetPlan();}
  if(action==='editchoices'){state.stage=1;state.preferencesConfirmed=false;resetPlan();}
  if(action==='apply'&&state.pending){const pending=state.pending;if(Object.keys(pending.slots).length){Object.assign(state.slots,pending.slots);resetSlots();}if(Object.keys(pending.preferences).length){Object.assign(state.preferences,pending.preferences);state.preferencesConfirmed=false;state.stage=state.confirmed?1:0;resetPlan();}state.pending=null;}
  render();
});
render();
