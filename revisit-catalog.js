// 地点素材库可以继续保留更多城市；当前产品入口只开放香港、上海、柏林。
export const supportedCities=['香港','上海','柏林'];

export const cityAliases={
  香港:['香港','Hong Kong'],上海:['上海','Shanghai'],深圳:['深圳','Shenzhen'],
  柏林:['柏林','Berlin'],米兰:['米兰','Milan','Milano'],马德里:['马德里','Madrid']
};
export const areaAliases={
  香港:['旺角','九龙','油麻地','尖沙咀','深水埗','石硖尾','中环','上环','西环','坚尼地城','铜锣湾','湾仔','大坑','天后','跑马地','黄竹坑','香港仔','鸭脷洲','赤柱','石澳','大浪湾','龙脊','筲箕湾','太古','鲗鱼涌','观塘','西贡','九龙城','启德','土瓜湾','红磡','钻石山','美孚','荔枝角','太平山','山顶','沙田','新界','大澳','坪洲','长洲','南丫岛','榕树湾','索罟湾'],
  上海:['黄浦','外滩','老城厢','豫园','打浦桥','思南路','徐汇','徐家汇','龙华','衡山路','武康路','新华路','西岸','虹口','提篮桥','北外滩','杨浦','五角场','长宁','中山公园','愚园路','静安','张园','苏州河','普陀','浦东','陆家嘴','前滩','世纪公园','闵行','七宝','青浦','朱家角','蟠龙','松江','佘山'],
  柏林:['Mitte','Scheunenviertel','Prenzlauer Berg','Friedrichshain','Kreuzberg','Neukölln','Rixdorf','Tempelhof','Schöneberg','Charlottenburg','Westend','Wedding','Moabit','Tiergarten','Gesundbrunnen','Treptow','Lichtenberg','Marzahn','Spandau','Grunewald','Britz']
};

const catalog=[
  {id:'hk-sham-shui-po',city:'香港',title:'深水埗的手作与旧街',anchor:'JCCAC 石硖尾',mapQuery:'Jockey Club Creative Arts Centre',supporting:['深水埗街巷','街市周边用餐'],tags:['街区','手作','小店','吃饭'],effort:'步行适中',cost:'低至中',novelty:'从购物与海港切换到旧区生活和创作空间',tradeoff:'店铺与空间开放时间需要临行确认'},
  {id:'hk-wong-chuk-hang',city:'香港',title:'黄竹坑的艺术空间',anchor:'黄竹坑工业区',mapQuery:'Wong Chuk Hang',supporting:['画廊或艺术空间','香港仔海滨收尾'],tags:['艺术','设计','室内','街区'],effort:'转场适中',cost:'中',novelty:'把工业楼宇与南区海滨组合成半日主题',tradeoff:'画廊开放日不统一，需要按日期筛选'},
  {id:'hk-tai-hang',city:'香港',title:'大坑与天后的慢街区',anchor:'大坑',mapQuery:'Tai Hang Hong Kong',supporting:['街巷散步','天后附近晚餐'],tags:['街区','建筑','小店','吃饭','轻松'],effort:'步行较少',cost:'中',novelty:'保留熟悉的港岛氛围，换成更紧凑的生活街区',tradeoff:'内容密度较低，适合慢逛而非密集打卡'},
  {id:'hk-sai-kung',city:'香港',title:'西贡海旁的松弛半天',anchor:'西贡海滨长廊',mapQuery:'Sai Kung Promenade',supporting:['海边散步','镇内用餐'],tags:['海边','自然','吃饭','轻松'],effort:'步行较少、往返较远',cost:'中',novelty:'用海边小镇替代维港与市中心视角',tradeoff:'市区往返时间长，天气影响明显'},
  {id:'hk-kowloon-city',city:'香港',title:'九龙城的旧城与南洋味',anchor:'九龙寨城公园',mapQuery:'Kowloon Walled City Park',supporting:['九龙城街巷','泰国菜或潮州菜'],tags:['历史','街区','吃饭','公园'],effort:'步行适中',cost:'低至中',novelty:'从商业中心切换到旧城历史与多元餐饮',tradeoff:'与港铁站有距离，需要公交或短途打车'},
  {id:'hk-kwun-tong',city:'香港',title:'观塘的工业楼与海滨',anchor:'观塘海滨花园',mapQuery:'Kwun Tong Promenade',supporting:['工业区街景','海滨日落'],tags:['工业','城市景观','街区','海边'],effort:'步行适中',cost:'低',novelty:'从传统景点转向东九龙的城市更新',tradeoff:'工业区路段观感粗粝，周末部分店铺休息'},
  {id:'hk-kennedy-town',city:'香港',title:'坚尼地城的西端日常',anchor:'卑路乍湾海滨长廊',mapQuery:'Belcher Bay Promenade',supporting:['西环街巷','傍晚用餐'],tags:['海边','街区','吃饭','轻松'],effort:'步行较少',cost:'中',novelty:'在港岛西端看居民区与海边日常',tradeoff:'日落时段人多，体验更偏生活而非景点'},
  {id:'hk-peng-chau',city:'香港',title:'坪洲的离岛慢行',anchor:'坪洲',mapQuery:'Peng Chau',supporting:['岛上街巷','海边休息'],tags:['离岛','自然','街区','轻松'],effort:'步行适中、需乘船',cost:'中',novelty:'用小尺度离岛替代市区密集安排',tradeoff:'受船班和天气影响，需预留往返时间'},
  {id:'hk-sheung-wan',city:'香港',title:'上环的文武庙与摩罗街',anchor:'文武庙',mapQuery:'Man Mo Temple Sheung Wan',supporting:['摩罗街古董小店','必列者士街周边'],tags:['历史','人文','旧街','小店'],effort:'步行较少',cost:'低',novelty:'从中环商圈退后一条街，看开埠早期的城市肌理',tradeoff:'古董店质量参差，重点在街巷本身而非购物'},
  {id:'hk-central-market',city:'香港',title:'中环街市与石板街',anchor:'中环街市',mapQuery:'Central Market Hong Kong',supporting:['石板街','周边台阶与旧档口'],tags:['建筑','设计','室内','街区'],effort:'步行较少',cost:'低至中',novelty:'把一个老街市的活化当成建筑观察对象',tradeoff:'内部以小店和餐饮为主，停留时间取决于消费意愿'},
  {id:'hk-pmq',city:'香港',title:'PMQ 元创方的旧校舍与设计',anchor:'PMQ 元创方',mapQuery:'PMQ Hong Kong',supporting:['设计工作室与小店','士丹顿街支路'],tags:['设计','艺术','手作','室内'],effort:'步行较少',cost:'中',novelty:'在旧已婚警察宿舍里看本地设计与手作',tradeoff:'店铺更替较快，内容密度取决于当期进驻品牌'},
  {id:'hk-wan-chai-blue-house',city:'香港',title:'湾仔的蓝屋与街市日常',anchor:'蓝屋',mapQuery:'Blue House Wan Chai',supporting:['湾仔街市周边','石水渠街支路'],tags:['历史','街区','人文','建筑'],effort:'步行适中',cost:'低',novelty:'从会展视角切回湾仔的唐楼保育与街坊生活',tradeoff:'参观性内容集中在几栋建筑，其余靠街巷观察'},
  {id:'hk-causeway-bay-market',city:'香港',title:'铜锣湾的鹅颈桥与街市',anchor:'鹅颈街市',mapQuery:'Bowrington Road Market',supporting:['鹅颈桥下','周边老字号'],tags:['市场','吃饭','街区','人文'],effort:'步行较少',cost:'低',novelty:'在购物中心密度最高的区域找一处街市与桥底空间',tradeoff:'环境嘈杂湿滑，重点是市井观察而非舒适游览'},
  {id:'hk-happy-valley',city:'香港',title:'跑马地的马场与街区节奏',anchor:'跑马地马场',mapQuery:'Happy Valley Racecourse',supporting:['周边街巷','成和道用餐'],tags:['体育','城市文化','街区','夜晚'],effort:'步行较少',cost:'中',novelty:'把本地赛马文化当作城市观察的入口',tradeoff:'赛马日与平日氛围差别大，日程需要围绕赛程确认'},
  {id:'hk-mongkok-market',city:'香港',title:'旺角的市集街与旧楼',anchor:'金鱼街',mapQuery:'Goldfish Market Hong Kong',supporting:['花墟道','旺角道旧楼一带'],tags:['市场','旧街','街区','人文'],effort:'步行适中',cost:'低',novelty:'在熟悉的旺角换成市集动线，观察主题街道的分工',tradeoff:'人流密集，周末拥挤明显，不适合怕吵的人'},
  {id:'hk-yau-ma-tei',city:'香港',title:'油麻地的庙街与果栏',anchor:'油麻地果栏',mapQuery:'Yau Ma Tei Wholesale Fruit Market',supporting:['庙街夜市','油麻地戏院'],tags:['旧街','夜晚','市场','人文'],effort:'步行较少',cost:'低',novelty:'傍晚以后进入批发与夜市交替的街区时间',tradeoff:'夜间人多嘈杂，部分档口白天不营业'},
  {id:'hk-hung-hom',city:'香港',title:'红磡的旧街与海滨',anchor:'红磡海滨',mapQuery:'Hung Hom Promenade',supporting:['红磡老街','黄埔一带用餐'],tags:['街区','城市景观','吃饭','轻松'],effort:'步行适中',cost:'低至中',novelty:'用海滨步道串起一个生活化的旧街区',tradeoff:'景观强度一般，适合慢逛而非打卡'},
  {id:'hk-to-kwa-wan',city:'香港',title:'土瓜湾的牛棚与旧楼',anchor:'牛棚艺术村',mapQuery:'Cattle Depot Artists Village',supporting:['土瓜湾旧街巷','海傍散步'],tags:['艺术','旧街','手作','街区'],effort:'步行适中',cost:'低',novelty:'在拆迁与保育并存的街区看艺术村与老铺',tradeoff:'艺术村开放单位有限，周边环境较为破旧'},
  {id:'hk-meifoo-academy',city:'香港',title:'美孚的活化古建与山丘',anchor:'饶宗颐文化馆',mapQuery:'Jao Tsung-I Academy',supporting:['美孚新邨街市','荔枝角公园'],tags:['历史','建筑','公园','轻松'],effort:'步行适中',cost:'低',novelty:'从旧荔枝角医院区看一层活化后的文化空间',tradeoff:'位置在九龙西端，专程前往需要预留转场时间'},
  {id:'hk-diamond-hill',city:'香港',title:'钻石山的唐风园林',anchor:'志莲净苑',mapQuery:'Chi Lin Nunnery',supporting:['南莲园池','斧山道周边'],tags:['建筑','公园','自然','轻松'],effort:'步行较少',cost:'低',novelty:'在高层住宅环绕中看一组建造工艺特殊的木构园林',tradeoff:'宗教场所需保持安静，参观节奏偏静态'},
  {id:'hk-tai-koo',city:'香港',title:'太古的糖厂街与滨海新街',anchor:'糖厂街',mapQuery:'Tong Chong Street',supporting:['太古公园','鲗鱼涌滨海步道'],tags:['城市景观','街区','吃饭','设计'],effort:'步行较少',cost:'中',novelty:'在老工业区的新界面里读糖厂与船坞的城市记忆',tradeoff:'内容集中在小区域，餐饮高峰时段排队明显'},
  {id:'hk-kai-tak',city:'香港',title:'启德跑道公园的旧机场线',anchor:'启德跑道公园',mapQuery:'Kai Tak Runway Park',supporting:['跑道尽头观景','土瓜湾海滨衔接'],tags:['城市景观','公园','轻松','海边'],effort:'步行较多、转场适中',cost:'低',novelty:'把旧机场跑道当作一条理解城市变迁的散步线',tradeoff:'遮荫少，天气影响大，周边商业仍在建设中'},
  {id:'hk-peak-lugard',city:'香港',title:'太平山的旧径与环山步道',anchor:'卢吉道',mapQuery:'Lugard Road',supporting:['旧山顶道','山顶公园'],tags:['自然','城市景观','散步','户外'],effort:'步行适中',cost:'中',novelty:'避开观景台人流，从环山步道看维港',tradeoff:'缆车与观景台周末拥挤，云雾天气视野受限'},
  {id:'hk-stanley',city:'香港',title:'赤柱的海滨与旧街市',anchor:'赤柱市集',mapQuery:'Stanley Market',supporting:['赤柱大街','美利楼海滨'],tags:['海边','街区','吃饭','轻松'],effort:'步行较少、往返较远',cost:'中',novelty:'把游客市集与本地海滨日常分开来看',tradeoff:'市集商业化明显，往返南区交通时间较长'},
  {id:'hk-shek-o',city:'香港',title:'石澳的村屋与海滩',anchor:'石澳海滩',mapQuery:'Shek O Beach',supporting:['石澳村街巷','鹤咀道方向散步'],tags:['海边','自然','户外','轻松'],effort:'步行适中、往返较远',cost:'低至中',novelty:'在半岛东端看村屋与海岸的关系',tradeoff:'公交班次少，天气和季节对体验影响大'},
  {id:'hk-aberdeen',city:'香港',title:'香港仔的渔港与对岸',anchor:'香港仔海滨',mapQuery:'Aberdeen Promenade',supporting:['香港仔鱼类批发市场外观','鸭脷洲大街'],tags:['海边','人文','吃饭','街区'],effort:'步行适中、转场较少',cost:'低至中',novelty:'把渔港水道当作理解南区城市起源的现场',tradeoff:'体验依赖观察角度，部分水上海鲜船偏游客价'},
  {id:'hk-dragon-back',city:'香港',title:'龙脊山径与土地湾',anchor:'龙脊',mapQuery:'Dragon Back Hong Kong',supporting:['土地湾村','大浪湾收尾'],tags:['自然','户外','海边','轻松'],effort:'步行较多、需转场',cost:'低',novelty:'用一条经典山径把城市换成山海视角',tradeoff:'台阶与曝晒路段多，雨天与夏季需谨慎'},
  {id:'hk-tai-o',city:'香港',title:'大澳的水乡棚屋',anchor:'大澳棚屋',mapQuery:'Tai O',supporting:['大澳街市','涌边散步'],tags:['自然','人文','海边','轻松'],effort:'步行较少、往返较远',cost:'低至中',novelty:'在离岛上读渔业聚落的空间结构',tradeoff:'往返时间最长，需要围绕巴士班次安排'},
  {id:'hk-cheung-chau',city:'香港',title:'长洲的岛屿节奏',anchor:'长洲东湾',mapQuery:'Cheung Chau Tung Wan',supporting:['北社街巷','岛上小吃'],tags:['离岛','海边','吃饭','轻松'],effort:'步行较少、需乘船',cost:'低至中',novelty:'把一个小岛的街巷与海面当成一日的观察对象',tradeoff:'周末船班拥挤，岛上人多'},
  {id:'hk-lamma',city:'香港',title:'南丫岛的渔村与山径',anchor:'榕树湾大街',mapQuery:'Yung Shue Wan',supporting:['洪圣爷湾','索罟湾方向步道'],tags:['离岛','自然','户外','吃饭'],effort:'步行较多、需乘船',cost:'低至中',novelty:'穿岛步道串起两种不同气质的渔村',tradeoff:'步行时间较长，渡轮班次与天气需要先确认'},
  {id:'hk-lung-yeuk-tau',city:'香港',title:'龙跃头文物径与围村',anchor:'龙跃头文物径',mapQuery:'Lung Yeuk Tau Heritage Trail',supporting:['松岭邓公祠','围门与风水林'],tags:['历史','人文','自然','户外'],effort:'步行较多、往返较远',cost:'低',novelty:'在新界的围村格局里看宗族与田野',tradeoff:'位置偏远离市区，需要按交通时间规划半天以上'},
  {id:'hk-shatin-river',city:'香港',title:'沙田的城门河与博物馆',anchor:'香港文化博物馆',mapQuery:'Hong Kong Heritage Museum',supporting:['城门河两岸步道','沙田街市周边'],tags:['展览','室内','公园','轻松'],effort:'步行较少',cost:'低',novelty:'看一个围绕河流与铁路生长的新市镇',tradeoff:'部分展馆更新缓慢，户外段以日常景观为主'},

  {id:'sh-hongkou',city:'上海',title:'虹口的城市记忆',anchor:'多伦路文化名人街',mapQuery:'Duolun Road Cultural Celebrities Street',supporting:['四川北路周边','虹口街区散步'],tags:['人文','建筑','街区','历史'],effort:'步行适中',cost:'低',novelty:'从外滩视角转向近代城市生活与支路',tradeoff:'体验依赖沿途阅读，追求强景观的人可能觉得平淡'},
  {id:'sh-yangpu-river',city:'上海',title:'杨浦滨江的工业线索',anchor:'杨浦滨江人民城市建设规划展示馆',mapQuery:'Yangpu Riverside',supporting:['工业遗存步道','滨江休息'],tags:['建筑','工业','城市景观','散步'],effort:'步行较多',cost:'低',novelty:'在滨江看上海的生产与城市更新',tradeoff:'户外路段较长，炎热或下雨时需要缩短'},
  {id:'sh-west-bund',city:'上海',title:'西岸的一馆一段江景',anchor:'西岸美术馆',mapQuery:'West Bund Museum',supporting:['一处展览','西岸滨江'],tags:['艺术','室内','城市景观','设计'],effort:'步行适中',cost:'中',novelty:'用一场展览组织半天，避免把西岸全部走完',tradeoff:'展览内容与票价需要按日期确认'},
  {id:'sh-xinhua-road',city:'上海',title:'新华路的建筑与院落',anchor:'上生·新所',mapQuery:'Columbia Circle Shanghai',supporting:['新华路街区','沿途咖啡或晚餐'],tags:['建筑','设计','小店','街区'],effort:'步行适中',cost:'中',novelty:'在熟悉市中心里换一条建筑观察路线',tradeoff:'周末可能拥挤，商业内容变化较快'},
  {id:'sh-m50',city:'上海',title:'苏州河边的艺术与工业',anchor:'M50 创意园',mapQuery:'M50 Creative Park',supporting:['苏州河步道','附近简餐'],tags:['艺术','工业','散步','街区'],effort:'步行适中',cost:'低至中',novelty:'沿苏州河串起工业空间与当代创作',tradeoff:'画廊开放情况不一，需要临行确认'},
  {id:'sh-1933',city:'上海',title:'虹口的异形建筑半天',anchor:'1933 老场坊',mapQuery:'1933 Old Millfun',supporting:['沙泾港周边','北外滩支路'],tags:['建筑','历史','街区','摄影'],effort:'步行适中',cost:'低',novelty:'围绕一座特殊工业建筑展开城市观察',tradeoff:'内部商业内容有限，重点在建筑本身'},
  {id:'sh-power-station',city:'上海',title:'南外滩的当代艺术',anchor:'上海当代艺术博物馆',mapQuery:'Power Station of Art',supporting:['南浦大桥下空间','黄浦江边散步'],tags:['艺术','建筑','室内','城市景观'],effort:'步行适中',cost:'低至中',novelty:'避开外滩主线，从南段看工业改造与江景',tradeoff:'展览和开放时间需要按日期确认'},
  {id:'sh-panlong',city:'上海',title:'蟠龙天地的水乡新旧',anchor:'蟠龙天地',mapQuery:'Panlong Tiandi',supporting:['水巷慢走','街区用餐'],tags:['水乡','街区','吃饭','轻松'],effort:'步行较少、往返较远',cost:'中',novelty:'在城市边缘体验被重新组织的江南空间',tradeoff:'商业化明显且离市中心较远'},
  {id:'sh-suzhou-creek',city:'上海',title:'苏州河南岸的仓库记忆',anchor:'四行仓库',mapQuery:'Sihang Warehouse',supporting:['河滨大楼','苏州河步道西向'],tags:['散步','历史','工业','城市景观'],effort:'步行较多',cost:'低',novelty:'沿河读仓库与里弄共同构成的沿河界面',tradeoff:'步行距离长，部分河段施工或界面单调'},
  {id:'sh-rockbund',city:'上海',title:'外滩源的老建筑细看',anchor:'虎丘路',mapQuery:'Rockbund Shanghai',supporting:['圆明园路','北京东路界面'],tags:['建筑','历史','街区','摄影'],effort:'步行较少',cost:'低',novelty:'把外滩背面当建筑细读现场，避开正面人流',tradeoff:'内容靠观察建筑立面，部分空间商业化'},
  {id:'sh-tianzifang',city:'上海',title:'泰康路的弄堂与小店',anchor:'田子坊',mapQuery:'Tianzifang Shanghai',supporting:['泰康路支弄','周边里弄'],tags:['小店','艺术','街区','手作'],effort:'步行较少',cost:'低至中',novelty:'在里弄肌理里分辨原生活空间与商业空间',tradeoff:'周末人流大，商铺同质化明显'},
  {id:'sh-sinan-mansions',city:'上海',title:'思南公馆与复兴公园一带',anchor:'思南公馆',mapQuery:'Sinan Mansions',supporting:['复兴公园','思南路梧桐界面'],tags:['历史','公园','街区','轻松'],effort:'步行适中',cost:'低至中',novelty:'把洋房街区与法式公园放在同一条动线',tradeoff:'部分区域商业化，安静时段体验更好'},
  {id:'sh-wukang-mansions',city:'上海',title:'武康大楼与梧桐界面',anchor:'武康大楼',mapQuery:'Wukang Building',supporting:['武康路支弄','安福路西端'],tags:['建筑','街区','散步','小店'],effort:'步行适中',cost:'低',novelty:'用一条完整街道把建筑观察与街边小店组织起来',tradeoff:'网红路段拥挤，拍摄机位需等待'},
  {id:'sh-hengshan-road',city:'上海',title:'衡山路的洋房与界面',anchor:'衡山路',mapQuery:'Hengshan Road Shanghai',supporting:['周边洋房支弄','东平路方向'],tags:['街区','建筑','散步','生活方式'],effort:'步行适中',cost:'低',novelty:'从商业界面退回到树影与洋房的比例关系',tradeoff:'沿街餐饮较密，重点街区段集中需要挑选'},
  {id:'sh-nanchang-road',city:'上海',title:'南昌路的里弄日常',anchor:'南昌路',mapQuery:'Nanchang Road Shanghai',supporting:['弄堂入口','周边小馆与书店'],tags:['街区','小店','生活方式','历史'],effort:'步行适中',cost:'低',novelty:'在市中心看一条保持里弄日常节奏的街道',tradeoff:'弄堂多为居住区，参观需尊重居民生活'},
  {id:'sh-zhangyuan',city:'上海',title:'张园的石库门活化',anchor:'张园',mapQuery:'Zhangyuan Shanghai',supporting:['石库门弄堂界面','茂名北路'],tags:['建筑','历史','室内','设计'],effort:'步行较少',cost:'中',novelty:'把一组石库门里弄的更新当作建筑与商业的对照样本',tradeoff:'商业化明显，热门时段人流大'},
  {id:'sh-yuyuan-road',city:'上海',title:'愚园路的弄堂与社区空间',anchor:'愚园路',mapQuery:'Yuyuan Road Shanghai',supporting:['岐山村弄堂','社区小店与展馆'],tags:['街区','小店','历史','生活方式'],effort:'步行较多',cost:'低至中',novelty:'沿一条长街读里弄、小店与社区更新的叠加',tradeoff:'全程较长需要取舍路段，部分弄堂不对外开放'},
  {id:'sh-laochengxiang',city:'上海',title:'老城厢的街巷与文庙',anchor:'上海文庙',mapQuery:'Confucian Temple Shanghai',supporting:['梦花街','老西门周边街巷'],tags:['历史','街区','人文','吃饭'],effort:'步行适中',cost:'低',novelty:'在城墙原址内看旧城格局与市井生活',tradeoff:'部分街区正在更新，实际观感受施工影响'},
  {id:'sh-jewish-quarter',city:'上海',title:'提篮桥的避难记忆',anchor:'上海犹太难民纪念馆',mapQuery:'Shanghai Jewish Refugees Museum',supporting:['白马咖啡馆','舟山路旧里界面'],tags:['历史','人文','室内','建筑'],effort:'步行适中',cost:'中',novelty:'从外滩北段进入一段较少被安排的城市记忆',tradeoff:'题材严肃，需要预留参观与阅读时间'},
  {id:'sh-xujiahui',city:'上海',title:'徐家汇的书院与老堂',anchor:'徐家汇书院',mapQuery:'Zikawei Library',supporting:['徐家汇天主堂','光启公园'],tags:['历史','建筑','室内','公园'],effort:'步行较少',cost:'低',novelty:'在商业中心背后看传教士时代的建筑群',tradeoff:'书院人流大，部分空间需要预约或排队'},
  {id:'sh-longhua',city:'上海',title:'龙华的塔与寺',anchor:'龙华寺',mapQuery:'Longhua Temple Shanghai',supporting:['龙华塔','周边素斋'],tags:['历史','人文','轻松','吃饭'],effort:'步行较少',cost:'低',novelty:'在城区西南角看一组连续使用的古建与香火节奏',tradeoff:'香客多时段拥挤，内容相对静态'},
  {id:'sh-expo-museum',city:'上海',title:'世博会博物馆与滨江',anchor:'世博会博物馆',mapQuery:'Expo Museum Shanghai',supporting:['黄浦滨江步道','江南制造厂旧址方向'],tags:['展览','室内','建筑','城市景观'],effort:'步行适中',cost:'低至中',novelty:'把一场城市事件与滨江工业遗存串成一线',tradeoff:'临展质量不稳定，户外段取决于天气'},
  {id:'sh-natural-history',city:'上海',title:'自然博物馆与雕塑公园',anchor:'上海自然博物馆',mapQuery:'Shanghai Natural History Museum',supporting:['静安雕塑公园','周边界面'],tags:['展览','室内','公园','轻松'],effort:'步行较少',cost:'中',novelty:'把一座建筑、一处公园和一馆内容组合成半天',tradeoff:'周末亲子客流大，需要避开高峰时段'},
  {id:'sh-minsheng-silo',city:'上海',title:'民生码头的筒仓与江岸',anchor:'八万吨筒仓',mapQuery:'Minsheng Silo Shanghai',supporting:['民生滨江步道','洋泾港桥'],tags:['工业','建筑','城市景观','散步'],effort:'步行较多',cost:'低',novelty:'在浦东滨江看粮食筒仓与集装箱岸线的改造',tradeoff:'内部展览不常开，主体是户外与外观观察'},
  {id:'sh-siping-block',city:'上海',title:'四平路的社区微更新',anchor:'NICE 2035 未来生活原型街',mapQuery:'Siping Road Shanghai',supporting:['同济大学周边','阜新路界面'],tags:['设计','街区','城市景观','小众'],effort:'步行适中',cost:'低',novelty:'看大学与社区之间的实验性界面与小微更新',tradeoff:'尺度小且分散，需要带着设计视角去找'},
  {id:'sh-wujiaochang',city:'上海',title:'大学路的街区节奏',anchor:'大学路',mapQuery:'Daxue Road Shanghai',supporting:['创智天地界面','江湾体育场'],tags:['街区','吃饭','轻松','生活方式'],effort:'步行适中',cost:'低至中',novelty:'把高校、创业园区与街区商业放在一次散步里',tradeoff:'人流集中在餐饮时段，上午内容偏少'},
  {id:'sh-century-park',city:'上海',title:'世纪公园的花木与水面',anchor:'世纪公园',mapQuery:'Century Park Shanghai',supporting:['周边花木街区','张家浜步道'],tags:['公园','自然','户外','轻松'],effort:'步行可控',cost:'低',novelty:'把一次公园散步和花木路界面组合起来',tradeoff:'以休闲为主，不适合寻找密集内容的安排'},
  {id:'sh-gongqing-forest',city:'上海',title:'共青森林公园的滨江森林',anchor:'共青森林公园',mapQuery:'Gongqing Forest Park Shanghai',supporting:['黄浦江岸线','西门周边'],tags:['自然','公园','户外','轻松'],effort:'步行较多、往返较远',cost:'低',novelty:'在江边看一片人工林的年轮与使用方式',tradeoff:'位置偏东北，往返时间需要预留'},
  {id:'sh-qibao',city:'上海',title:'七宝的老街与水巷',anchor:'七宝老街',mapQuery:'Qibao Old Street',supporting:['蒲汇塘沿岸','老街支弄'],tags:['水乡','街区','吃饭','轻松'],effort:'步行较少',cost:'低至中',novelty:'不离开市区范围体验一条江南水巷的日常',tradeoff:'节假日人流大，商业内容为主需筛选'},
  {id:'sh-zhujiajiao',city:'上海',title:'朱家角的水乡骨架',anchor:'课植园',mapQuery:'Kezhi Garden',supporting:['北大街界面','放生桥'],tags:['水乡','自然','轻松','吃饭'],effort:'步行适中、往返较远',cost:'中',novelty:'从园林与桥的空间看一个完整的水乡结构',tradeoff:'往返时间较长，周末人流量大'},
  {id:'sh-sheshan',city:'上海',title:'佘山的教堂与天文台',anchor:'佘山天文台',mapQuery:'Sheshan Observatory',supporting:['佘山天主堂','东佘山步道'],tags:['历史','自然','户外','小众'],effort:'步行较多、往返较远',cost:'低至中',novelty:'把一座山丘上的科学与信仰并置观察',tradeoff:'离市中心远，需要围绕交通与开放时间安排'},
  {id:'sh-qiantan',city:'上海',title:'前滩的滨江与街区',anchor:'前滩休闲公园',mapQuery:'Qiantan Park',supporting:['前滩大道界面','东方体育中心周边'],tags:['城市景观','公园','轻松','吃饭'],effort:'步行适中',cost:'中',novelty:'看一段全新规划城区的尺度与滨江连接',tradeoff:'内容新而同质，缺少历史层次'},

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
  {id:'berlin-hackesche-hofe',city:'柏林',title:'Scheunenviertel 的院落界面',anchor:'Hackesche Höfe',mapQuery:'Hackesche Höfe',supporting:['罗森塔勒街','旧犹太公墓外观'],tags:['街区','历史','小店','建筑'],effort:'步行较少',cost:'低',novelty:'从主街转入院落体系，读一层不断更换用途的城市空间',tradeoff:'院落商业化明显，需要挑选感兴趣的入口'},
  {id:'berlin-mauerpark',city:'柏林',title:'Mauerpark 的周末市场',anchor:'Mauerpark',mapQuery:'Mauerpark Berlin',supporting:['跳蚤市场','山坡草地'],tags:['市场','街区','户外','生活方式'],effort:'步行较少',cost:'低',novelty:'把一段墙基上的公园当作周末观察现场',tradeoff:'市场集中在周日，其余时间内容较少'},
  {id:'berlin-kollwitzkiez',city:'柏林',title:'Kollwitzplatz 的街区节奏',anchor:'Kollwitzplatz',mapQuery:'Kollwitzplatz',supporting:['周边街市','Wasserturm 外观'],tags:['街区','吃饭','轻松','生活方式'],effort:'步行较少',cost:'中',novelty:'在一个成熟街区和旧水塔之间读城市更新历史',tradeoff:'游客化明显，餐饮需要避开纯游客选择'},
  {id:'berlin-kulturbrauerei',city:'柏林',title:'Kulturbrauerei 的旧酿造厂',anchor:'Kulturbrauerei',mapQuery:'Kulturbrauerei Berlin',supporting:['院落空间','Schönhauser Allee 界面'],tags:['工业','艺术','建筑','室内'],effort:'步行较少',cost:'低',novelty:'在旧啤酒厂结构里看文化机构如何接管工业空间',tradeoff:'活动与展览随日程变化，临行需确认'},
  {id:'berlin-volkspark-friedrichshain',city:'柏林',title:'Volkspark Friedrichshain 的林间',anchor:'Volkspark Friedrichshain',mapQuery:'Volkspark Friedrichshain',supporting:['小山与溪流','周边街区'],tags:['公园','自然','户外','轻松'],effort:'步行可控',cost:'低',novelty:'在老城外围看一片被反复使用的城市森林',tradeoff:'以散步为主，强内容集中在公园细节'},
  {id:'berlin-markthalle-neun',city:'柏林',title:'Markthalle Neun 的市场日常',anchor:'Markthalle Neun',mapQuery:'Markthalle Neun',supporting:['Eisenbahnstraße 界面','周边支路'],tags:['市场','吃饭','室内','街区'],effort:'步行较少',cost:'中',novelty:'把一座百年市场建筑当作街区变化的观察台',tradeoff:'主题活动日拥挤，平时摊位有限'},
  {id:'berlin-viktoriapark',city:'柏林',title:'Viktoriapark 的坡地与瀑布',anchor:'Viktoriapark',mapQuery:'Viktoriapark Berlin',supporting:['山顶纪念碑','Kreuzberg 街区下坡'],tags:['公园','城市景观','户外','轻松'],effort:'步行较多',cost:'低',novelty:'从坡顶把街区和天际线放进同一视角',tradeoff:'上坡有台阶，雨天路面湿滑'},
  {id:'berlin-prinzessinnengarten',city:'柏林',title:'Prinzessinnengarten 的城市种植',anchor:'Prinzessinnengarten',mapQuery:'Prinzessinnengarten',supporting:['移动种植箱','Moritzplatz 周边'],tags:['自然','街区','生活方式','轻松'],effort:'步行较少',cost:'低',novelty:'在一块临时用地上看社区如何讨论城市土地',tradeoff:'体量小且随季节变化，适合顺路而非专程'},
  {id:'berlin-gleisdreieck',city:'柏林',title:'Gleisdreieck 的铁路遗存公园',anchor:'Park am Gleisdreieck',mapQuery:'Park am Gleisdreieck',supporting:['旧铁路痕迹','草坪与步道'],tags:['公园','城市景观','户外','设计'],effort:'步行较多',cost:'低',novelty:'在废弃铁路编组站上读一个公园的保守更新',tradeoff:'遮荫有限，体验依赖天气与步行意愿'},
  {id:'berlin-treptower',city:'柏林',title:'Treptower Park 与施普雷河岸',anchor:'Treptower Park',mapQuery:'Treptower Park',supporting:['苏军纪念墓园','河岸步道'],tags:['历史','公园','户外','建筑'],effort:'步行较多',cost:'低',novelty:'用一个大型纪念空间和河岸理解城市尺度',tradeoff:'距离较长，纪念区需保持肃穆'},
  {id:'berlin-rixdorf',city:'柏林',title:'Rixdorf 的波希米亚旧村',anchor:'Böhmisches Dorf',mapQuery:'Boehmisches Dorf Rixdorf',supporting:['旧村街巷','村口教堂'],tags:['历史','街区','轻松','小众'],effort:'步行较少',cost:'低',novelty:'在 Neukölln 里找一段保存完整的移民村落格局',tradeoff:'体量小，适合与其他点位拼半天'},
  {id:'berlin-winterfeldtplatz',city:'柏林',title:'Schöneberg 的市场与市政厅',anchor:'Winterfeldtplatz',mapQuery:'Winterfeldtplatz',supporting:['周六市场','Schöneberg 市政厅外观'],tags:['市场','街区','吃饭','生活方式'],effort:'步行较少',cost:'低至中',novelty:'用市场日看一个老西柏林街区的日常',tradeoff:'市场集中在周六，平日内容较少'},
  {id:'berlin-arminius',city:'柏林',title:'Moabit 的旧市场大厅',anchor:'Arminius Markthalle',mapQuery:'Arminius Markthalle',supporting:['周边旧街巷','Westhafen 方向外观'],tags:['市场','吃饭','室内','街区'],effort:'步行较少',cost:'中',novelty:'在一座百年市场大厅里读 Moabit 的社区构成',tradeoff:'区域尺度分散，需要顺路组织动线'},
  {id:'berlin-savignyplatz',city:'柏林',title:'Savignyplatz 的老西柏林',anchor:'Savignyplatz',mapQuery:'Savignyplatz',supporting:['书店与餐馆界面','Kantstraße 支路'],tags:['街区','吃饭','轻松','生活方式'],effort:'步行较少',cost:'中',novelty:'在老西柏林街区看书店、餐馆与住宅的比例',tradeoff:'内容偏日常，缺少强地标'},
  {id:'berlin-charlottenburg-palace',city:'柏林',title:'Charlottenburg 的宫殿与花园',anchor:'Schloss Charlottenburg',mapQuery:'Schloss Charlottenburg',supporting:['巴洛克花园','Spandauer Damm 界面'],tags:['历史','建筑','公园','室内'],effort:'步行适中',cost:'中',novelty:'从纪念性空间读一段普鲁士的空间秩序',tradeoff:'宫殿内部需购票，庭院部分更适合慢逛'},
  {id:'berlin-zitadelle',city:'柏林',title:'Spandau 的城堡与老城',anchor:'Zitadelle Spandau',mapQuery:'Zitadelle Spandau',supporting:['老城街巷','Havel 河岸'],tags:['历史','建筑','户外','小众'],effort:'步行较多、转场适中',cost:'低至中',novelty:'把文艺复兴要塞和哈弗尔河放进同一条线',tradeoff:'离市中心远，需要围绕交通时间安排'},
  {id:'berlin-humboldthain',city:'柏林',title:'Volkspark Humboldthain 的高塔',anchor:'Volkspark Humboldthain',mapQuery:'Volkspark Humboldthain',supporting:['旧防空塔外观','坡地草坪'],tags:['历史','自然','公园','户外'],effort:'步行可控',cost:'低',novelty:'在一座公园里同时看到战争遗迹与日常使用',tradeoff:'遗迹参观有开放限制，内容偏静态'},
  {id:'berlin-suedgelaende',city:'柏林',title:'Südgelände 的荒野铁道',anchor:'Natur-Park Südgelände',mapQuery:'Natur-Park Suedgelaende',supporting:['旧调车场遗迹','步道与水塔'],tags:['自然','工业','户外','小众'],effort:'步行适中',cost:'低',novelty:'看自然如何接管一片废弃铁路编组站',tradeoff:'位置偏南需要转场，场地开放时间有限'},
  {id:'berlin-britzer-garten',city:'柏林',title:'Britzer Garten 的园林尺度',anchor:'Britzer Garten',mapQuery:'Britzer Garten',supporting:['湖区与草坡','周边街区'],tags:['自然','公园','户外','轻松'],effort:'步行可控、往返较远',cost:'低',novelty:'在市中心之外看一次花园展留下的城市绿地',tradeoff:'离中心远，往返时间需要预留'},
  {id:'berlin-pfaueninsel',city:'柏林',title:'Pfaueninsel 的宫殿岛',anchor:'Pfaueninsel',mapQuery:'Pfaueninsel',supporting:['岛上宫殿','孔雀与林地'],tags:['自然','历史','户外','轻松'],effort:'步行较多、需乘船',cost:'中',novelty:'把一段短渡轮换成进入另一个时代的门',tradeoff:'渡轮班次与天气影响大，旺季人多'},
  {id:'berlin-koenig-st-agnes',city:'柏林',title:'St. Agnes 的教堂画廊',anchor:'König Galerie',mapQuery:'Koenig Galerie',supporting:['教堂空间','Kreuzberg 北端支路'],tags:['艺术','建筑','室内','小众'],effort:'步行较少',cost:'中',novelty:'看一座粗野主义教堂如何变成当代艺术容器',tradeoff:'展期更换需要确认，空间停留时间不长'},
  {id:'berlin-boros',city:'柏林',title:'Boros 旧地堡的当代收藏',anchor:'Sammlung Boros',mapQuery:'Sammlung Boros',supporting:['地堡外观',' Mitte 周边支路'],tags:['艺术','建筑','室内','小众'],effort:'步行较少',cost:'中',novelty:'在一座战争地堡里看当代艺术与空间的互相改造',tradeoff:'仅预约开放，需提前数周预订'},
  {id:'berlin-dongxuan',city:'柏林',title:'Dong Xuan 的河内市场',anchor:'Dong Xuan Center',mapQuery:'Dong Xuan Center',supporting:['市场棚区','周边工业界面'],tags:['市场','吃饭','街区','小众'],effort:'步行较少、转场较多',cost:'低',novelty:'在 Lichtenberg 的仓库区看一段真实的移民商业',tradeoff:'环境粗粝，需要接受市集而非景点的心态'},
  {id:'berlin-gaerten-der-welt',city:'柏林',title:'Gärten der Welt 的世界园林',anchor:'Gärten der Welt',mapQuery:'Gaerten der Welt',supporting:['东方园林区','周边绿地'],tags:['自然','公园','户外','轻松'],effort:'步行可控、往返较远',cost:'中',novelty:'在一处园区里比较不同文化如何定义花园',tradeoff:'位于城东边缘，往返时间较长'},

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

export const cityMaterials=catalog.map(item=>({...item}));
export const revisitCatalog=cityMaterials;

const stableRank=value=>[...value].reduce((sum,char)=>(sum*31+char.codePointAt(0))%100000,7);

export function resolveSupportedCity(value=''){
  const normalized=value.toLowerCase();
  const matches=supportedCities.filter(city=>[...cityAliases[city],...(areaAliases[city]||[])].some(alias=>normalized.includes(alias.toLowerCase())));
  return matches.length===1?matches[0]:null;
}

export function resolveExplicitCity(value=''){
  const normalized=value.toLowerCase();
  const matches=supportedCities.filter(city=>(cityAliases[city]||[]).some(alias=>normalized.includes(alias.toLowerCase())));
  return matches.length===1?matches[0]:null;
}

export function resolveSupportedAreas(value='',city=''){
  const normalized=value.toLowerCase();
  const cities=city&&areaAliases[city]?[city]:supportedCities;
  for(const candidateCity of cities){
    const matches=(areaAliases[candidateCity]||[])
      .filter(alias=>normalized.includes(alias.toLowerCase()))
      .filter(alias=>!(areaAliases[candidateCity]||[]).some(longer=>longer.length>alias.length&&longer.includes(alias)&&normalized.includes(longer.toLowerCase())));
    if(matches.length)return {city:candidateCity,areas:matches};
  }
  return null;
}

export function resolveSupportedArea(value='',city=''){
  const match=resolveSupportedAreas(value,city);
  return match?{city:match.city,area:match.areas.join('、')}:null;
}

const materialText=item=>[item.title,item.anchor,...item.supporting,...item.tags,item.novelty,item.tradeoff].join(' ').toLowerCase();
const normalizedSignals=values=>values.filter(value=>typeof value==='string'&&value.trim().length>1).map(value=>value.trim().toLowerCase());
const signalMatches=(content,signals)=>signals.filter(signal=>content.includes(signal));
export function areaMaterialQueries(city,area){
  const normalized=(area||'').trim().toLowerCase();
  if(!normalized)return [];
  return cityMaterials.filter(item=>item.city===city&&materialText(item).includes(normalized)).map(item=>item.mapQuery);
}
export function materialCandidatesFor(city,revisit={},excludedMaterialIds=[]){
  const interests=normalizedSignals([...(revisit.interests||[]),...(revisit.liked||[]),...(revisit.revisit||[]),revisit.direction||'']);
  const avoid=normalizedSignals(revisit.avoid||[]);
  const areas=normalizedSignals([revisit.area||'']);
  const paceText=[revisit.pace,revisit.mobility,revisit.direction].filter(Boolean).join(' ').toLowerCase();
  const requiresLowWalking=/(?:少走|不想走|走不动|行动不便|轮椅)/.test(paceText);
  const prefersEasy=requiresLowWalking||/(?:轻松|慢慢|别太累|不要太累)/.test(paceText);
  const excluded=new Set(excludedMaterialIds);
  return cityMaterials.filter(item=>item.city===city&&!excluded.has(item.id)).map(item=>{
    const content=materialText(item);
    const interestMatches=signalMatches(content,interests),areaMatches=signalMatches(content,areas);
    const excessiveWalking=requiresLowWalking&&/步行较多/.test(item.effort);
    const paceScore=prefersEasy?(/步行较少|轻松|可控制/.test(item.effort)?2:/步行较多/.test(item.effort)?-3:0):0;
    const score=interestMatches.length*3+areaMatches.length*6+paceScore;
    const blockedBy=avoid.filter(avoided=>content.includes(avoided));
    return {...item,score,retrieval:{score,interestMatches,areaMatches,paceScore},blocked:blockedBy.length>0||excessiveWalking};
  }).filter(item=>!item.blocked).sort((left,right)=>right.score-left.score||stableRank(left.id)-stableRank(right.id)).map(({blocked,...item})=>item);
}
