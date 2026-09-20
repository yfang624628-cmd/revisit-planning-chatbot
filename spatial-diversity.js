const earthRadiusMeters=6371000;

export function distanceMeters(left,right){
  const radians=value=>value*Math.PI/180;
  const lat1=radians(left.lat),lat2=radians(right.lat);
  const deltaLat=lat2-lat1,deltaLon=radians(right.lon-left.lon);
  const value=Math.sin(deltaLat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(deltaLon/2)**2;
  return 2*earthRadiusMeters*Math.atan2(Math.sqrt(value),Math.sqrt(1-value));
}

function nearbyRatio(source,target,radius){
  return source.filter(point=>target.some(other=>distanceMeters(point,other)<=radius)).length/source.length;
}

export function activityOverlapRatio(left,right,radius){
  if(!left.length||!right.length)return 0;
  return Math.max(nearbyRatio(left,right,radius),nearbyRatio(right,left,radius));
}

export async function validateSpatialDiversity(plan,destination,rule,locateDay){
  if(!rule?.enabled||plan.days.length<2)return;
  const locations=await Promise.all(plan.days.map(day=>locateDay(day,destination)));
  const pointSets=locations.map(result=>Array.isArray(result)?result:result?.points||[]);
  const insufficient=pointSets.findIndex(points=>points.length<rule.minimumLocatedStops);
  if(insufficient>=0){
    if(rule.onLocationFailure==='skip')return;
    const serviceFailed=locations[insufficient]?.serviceWarning;
    throw Object.assign(new Error(`第 ${insufficient+1} 天可定位的具体地点不足，无法校验活动范围是否重叠，原方案未改变。`),{status:serviceFailed?504:502});
  }
  for(let left=0;left<pointSets.length;left++)for(let right=left+1;right<pointSets.length;right++){
    const overlap=activityOverlapRatio(pointSets[left],pointSets[right],rule.activityRadiusMeters);
    if(overlap>rule.maxOverlapRatio){
      const nearStops=pointSets[left].filter(point=>pointSets[right].some(other=>distanceMeters(point,other)<=rule.activityRadiusMeters)).map(point=>point.name).filter(Boolean);
      throw Object.assign(new Error(`第 ${left+1} 天和第 ${right+1} 天的活动范围重叠 ${Math.round(overlap*100)}%，超过配置上限 ${Math.round(rule.maxOverlapRatio*100)}%（过近地点：${nearStops.join('、')}）。`),{status:502,code:'ACTIVITY_OVERLAP',conflict:{days:[left,right],radiusMeters:rule.activityRadiusMeters,maxOverlapRatio:rule.maxOverlapRatio,points:pointSets}});
    }
  }
}
