import {readFile} from 'node:fs/promises';
import {resolve as resolvePath} from 'node:path';
import {materialCandidatesFor,supportedCities} from './revisit-catalog.js';

const file=resolvePath('content/content-v1.json');
let active=null,previous=null;
const isObject=value=>value&&typeof value==='object'&&!Array.isArray(value);

export function validateContent(config){
  const issues=[];
  if(!isObject(config))return ['配置根节点必须是对象'];
  for(const key of ['version','status','roles','activities','rules'])if(config[key]===undefined)issues.push(`root: 缺少 ${key}`);
  for(const [type,required] of Object.entries({roles:['id','status','name','care','method','keywords'],activities:['id','status','name','instruction'],rules:['id','status','maxCandidates','maxCards']})){
    if(!Array.isArray(config[type])){issues.push(`${type}: 必须是数组`);continue;}
    const ids=new Set();
    for(const item of config[type]){
      if(!isObject(item)){issues.push(`${type}: 元素必须是对象`);continue;}
      for(const key of required)if(item[key]===undefined||item[key]==='')issues.push(`${type}.${item.id||'?'}: 缺少 ${key}`);
      if(ids.has(item.id))issues.push(`${type}.${item.id}: ID 重复`);else ids.add(item.id);
      if(!['draft','published','archived'].includes(item.status))issues.push(`${type}.${item.id||'?'}: status 无效`);
      if(type==='rules'&&item.minRoleScore!==undefined&&(!Number.isFinite(item.minRoleScore)||item.minRoleScore<0))issues.push(`${type}.${item.id||'?'}: minRoleScore 无效`);
      if(type==='rules'&&item.spatialDiversity!==undefined){
        const spatial=item.spatialDiversity;
        if(!isObject(spatial))issues.push(`${type}.${item.id||'?'}.spatialDiversity: 必须是对象`);
        else{
          if(typeof spatial.enabled!=='boolean')issues.push(`${type}.${item.id||'?'}.spatialDiversity.enabled: 必须是布尔值`);
          if(!Number.isFinite(spatial.activityRadiusMeters)||spatial.activityRadiusMeters<100||spatial.activityRadiusMeters>50000)issues.push(`${type}.${item.id||'?'}.spatialDiversity.activityRadiusMeters: 应在 100–50000 米`);
          if(!Number.isFinite(spatial.maxOverlapRatio)||spatial.maxOverlapRatio<0||spatial.maxOverlapRatio>1)issues.push(`${type}.${item.id||'?'}.spatialDiversity.maxOverlapRatio: 应在 0–1`);
          if(!Number.isInteger(spatial.minimumLocatedStops)||spatial.minimumLocatedStops<1||spatial.minimumLocatedStops>5)issues.push(`${type}.${item.id||'?'}.spatialDiversity.minimumLocatedStops: 应为 1–5`);
          if(!['reject','skip'].includes(spatial.onLocationFailure))issues.push(`${type}.${item.id||'?'}.spatialDiversity.onLocationFailure: 只能是 reject 或 skip`);
        }
      }
    }
  }
  return issues;
}

export async function loadContent(){
  const candidate=JSON.parse(await readFile(file,'utf8'));
  const issues=validateContent(candidate);
  if(issues.length)throw Object.assign(new Error(issues.join('\n')),{issues});
  previous=active;active=structuredClone(candidate);return active;
}
export async function reloadContent(){try{return {ok:true,config:await loadContent(),issues:[]};}catch(error){return {ok:false,config:active,issues:error.issues||[error.message]};}}
export async function getContent(){if(!active)await loadContent();return active;}
export function rollbackContent(){if(!previous)return {ok:false,issues:['没有可回退的上一有效版本']};[active,previous]=[previous,active];return {ok:true,config:active,issues:[]};}

const activeItems=items=>items.filter(item=>item.status==='published');
const materialIdFromDirection=id=>typeof id==='string'&&id.startsWith('direction:')?id.split(':')[1]:null;
export async function planningRule(){
  const config=await getContent();
  return activeItems(config.rules)[0]||{};
}
export async function generationContext({city,slots={},revisit={},excluded=[]}={}){
  const config=await getContent();
  const rule=await planningRule();
  const excludedMaterials=rule.excludeShownMaterials?excluded.map(materialIdFromDirection).filter(Boolean):[];
  const scopedRevisit={...revisit,area:slots.area||''};
  const materials=materialCandidatesFor(city,scopedRevisit,excludedMaterials).slice(0,rule.maxCandidates);
  return {version:config.version,city,rule,roles:activeItems(config.roles),activities:activeItems(config.activities),materials};
}

export async function contentPreview({city='香港',roleId='',revisit={}}={}){
  if(!supportedCities.includes(city))throw new Error('当前入口只支持香港、上海、柏林');
  const context=await generationContext({city,revisit});
  return {...context,roles:roleId?context.roles.filter(item=>item.id===roleId):context.roles};
}
