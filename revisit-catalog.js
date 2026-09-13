export const supportedCities=['香港','上海','深圳','柏林','米兰','马德里'];

export const cityAliases={
  香港:['香港','Hong Kong'],上海:['上海','Shanghai'],深圳:['深圳','Shenzhen'],
  柏林:['柏林','Berlin'],米兰:['米兰','Milan','Milano'],马德里:['马德里','Madrid']
};

export const revisitCatalog=[
  {id:'hk-sham-shui-po',city:'香港',title:'深水埗的手作与旧街',anchor:'JCCAC 石硖尾',mapQuery:'Jockey Club Creative Arts Centre',supporting:['深水埗街巷','街市周边用餐'],tags:['街区','手作','小店','吃饭'],effort:'步行适中',cost:'低至中',novelty:'从购物与海港切换到旧区生活和创作空间',tradeoff:'店铺与空间开放时间需要临行确认'},
  {id:'hk-wong-chuk-hang',city:'香港',title:'黄竹坑的艺术空间',anchor:'黄竹坑工业区',mapQuery:'Wong Chuk Hang',supporting:['画廊或艺术空间','香港仔海滨收尾'],tags:['艺术','设计','室内','街区'],effort:'转场适中',cost:'中',novelty:'把工业楼宇与南区海滨组合成半日主题',tradeoff:'画廊开放日不统一，需要按日期筛选'},
  {id:'hk-tai-hang',city:'香港',title:'大坑与天后的慢街区',anchor:'大坑',mapQuery:'Tai Hang Hong Kong',supporting:['街巷散步','天后附近晚餐'],tags:['街区','建筑','小店','吃饭','轻松'],effort:'步行较少',cost:'中',novelty:'保留熟悉的港岛氛围，换成更紧凑的生活街区',tradeoff:'内容密度较低，适合慢逛而非密集打卡'},
  {id:'hk-sai-kung',city:'香港',title:'西贡海旁的松弛半天',anchor:'西贡海滨长廊',mapQuery:'Sai Kung Promenade',supporting:['海边散步','镇内用餐'],tags:['海边','自然','吃饭','轻松'],effort:'步行较少、往返较远',cost:'中',novelty:'用海边小镇替代维港与市中心视角',tradeoff:'市区往返时间长，天气影响明显'},
  {id:'hk-kowloon-city',city:'香港',title:'九龙城的旧城与南洋味',anchor:'九龙寨城公园',mapQuery:'Kowloon Walled City Park',supporting:['九龙城街巷','泰国菜或潮州菜'],tags:['历史','街区','吃饭','公园'],effort:'步行适中',cost:'低至中',novelty:'从商业中心切换到旧城历史与多元餐饮',tradeoff:'与港铁站有距离，需要公交或短途打车'},
  {id:'hk-kwun-tong',city:'香港',title:'观塘的工业楼与海滨',anchor:'观塘海滨花园',mapQuery:'Kwun Tong Promenade',supporting:['工业区街景','海滨日落'],tags:['工业','城市景观','街区','海边'],effort:'步行适中',cost:'低',novelty:'从传统景点转向东九龙的城市更新',tradeoff:'工业区路段观感粗粝，周末部分店铺休息'},
  {id:'hk-kennedy-town',city:'香港',title:'坚尼地城的西端日常',anchor:'卑路乍湾海滨长廊',mapQuery:'Belcher Bay Promenade',supporting:['西环街巷','傍晚用餐'],tags:['海边','街区','吃饭','轻松'],effort:'步行较少',cost:'中',novelty:'在港岛西端看居民区与海边日常',tradeoff:'日落时段人多，体验更偏生活而非景点'},
  {id:'hk-peng-chau',city:'香港',title:'坪洲的离岛慢行',anchor:'坪洲',mapQuery:'Peng Chau',supporting:['岛上街巷','海边休息'],tags:['离岛','自然','街区','轻松'],effort:'步行适中、需乘船',cost:'中',novelty:'用小尺度离岛替代市区密集安排',tradeoff:'受船班和天气影响，需预留往返时间'},

  {id:'sh-hongkou',city:'上海',title:'虹口的城市记忆',anchor:'多伦路文化名人街',mapQuery:'Duolun Road Cultural Celebrities Street',supporting:['四川北路周边','虹口街区散步'],tags:['人文','建筑','街区','历史'],effort:'步行适中',cost:'低',novelty:'从外滩视角转向近代城市生活与支路',tradeoff:'体验依赖沿途阅读，追求强景观的人可能觉得平淡'},
  {id:'sh-yangpu-river',city:'上海',title:'杨浦滨江的工业线索',anchor:'杨浦滨江人民城市建设规划展示馆',mapQuery:'Yangpu Riverside',supporting:['工业遗存步道','滨江休息'],tags:['建筑','工业','城市景观','散步'],effort:'步行较多',cost:'低',novelty:'在滨江看上海的生产与城市更新',tradeoff:'户外路段较长，炎热或下雨时需要缩短'},
  {id:'sh-west-bund',city:'上海',title:'西岸的一馆一段江景',anchor:'西岸美术馆',mapQuery:'West Bund Museum',supporting:['一处展览','西岸滨江'],tags:['艺术','室内','城市景观','设计'],effort:'步行适中',cost:'中',novelty:'用一场展览组织半天，避免把西岸全部走完',tradeoff:'展览内容与票价需要按日期确认'},
  {id:'sh-xinhua-road',city:'上海',title:'新华路的建筑与院落',anchor:'上生·新所',mapQuery:'Columbia Circle Shanghai',supporting:['新华路街区','沿途咖啡或晚餐'],tags:['建筑','设计','小店','街区'],effort:'步行适中',cost:'中',novelty:'在熟悉市中心里换一条建筑观察路线',tradeoff:'周末可能拥挤，商业内容变化较快'},
  {id:'sh-m50',city:'上海',title:'苏州河边的艺术与工业',anchor:'M50 创意园',mapQuery:'M50 Creative Park',supporting:['苏州河步道','附近简餐'],tags:['艺术','工业','散步','街区'],effort:'步行适中',cost:'低至中',novelty:'沿苏州河串起工业空间与当代创作',tradeoff:'画廊开放情况不一，需要临行确认'},
  {id:'sh-1933',city:'上海',title:'虹口的异形建筑半天',anchor:'1933 老场坊',mapQuery:'1933 Old Millfun',supporting:['沙泾港周边','北外滩支路'],tags:['建筑','历史','街区','摄影'],effort:'步行适中',cost:'低',novelty:'围绕一座特殊工业建筑展开城市观察',tradeoff:'内部商业内容有限，重点在建筑本身'},
  {id:'sh-power-station',city:'上海',title:'南外滩的当代艺术',anchor:'上海当代艺术博物馆',mapQuery:'Power Station of Art',supporting:['南浦大桥下空间','黄浦江边散步'],tags:['艺术','建筑','室内','城市景观'],effort:'步行适中',cost:'低至中',novelty:'避开外滩主线，从南段看工业改造与江景',tradeoff:'展览和开放时间需要按日期确认'},
  {id:'sh-panlong',city:'上海',title:'蟠龙天地的水乡新旧',anchor:'蟠龙天地',mapQuery:'Panlong Tiandi',supporting:['水巷慢走','街区用餐'],tags:['水乡','街区','吃饭','轻松'],effort:'步行较少、往返较远',cost:'中',novelty:'在城市边缘体验被重新组织的江南空间',tradeoff:'商业化明显且离市中心较远'},

  {id:'sz-nantou',city:'深圳',title:'南头古城的新旧叠层',anchor:'南头古城',mapQuery:'Nantou Ancient City',supporting:['城中村街巷','沿途用餐'],tags:['历史','建筑','街区','吃饭'],effort:'步行适中',cost:'低至中',novelty:'从现代深圳切换到城市历史与更新现场',tradeoff:'节假日人流较多，店铺质量需要筛选'},
  {id:'sz-oct-loft',city:'深圳',title:'华侨城的设计慢逛',anchor:'OCT-LOFT 华侨城创意文化园',mapQuery:'OCT Loft',supporting:['设计空间','附近晚餐'],tags:['设计','艺术','小店','轻松'],effort:'步行较少',cost:'中',novelty:'围绕设计与创意空间安排松弛半天',tradeoff:'具体展览和店铺需要临行确认'},
  {id:'sz-shekou',city:'深圳',title:'蛇口的海港与城市史',anchor:'海上世界文化艺术中心',mapQuery:'Sea World Culture and Arts Center',supporting:['蛇口海滨','街区用餐'],tags:['海边','艺术','城市景观','吃饭'],effort:'步行适中',cost:'中',novelty:'把海边、展览与蛇口发展线索放在同一片区',tradeoff:'展览内容和海边天气影响体验'},
  {id:'sz-dafen',city:'深圳',title:'大芬的绘画产业街区',anchor:'大芬美术馆',mapQuery:'Dafen Art Museum',supporting:['大芬油画村街巷','附近简餐'],tags:['艺术','产业','街区','人文'],effort:'步行适中',cost:'低',novelty:'从观光景点转向一条真实的城市产业线索',tradeoff:'商业画店较多，需要对这一主题本身感兴趣'},
  {id:'sz-guanlan-print',city:'深圳',title:'观澜的版画与旧村',anchor:'观澜版画村',mapQuery:'Guanlan Printmaking Village',supporting:['客家旧村','版画相关空间'],tags:['艺术','手作','历史','街区'],effort:'步行适中、往返较远',cost:'低',novelty:'用版画与旧村看深圳不常被提起的一面',tradeoff:'离中心较远，开放内容需要提前确认'},
  {id:'sz-gangxia-north',city:'深圳',title:'岗厦北的地下城市',anchor:'岗厦北站',mapQuery:'Gangxia North Station',supporting:['交通建筑','福田中心区街景'],tags:['建筑','设计','城市景观','室内'],effort:'步行较少',cost:'低',novelty:'把公共交通空间本身当成城市观察对象',tradeoff:'主题偏建筑，缺少传统游览内容'},
  {id:'sz-mangrove',city:'深圳',title:'红树林边的城市自然',anchor:'福田红树林生态公园',mapQuery:'Futian Mangrove Ecological Park',supporting:['生态步道','附近轻食'],tags:['自然','公园','户外','轻松'],effort:'步行可控',cost:'低',novelty:'在高密度城区旁切换到湿地观察',tradeoff:'天气和季节影响明显，需做好防晒防蚊'},
  {id:'sz-shangwei',city:'深圳',title:'上围村的艺术化更新',anchor:'上围艺术村',mapQuery:'Shangwei Art Village Shenzhen',supporting:['村内街巷','社区空间'],tags:['艺术','街区','城中村','小众'],effort:'步行适中、往返较远',cost:'低',novelty:'从成熟创意园转向仍有生活感的村落更新',tradeoff:'内容密度不稳定，适合探索而非打卡'},

  {id:'berlin-hansaviertel',city:'柏林',title:'Hansaviertel 的现代建筑',anchor:'Hansaviertel',mapQuery:'Hansaviertel Berlin',supporting:['现代住宅建筑','Tiergarten 边缘散步'],tags:['建筑','设计','历史','散步'],effort:'步行适中',cost:'低',novelty:'从纪念性地标转向战后城市规划',tradeoff:'以户外观察为主，需对建筑有兴趣'},
  {id:'berlin-tempelhof',city:'柏林',title:'Tempelhof 的城市空地',anchor:'Tempelhofer Feld',mapQuery:'Tempelhofer Feld',supporting:['旧机场空间','Schillerkiez 街区'],tags:['城市景观','历史','街区','户外'],effort:'步行较多',cost:'低',novelty:'在巨大开放空间理解柏林的城市尺度',tradeoff:'天气影响明显，场地很大不宜贪多'},
  {id:'berlin-kreuzberg',city:'柏林',title:'运河边的 Kreuzberg',anchor:'Landwehrkanal',mapQuery:'Landwehrkanal Berlin',supporting:['运河散步','Bergmannkiez 用餐'],tags:['街区','散步','吃饭','生活方式'],effort:'步行适中',cost:'中',novelty:'弱化地标，围绕水边与社区节奏安排半天',tradeoff:'周末热门区域可能拥挤'},
  {id:'berlin-siemensstadt',city:'柏林',title:'Siemensstadt 的住宅实验',anchor:'Siemensstadt Housing Estate',mapQuery:'Siemensstadt Housing Estate',supporting:['世界遗产住宅区','邻近街区休息'],tags:['建筑','设计','历史','小众'],effort:'转场较多',cost:'低',novelty:'深入一处不在首次旅行清单里的现代住宅区',tradeoff:'离中心较远，内容专业度较高'},
  {id:'berlin-karl-marx-allee',city:'柏林',title:'Karl-Marx-Allee 的城市尺度',anchor:'Karl-Marx-Allee',mapQuery:'Karl-Marx-Allee Berlin',supporting:['社会主义建筑','Strausberger Platz'],tags:['建筑','历史','城市景观','散步'],effort:'步行适中',cost:'低',novelty:'从单个地标转向一整条城市规划轴线',tradeoff:'街道尺度大，需对建筑与历史有兴趣'},
  {id:'berlin-koernerpark',city:'柏林',title:'Neukölln 的社区公园与街区',anchor:'Körnerpark',mapQuery:'Körnerpark Berlin',supporting:['Neukölln 支路','街区用餐'],tags:['公园','街区','吃饭','轻松'],effort:'步行较少',cost:'低至中',novelty:'在居民区里体验更日常的柏林节奏',tradeoff:'缺少强地标，适合慢逛型用户'},
  {id:'berlin-teufelsberg',city:'柏林',title:'Teufelsberg 的冷战遗迹',anchor:'Teufelsberg',mapQuery:'Teufelsberg Berlin',supporting:['旧监听站','Grunewald 林地'],tags:['历史','建筑','自然','户外'],effort:'步行较多、往返较远',cost:'中',novelty:'把冷战遗迹和城市边缘自然放在一起',tradeoff:'交通和步行负担较大，开放信息需确认'},
  {id:'berlin-raw',city:'柏林',title:'RAW Gelände 的工业夜生活',anchor:'RAW-Gelände',mapQuery:'RAW-Gelände Berlin',supporting:['工业遗址空间','Friedrichshain 晚餐'],tags:['工业','夜晚','街区','吃饭'],effort:'步行适中',cost:'中',novelty:'用工业空间和夜间氛围替代白天地标',tradeoff:'夜间较嘈杂，不适合偏安静的用户'},

  {id:'milan-prada',city:'米兰',title:'Porta Romana 的当代艺术',anchor:'Fondazione Prada',mapQuery:'Fondazione Prada',supporting:['当代艺术空间','Porta Romana 周边'],tags:['艺术','设计','建筑','室内'],effort:'步行适中',cost:'中至高',novelty:'从历史中心转向工业改造与当代文化',tradeoff:'门票和展览需要按日期确认'},
  {id:'milan-isola',city:'米兰',title:'Isola 的新旧城市界面',anchor:'Piazza Gae Aulenti',mapQuery:'Piazza Gae Aulenti',supporting:['Isola 街区','Monumentale 周边'],tags:['建筑','设计','街区','城市景观'],effort:'步行适中',cost:'低至中',novelty:'同时看新天际线与传统社区的反差',tradeoff:'部分区域商业化明显，需要控制停留点'},
  {id:'milan-triennale',city:'米兰',title:'设计主题的一馆一公园',anchor:'Triennale Milano',mapQuery:'Triennale Milano',supporting:['设计展览','Parco Sempione'],tags:['设计','艺术','室内','公园'],effort:'步行较少',cost:'中',novelty:'用设计内容重新进入熟悉的市中心',tradeoff:'展览质量与开放时间需要确认'},
  {id:'milan-navigli',city:'米兰',title:'运河区的傍晚节奏',anchor:'Darsena',mapQuery:'Darsena Milano',supporting:['Navigli 支路','沿途晚餐'],tags:['街区','吃饭','夜晚','散步'],effort:'步行适中',cost:'中至高',novelty:'把一天重点放在傍晚与夜间生活',tradeoff:'热门时段嘈杂，餐饮需要避开纯游客选择'},
  {id:'milan-hangar-bicocca',city:'米兰',title:'Bicocca 的大型当代艺术',anchor:'Pirelli HangarBicocca',mapQuery:'Pirelli HangarBicocca',supporting:['工业空间展览','Bicocca 街区'],tags:['艺术','工业','建筑','室内'],effort:'转场适中',cost:'低至中',novelty:'用大型工业空间替代历史中心的博物馆密度',tradeoff:'位置偏北，展览内容需要提前确认'},
  {id:'milan-monumentale',city:'米兰',title:'Monumentale 的雕塑与城市史',anchor:'Cimitero Monumentale',mapQuery:'Cimitero Monumentale di Milano',supporting:['纪念建筑','Chinatown 边缘'],tags:['历史','建筑','雕塑','人文'],effort:'步行适中',cost:'低',novelty:'通过纪念雕塑与家族故事阅读米兰',tradeoff:'题材偏肃穆，不适合所有用户'},
  {id:'milan-porta-venezia',city:'米兰',title:'Porta Venezia 的多元街区',anchor:'Porta Venezia',mapQuery:'Porta Venezia Milan',supporting:['新艺术风格建筑','街区晚餐'],tags:['建筑','街区','吃饭','夜晚'],effort:'步行适中',cost:'中',novelty:'从历史中心转向建筑细节和多元社区生活',tradeoff:'范围较大，需要围绕少量支路安排'},
  {id:'milan-san-siro',city:'米兰',title:'San Siro 的足球城市线索',anchor:'圣西罗球场',mapQuery:'San Siro Stadium',supporting:['球场周边','城市西侧街区'],tags:['体育','建筑','城市文化'],effort:'转场适中',cost:'低至高',novelty:'用足球与大型公共建筑理解另一种米兰',tradeoff:'比赛日与参观开放情况影响很大'},

  {id:'madrid-matadero',city:'马德里',title:'Matadero 与河岸更新',anchor:'Matadero Madrid',mapQuery:'Matadero Madrid',supporting:['文化空间','Madrid Río'],tags:['艺术','建筑','城市景观','散步'],effort:'步行适中',cost:'低至中',novelty:'从中心广场转向城市南部的文化与河岸空间',tradeoff:'活动内容和户外天气需要确认'},
  {id:'madrid-chamberi',city:'马德里',title:'Chamberí 的生活街区',anchor:'Plaza de Olavide',mapQuery:'Plaza de Olavide',supporting:['Chamberí 街巷','市场或街区用餐'],tags:['街区','吃饭','生活方式','轻松'],effort:'步行较少',cost:'中',novelty:'用居民区节奏替代密集景点',tradeoff:'缺少单一强地标，适合愿意慢逛的人'},
  {id:'madrid-literary',city:'马德里',title:'文学街区的细看路线',anchor:'Barrio de las Letras',mapQuery:'Barrio de las Letras',supporting:['街巷文字线索','附近晚餐'],tags:['人文','历史','街区','吃饭'],effort:'步行适中',cost:'中',novelty:'在熟悉中心区换成文学与城市故事视角',tradeoff:'与首次游区域可能重叠，需要确认是否愿意重温'},
  {id:'madrid-casa-campo',city:'马德里',title:'Casa de Campo 的城市自然',anchor:'Casa de Campo',mapQuery:'Casa de Campo Madrid',supporting:['公园慢行','湖区休息'],tags:['自然','公园','户外','轻松'],effort:'可控制、转场适中',cost:'低',novelty:'从美术馆与广场切换到城市尺度的自然空间',tradeoff:'天气影响明显，夜间不适合作为主要安排'},
  {id:'madrid-conde-duque',city:'马德里',title:'Conde Duque 的文化街区',anchor:'Centro Cultural Conde Duque',mapQuery:'Centro de Cultura Contemporánea Conde Duque',supporting:['文化空间','Malasaña 西侧街巷'],tags:['艺术','建筑','街区','室内'],effort:'步行较少',cost:'低至中',novelty:'避开大型美术馆，用社区文化中心组织半天',tradeoff:'活动内容与开放时间需要确认'},
  {id:'madrid-vallehermoso',city:'马德里',title:'Vallehermoso 的市场日常',anchor:'Mercado de Vallehermoso',mapQuery:'Mercado de Vallehermoso',supporting:['市场用餐','Chamberí 支路'],tags:['市场','吃饭','街区','生活方式'],effort:'步行较少',cost:'中',novelty:'围绕一顿饭进入居民区的日常节奏',tradeoff:'体验重点是饮食，非餐时内容较弱'},
  {id:'madrid-capricho',city:'马德里',title:'El Capricho 的花园半天',anchor:'Parque de El Capricho',mapQuery:'Parque de El Capricho',supporting:['历史花园','附近安静散步'],tags:['自然','历史','公园','轻松'],effort:'步行适中、往返较远',cost:'低',novelty:'从中心公园切换到城市东侧的历史花园',tradeoff:'开放日期有限且离中心较远，需要提前确认'},
  {id:'madrid-lavapies',city:'马德里',title:'Lavapiés 的多元街区',anchor:'Plaza de Lavapiés',mapQuery:'Plaza de Lavapiés',supporting:['街区壁画','多国料理'],tags:['街区','吃饭','艺术','生活方式'],effort:'步行适中',cost:'低至中',novelty:'从纪念性中心转向多元社区与街头文化',tradeoff:'街区观感复杂，夜间需要注意具体路段'}
];

export function resolveSupportedCity(value=''){
  const matches=supportedCities.filter(city=>cityAliases[city].some(alias=>value.toLowerCase().includes(alias.toLowerCase())));
  return matches.length===1?matches[0]:null;
}

export function proposalsFor(city,revisit={},excluded=[],limit=3){
  const interests=[...(revisit.interests||[]),...(revisit.liked||[])].join(' ').toLowerCase();
  const avoid=(revisit.avoid||[]).join(' ').toLowerCase();
  const candidates=revisitCatalog.filter(item=>item.city===city&&!excluded.includes(item.id));
  return candidates.map(item=>{
    let score=0;
    for(const tag of item.tags)if(interests.includes(tag.toLowerCase()))score+=2;
    if(avoid&&[item.title,item.anchor,...item.supporting].join(' ').toLowerCase().split(/\s+/).some(word=>word.length>1&&avoid.includes(word)))score-=5;
    return {...item,score};
  }).sort((left,right)=>right.score-left.score).slice(0,limit).map(({score,...item})=>item);
}
