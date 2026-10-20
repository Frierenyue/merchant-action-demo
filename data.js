// Public facts are retained snapshots, not live API responses. No business has joined a trial.
const DEMO = {
  snapshot: '2026-10-20',
  week: '2026.10.19 — 10.25',
  defaults: {name:'阿娘面馆',address:'上海市黄浦区思南路 36 号',industry:'餐饮 · 面馆 / 中餐',radius:'1 公里',stage:'已经营一段时间',goal:'了解本周机会'},
  industries: ['餐饮 · 面馆 / 中餐','饮品 · 咖啡 / 茶饮','零售 · 便利店','生活服务 · 美容美发'],
  stages: ['已经营一段时间','刚开业，正在找客人','增长遇到瓶颈'],
  goals: ['了解本周机会','让新客更容易找到店','试一次小活动'],
  sources: {
    store: {name:'高德地图 · 阿娘面馆',url:'https://www.amap.com/place/B00155LXME',fact:'阿娘面馆（锡荣别墅店），上海市黄浦区思南路 36 号。名称、地址为公开 POI 快照，营业状态需再核实。'},
    restaurant: {name:'高德地图 · 思澜新派本帮菜',url:'https://www.amap.com/place/B0FFGB9IEL',fact:'思南路 51 号，中餐厅样本。未核验交易、评分或直接竞争关系。'},
    coffee: {name:'高德地图 · RADAR COFFEE',url:'https://www.amap.com/place/B0H1RXFOLX',fact:'思南路 27 号，咖啡厅样本。未确认任何联营或互相导流合作。'},
    weather: {name:'中国天气网 · 上海城区预报',url:'https://www.weather.com.cn/weather/101020100.shtml',fact:'2026-10-20 留存的预报快照：10 月 23 日中雨、24 日小雨、25 日小雨转阴。市级预报，执行前须重新核对。'},
    calendar: {name:'2026 年节假日安排 · 政府转载',url:'https://zwfw.gansu.gov.cn/huixian/zczx/tzgg/art/2025/art_715c16a75e4d4c289c295e77772c7274.html',fact:'10 月 19–25 日不在通知列明的法定节假日安排内，24–25 日为普通周末。未取得附近活动的已核实信息。'}
  },
  topics: [
    {id:'location',title:'位置与周边',short:'店在哪里',caption:'门店、邻店与到店路径'},
    {id:'people',title:'客群与人流',short:'谁会来',caption:'已知什么，还缺什么'},
    {id:'signals',title:'本周信号',short:'现在有什么变化',caption:'天气、日历和附近活动'},
    {id:'competition',title:'同业与差异',short:'周边有什么店',caption:'公开样本，不虚构排名'},
    {id:'partners',title:'可合作的邻店',short:'谁能一起做',caption:'先访谈，再谈互相带客'},
    {id:'experiment',title:'这周怎么试',short:'先做一件事',caption:'动作、素材和真实反馈'}
  ],
  managerSamples: [
    {id:'tea',name:'示例 · 街角茶饮店',tag:'虚构门店',signal:'拟新增收银设备',label:'容量待核实',product:'商务宽带 / 网络评估',why:'先问现有网络是否影响收银，再核对设备数量与连接情况。不能只因新增设备就推荐升档。',note:'模拟回访：准备增加一台收银机，现有网络是否足够还不清楚。',task:'核对设备数量、峰值连接与现有网络'},
    {id:'market',name:'示例 · 便民小超市',tag:'虚构门店',signal:'希望减少往返门店',label:'需求待核实',product:'云看店 · 方案待确认',why:'先了解远程管理任务和已有设备，再核实现场条件、人员告知及产品适配。',note:'模拟回访：店主希望远程了解开店情况，没有确认采购意向。',task:'了解管理任务、已有设备与服务预算'}
  ]
};

function knownLocation(config) {
  return ['上海市黄浦区思南路36号','上海黄浦区思南路36号','上海思南路36号','思南路36号'].includes(config.address.replace(/\s/g,''));
}
function actionsFor(config) {
  const known=knownLocation(config), food=/餐饮|饮品/.test(config.industry);
  const actions=[
    {id:'rain',label:known?'雨天应对':'到店准备',icon:'rain',when:'15 分钟准备',title:known?'周末可能有雨，':'先把到店信息理顺，',conclusion:food?'让取餐少一点折腾。':'让顾客少跑一趟。',
      brief:known?'按留存天气快照演示；执行前再核对预报。':'本地址资料尚未接入，先完成一项门店自查。',
      task:food?'确认打包能力和取餐点，再做一张到店提醒。':'核对营业时间与预约安排，再更新到店提示。',
      reason:known?'上海城区预报快照包含降雨，可以小范围测试更清楚的取餐或到店提示。天气不等于营业额变化。':'尚无该地址的天气、客流或同业数据。本项是门店信息自查模板，不是对本地机会的判断。',
      evidence:known?['weather']:[],steps:food?['确认营业时间、打包能力与取餐位置。','检查包装和提示，先小范围使用一张提醒图。','记录询问、实际取餐与投诉情况。']:['核对营业与预约信息。','更新自有渠道的到店提示。','记录问路、改约和顾客反馈。'],
      metric:food?'打包询问 / 实际取餐 / 包装反馈':'到店询问 / 改约 / 顾客反馈',campaign:food?'好好吃饭，也能带走':'来之前，先看这张提醒',subtitle:'营业时间与服务方式，请以门店确认的信息为准。'},
    {id:'street',label:'门店介绍',icon:'store',when:'20 分钟整理',title:'路过这条街，',conclusion:'让人知道为什么进店。',brief:'一张图说明位置、服务和到店方式。',
      task:'由店主确认主打商品、入口和营业时间，再制作介绍图。',
      reason:known?'思南路有餐饮和咖啡厅公开样本，可据此设计邻店访谈与门店介绍。没有证据证明这些邻店会带来客流。':'本地址周边数据待补齐。先核实自己的门店信息，不推断附近居民与同行情况。',
      evidence:known?['store','restaurant','coffee']:[],steps:['确认名称、入口和主打商品或服务。','把介绍图发到门店自有渠道，小范围试用。','询问愿意反馈的顾客从哪里知道门店。'],metric:'问路次数 / 顾客自愿反馈的到店来源',campaign:'就在街角，等你来逛',subtitle:'把位置和主打服务说清楚，让第一次到店更容易。'},
    {id:'weekend',label:'周末小试',icon:'calendar',when:'小范围试一次',title:'这周先试一个想法，',conclusion:'用真实反馈决定下周。',brief:'先确认成本与供应，再决定要不要做活动。',
      task:food?'选一组搭配，小量准备并记录售出与剩余。':'选一项体验或组合服务，控制人数与成本。',
      reason:known?'本演示周是普通周末，没有核实到附近活动。可以做低投入测试，不把假设写成确定的节庆客流。':'没有该地址的活动或节庆影响数据。只提供小范围活动设计模板，由店主决定是否适用。',
      evidence:known?['calendar','weather']:[],steps:['核算成本、供应与价格，由店主确认。','限定时间和数量，记录实际参与情况。','复盘收入、成本与额外工作；负担过高就停止。'],metric:'参与数量 / 实际毛利 / 剩余与额外工作',campaign:'这个周末，来点新鲜的',subtitle:'活动内容、数量与价格，发布前由门店确认。'}
  ];
  if(config.goal==='让新客更容易找到店') return [actions[1],actions[0],actions[2]];
  if(config.goal==='试一次小活动') return [actions[2],actions[0],actions[1]];
  return actions;
}
