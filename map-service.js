import {ProxyAgent,fetch as httpFetch} from 'undici';

const geoCache = new Map();
const routeCache = new Map();
const tileCache = new Map();
let geocodeQueue = Promise.resolve();
const dispatcher=process.env.TRAVEL_PLANNER_PROXY?.trim()?new ProxyAgent(process.env.TRAVEL_PLANNER_PROXY.trim()):undefined;
const fail = (message,status=400)=>Object.assign(new Error(message),{status});
const shortText=(value,max=160)=>typeof value==='string'&&value.trim().length>0&&value.length<=max;

async function externalJSON(url,options={}){
  let response;
  try{
    response=await httpFetch(url,{...options,dispatcher,headers:{'User-Agent':'TravelPlannerLocal/1.0 (local itinerary preview)','Accept-Language':'zh-CN,zh;q=0.9,en;q=0.7',...options.headers},signal:AbortSignal.timeout(8000)});
    if(!response.ok)throw fail('地图服务暂时不可用（'+response.status+'），行程本身没有改变。',502);
    return await response.json();
  }catch{throw fail('地图服务连接失败或超时，行程本身没有改变。',504);}
}
export async function mapTile(z,x,y){
  if(![z,x,y].every(Number.isInteger)||z<0||z>19||x<0||y<0||x>=2**z||y>=2**z)return null;
  const key=`${z}/${x}/${y}`;
  if(tileCache.has(key))return tileCache.get(key);
  const sources=[`https://tile.openstreetmap.de/${key}.png`,`https://a.tile.openstreetmap.fr/hot/${key}.png`];
  for(const url of sources){
    try{
      const response=await httpFetch(url,{dispatcher,headers:{'User-Agent':'TravelPlannerLocal/1.0 (local itinerary preview)'},signal:AbortSignal.timeout(8000)});
      const contentType=response.headers.get('content-type')||'';
      if(!response.ok||!contentType.startsWith('image/'))continue;
      const tile={body:Buffer.from(await response.arrayBuffer()),contentType};
      if(tileCache.size>=500)tileCache.delete(tileCache.keys().next().value);
      tileCache.set(key,tile);
      return tile;
    }catch{}
  }
  return null;
}
async function geocode(place,city,destination){
  const query=[...new Set([place,city,destination].filter(Boolean).map(value=>value.trim()))].join(', ');
  if(geoCache.has(query))return geoCache.get(query);
  const task=geocodeQueue.catch(()=>{}).then(async()=>{
    try{
      const configured=process.env.NOMINATIM_URL?.trim();
      const providers=configured?[{kind:'nominatim',url:configured}]:[
        {kind:'photon',url:'https://photon.komoot.io/api/'},
        {kind:'nominatim',url:'https://nominatim.openstreetmap.org/search'}
      ];
      let lastError=null,receivedResponse=false;
      for(const provider of providers){
        try{
          const endpoint=new URL(provider.url);
          endpoint.search=provider.kind==='photon'
            ?new URLSearchParams({q:query,limit:'3',lang:'en'})
            :new URLSearchParams({q:query,format:'jsonv2',limit:'3',addressdetails:'1'});
          const result=await externalJSON(endpoint);receivedResponse=true;
          if(provider.kind==='photon'){
            const first=result.features?.find(item=>Number.isFinite(Number(item.geometry?.coordinates?.[1]))&&Number.isFinite(Number(item.geometry?.coordinates?.[0])));
            if(first){
              const properties=first.properties||{};
              return {name:place,lat:Number(first.geometry.coordinates[1]),lon:Number(first.geometry.coordinates[0]),displayName:[properties.name,properties.city,properties.country].filter(Boolean).join(', '),osmType:properties.osm_type,osmId:properties.osm_id,category:properties.osm_key,type:properties.osm_value};
            }
          }else{
            const first=Array.isArray(result)&&result.find(item=>Number.isFinite(Number(item.lat))&&Number.isFinite(Number(item.lon)));
            if(first)return {name:place,lat:Number(first.lat),lon:Number(first.lon),displayName:first.display_name,osmType:first.osm_type,osmId:first.osm_id,category:first.category,type:first.type};
          }
        }catch(error){lastError=error;}
      }
      if(!receivedResponse&&lastError)throw lastError;
      return null;
    }finally{
      await new Promise(resolve=>setTimeout(resolve,1100));
    }
  });
  geocodeQueue=task;
  const value=await task;
  if(geoCache.size>=300)geoCache.delete(geoCache.keys().next().value);
  geoCache.set(query,value);
  return value;
}
function mapSearchNames(stop){
  if(shortText(stop.mapQuery,80))return [stop.mapQuery.trim()];
  const candidates=stop.name.split(/[与和·（(]/).map(name=>name.replace(/(?:区域|周边|附近|一带|沿岸步道|河畔步道|街区|小巷本地小店|本地小店|散步|游览)$/,'').trim()).filter(Boolean);
  return [...new Set(candidates.length?candidates:[stop.name])];
}
export async function locateStopsForDay(day,destination,{geocodePlace=geocode}={}){
  const located=[];const unresolved=[];
  let serviceWarning='',lookupFailed=false;
  for(const [index,stop] of day.stops.entries()){
    if(lookupFailed){unresolved.push(stop.name);continue;}
    let point=null,mapQuery=stop.name;
    for(const candidate of mapSearchNames(stop)){
      mapQuery=candidate;
      try{point=await geocodePlace(candidate,day.city,destination);}
      catch{lookupFailed=true;serviceWarning='地点查询服务连接失败或超时，暂时无法定位剩余地点。已定位的地点仍可查看。';break;}
      if(point)break;
    }
    const isBroadFeature=!stop.mapQuery&&/(?:步道|沿岸|河畔)/.test(stop.name)&&['waterway','boundary'].includes(point?.category);
    if(point&&!isBroadFeature)located.push({...point,name:stop.name,mapQuery,stopNumber:index+1});else unresolved.push(stop.name);
  }
  return {points:located,unresolved,serviceWarning};
}
export async function routeForDay(day,destination,{geocodePlace=geocode,routeRequest=externalJSON}={}){
  const cacheKey=JSON.stringify([day.city,destination,day.stops.map(stop=>[stop.name,stop.mapQuery])]);
  if(routeCache.has(cacheKey))return routeCache.get(cacheKey);
  const location=await locateStopsForDay(day,destination,{geocodePlace});
  const located=location.points,unresolved=location.unresolved;
  let serviceWarning=location.serviceWarning;
  let distance=null,duration=null,geometry=[],segments=[],routeUnavailable=false,includesFerry=false;
  if(located.length>=2){
    const coordinates=located.map(point=>point.lon+','+point.lat).join(';');
    const base=process.env.FOOT_ROUTER_URL||'https://routing.openstreetmap.de/routed-foot';
    let result;
    try{result=await routeRequest(base+'/route/v1/foot/'+coordinates+'?overview=full&geometries=geojson&steps=true');}
    catch{result={};serviceWarning='步行道路查询失败或超时，已保留地点标记，暂不显示步行距离。';}
    const route=result.routes?.[0];
    if(result.code==='Ok'&&route?.geometry?.coordinates?.length){
      distance=Math.round(route.distance);duration=Math.round(route.duration);geometry=route.geometry.coordinates;
      segments=(route.legs||[]).map(leg=>(leg.steps||[]).flatMap((step,index)=>{
        const coordinates=step.geometry?.coordinates||[];
        return index?coordinates.slice(1):coordinates;
      })).filter(coordinates=>coordinates.length>1);
      routeUnavailable=false;
      includesFerry=route.legs?.some(leg=>leg.steps?.some(step=>step.mode==='ferry'))||false;
    }else routeUnavailable=true;
  }
  const answer={points:located,unresolved,distance,duration,geometry,segments,routeUnavailable,includesFerry,serviceWarning,totalStops:day.stops.length,mode:'walking',verifiedAt:new Date().toISOString()};
  if(routeCache.size>=100)routeCache.delete(routeCache.keys().next().value);
  if(!serviceWarning)routeCache.set(cacheKey,answer);
  return answer;
}
