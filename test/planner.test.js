import test from 'node:test';
import assert from 'node:assert/strict';
import {plannerAPI,routeForDay,validatePlan} from '../planner-api.js';

const slots={mode:'trip',destination:'香港',origin:'深圳',date:'',days:2,people:2,budget:8000,scope:'total'};
const revisit={visitedBefore:true,wantsIdeas:false,direction:'街区慢逛',avoid:[],revisit:[],liked:[],interests:['街区'],pace:'',mobility:''};
const extracted=()=>({slots,revisit});
const day=name=>({title:name,city:'香港',stops:[{time:'10:00',name,note:'慢慢游览'}],hotel:'港铁站附近住宿',food:'附近简餐',transport:'步行',cost:{stay:500,food:200,transport:50,activities:0}});
const plan={title:'香港两天',days:[day('大坑'),day('深水埗')]};
test('只接受当前六座城市，并继续追问再访经历',async()=>{
  const unsupported=await plannerAPI({message:'两个人去巴黎玩三天，预算5000'},{callModel:async()=>({slots:{...slots,destination:'巴黎',days:3},revisit:{visitedBefore:true,wantsIdeas:true}})});
  assert.match(unsupported.answer,/目前支持香港、上海、深圳、柏林、米兰和马德里/);
  assert.equal(unsupported.phase,'collecting');
  const unknown=await plannerAPI({message:'两个人去香港玩两天，预算5000'},{callModel:async()=>({slots:{...slots,budget:5000}})});
  assert.match(unknown.answer,/以前去过香港吗/);
});
test('兼容模型把再访布尔值返回成常见文字',async()=>{
  const result=await plannerAPI({message:'香港去过了，但这次没想法'},{callModel:async()=>({slots,revisit:{visitedBefore:'去过',wantsIdeas:'没想法'}})});
  assert.equal(result.revisit.visitedBefore,true);
  assert.equal(result.revisit.wantsIdeas,true);
  assert.equal(result.phase,'confirming');
});
test('没想法的再访用户先选玩法，再保留锚点生成行程',async()=>{
  const first=await plannerAPI({message:'香港去过两次，不知道这次干什么'},{callModel:async()=>({slots,revisit:{visitedBefore:true,wantsIdeas:true,avoid:['太平山'],interests:['街区']}})});
  assert.equal(first.phase,'confirming');
  const explored=await plannerAPI({sessionId:first.sessionId,action:'confirm',slots},{callModel:async()=>{throw new Error('确认条件时不应生成行程');}});
  assert.equal(explored.phase,'exploring');assert.equal(explored.proposals.length,3);assert.equal(explored.plan,null);
  const selected=explored.proposals[0];
  const generated={title:'香港再访',days:[{...day(selected.title),stops:[{time:'10:00',name:selected.anchor,mapQuery:selected.mapQuery,note:'保留选中的玩法'}]},day('另一日')]};
  const finished=await plannerAPI({sessionId:first.sessionId,action:'proposal',proposalId:selected.id},{callModel:async()=>structuredClone(generated)});
  assert.equal(finished.phase,'planned');assert.equal(finished.selectedProposal.id,selected.id);
  assert.ok(finished.plan.days.some(item=>item.stops.some(stop=>stop.mapQuery===selected.mapQuery)));
});
test('按卡片顺序定位地点并返回真实道路折线',async()=>{
  const routeDay={city:'测试城',stops:[{name:'甲'},{name:'乙'},{name:'未找到'}]};
  const requested=[];
  const route=await routeForDay(routeDay,'测试国',{
    geocodePlace:async name=>name==='未找到'?null:{name,lat:name==='甲'?31:31.01,lon:name==='甲'?121:121.01,displayName:name+'，测试城'},
    routeRequest:async url=>{requested.push(url);return {code:'Ok',routes:[{distance:1800,duration:1440,geometry:{coordinates:[[121,31],[121.01,31.01]]}}]};}
  });
  assert.equal(route.distance,1800);assert.equal(route.points.length,2);
  assert.deepEqual(route.points.map(point=>point.stopNumber),[1,2]);
  assert.deepEqual(route.unresolved,['未找到']);
  assert.equal(route.totalStops,3);
  assert.match(requested[0],/route\/v1\/foot\/121,31;121.01,31.01/);
});
test('地图匹配不完整时保留可用地点，不伪造完整路线',async()=>{
  const routeDay={city:'纽约',stops:[{name:'自由女神像'},{name:'未找到'}]};
  const one=await routeForDay(routeDay,'美国',{
    geocodePlace:async name=>name==='未找到'?null:{name,lat:40.6892,lon:-74.0445,displayName:'Statue of Liberty'},
    routeRequest:async()=>{throw new Error('单点不应请求道路服务');}
  });
  assert.equal(one.points.length,1);assert.equal(one.distance,null);assert.deepEqual(one.geometry,[]);
  assert.deepEqual(one.unresolved,['未找到']);assert.equal(one.points[0].stopNumber,1);
  const none=await routeForDay({city:'测试城',stops:[{name:'甲'},{name:'乙'}]},'测试国',{
    geocodePlace:async()=>null,
    routeRequest:async()=>{throw new Error('零点不应请求道路服务');}
  });
  assert.equal(none.points.length,0);assert.deepEqual(none.unresolved,['甲','乙']);
});
test('坐标存在但步行道路不连通时仍返回地点标记',async()=>{
  const disconnected=await routeForDay({city:'测试岛',stops:[{name:'甲'},{name:'乙'}]},'测试国',{
    geocodePlace:async name=>({name,lat:name==='甲'?30:31,lon:name==='甲'?120:121,displayName:name}),
    routeRequest:async()=>({code:'NoRoute',routes:[]})
  });
  assert.equal(disconnected.points.length,2);assert.equal(disconnected.routeUnavailable,true);
  assert.equal(disconnected.distance,null);assert.deepEqual(disconnected.geometry,[]);
});
test('组合地点会尝试另一半，并识别路线中的渡轮',async()=>{
  const queries=[];
  const route=await routeForDay({city:'纽约',stops:[{name:'错误名与自由女神像'},{name:'华尔街'}]},'美国',{
    geocodePlace:async name=>{queries.push(name);return name==='错误名'?null:{name,lat:name==='自由女神像'?40.6892:40.7074,lon:name==='自由女神像'?-74.0445:-74.0113,displayName:name};},
    routeRequest:async()=>({code:'Ok',routes:[{distance:6000,duration:4000,geometry:{coordinates:[[-74.0445,40.6892],[-74.0113,40.7074]]},legs:[{steps:[{mode:'ferry'}]}]}]})
  });
  assert.deepEqual(queries,['错误名','自由女神像','华尔街']);
  assert.equal(route.points[0].mapQuery,'自由女神像');assert.equal(route.includesFerry,true);
});
test('追问3天改5天先更新条件，保留锁定天；失败则整体回滚',async()=>{
  const originalSlots={...slots,days:3};
  const first=await plannerAPI({message:'香港三天'},{callModel:async()=>({slots:originalSlots,revisit})});
  const sessionId=first.sessionId;
  const originalPlan={title:'香港三天',days:[day('大坑'),day('深水埗'),day('西贡')]};
  await plannerAPI({sessionId,action:'confirm',slots:originalSlots},{callModel:async()=>structuredClone(originalPlan)});
  await plannerAPI({sessionId,action:'lock',day:0});
  const expanded={slots:{days:5},title:'香港五天',days:[day('不得覆盖'),day('深水埗'),day('西贡'),day('黄竹坑'),day('石硖尾')]};
  const result=await plannerAPI({sessionId,action:'message',message:'改成5天'},{callModel:async()=>structuredClone(expanded)});
  assert.equal(result.slots.days,5);assert.equal(result.plan.days.length,5);
  assert.equal(result.slots.budget,8000);assert.equal(result.slots.people,2);
  assert.deepEqual(result.plan.days[0],originalPlan.days[0]);
  assert.equal(result.plan.days[4].city,'香港');
  const recovered=await plannerAPI({sessionId:'expired-session',action:'resume',snapshot:result});
  assert.deepEqual(recovered.plan,result.plan);
  assert.deepEqual(recovered.lockedDays,[0]);
  await assert.rejects(()=>plannerAPI({sessionId,action:'message',message:'改7天'},{callModel:async()=>({...structuredClone(expanded),slots:{days:7}})}),/天数/);
  assert.equal((await plannerAPI({sessionId,action:'resume'})).slots.days,5);
  await plannerAPI({sessionId,action:'lock',day:4});
  await assert.rejects(()=>plannerAPI({sessionId,action:'message',message:'改3天'},{callModel:async()=>({...structuredClone(originalPlan),slots:{days:3}})}),/解除/);
});
test('先收集确认，再生成；单日修改和锁定都由服务端保留',async()=>{
  let result=await plannerAPI({message:'再去香港'},{callModel:async()=>extracted()});
  assert.equal(result.plan,null);
  const sessionId=result.sessionId;
  result=await plannerAPI({sessionId,action:'confirm',slots},{callModel:async()=>structuredClone(plan)});
  assert.equal(result.plan.estimatedTotal,1500);
  const original=structuredClone(result.plan.days[0]);
  await plannerAPI({sessionId,action:'lock',day:0});
  result=await plannerAPI({sessionId,action:'message',message:'轻松一点'},{callModel:async()=>({title:'新版',days:[day('模型企图改锁定天'),day('公园')]})});
  assert.deepEqual(result.plan.days[0],original);
  result=await plannerAPI({sessionId,action:'day',day:1,message:'换一个'},{callModel:async()=>({day:day('银座')})});
  assert.deepEqual(result.plan.days[0],original);
  assert.equal(result.plan.days[1].title,'银座');
  await assert.rejects(()=>plannerAPI({sessionId,action:'day',day:0,message:'换一个'}),/锁定/);
  await assert.rejects(()=>plannerAPI({sessionId,action:'budget',budget:9000}),/500/);
});
test('途中不要求出发地日期，缺人数预算不能生成',async()=>{
  const result=await plannerAPI({message:'中环三小时'},{callModel:async()=>({slots:{mode:'now',destination:'香港中环',hours:3}})});
  assert.match(result.answer,/人数/);assert.match(result.answer,/预算/);
  await assert.rejects(()=>plannerAPI({sessionId:result.sessionId,action:'confirm',slots:{}}),/补充/);
  const shortDay=day('大馆');shortDay.cost.stay=0;shortDay.stops[0].time='+00:00–+01:00';
  assert.doesNotThrow(()=>validatePlan({title:'中环',days:[shortDay]},{mode:'now',hours:3}));
  shortDay.stops[0].time='+00:00–+04:00';
  assert.throws(()=>validatePlan({title:'中环',days:[shortDay]},{mode:'now',hours:3}),/超出/);
});
test('模型失败不覆盖原方案',async()=>{
  let result=await plannerAPI({message:'测试'},{callModel:async()=>extracted()});
  const sessionId=result.sessionId;
  result=await plannerAPI({sessionId,action:'confirm',slots},{callModel:async()=>structuredClone(plan)});
  await assert.rejects(()=>plannerAPI({sessionId,action:'message',message:'换一个'},{callModel:async()=>({title:'错误',days:[]})}),/天数/);
  result=await plannerAPI({sessionId,action:'lock',day:0});
  assert.equal(result.plan.days[0].title,'大坑');
});
test('追问不重写行程，刷新可恢复原方案',async()=>{
  const first=await plannerAPI({message:'测试'},{callModel:async()=>extracted()});
  const sessionId=first.sessionId;
  const generated=await plannerAPI({sessionId,action:'confirm',slots},{callModel:async()=>structuredClone(plan)});
  const reply=await plannerAPI({sessionId,action:'message',message:'适合带爸妈吗？'},{callModel:async()=>({answer:'先确认父母可接受的步行量。'})});
  assert.deepEqual(reply.plan,generated.plan);
  assert.match(reply.answer,/步行量/);
  const resumed=await plannerAPI({sessionId,action:'resume'});
  assert.deepEqual(resumed.plan,generated.plan);
});
