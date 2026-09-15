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
export async function generationContext({city,slots={},revisit={},excluded=[]}={}){
  const config=await getContent();
  const rule=activeItems(config.rules)[0]||{maxCandidates:8,maxCards:3,actionsPerCard:2,uniqueMaterial:true,uniqueRole:true,excludeShownMaterials:true};
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
