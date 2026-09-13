import test from 'node:test';
import assert from 'node:assert/strict';
import {emptySlots,defaultPreferences,slotErrors,totalBudget,assertReady,openWindow,draftTrip,spendingPlan} from '../src/trip-core.js';
import {citySearchRequest,findCities,loadTripCatalog,generateTrip,tripMessage,normalizeTripReply} from '../trip-api.js';

const slots={...emptySlots(),origin:'上海',destination:'京都',startDate:'2099-05-12',days:2,adults:2,children:1,rooms:1,budget:6000};
const place=(id,lat=35)=>({id,name:id,lat,lon:135,themes:['history'],duration:60,hours:'24/7'});
const catalog={city:place('city'),sights:[place('first'),place('second',35.01),place('extra',35.002)],hotels:[place('hotel')],restaurants:[place('meal')],weather:[]};

test('真实模型回显整份配置时只保留变化，不谎称已应用',()=>{
  const preferences=defaultPreferences();
  const reply=normalizeTripReply({answer:'已调整',slots:{...slots},preferences:{...preferences,rhythm:'late'}},{slots,preferences,confirmed:true});
  assert.deepEqual(reply.slots,{});
  assert.deepEqual(reply.preferences,{rhythm:'late'});
  assert.match(reply.answer,/才会生效/);
  const collected=normalizeTripReply({answer:'请再提供日期和人数',slots,preferences:{}},{slots:emptySlots(),confirmed:false});
  assert.doesNotMatch(collected.answer,/再提供/);
});

test('东京与日本东京查询 Tokyo，并排除中国同名地点',async()=>{
  for(const name of ['东京','東京','日本东京','日本 东京','Tokyo'])assert.deepEqual(citySearchRequest(name),{name:'Tokyo',countryCode:'JP'});
  assert.deepEqual(citySearchRequest('京都'),{name:'Kyoto',countryCode:'JP'});
  assert.deepEqual(citySearchRequest('大阪'),{name:'Osaka',countryCode:'JP'});
  assert.deepEqual(citySearchRequest('上海'),{name:'上海',countryCode:null});
  const original=globalThis.fetch;
  try{
    globalThis.fetch=async url=>{
      assert.equal(new URL(url).searchParams.get('name'),'Tokyo');
      return {ok:true,json:async()=>({results:[{id:1,name:'东京',country_code:'CN',feature_code:'PPL'},{id:2,name:'東京',country:'日本',country_code:'JP',feature_code:'PPLC',latitude:35.69,longitude:139.69,population:8000000}]})};
    };
    assert.deepEqual((await findCities('东京')).map(city=>[city.id,city.country]),[[2,'日本']]);
    globalThis.fetch=async()=>({ok:true,json:async()=>({results:[{id:1,name:'东京',country_code:'CN',feature_code:'PPL'}]})});
    await assert.rejects(()=>findCities('日本 东京'),/不会返回其他国家/);
  }finally{globalThis.fetch=original;}
});

test('国家不能冒充城市，机场和宫殿也不进入城市选项',async()=>{
  const original=globalThis.fetch;
  try{
    globalThis.fetch=async()=>({ok:true,json:async()=>({results:[{name:'日本',feature_code:'PCLI',country_code:'JP'}]})});
    await assert.rejects(()=>findCities('日本测试'),/请先确定一个城市/);
    globalThis.fetch=async()=>({ok:true,json:async()=>({results:[{id:1,name:'京都',feature_code:'PPLA',latitude:35,longitude:135},{id:2,name:'京都御所',feature_code:'PAL'}]})});
    assert.deepEqual((await findCities('京都测试')).map(city=>city.id),[1]);
  }finally{globalThis.fetch=original;}
});

test('未填人数和预算不能跳过收集，预算口径区分全员和每人',()=>{
  assert.ok(slotErrors(emptySlots()).some(error=>error.includes('成人数')));
  assert.ok(slotErrors(emptySlots()).some(error=>error.includes('预算')));
  assert.deepEqual(slotErrors(slots),[]);
  assert.equal(totalBudget(slots),6000);
  assert.equal(totalBudget({...slots,budgetScope:'person'}),18000);
  assert.ok(slotErrors({...slots,startDate:'2099-02-30'}).length);
});
test('每天一个不同重点，库外和重复地点不被接受',()=>{
  for(const anchors of [[],['first'],['first','first'],['first','fake']])assert.throws(()=>assertReady(slots,defaultPreferences(),anchors,catalog));
  assert.doesNotThrow(()=>assertReady(slots,defaultPreferences(),['first','second'],catalog));
});
test('预算为分配而非报价，保留每日重点并区分早出晚出',()=>{
  const early=draftTrip(slots,{...defaultPreferences(),rhythm:'early'},['first','second'],catalog);
  const late=draftTrip(slots,{...defaultPreferences(),rhythm:'late'},['first','second'],catalog);
  assert.deepEqual(early.days.map(day=>day.anchor.id),['first','second']);
  assert.ok(late.days[0].stops[0].arrival>early.days[0].stops[0].arrival);
  const budget=spendingPlan(slots);
  assert.equal(budget.verified,false);
  assert.equal(budget.stay+budget.food+budget.transport+budget.activities+budget.reserve,6000);
});
test('营业时间不支持的格式保持未知，不能假定开放',()=>{
  assert.equal(openWindow('Mo-Fr 10:00-18:00; PH off','2099-05-12'),null);
  assert.deepEqual(openWindow('24/7','2099-05-12'),{open:0,close:1440});
});
test('服务端拒绝绕过确认和过期地点，不会退回香港样例',async()=>{
  await assert.rejects(()=>loadTripCatalog({slots,confirmed:false}),/确认/);
  await assert.rejects(()=>generateTrip({slots,confirmed:true,preferencesConfirmed:false}),/确认/);
  await assert.rejects(()=>generateTrip({slots,confirmed:true,preferencesConfirmed:true,catalogId:'missing'}),/过期/);
});
test('无密钥时自然语言不伪造回复',async()=>{
  const previous=process.env.DEEPSEEK_API_KEY;
  delete process.env.DEEPSEEK_API_KEY;
  try{await assert.rejects(()=>tripMessage({message:'去京都'}),/密钥/);}finally{if(previous!==undefined)process.env.DEEPSEEK_API_KEY=previous;}
});
