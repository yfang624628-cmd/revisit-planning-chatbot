import test from 'node:test';
import assert from 'node:assert/strict';
import {interpretSupplement,parseModelJSON,plannerAPI,validatePlan} from '../planner-api.js';
import {routeForDay} from '../map-service.js';
import {materialCandidatesFor,resolveSupportedArea,resolveSupportedAreas,resolveSupportedCity,supportedCities} from '../revisit-catalog.js';
import {contentPreview,generationContext,getContent,validateContent} from '../content-store.js';

const slots={mode:'trip',destination:'香港',origin:'深圳',date:'',days:2,people:2,budget:8000,scope:'total'};
const revisit={visitedBefore:true,wantsIdeas:false,direction:'街区慢逛',avoid:[],revisit:[],liked:[],interests:['街区'],pace:'',mobility:''};
const extracted=()=>({slots,revisit});
const day=name=>({title:name,city:'香港',stops:[{time:'10:00–11:00',name,note:'慢慢游览'}],hotel:'港铁站附近住宿',food:'附近简餐',transport:'步行',cost:{stay:500,food:200,transport:50,activities:0}});
const plan={title:'香港两天',days:[day('大坑'),day('深水埗')]};
const directionModel=async messages=>{
  const payload=JSON.parse(messages.at(-1).content),usedRoles=new Set(),proposals=[];
  for(const material of payload.materials||[]){
    const role=(payload.roles||[]).find(candidate=>!usedRoles.has(candidate.roleId)&&candidate.keywords.some(keyword=>material.tags.includes(keyword)));
    if(!role)continue;
    usedRoles.add(role.roleId);
    proposals.push({materialId:material.materialId,roleId:role.roleId,activityIds:['observe','compare'],title:`${role.name}看${material.anchor}`,question:`${material.anchor}的空间如何被使用？`,activities:[`在${material.anchor}观察入口与人流`,`比较${material.supporting[0]}与锚点的使用方式`],novelty:material.novelty,tradeoff:material.tradeoff});
    if(proposals.length===3)break;
  }
  return {proposals,shortageReason:proposals.length===3?'none':'insufficient_evidence'};
};
test('模型 JSON 解析兼容代码块和前置说明',()=>{
  assert.deepEqual(parseModelJSON('{"slots":{}}'),{slots:{}});
  assert.deepEqual(parseModelJSON('```json\n{"slots":{"days":2}}\n```'),{slots:{days:2}});
  assert.deepEqual(parseModelJSON('结果如下：{"revisit":{"visitedBefore":true}}'),{revisit:{visitedBefore:true}});
  assert.throws(()=>parseModelJSON(''),/empty/);
});
test('内容配置与地点库分离，不需要预设角色地点绑定',async()=>{
  const config=await getContent();
  assert.equal(validateContent(config).length,0);
  assert.equal(config.roles.length,15);
  assert.equal(config.materials,undefined);
  assert.deepEqual(supportedCities,['香港','上海','柏林']);
  for(const city of supportedCities)assert.equal((await generationContext({city})).materials.length,16);
  const preview=await contentPreview({city:'上海',roleId:'restorer'});
  assert.equal(preview.version,config.version);assert.deepEqual(preview.roles.map(item=>item.id),['restorer']);
});
test('召回结果记录分项理由，并将明确少走作为可行性约束',()=>{
  const candidates=materialCandidatesFor('香港',{area:'黄竹坑',interests:['建筑'],pace:'不想走太多'});
  assert.ok(candidates.length>0);
  assert.ok(candidates.every(item=>!/步行较多/.test(item.effort)));
  assert.ok(candidates[0].retrieval&&Number.isInteger(candidates[0].retrieval.score));
  assert.ok(candidates.some(item=>item.retrieval.areaMatches.includes('黄竹坑')));
});
test('方向卡每轮三个地点不重复，刷新优先使用未展示地点',async()=>{
  const first=await plannerAPI({message:'香港去过两次，先给我方向'},{callModel:async()=>({slots,revisit:{visitedBefore:true,wantsIdeas:true}})});
  const one=await plannerAPI({sessionId:first.sessionId,action:'confirm',slots},{callModel:directionModel});
  const two=await plannerAPI({sessionId:first.sessionId,action:'refresh'},{callModel:directionModel});
  assert.equal(one.proposals.length,3);
  assert.equal(two.proposals.length,3);
  assert.equal(new Set(one.proposals.map(item=>item.materialId)).size,3);
  assert.equal(new Set(one.proposals.map(item=>item.roleId)).size,3);
  assert.equal(one.proposals.some(item=>two.proposals.some(next=>next.materialId===item.materialId)),false);
});
test('排除一个香港片区后仍从其他地点生成三种体验',async()=>{
  const first=await plannerAPI({message:'香港去过两次，深水埗不想重复，先给我方向'},{callModel:async()=>({slots,revisit:{visitedBefore:true,wantsIdeas:true,avoid:['深水埗']}})});
  const explored=await plannerAPI({sessionId:first.sessionId,action:'confirm',slots},{callModel:directionModel});
  assert.equal(explored.proposals.length,3);
  assert.ok(explored.proposals.every(item=>item.materialId!=='hk-sham-shui-po'));
});
test('入口只接受香港、上海、柏林，并继续追问再访经历',async()=>{
  const unsupported=await plannerAPI({message:'两个人去巴黎玩三天，预算5000'},{callModel:async()=>({slots:{...slots,destination:'巴黎',days:3},revisit:{visitedBefore:true,wantsIdeas:true}})});
  assert.match(unsupported.answer,/目前专注香港、上海和柏林/);
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
test('首页固定话术由代码识别再访状态，忽略模型漂移字段',async()=>{
  const result=await plannerAPI({message:'两个人再去柏林3天，当地总预算5000元人民币。上次主要逛博物馆，这次想围绕街区和吃饭安排，晚出门也可以。'},{callModel:async()=>({slots:{...slots,destination:'柏林',days:3,budget:5000},revisit:{visitedBefore:'第二次去',wantsIdeas:'看情况',interests:'街区和吃饭',unexpected:'忽略'}})});
  assert.equal(result.revisit.visitedBefore,true);
  assert.deepEqual(result.revisit.interests,['街区和吃饭']);
  assert.equal(result.revisit.wantsIdeas,null);
  assert.equal(result.phase,'confirming');
});
test('模型返回异常槽位时忽略异常值并追问，不暴露格式错误',async()=>{
  const result=await plannerAPI({message:'上次去过柏林，这次想看看街区'},{callModel:async()=>({slots:{destination:'柏林',days:'三天',people:{value:2},budget:null,unknown:'x'},revisit:{visitedBefore:{value:true},wantsIdeas:'不确定',interests:'街区'}})});
  assert.equal(result.revisit.visitedBefore,true);
  assert.deepEqual(result.revisit.interests,['街区']);
  assert.match(result.answer,/天数、人数、人民币预算/);
  assert.doesNotMatch(result.answer,/格式/);
});
test('用户明确说出支持城市时不依赖模型填写目的地',async()=>{
  const result=await plannerAPI({message:'两个人在上海玩1天，预算600元，以前去过，想看点新的'},{callModel:async()=>({slots:{days:1,people:2,budget:600,scope:'total'},revisit:{visitedBefore:true,wantsIdeas:true}})});
  assert.equal(result.slots.destination,'上海');
  assert.equal(result.phase,'confirming');
});
test('排除项中的片区不会被误填为偏好片区',async()=>{
  const result=await plannerAPI({message:'两个人再去香港2天，预算3000元，太平山不想重复，喜欢街巷和吃饭'},{callModel:async()=>({slots:{...slots,budget:3000},revisit:{visitedBefore:true,wantsIdeas:true,avoid:['太平山'],interests:['街巷','吃饭']}})});
  assert.equal(result.slots.destination,'香港');
  assert.equal(result.slots.area,'');
  assert.deepEqual(result.revisit.avoid,['太平山']);
});
test('“不再安排”的片区只进入排除项，即使模型同时返回 area',async()=>{
  const result=await plannerAPI({message:'两个人在上海玩1天，当地总预算600元人民币。以前去过，外滩和南京路不再安排，想看点新的，晚上好好吃顿饭。先给我几个方向。'},{callModel:async()=>({
    slots:{mode:'trip',destination:'上海',date:'',days:1,hours:null,people:2,budget:600,scope:'total',area:'外滩'},
    revisit:{visitedBefore:true,wantsIdeas:true,avoid:['外滩','南京路'],interests:['新的','好好吃顿饭']}
  })});
  assert.equal(interpretSupplement('外滩和南京路不再安排',{destination:'上海'},'collecting').intent,'exclude');
  assert.equal(result.slots.area,'');
  assert.deepEqual(result.revisit.avoid,['外滩','南京路']);
  assert.equal(result.phase,'confirming');
});
test('语义模型判为排除时清除相同偏好片区，不依赖固定措辞',async()=>{
  const result=await plannerAPI({message:'上海这些老面孔我已经看够了，想把外滩略过去'},{callModel:async()=>({
    intent:'exclude',
    slots:{destination:'上海',area:'外滩'},
    revisit:{visitedBefore:true,wantsIdeas:true,avoid:['外滩']}
  })});
  assert.equal(result.slots.area,'');
  assert.deepEqual(result.revisit.avoid,['外滩']);
});
test('确认表单可修改不去地点，并在提交时消解正负片区冲突',async()=>{
  const first=await plannerAPI({message:'两个人再去上海1天，预算600元，先给方向'},{callModel:async()=>({
    slots:{mode:'trip',destination:'上海',days:1,people:2,budget:600,scope:'total'},
    revisit:{visitedBefore:true,wantsIdeas:true,interests:['新的']}
  })});
  const confirmed=await plannerAPI({sessionId:first.sessionId,action:'confirm',slots:{...first.slots,area:'外滩'},revisit:{avoid:['外滩','南京路']}},{callModel:directionModel});
  assert.equal(confirmed.slots.area,'');
  assert.deepEqual(confirmed.revisit.avoid,['外滩','南京路']);
  assert.equal(confirmed.phase,'exploring');
});
test('已确认香港后补充旺角附近，不会把片区当成新城市',async()=>{
  assert.equal(resolveSupportedCity('旺角附近'),'香港');
  assert.deepEqual(resolveSupportedArea('九龙附近'),{city:'香港',area:'九龙'});
  const first=await plannerAPI({message:'两个人再去香港2天，预算3000元，先给方向'},{callModel:async()=>({slots,revisit:{visitedBefore:true,wantsIdeas:true}})});
  const explored=await plannerAPI({sessionId:first.sessionId,action:'confirm',slots},{callModel:directionModel});
  let calls=0;
  const narrowed=await plannerAPI({sessionId:first.sessionId,message:'旺角附近的'},{callModel:async messages=>{
    if(calls++===0)return {intent:'feedback',slots:{destination:'旺角'},revisit:{direction:'旺角附近'}};
    return directionModel(messages);
  }});
  assert.equal(explored.phase,'exploring');
  assert.equal(narrowed.slots.destination,'香港');
  assert.equal(narrowed.slots.area,'旺角');
  assert.equal(narrowed.revisit.direction,'旺角附近的');
  assert.equal(narrowed.proposals.length,3);
  assert.match(narrowed.answer,/重新生成/);
});
test('补充要求区分片区、条件修改、排除和提问',()=>{
  const current={destination:'香港'};
  assert.deepEqual(resolveSupportedAreas('九龙、尖沙咀','香港'),{city:'香港',areas:['九龙','尖沙咀']});
  assert.equal(interpretSupplement('换成九龙、尖沙咀附近',current,'exploring').intent,'narrow_area');
  assert.equal(interpretSupplement('预算改成3500元',current,'exploring').intent,'change_slot');
  assert.equal(interpretSupplement('不要安排深水埗',current,'exploring').intent,'exclude');
  assert.equal(interpretSupplement('深水埗还是想去',current,'exploring').intent,'restore');
  assert.equal(interpretSupplement('第二张适合带爸妈吗？',current,'exploring').intent,'question');
});
test('没想法的再访用户先选玩法，再保留锚点生成行程',async()=>{
  const first=await plannerAPI({message:'香港去过两次，不知道这次干什么'},{callModel:async()=>({slots,revisit:{visitedBefore:true,wantsIdeas:true,avoid:['太平山'],interests:['街区']}})});
  assert.equal(first.phase,'confirming');
  const explored=await plannerAPI({sessionId:first.sessionId,action:'confirm',slots},{callModel:directionModel});
  assert.equal(explored.phase,'exploring');assert.equal(explored.proposals.length,3);assert.equal(explored.plan,null);
  const selected=explored.proposals[0];
  const activity=(selected.activities||selected.lensActions)[0];
  const generated={title:'香港再访',days:[{...day(selected.title),stops:[{time:'10:00–11:00',name:selected.anchor,mapQuery:selected.mapQuery,note:'安排'+activity}]},day('另一日')]};
  const finished=await plannerAPI({sessionId:first.sessionId,action:'proposal',proposalId:selected.id},{callModel:async()=>structuredClone(generated)});
  assert.equal(finished.phase,'planned');assert.equal(finished.selectedProposal.id,selected.id);
  assert.ok(finished.plan.days.some(item=>item.stops.some(stop=>stop.mapQuery===selected.mapQuery)));
});
test('方向卡由模型自由组合配置中的角色与地点',async()=>{
  const first=await plannerAPI({message:'香港去过两次，先给我方向'},{callModel:async()=>({slots,revisit:{visitedBefore:true,wantsIdeas:true}})});
  const explored=await plannerAPI({sessionId:first.sessionId,action:'confirm',slots},{callModel:async()=>({proposals:[
    {materialId:'hk-wong-chuk-hang',roleId:'planner',activityIds:['observe','trace'],title:'今天沿工业楼读南区',question:'工业楼宇如何转向艺术与公共界面？',activities:['比较工业区入口与画廊界面','记录黄竹坑与海滨的衔接方式'],novelty:'换成公共空间视角',tradeoff:'画廊开放日需确认'},
    {materialId:'hk-sai-kung',roleId:'biologist',activityIds:['observe','compare'],title:'从海旁读小镇生态',question:'海旁空间如何同时服务人与自然？',activities:['观察海滨长廊的水陆边界','比较码头与街市的人流节奏'],novelty:'换成自然观察视角',tradeoff:'往返市区时间较长'},
    {materialId:'not-in-catalog',roleId:'writer',activityIds:['record'],title:'虚构方向',question:'未知',activities:['未知','未知'],novelty:'未知',tradeoff:'未知'}
  ]})});
  assert.equal(explored.proposals.length,2);
  assert.equal(explored.proposalStatus,'insufficient_evidence');
  assert.equal(explored.proposals[0].id,'direction:hk-wong-chuk-hang:planner');
  assert.equal(explored.proposals[0].title,'今天沿工业楼读南区');
  assert.match(explored.proposals[0].question,/工业楼宇/);
  assert.equal(new Set(explored.proposals.map(item=>item.perspective)).size,2);
  assert.equal(new Set(explored.proposals.map(item=>item.materialId)).size,2);
  assert.ok(explored.proposals.every(item=>item.dynamic&&item.generated));
  assert.ok(explored.proposals.every(item=>item.corePromise?.id&&item.evidence?.roleKeywordMatches.length));
});
test('方向模型失败时不伪装成候选不足，也不提交确认状态',async()=>{
  const first=await plannerAPI({message:'香港去过两次，先给我方向'},{callModel:async()=>({slots,revisit:{visitedBefore:true,wantsIdeas:true}})});
  await assert.rejects(()=>plannerAPI({sessionId:first.sessionId,action:'confirm',slots},{callModel:async()=>{throw new Error('方向模型离线');}}),/方向模型离线/);
  const restored=await plannerAPI({sessionId:first.sessionId,action:'resume'});
  assert.equal(restored.confirmed,false);
  assert.equal(restored.phase,'confirming');
  assert.equal(restored.proposals.length,0);
});
test('条件冲突时允许零张方向，并返回可调整的具体边界',async()=>{
  const first=await plannerAPI({message:'香港去过两次，先给我方向'},{callModel:async()=>({slots,revisit:{visitedBefore:true,wantsIdeas:true}})});
  const explored=await plannerAPI({sessionId:first.sessionId,action:'confirm',slots},{callModel:async()=>({proposals:[],shortageReason:'constraints_conflict'})});
  assert.equal(explored.phase,'exploring');
  assert.equal(explored.proposalStatus,'constraints_conflict');
  assert.equal(explored.proposals.length,0);
  assert.match(explored.answer,/条件之间存在冲突/);
});
test('探索阶段可以询问方向卡，不会选择或替换卡片',async()=>{
  const first=await plannerAPI({message:'香港去过两次，先给我方向'},{callModel:async()=>({slots,revisit:{visitedBefore:true,wantsIdeas:true}})});
  const explored=await plannerAPI({sessionId:first.sessionId,action:'confirm',slots},{callModel:directionModel});
  const answered=await plannerAPI({sessionId:first.sessionId,message:'第二个适合带爸妈吗？'},{callModel:async()=>({intent:'question',answer:'第二个步行适中，可以减少一个停留点，并预留休息。',slots:{},revisit:{}})});
  assert.equal(answered.answer,'第二个步行适中，可以减少一个停留点，并预留休息。');
  assert.equal(answered.phase,'exploring');
  assert.equal(answered.plan,null);
  assert.deepEqual(answered.proposals,explored.proposals);
});
test('用户反悔时撤销旧排除项，并消除相反要求',async()=>{
  const first=await plannerAPI({message:'香港去过两次，太平山不想再去'},{callModel:async()=>({slots,revisit:{visitedBefore:true,wantsIdeas:true,avoid:['太平山']}})});
  const corrected=await plannerAPI({sessionId:first.sessionId,message:'太平山还是想去'},{callModel:async()=>({intent:'feedback',slots:{},revisit:{revisit:['太平山']},revisitRemove:{avoid:['太平山']}})});
  assert.deepEqual(corrected.revisit.avoid,[]);
  assert.deepEqual(corrected.revisit.revisit,['太平山']);
});
test('补充措辞识别：xx也可以是撤销排除，全程措辞豁免片区多样性，普通偏好不误判片区',()=>{
  assert.equal(interpretSupplement('公园也可以',{destination:'香港'},'exploring').intent,'restore');
  assert.equal(interpretSupplement('山边公园其实还行',{destination:'香港'},'exploring').intent,'restore');
  const whole=interpretSupplement('这几天都待在旺角附近',{destination:'香港'},'exploring');
  assert.equal(whole.intent,'narrow_area');assert.equal(whole.wholeTrip,true);
  assert.equal(interpretSupplement('我喜欢街区的感觉',{destination:'香港'},'exploring').intent,'feedback');
  assert.equal(interpretSupplement('旺角附近住，方便逛',{destination:'香港'},'exploring').nearby,true);
});
test('选中动态方向必须保留锚点与有依据的行动',async()=>{
  const first=await plannerAPI({message:'香港去过两次，想看城市更新'},{callModel:async()=>({slots,revisit:{visitedBefore:true,wantsIdeas:true,interests:['城市更新']}})});
  const explored=await plannerAPI({sessionId:first.sessionId,action:'confirm',slots},{callModel:directionModel});
  const selected=explored.proposals[0];
  const badPlan={title:'香港观察',days:[day('市区'),day('另一日')]};
  await assert.rejects(()=>plannerAPI({sessionId:first.sessionId,action:'proposal',proposalId:selected.id},{callModel:async()=>badPlan}),/锚点/);
});
test('服务端将核心行动绑定到锚点，不要求模型生成内部承诺 ID',async()=>{
  const first=await plannerAPI({message:'香港去过两次，想看城市更新'},{callModel:async()=>({slots,revisit:{visitedBefore:true,wantsIdeas:true,interests:['城市更新']}})});
  const explored=await plannerAPI({sessionId:first.sessionId,action:'confirm',slots},{callModel:directionModel});
  const selected=explored.proposals[0];
  const unbound={title:'香港观察',days:[{...day('第一日'),stops:[{time:'10:00–11:00',name:selected.anchor,mapQuery:selected.mapQuery,note:'普通游览'}]},day('另一日')]};
  const finished=await plannerAPI({sessionId:first.sessionId,action:'proposal',proposalId:selected.id},{callModel:async()=>structuredClone(unbound)});
  const commitmentStop=finished.plan.days.flatMap(item=>item.stops).find(stop=>stop.commitmentId===selected.corePromise.id);
  assert.ok(commitmentStop);
  assert.match(commitmentStop.note,new RegExp(selected.corePromise.action));
});
test('按卡片顺序定位地点并返回真实道路折线',async()=>{
  const routeDay={city:'测试城',stops:[{name:'甲'},{name:'乙'},{name:'未找到'}]};
  const requested=[];
  const route=await routeForDay(routeDay,'测试国',{
    geocodePlace:async name=>name==='未找到'?null:{name,lat:name==='甲'?31:31.01,lon:name==='甲'?121:121.01,displayName:name+'，测试城'},
    routeRequest:async url=>{requested.push(url);return {code:'Ok',routes:[{distance:1800,duration:1440,geometry:{coordinates:[[121,31],[121.01,31.01]]},legs:[{steps:[{geometry:{coordinates:[[121,31],[121.01,31.01]]}}]}]}]};}
  });
  assert.equal(route.distance,1800);assert.equal(route.points.length,2);
  assert.deepEqual(route.points.map(point=>point.stopNumber),[1,2]);
  assert.deepEqual(route.unresolved,['未找到']);
  assert.equal(route.totalStops,3);
  assert.equal(route.segments.length,1);
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
test('道路超时保留地点，失败结果不缓存，重试可以恢复',async()=>{
  const routeDay={city:'超时测试城',stops:[{name:'超时甲'},{name:'超时乙'}]};
  const geocodePlace=async name=>({name,lat:name==='超时甲'?30:31,lon:120});
  const failed=await routeForDay(routeDay,'测试',{geocodePlace,routeRequest:async()=>{throw new Error('timeout');}});
  assert.equal(failed.points.length,2);assert.equal(failed.distance,null);assert.match(failed.serviceWarning,/道路查询/);
  let retried=false;
  await routeForDay(routeDay,'测试',{geocodePlace,routeRequest:async()=>{retried=true;return {code:'NoRoute'};}});
  assert.equal(retried,true);
});
test('地点服务失败后停止连续等待，保留成功定位的部分',async()=>{
  let calls=0;
  const result=await routeForDay({city:'定位超时城',stops:[{name:'成功'},{name:'失败'},{name:'未请求'}]},'测试',{
    geocodePlace:async name=>{calls++;if(name==='成功')return {lat:30,lon:120};throw new Error('timeout');}
  });
  assert.equal(calls,2);assert.equal(result.points.length,1);assert.deepEqual(result.unresolved,['失败','未请求']);assert.match(result.serviceWarning,/地点查询/);
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
test('单日轻松必须缩短真实步行路线，省一点必须降低当天费用',async()=>{
  const first=await plannerAPI({message:'测试'},{callModel:async()=>extracted()});
  const sessionId=first.sessionId;
  await plannerAPI({sessionId,action:'confirm',slots},{callModel:async()=>structuredClone(plan)});
  const distances={深水埗:3000,近处:1000,更远:2000};
  const routeDay=async currentDay=>({distance:distances[currentDay.title]});
  let result=await plannerAPI({sessionId,action:'day',day:1,dayMode:'lighter',message:'缩短步行路线'},{callModel:async()=>({day:day('近处')}),routeDay});
  assert.equal(result.plan.days[1].title,'近处');
  assert.match(result.answer,/3.0 公里.*1.0 公里/);
  await assert.rejects(()=>plannerAPI({sessionId,action:'day',day:1,dayMode:'lighter',message:'再轻松一点'},{callModel:async()=>({day:day('更远')}),routeDay}),/没有变短/);
  assert.equal((await plannerAPI({sessionId,action:'resume'})).plan.days[1].title,'近处');
  const cheaper=day('省钱');cheaper.cost.food=100;
  result=await plannerAPI({sessionId,action:'day',day:1,dayMode:'cheaper',message:'省一点'},{callModel:async()=>({day:cheaper}),routeDay});
  assert.equal(result.plan.days[1].title,'省钱');
  assert.match(result.answer,/¥750.*¥650/);
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
test('校验失败时带驳回原因自动重试，修正后通过',async()=>{
  const first=await plannerAPI({message:'香港再去一次'},{callModel:async()=>({slots,revisit:{visitedBefore:true,wantsIdeas:false,direction:'街区'}})});
  const overlapping={...day('重叠日'),stops:[{time:'10:00–10:30',name:'甲',note:'先逛'},{time:'10:15–11:00',name:'乙',note:'再逛'}]};
  let calls=0;
  const result=await plannerAPI({sessionId:first.sessionId,action:'confirm',slots},{callModel:async messages=>{
    calls++;
    if(calls===1)return {title:'重叠版',days:[overlapping,day('第二日')]};
    assert.ok(messages.length>2&&/时段重叠/.test(messages.at(-1).content),'重试消息应携带驳回原因');
    return structuredClone(plan);
  }});
  assert.equal(calls,2);
  assert.equal(result.phase,'planned');
  assert.equal(result.plan.days.length,2);
});
test('偏好片区至少一天覆盖，多天不得全困在片区内',async()=>{
  const areaSlots={...slots,area:'旺角'};
  const allInArea={title:'全旺角',days:[
    {title:'旺角市集',city:'香港',stops:[{time:'10:00–11:00',name:'旺角金鱼街',mapQuery:'Goldfish Market Hong Kong',note:'看市集'}],hotel:'旺角住宿',food:'旺角小吃',transport:'步行',cost:{stay:500,food:200,transport:50,activities:0}},
    {title:'旺角旧楼',city:'香港',stops:[{time:'10:00–11:00',name:'旺角花墟道',mapQuery:'Flower Market Road',note:'看花墟'}],hotel:'旺角住宿',food:'旺角小吃',transport:'步行',cost:{stay:500,food:200,transport:50,activities:0}}
  ]};
  const mixed={title:'旺角加西贡',days:[allInArea.days[0],{...day('西贡'),stops:[{time:'10:00–11:00',name:'西贡海旁',mapQuery:'Sai Kung Promenade',note:'海边走走'}]}]};
  const first=await plannerAPI({message:'香港再去，主要在旺角附近'},{callModel:async()=>({slots:areaSlots,revisit:{visitedBefore:true,wantsIdeas:false,direction:'旺角慢逛'}})});
  let calls=0;
  const result=await plannerAPI({sessionId:first.sessionId,action:'confirm',slots:areaSlots},{callModel:async()=>{
    calls++;
    return structuredClone(calls===1?allInArea:mixed);
  }});
  assert.equal(calls,2,'每天都困在片区的方案应被驳回并重试');
  assert.equal(result.phase,'planned');
  assert.ok(result.plan.days.some(item=>item.stops.some(stop=>stop.mapQuery==='Goldfish Market Hong Kong')));
  assert.ok(result.plan.days.some(item=>item.stops.every(stop=>!['Goldfish Market Hong Kong','Flower Market Road'].includes(stop.mapQuery)&&!/旺角/.test(stop.name))));
  const uncovered=await plannerAPI({message:'香港再去，主要在旺角附近'},{callModel:async()=>({slots:areaSlots,revisit:{visitedBefore:true,wantsIdeas:false,direction:'旺角慢逛'}})});
  await assert.rejects(()=>plannerAPI({sessionId:uncovered.sessionId,action:'confirm',slots:areaSlots},{callModel:async()=>structuredClone(plan)}),/旺角/);
});
test('用户明确全程留在片区时不做多样性驳回',async()=>{
  const areaSlots={...slots,area:'旺角',areaScope:'all'};
  const allInArea={title:'全旺角',days:[
    {title:'旺角市集',city:'香港',stops:[{time:'10:00–11:00',name:'旺角金鱼街',mapQuery:'Goldfish Market Hong Kong',note:'看市集'}],hotel:'旺角住宿',food:'旺角小吃',transport:'步行',cost:{stay:500,food:200,transport:50,activities:0}},
    {title:'旺角旧楼',city:'香港',stops:[{time:'10:00–11:00',name:'旺角花墟道',mapQuery:'Flower Market Road',note:'看花墟'}],hotel:'旺角住宿',food:'旺角小吃',transport:'步行',cost:{stay:500,food:200,transport:50,activities:0}}
  ]};
  const first=await plannerAPI({message:'香港再去，这几天都待在旺角附近'},{callModel:async()=>({slots:areaSlots,revisit:{visitedBefore:true,wantsIdeas:false,direction:'旺角慢逛'}})});
  const result=await plannerAPI({sessionId:first.sessionId,action:'confirm',slots:areaSlots},{callModel:async()=>structuredClone(allInArea)});
  assert.equal(result.phase,'planned');
  assert.equal(result.slots.areaScope,'all');
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
