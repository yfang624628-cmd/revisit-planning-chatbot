export const THEMES = { nature:'自然风光', history:'人文历史', art:'艺术设计', city:'城市景观', street:'市井生活' };
export const RHYTHMS = { early:{name:'早出早归',start:510,end:1170}, normal:{name:'从容出游',start:570,end:1260}, late:{name:'晚出晚归',start:660,end:1380} };
export const SLOT_LABELS = {origin:'出发地',destination:'目的地',startDate:'出发日期',days:'天数',adults:'成人数',children:'儿童数',rooms:'房间数',budget:'预算',budgetScope:'预算口径'};
export const emptySlots = () => ({origin:'',destination:'',startDate:'',days:null,adults:null,children:0,rooms:null,budget:null,budgetScope:'total'});
export const defaultPreferences = () => ({themes:[],rhythm:'normal',stayTier:'any',mealStyle:'value',pace:'normal',mode:'walking'});
export const today = () => new Date().toLocaleDateString('en-CA', {year:'numeric',month:'2-digit',day:'2-digit'});
export function dateAt(date, offset){ return new Date(Date.parse(date+'T12:00:00Z') + offset*86400000).toISOString().slice(0,10); }
export function slotErrors(slots){
  const errors = [];
  for (const key of ['origin','destination']) if (typeof slots[key] !== 'string' || !slots[key].trim() || slots[key].length > 100) errors.push('请填写'+SLOT_LABELS[key]);
  if (typeof slots.startDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(slots.startDate) || !Number.isFinite(Date.parse(slots.startDate)) || new Date(slots.startDate).toISOString().slice(0,10) !== slots.startDate || slots.startDate < today()) errors.push('请选择今天或之后的有效出发日期');
  for (const [key,min,max] of [['days',1,14],['adults',1,12],['children',0,12],['rooms',1,12],['budget',1,1000000]]) if (!Number.isInteger(slots[key]) || slots[key] < min || slots[key] > max) errors.push(SLOT_LABELS[key]+'应为 '+min+'–'+max+' 的整数');
  if (Number.isInteger(slots.rooms) && slots.rooms > slots.adults + slots.children) errors.push('房间数不能多于人数');
  if (!['total','person'].includes(slots.budgetScope)) errors.push('请确认预算是全员总额还是每人金额');
  return errors;
}
export function totalBudget(slots){ return slots.budget * (slots.budgetScope === 'person' ? slots.adults+slots.children : 1); }
export function validatePreferences(preferences){
  if (!preferences || !Array.isArray(preferences.themes) || preferences.themes.some(theme => !Object.hasOwn(THEMES,theme))) throw new Error('旅行偏好无效');
  for (const [key,values] of Object.entries({rhythm:Object.keys(RHYTHMS),stayTier:['any','economy','comfort','premium'],mealStyle:['value','local','restaurant'],pace:['normal','relaxed'],mode:['walking','driving']})) if (!values.includes(preferences[key])) throw new Error('偏好无效：'+key);
}
export function assertReady(slots, preferences, anchors, catalog){
  const errors = slotErrors(slots);
  if (errors.length) throw new Error(errors[0]);
  validatePreferences(preferences);
  if (!catalog || anchors.length !== slots.days || new Set(anchors).size !== anchors.length || anchors.some(id => !catalog.sights.some(sight => sight.id === id))) throw new Error('每天需要一个不同的重点景点，请先选满');
}
export function distance(first, second){
  const radians = value => value*Math.PI/180;
  const deltaLat = radians(second.lat-first.lat), deltaLon = radians(second.lon-first.lon);
  const value = Math.sin(deltaLat/2)**2 + Math.cos(radians(first.lat))*Math.cos(radians(second.lat))*Math.sin(deltaLon/2)**2;
  return 6371*2*Math.atan2(Math.sqrt(value),Math.sqrt(Math.max(0,1-value)));
}
export function rankPlaces(places, preferences, center, search = ''){
  const query = search.trim().toLocaleLowerCase();
  return places.filter(place => !query || (place.name+' '+(place.aliases||'')).toLocaleLowerCase().includes(query)).map(place => {
    const matches = preferences.themes.filter(theme => place.themes.includes(theme)).length;
    const score = matches*30 + (place.landmark ? 10 : 0) + (place.hours ? 2 : 0) - distance(center,place)*0.4;
    return {place,score};
  }).sort((first,second) => second.score-first.score || first.place.id.localeCompare(second.place.id)).map(entry => entry.place);
}
export function recommendedAnchors(catalog, slots, preferences){
  const choices = rankPlaces(catalog.sights,preferences,catalog.city);
  return choices.slice(0,slots.days).map(place => place.id);
}
export function spendingPlan(slots, amount = totalBudget(slots)){
  const nights = slots.days-1, people = slots.adults+slots.children;
  const transport = Math.floor(amount*0.2), reserve = Math.floor(amount*0.1);
  const stay = nights ? Math.floor(amount*0.35) : 0;
  const food = Math.floor(amount*(nights ? 0.2 : 0.35));
  return {total:amount,transport,stay,food,activities:amount-transport-reserve-stay-food,reserve,
    perRoom:nights ? Math.floor(stay/nights/slots.rooms) : 0,perMeal:Math.floor(food/people/slots.days/3),nights,people,verified:false};
}
export function clock(minutes){ return String(Math.floor(minutes/60)).padStart(2,'0')+':'+String(minutes%60).padStart(2,'0'); }
export function openWindow(hours, date){
  if (hours === '24/7') return {open:0,close:1440};
  if (!hours) return null;
  const day = ['Su','Mo','Tu','We','Th','Fr','Sa'][new Date(date+'T12:00:00Z').getUTCDay()];
  const weekdays = ['Mo','Tu','We','Th','Fr','Sa','Su'];
  let selected = null;
  for (const part of hours.split(';')){
    const match = part.trim().match(/^(?:(Mo|Tu|We|Th|Fr|Sa|Su)(?:-(Mo|Tu|We|Th|Fr|Sa|Su))?\s+)?(off|\d{2}:\d{2}-\d{2}:\d{2})$/);
    if (!match) return null;
    const start = weekdays.indexOf(match[1]), end = weekdays.indexOf(match[2]||match[1]), current = weekdays.indexOf(day);
    if (match[1] && !(start <= end ? current>=start && current<=end : current>=start || current<=end)) continue;
    if (match[3] === 'off') selected = {closed:true};
    else {
      const [opening,closing] = match[3].split('-').map(value => Number(value.slice(0,2))*60+Number(value.slice(3)));
      if (opening >= closing || closing > 1440) return null;
      selected = {open:opening,close:closing};
    }
  }
  return selected || {closed:true};
}
export function draftTrip(slots, preferences, anchors, catalog, selections = {}){
  assertReady(slots,preferences,anchors,catalog);
  const rhythm = RHYTHMS[preferences.rhythm], used = new Set(anchors), warnings = [];
  const days = anchors.map((id,index) => {
    const anchor = catalog.sights.find(place => place.id === id), date = dateAt(slots.startDate,index);
    const weather = catalog.weather?.find(item => item.date === date);
    const radius = preferences.pace === 'relaxed' ? 1.5 : 4;
    const extra = rankPlaces(catalog.sights,preferences,anchor).filter(place => !used.has(place.id) && distance(anchor,place) <= radius && !openWindow(place.hours,date)?.closed && !(weather?.rain >= 70 && !place.indoor)).slice(0,preferences.pace === 'relaxed' ? 1 : 2);
    extra.forEach(place => used.add(place.id));
    const hotel = catalog.hotels.find(place => place.id === selections.hotel);
    const stops = [], candidates = [anchor,...extra];
    let position = hotel || anchor, time = rhythm.start;
    for (const place of candidates){
      const travel = stops.length || hotel ? Math.ceil(distance(position,place)*1.35/(preferences.mode === 'walking' ? 4 : 22)*60) : 0;
      const hours = openWindow(place.hours,date), arrival = Math.max(time+travel,hours?.open||0), duration = place.duration;
      const issue = hours?.closed ? '所选日期标注为不开放' : arrival+duration > Math.min(rhythm.end,hours?.close||1440) ? '可能超出营业时间或你的返程时间' : null;
      if (issue && place.id !== id) continue;
      if (issue) warnings.push('第'+(index+1)+'天 '+place.name+'：'+issue+'，请更换或调整时间');
      stops.push({place,anchor:place.id===id,arrival,departure:arrival+duration,travel,issue,hoursVerified:!!hours});
      time = arrival+duration+20; position = place;
    }
    const restaurant = catalog.restaurants.find(place => place.id === selections.meals?.[index]) || rankPlaces(catalog.restaurants,preferences,anchor)[0] || null;
    const restaurantWindow = restaurant ? openWindow(restaurant.hours,date) : null;
    if (restaurantWindow?.closed) warnings.push('第'+(index+1)+'天餐厅 '+restaurant.name+' 当日标注不营业，请换一家');
    return {date,anchor,stops,restaurant,weather,hotel,route:null};
  });
  return {days,warnings,budget:spendingPlan(slots),priceStatus:'未核价',routeStatus:'距离估算',generatedAt:new Date().toISOString()};
}

export function validateSlotPatch(patch){
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw new Error('槽位格式不正确');
  for (const [key,value] of Object.entries(patch)){
    if (!Object.hasOwn(SLOT_LABELS,key)) throw new Error('不支持的出行条件');
    if (['origin','destination','startDate','budgetScope'].includes(key) ? typeof value !== 'string' || value.length>100 : !Number.isInteger(value) || value<0 || value>1000000) throw new Error('出行条件格式不正确');
  }
  return patch;
}
