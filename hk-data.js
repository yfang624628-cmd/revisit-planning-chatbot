"use strict";
/* ==================================================================
   香港数据层 · 快照 2026-09
   地名 / 坐标 / 区域 / 步行连通性：OpenStreetMap
   门票 / 房价 / 人均 / 营业时间：示例数据，非实时报价
   换一个城市 = 换这一个文件，规划逻辑不用动。
   ================================================================== */
const HK = {
  meta: {
    city: '香港',
    snapshot: '2026-09',
    geo: '地点与坐标：OpenStreetMap',
    biz: '门票 / 房价 / 人均：示例数据'
  },

  /* ---------- 旅行偏好。锚点推荐先按这个筛，再按不可替代性排 ---------- */
  themes: [
    { id:'art',     n:'艺术设计', sub:'美术馆 / 旧建筑活化 / 设计市集' },
    { id:'history', n:'人文历史', sub:'博物馆 / 庙宇 / 老唐楼' },
    { id:'city',    n:'城市景观', sub:'维港 / 天际线 / 夜景' },
    { id:'street',  n:'市井烟火', sub:'街市 / 夜市 / 老街' },
    { id:'nature',  n:'自然山海', sub:'步道 / 海岛 / 渔村' }
  ],

  /* ---------- 区域。side 决定 Day1/Day2 分在哪一边 ---------- */
  areas: {
    westkln:  { n:'西九龙', side:'kln' },
    tst:      { n:'尖沙咀', side:'kln' },
    mongkok:  { n:'旺角油麻地', side:'kln' },
    ssp:      { n:'深水埗', side:'kln' },
    central:  { n:'中环', side:'hk' },
    sheung:   { n:'上环', side:'hk' },
    wanchai:  { n:'湾仔铜锣湾', side:'hk' },
    peak:     { n:'太平山顶', side:'hk' },
    lantau:   { n:'大屿山', side:'out' },
    southern: { n:'港岛南区', side:'out' },
    shatin:   { n:'沙田', side:'out' }
  },

  /* 区间移动分钟。没写的按同侧 25 / 跨海 40 / 出城 70 估。 */
  hop: {
    'westkln|tst':10, 'westkln|mongkok':12, 'westkln|ssp':16, 'tst|mongkok':10,
    'tst|ssp':18, 'mongkok|ssp':8, 'central|sheung':8, 'central|wanchai':10,
    'central|peak':22, 'sheung|wanchai':14, 'sheung|peak':28, 'wanchai|peak':30,
    'tst|central':14, 'tst|sheung':18, 'tst|wanchai':16, 'westkln|central':16,
    'mongkok|central':20, 'ssp|central':24, 'central|lantau':55, 'tst|lantau':65,
    'central|southern':35, 'tst|southern':45, 'mongkok|shatin':25, 'tst|shatin':30,
    'central|shatin':40, 'ssp|shatin':22, 'westkln|peak':38, 'mongkok|peak':40
  },

  /* ---------- 33 个地点。price 为单人门票，0 = 免费 ---------- */
  sights: [
    { id:'mplus', n:'M+ 博物馆', area:'westkln', price:159, dur:120, from:'10:00', to:'18:00',
      book:true, themes:['art'], uniq:10, cover:'in', cat:'馆', pop:9, tags:['indoor'],
      why:'亚洲第一个视觉文化馆。三楼常设一层就够看两小时，特展看不完就别硬看。',
      tip:'周一闭馆，官网限流，当天不一定有票' },
    { id:'palace', n:'香港故宫文化博物馆', area:'westkln', price:130, dur:110, from:'10:00', to:'18:00',
      book:true, themes:['art','history'], uniq:6, cover:'in', cat:'馆', pop:7, tags:['indoor'],
      why:'和 M+ 隔一条路。九个展厅里只有第一、第二值得慢慢走。',
      tip:'周二闭馆，特展另收费' },
    { id:'artpark', n:'西九艺术公园海滨长廊', area:'westkln', price:0, dur:45, from:'06:00', to:'23:00',
      themes:['city'], uniq:4, cover:'open', cat:'外', pop:5, tags:['view'],
      why:'看港岛天际线最不挤的一段草地，日落前四十分钟最好。', tip:'' },

    { id:'avenue', n:'星光大道', area:'tst', price:0, dur:40, from:'00:00', to:'23:59',
      themes:['city'], uniq:6, cover:'open', cat:'外', pop:6, tags:['view'],
      why:'沿海边走完全程二十分钟。傍晚这一段光最好，八点有幻彩咏香江。', tip:'' },
    { id:'space', n:'香港太空馆', area:'tst', price:22, dur:70, from:'13:00', to:'21:00',
      themes:['history'], uniq:3, cover:'in', cat:'馆', pop:4, tags:['indoor'],
      why:'下雨天的备选。天象厅那场值 22 块，展厅本身一般。', tip:'周二闭馆' },
    { id:'history', n:'香港历史博物馆', area:'tst', price:0, dur:90, from:'10:00', to:'18:00',
      themes:['history'], uniq:7, cover:'in', cat:'馆', pop:6, tags:['indoor'],
      why:'常设展免费，"香港故事"从渔村讲到回归，是理解这座城最快的一小时半。', tip:'周二闭馆' },
    { id:'h1881', n:'1881 Heritage', area:'tst', price:0, dur:30, from:'10:00', to:'22:00',
      themes:['history','city'], uniq:4, cover:'half', cat:'外', pop:3, tags:[],
      why:'旧水警总部改的商场。不用进店，外面那圈殖民地建筑拍完就走。', tip:'' },
    { id:'ferry', n:'天星小轮', area:'tst', price:4, dur:20, from:'06:30', to:'23:30',
      themes:['city'], uniq:9, cover:'half', wind:true, cat:'外', pop:7, tags:['view'],
      why:'过海比地铁慢十分钟，但这十分钟是四块钱的维港。坐上层。', tip:'' },

    { id:'temple', n:'庙街夜市', area:'mongkok', price:0, dur:90, from:'18:00', to:'23:30',
      themes:['street'], uniq:8, cover:'half', cat:'夜', pop:7, tags:['night','market'],
      why:'十点才真正热闹，早到只有空架子。看完记得别订太早的回程车。', tip:'' },
    { id:'ladies', n:'女人街（通菜街）', area:'mongkok', price:0, dur:50, from:'12:00', to:'23:00',
      themes:['street'], uniq:5, cover:'half', cat:'市', pop:5, tags:['market'],
      why:'一公里的地摊，买不买都得走一遍才知道旺角是什么密度。', tip:'' },
    { id:'bird', n:'园圃街雀鸟花园', area:'mongkok', price:0, dur:35, from:'07:00', to:'20:00',
      themes:['street'], uniq:7, cover:'open', cat:'市', pop:4, tags:['market'],
      why:'老人提着笼子来遛鸟的地方。上午去才有人，下午只剩鸟。', tip:'' },
    { id:'goldfish', n:'金鱼街', area:'mongkok', price:0, dur:25, from:'10:30', to:'22:00',
      themes:['street'], uniq:8, cover:'half', cat:'市', pop:4, tags:['market'],
      why:'一整条街挂满装鱼的塑料袋。十分钟看完，但那画面别处没有。', tip:'' },
    { id:'sneaker', n:'波鞋街', area:'mongkok', price:0, dur:30, from:'11:00', to:'22:00',
      themes:['street'], uniq:4, cover:'half', cat:'市', pop:3, tags:['market'],
      why:'限量款比内地便宜的那条街。不买鞋可以跳过。', tip:'' },

    { id:'apliu', n:'鸭寮街', area:'ssp', price:0, dur:45, from:'12:00', to:'22:00',
      themes:['street'], uniq:9, cover:'half', cat:'市', pop:5, tags:['market'],
      why:'电子垃圾和二手器材摊，香港最不修饰的一条街。', tip:'' },
    { id:'meiho', n:'美荷楼生活馆', area:'ssp', price:0, dur:60, from:'09:30', to:'17:00',
      themes:['history'], uniq:8, cover:'in', cat:'馆', pop:5, tags:['indoor'],
      why:'五十年代公屋原样保留，免费。看完再走鸭寮街，那条街就看得懂了。', tip:'周三闭馆' },
    { id:'tainan', n:'大南街咖啡一条街', area:'ssp', price:0, dur:50, from:'10:00', to:'19:00',
      themes:['street','art'], uniq:5, cover:'in', cat:'市', pop:4, tags:[],
      why:'旧布行中间开出的独立咖啡店。坐下就是半小时起。', tip:'' },

    { id:'daikwun', n:'大馆', area:'central', price:0, dur:90, from:'08:00', to:'23:00',
      themes:['art','history'], uniq:8, cover:'half', cat:'馆', pop:8, tags:['indoor'],
      why:'旧中区警署改的艺术区，免费不用订。红砖操场那一圈是唯一必拍。', tip:'' },
    { id:'market', n:'中环街市', area:'central', price:0, dur:30, from:'10:00', to:'22:00',
      themes:['street','history'], uniq:4, cover:'in', cat:'市', pop:4, tags:['indoor'],
      why:'百年菜市场改的。二楼小店买手信，一楼不用逛。', tip:'' },
    { id:'escal', n:'半山自动扶梯', area:'central', price:0, dur:30, from:'06:00', to:'00:00',
      themes:['city','street'], uniq:9, cover:'half', cat:'外', pop:6, tags:['walk'],
      why:'全球最长户外扶梯。10:20 之后改上行，中途随时跳下来，别想走完。', tip:'' },
    { id:'duddell', n:'都爹利街石阶煤气灯', area:'central', price:0, dur:15, from:'00:00', to:'23:59',
      themes:['history'], uniq:7, cover:'open', cat:'外', pop:3, tags:['night'],
      why:'香港仅存四盏煤气灯，天黑才点。顺路五分钟的事。', tip:'' },
    { id:'tamar', n:'添马公园', area:'central', price:0, dur:35, from:'06:00', to:'23:00',
      themes:['city'], uniq:3, cover:'open', cat:'外', pop:3, tags:['view'],
      why:'政府总部前面那片草地，坐着看对岸，没有一个摊贩。', tip:'' },

    { id:'manmo', n:'文武庙', area:'sheung', price:0, dur:30, from:'08:00', to:'18:00',
      themes:['history'], uniq:7, cover:'in', cat:'馆', pop:5, tags:['indoor'],
      why:'一百八十年的庙，满屋盘香。进去五分钟就知道为什么值一趟。', tip:'' },
    { id:'hollywood', n:'荷李活道古董街', area:'sheung', price:0, dur:45, from:'11:00', to:'19:00',
      themes:['art','history'], uniq:5, cover:'half', cat:'市', pop:4, tags:[],
      why:'从文武庙一路走下去，两边全是古董铺和画廊，不买也顺路。', tip:'' },
    { id:'pmq', n:'PMQ 元创方', area:'sheung', price:0, dur:50, from:'07:00', to:'23:00',
      themes:['art'], uniq:6, cover:'in', cat:'馆', pop:4, tags:['indoor'],
      why:'旧警察宿舍改的设计师市集，一百多间小工作室。下雨天很好用。', tip:'' },
    { id:'westmk', n:'西港城', area:'sheung', price:0, dur:25, from:'10:00', to:'19:00',
      themes:['history'], uniq:4, cover:'in', cat:'馆', pop:3, tags:['indoor'],
      why:'爱德华式红砖楼，二楼卖布。十五分钟够了。', tip:'' },

    { id:'bluehouse', n:'蓝屋建筑群', area:'wanchai', price:18, dur:50, from:'10:00', to:'18:00',
      themes:['history'], uniq:8, cover:'in', cat:'馆', pop:5, tags:['indoor'],
      why:'唯一还住着人的战前唐楼。导赏 18 块，比隔壁任何一个展馆都实在。', tip:'周四闭馆' },
    { id:'happyv', n:'跑马地夜赛', area:'wanchai', price:9, dur:120, from:'19:00', to:'23:00',
      themes:['city','street'], uniq:9, cover:'half', cat:'夜', pop:7, tags:['night'],
      why:'周三晚才有。十块钱进场，站在草地边上看，比任何夜景都香港。', tip:'只有周三，其他晚上没有' },
    { id:'times', n:'铜锣湾时代广场', area:'wanchai', price:0, dur:40, from:'10:00', to:'22:00',
      themes:['city'], uniq:1, cover:'in', cat:'市', pop:3, tags:[],
      why:'人流密度的样本。不购物的话看一眼门口就够。', tip:'' },

    { id:'peaktram', n:'山顶缆车 + 凌霄阁', area:'peak', price:80, dur:90, from:'08:00', to:'23:00',
      themes:['city','nature'], uniq:7, cover:'half', wind:true, cat:'外', pop:9, tags:['view','night'],
      why:'往返 88 港元。四点后队伍最长，三点半到是故意的。', tip:'旺季排队可超一小时' },
    { id:'lugard', n:'卢吉道观景步道', area:'peak', price:0, dur:60, from:'00:00', to:'23:59',
      themes:['nature','city'], uniq:7, cover:'open', cat:'外', pop:7, tags:['view','walk'],
      why:'上山之后往左那条平路，一公里，免费，视角比凌霄阁付费平台好。', tip:'没有路灯' },

    { id:'bigbuddha', n:'天坛大佛 + 昂坪 360', area:'lantau', price:215, dur:240, from:'10:00', to:'18:00',
      themes:['nature','history'], uniq:7, cover:'open', wind:true, cat:'外', pop:6, tags:['view'],
      why:'缆车来回加山上，半天没了。要去就把这天全给它，别想再串别的。', tip:'大风停运，出发前查' },
    { id:'taio', n:'大澳渔村', area:'lantau', price:0, dur:120, from:'09:00', to:'18:00',
      themes:['nature','street'], uniq:8, cover:'open', cat:'外', pop:5, tags:[],
      why:'棚屋和咸鱼味，跟你想象的香港完全不是一回事。从昂坪坐巴士 20 分钟。', tip:'末班车 19:00 前' },
    { id:'ocean', n:'海洋公园', area:'southern', price:440, dur:300, from:'10:00', to:'19:00',
      book:true, themes:['nature'], uniq:4, cover:'open', cat:'外', pop:5, tags:[],
      why:'一整天的项目。带小孩才值这个价和这个时间。', tip:'官网早鸟票便宜约 15%' },
    { id:'stanley', n:'赤柱大街', area:'southern', price:0, dur:120, from:'10:00', to:'19:00',
      themes:['nature','city'], uniq:4, cover:'open', cat:'外', pop:4, tags:['view'],
      why:'从中环坐 6 号双层巴士上层去，那一段山路本身就是景点。', tip:'' },
    { id:'10k', n:'万佛寺', area:'shatin', price:0, dur:90, from:'09:00', to:'17:00',
      themes:['nature','history'], uniq:7, cover:'open', cat:'馆', pop:5, tags:['walk'],
      why:'四百级台阶两边全是罗汉像。爬上去要出汗，但上面没人。', tip:'' },
    { id:'heritage', n:'香港文化博物馆', area:'shatin', price:0, dur:80, from:'10:00', to:'18:00',
      themes:['history','art'], uniq:5, cover:'in', cat:'馆', pop:4, tags:['indoor'],
      why:'常设免费，粤剧厅和金庸馆各占一层。', tip:'周二闭馆' }
  ],

  /* ---------- 12 个住处，按价降序。commute = 每天多出的通勤分钟 ---------- */
  stays: [
    { id:'rosewood', n:'尖沙咀 瑰丽酒店', area:'tst', price:1880, commute:0,
      note:'落地窗正对维港', down:'' },
    { id:'shangri', n:'港岛 香格里拉', area:'central', price:1420, commute:0,
      note:'中环步行圈内', down:'不看维港，换到港岛这边' },
    { id:'mira', n:'尖沙咀 The Mira', area:'tst', price:980, commute:0,
      note:'弥敦道旁，出门就是地铁', down:'房间小一半，位置一样好' },
    { id:'cordis', n:'旺角 康得思', area:'mongkok', price:760, commute:8,
      note:'楼下就是朗豪坊', down:'挪到旺角，每天多 8 分钟' },
    { id:'crowne', n:'铜锣湾 皇冠假日', area:'wanchai', price:620, commute:12,
      note:'安静一点的那一侧', down:'过海到港岛东，每天多 12 分钟' },
    { id:'motel', n:'尖沙咀 木的地酒店', area:'tst', price:560, commute:5,
      note:'房间 14 平，位置好', down:'从大房换到 14 平' },
    { id:'sheung', n:'上环 逸林希尔顿', area:'sheung', price:493, commute:10,
      note:'近地铁，楼下有茶餐厅', down:'通勤多 10 分钟，看不到维港' },
    { id:'metro', n:'旺角 帝京酒店', area:'mongkok', price:420, commute:14,
      note:'旧一点，干净', down:'装修旧十年，位置退一站' },
    { id:'jordan', n:'佐敦 华丽都会', area:'mongkok', price:380, commute:16,
      note:'性价比那一档', down:'再退一站，每天多 16 分钟' },
    { id:'ssp', n:'深水埗 民宿', area:'ssp', price:280, commute:25,
      note:'整间，楼梯房无电梯', down:'每天多 25 分钟通勤，六楼没电梯' },
    { id:'chung', n:'重庆大厦 单人间', area:'tst', price:180, commute:0,
      note:'8 平，位置无敌', down:'房间 8 平，楼下永远吵' },
    { id:'hostel', n:'油麻地 青旅床位', area:'mongkok', price:110, commute:14,
      note:'六人间，共用卫浴', down:'六人间，共用卫浴，睡不好' },
    { id:'none', n:'不住，当天来回', area:'tst', price:0, commute:0,
      note:'Day 2 取消', down:'Day 2 整天没了' }
  ],

  /* ---------- 餐饮 6 档，每档挂真实店 ---------- */
  foods: [
    { id:'fine', n:'两顿正经的', price:520, down:'',
      note:'一乐烧鹅 / 何洪记',
      d1:{ cap:'晚饭 · 正经一顿', m:75, opts:[['一乐烧鹅','人均 ¥184'],['镛记酒家','人均 ¥260']],
           why:'烧鹅要等位，镛记要订位。赶时间选前者。', hint:'一乐 21:30 收档' },
      d2:{ cap:'午饭 · 正经一顿', m:70, opts:[['何洪记','人均 ¥150'],['陆羽茶室','人均 ¥220']],
           why:'何洪记的云吞和粥底火锅是两回事，中午吃前者。', hint:'陆羽只收现金' } },
    { id:'old', n:'老字号', price:400, down:'从米其林那档退到老字号',
      note:'九记牛腩 / 莲香楼',
      d1:{ cap:'晚饭 · 老字号', m:60, opts:[['九记牛腩','人均 ¥82'],['甘牌烧鹅','人均 ¥95']],
           why:'九记清汤牛腩汤头鲜甜，饭点前去不用排长队。', hint:'九记周日休息' },
      d2:{ cap:'午饭 · 老字号', m:60, opts:[['莲香楼','人均 ¥90'],['添好运','人均 ¥70']],
           why:'莲香楼要自己抢推车点心，添好运是坐着等的米其林。', hint:'莲香楼 15:00 收' } },
    { id:'cha', n:'茶餐厅', price:250, down:'不吃那两顿正经的',
      note:'沾仔记 / 兰芳园',
      d1:{ cap:'晚饭 · 茶餐厅', m:45, opts:[['沾仔记','人均 ¥64'],['澳洲牛奶公司','人均 ¥45']],
           why:'沾仔记只卖三样浇头，点云吞面就对了。', hint:'澳牛 19:45 就关' },
      d2:{ cap:'午饭 · 茶餐厅', m:45, opts:[['兰芳园','人均 ¥55'],['沾仔记','人均 ¥64']],
           why:'兰芳园的丝袜奶茶和猪扒包，站着吃也行。', hint:'兰芳园周日休息' } },
    { id:'daipai', n:'大排档 + 夜市', price:180, down:'两顿都挪到街边和大排档',
      note:'庙街大排档 / 妹记',
      d1:{ cap:'晚饭 · 大排档', m:50, opts:[['庙街大排档','人均 ¥70'],['兴记煲仔饭','人均 ¥85']],
           why:'煲仔饭现做要等 25 分钟，等的时候先逛完夜市那一段。', hint:'兴记 18:00 才开' },
      d2:{ cap:'午饭 · 街市熟食', m:40, opts:[['妹记生滚粥','人均 ¥40'],['强记美食','人均 ¥45']],
           why:'街市二楼的熟食中心，本地人比游客多。', hint:'妹记 14:30 收档' } },
    { id:'snack', n:'街边小食', price:120, down:'正餐取消，改小食垫',
      note:'泰昌饼家 / 咖喱鱼蛋',
      d1:{ cap:'晚饭 · 街边', m:25, opts:[['泰昌饼家','人均 ¥23'],['咖喱鱼蛋','¥15']],
           why:'牛油皮蛋挞，站着吃完就走。这一档就是垫一下，不装。', hint:'泰昌 19:30 关门' },
      d2:{ cap:'午饭 · 街边', m:25, opts:[['佳佳甜品','人均 ¥30'],['碗仔翅','¥20']],
           why:'甜品当饭吃，走得动就行。', hint:'' } },
    { id:'cvs', n:'便利店', price:70, down:'两顿都在便利店解决',
      note:'7-11 / OK',
      d1:{ cap:'晚饭 · 便利店', m:20, opts:[['7-11 关东煮','¥25']],
           why:'省下来的钱花在别处了，这一顿只负责让你走得动。', hint:'' },
      d2:{ cap:'午饭 · 便利店', m:15, opts:[['OK 三明治','¥20']],
           why:'边走边吃，不占时间。', hint:'' } }
  ],

  /* ---------- 天气。形状照香港天文台 9 天预报 API（政府开放数据，免费无需 key）
     rain = 降雨概率 %，wind8 = 是否发出 8 号或以上风球 ---------- */
  weather: {
    src: '香港天文台 9 天预报 · 快照 2026-09',
    d1: { sky:'有雨', rain:80, temp:'26–29°', wind8:false,
          note:'早上有骤雨，下午转大' },
    d2: { sky:'多云', rain:30, temp:'27–31°', wind8:false,
          note:'短暂时间有阳光' }
  },

  /* ---------- 往返交通 ---------- */
  transports: [
    { id:'fly',  n:'深圳直飞香港', price:1769, extra:0,  note:'最省时', down:'' },
    { id:'rail', n:'福田→西九龙 高铁', price:430, extra:0, note:'78 分钟直达',
      down:'放弃最省时的走法' },
    { id:'through', n:'深圳湾直通巴士', price:180, extra:80, note:'每程多 40 分钟',
      down:'每程多 40 分钟' },
    { id:'border', n:'罗湖过关 + 港铁', price:95, extra:110, note:'每程多 55 分钟',
      down:'自己过关拖箱子，每程多 55 分钟' }
  ],

  /* ---------- 逛多少：付费景点配额 ---------- */
  sightPlans: [
    { id:'rich', max:2, n:'多逛两个付费的', down:'' },
    { id:'one',  max:1, n:'只留一个付费的', down:'砍掉一个付费展馆' },
    { id:'free', max:0, n:'只逛免费的',     down:'付费展馆全砍，只走免费的' }
  ]
};
