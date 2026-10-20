const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const STORAGE='merchant-radar-demo-v1';
let saved={config:{...DEMO.defaults},reports:{},followups:{}};
try { const d=JSON.parse(localStorage.getItem(STORAGE)); if(d?.config && d.reports && d.followups) saved=d; } catch {}
let view='home',selectedAction='',selectedMerchant='primary',filter='all',query='',toastTimer;
const config=()=>saved.config;
const reportKey=()=>JSON.stringify([config().address,config().industry,config().name]);
const reportState=()=>saved.reports[reportKey()] ||= {plans:{},records:{},materials:{},reminder:null};
const actions=()=>actionsFor(config());
const action=()=>actions().find(a=>a.id===selectedAction) || actions()[0];
const followKey=()=>selectedMerchant==='primary'?reportKey():selectedMerchant;
function persist(){try{localStorage.setItem(STORAGE,JSON.stringify(saved));}catch{notify('当前浏览器无法保存，记录仅在本次页面内保留');}}
function notify(text){$('#toast').textContent=text;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3200);}
function go(next){location.hash=next;if(view===next)render();window.scrollTo({top:0,behavior:'instant'});}
function modal(label,html){$('#dialog-label').textContent=label;$('#dialog-body').innerHTML=html;if(!$('#dialog').open)$('#dialog').showModal();$('#dialog').scrollTop=0;$('#close-dialog').focus();}
function optionList(list,value){return list.map(x=>`<option ${x===value?'selected':''}>${esc(x)}</option>`).join('');}
function sourceLinks(ids){return ids.map(id=>{const s=DEMO.sources[id];return `<div class="source-item"><a href="${s.url}" target="_blank" rel="noopener">${s.name} ↗</a><p>${s.fact}</p></div>`;}).join('');}
function art(type='store'){
  const common='fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  const shapes=type==='rain'?'<path d="M20 48c0-30 52-30 52 0H20zm26-28v45c0 13 17 13 17 0M12 64l-3 8m66-9-3 8M27 72l-3 8"/><path d="M26 48c0-18 39-18 39 0" opacity=".35"/>':type==='calendar'?'<rect x="20" y="20" width="55" height="55" rx="3"/><path d="M20 36h55M34 14v13m27-13v13M34 49h7m13 0h7M34 62h7m13 0h7"/>':'<path d="M15 38h70l-8-20H23zm5 0v40h60V38M30 78V51h17v27m10-27h14v15H57zM32 18l-3 20m19-20v20m17-20 4 20M10 79h80"/>';
  return `<svg viewBox="0 0 100 96" aria-hidden="true"><circle cx="48" cy="48" r="39" fill="#eaf0e4"/><g ${common}>${shapes}</g></svg>`;
}
function contextLine(){return `<div class="context-line"><span>${esc(config().name||'我的门店')} <b>·</b> ${esc(config().industry)}</span><span>${knownLocation(config())?'公开快照 '+DEMO.snapshot:'本地址数据待接入'} · 演示周 ${DEMO.week}</span></div>`;}
function home(){
  const c=config();
  return `<div class="home-hero"><p class="eyebrow">一条街的变化，一家店的行动</p><h1>附近有什么机会，<br><em>本周先做哪一件？</em></h1><p class="lede">从地址和行业开始，先看建议，再看依据。</p></div>
  <div class="setup-grid"><section class="intro-panel"><div class="store-scene">${art()}<span>看清附近<br><strong>做好眼前</strong></span></div><h2>一份报告，回答六个问题</h2><div class="topic-previews">${DEMO.topics.map(t=>`<button data-topic="${t.id}"><strong>${t.short}</strong><span>${t.caption}</span></button>`).join('')}</div><div class="intro-note"><span class="simulation">独立演示 · 未接实时查询</span><p>带入思南路样例即可完整演示。更换地址后，缺失资料会显示“待补齐”。</p></div></section>
  <section class="setup-panel"><div class="setup-heading"><h2>开始看你的商圈</h2><button class="text-btn" id="sample-fill">填入思南路样例 ↗</button></div><form id="setup-form">
  <label for="address">门店地址</label><input id="address" name="address" required maxlength="120" value="${esc(c.address)}" placeholder="例如：上海市黄浦区思南路 36 号">
  <div class="field-pair"><div><label for="store-name">门店名称</label><input id="store-name" name="name" maxlength="30" value="${esc(c.name)}" placeholder="我的门店"></div><div><label for="industry">经营行业</label><select id="industry" name="industry">${optionList(DEMO.industries,c.industry)}</select></div></div>
  <label>希望看多大范围</label><div class="radius-options" role="group" aria-label="意向分析范围">${['500 米','1 公里','3 公里'].map(r=>`<button type="button" data-radius="${r}" class="${c.radius===r?'active':''}" aria-pressed="${c.radius===r}">${r}</button>`).join('')}</div><input type="hidden" name="radius" id="radius" value="${esc(c.radius)}"><small class="field-note">意向范围；样例未按半径穷尽检索周边。</small>
  <div class="field-pair"><div><label for="stage">经营阶段</label><select id="stage" name="stage">${optionList(DEMO.stages,c.stage)}</select></div><div><label for="goal">最想解决</label><select id="goal" name="goal">${optionList(DEMO.goals,c.goal)}</select></div></div>
  <button class="primary full" type="submit">生成演示报告 <span>→</span></button><p class="form-caption">公开资料与模拟内容分开标注，不需要登录。</p></form></section></div>`;
}
function report(){
  const a=action(),r=reportState(),record=r.records[a.id],known=knownLocation(config());
  const readings=known?[['本周天气','有雨','市级预报留存快照'],['邻店资料','2 个','已选公开样本'],['区域人流','待接入','没有真实人流数据']]:[['本地资料','待补齐','本地址未接查询'],['意向范围',config().radius,'未执行半径检索'],['区域人流','待接入','不沿用样例数据']];
  return `${contextLine()}<div class="report-toolbar"><button id="edit-input" class="text-btn">← 修改地址与行业</button><div class="report-steps"><span>填写信息</span><b>→</b><strong>查看报告</strong><b>→</b><span>记录行动</span></div><button id="share-report" class="text-btn">复制报告链接 ↗</button></div>
  <div class="hero"><div><p class="eyebrow">本周商机报告 · ${esc(config().goal)}</p><h1>${a.title}<br><em>${a.conclusion}</em></h1><p class="lede">${a.brief}</p></div><div class="hero-side"><span class="simulation">${known?'门店未参与试点 · 建议待确认':'资料不足 · 仅展示自查模板'}</span><button id="message-entry" class="text-btn">从提醒消息开始演示 ↗</button><button id="reminder" class="text-btn">下周报告提醒 ↗</button></div></div>
  <div class="action-grid"><aside class="action-list" aria-label="本周三件事"><div class="section-label">本周做什么 <span>先选一件小事</span></div>${actions().map(x=>`<button class="action-card ${x.id===a.id?'selected':''}" data-action="${x.id}" aria-pressed="${x.id===a.id}"><div>${art(x.icon)}</div><span><strong>${x.label}</strong><small>${r.records[x.id]?'已记录反馈':r.plans[x.id]?'已加入计划':x.when}</small></span><b aria-hidden="true">↗</b></button>`).join('')}</aside>
  <article class="action-panel"><div class="panel-heading"><h2>${a.label} · 先做这件事</h2><span class="status">${record?'反馈已记录':r.plans[a.id]?'已加入本周计划':'由店主确认后执行'}</span></div><div class="readings">${readings.map(v=>`<div><span>${v[0]}</span><strong>${v[1]}</strong><small>${v[2]}</small></div>`).join('')}</div>
  <ol class="workflow"><li class="done">看依据</li><li class="${r.plans[a.id]?'done':''}">列计划</li><li class="${record?'done':''}">记反馈</li></ol><div class="action-copy"><p>${a.task}</p><button class="text-btn" id="evidence">为什么这样建议？查看依据 ↗</button></div>
  ${record?`<div class="receipt"><span>店主反馈 · 本机演示记录</span><strong>${esc(record.result)}</strong><p>${esc(record.note)}</p><small>自述反馈，未核验经营效果。</small></div>`:''}
  <div class="panel-actions"><button id="plan" class="secondary">${r.plans[a.id]?'已加入计划 ✓':'加入本周计划'}</button><button id="campaign" class="primary">生成活动素材 →</button><button id="record" class="secondary">${record?'修改反馈':'记录执行反馈'}</button></div></article></div>
  <div class="handoff-band"><div><span>同一家店，两端接着服务</span><strong>做了什么、还缺什么，留给客户经理。</strong></div><button class="primary quiet" data-view="manager">查看客户经理端 →</button></div>
  <section class="evidence-section"><div class="evidence-heading"><div><p class="eyebrow">想看清楚，再往下展开</p><h2>建议背后的六块依据</h2></div><span>${esc(config().address)} · ${esc(config().radius)}意向范围</span></div>
  <div class="evidence-grid">${DEMO.topics.map(t=>`<details><summary><span><strong>${t.title}</strong><small>${t.caption}</small></span><span class="plus" aria-hidden="true">＋</span></summary><div class="detail-body">${topicContent(t.id)}</div></details>`).join('')}</div></section>
  <div class="report-bottom"><div><strong>看完报告，留下一次行动。</strong><p>报告可以分享，执行记录只保存在当前浏览器。</p></div><div><button id="download-report" class="secondary">下载报告摘要 ↓</button><button id="print-report" class="secondary">打印报告</button></div></div>`;
}
function topicContent(id){
  const known=knownLocation(config()),a=action();
  if(id==='location')return known?`<div class="street-map" aria-label="思南路地址示意，非比例地图"><span class="street-name">思南路</span><span>27 号<small>咖啡厅样本</small></span><strong>36 号<small>门店 POI 样本</small></strong><span>51 号<small>餐饮样本</small></span></div><p>街道地址示意，不代表距离、行走路线或完整商圈。</p>${sourceLinks(['store'])}`:'<p>尚未取得这个地址的定位与周边商户资料。报告不会把思南路样本挪到这里。</p>';
  if(id==='people')return `<p>人口、年龄、消费能力：暂无已接入数据。不能从两个邻店样本推算顾客画像。</p><div class="flow-demo"><span class="simulation">接入联通网格数据后显示</span><div class="bars" aria-label="纯模拟指数，不代表真实人数">${[['上午',32],['午间',68],['下午',44],['傍晚',80]].map(([t,v])=>`<div><i style="height:${v}px"></i><span>${t}</span></div>`).join('')}</div><small>仅示意界面，无真实单位；不参与建议或销售判断。</small></div><p>未来接入也需确认授权、粒度和时效，区域人流不能当作本店订单。</p>`;
  if(id==='signals')return known?`${sourceLinks(['weather','calendar'])}<p class="missing-note">附近活动与新闻：暂无已核实信息。本演示不编造活动。</p>`:'<p>天气、节假日影响、附近活动与新闻均待接入。当前没有本地信号可供判断。</p>';
  if(id==='competition')return known?`${sourceLinks(['restaurant','coffee'])}<p>这是已选的两家邻店样本，未完成按行业、半径的检索。同行数量、评分、收入与竞争强度：暂无。</p>`:'<p>尚无本地址的同业样本，不给出竞争评分、排名或“最佳商圈”结论。</p>';
  if(id==='partners')return known?`${sourceLinks(['coffee'])}<p>可作为邻店访谈候选，先确认客群、时段和合作意愿。邻近不等于互补，更不等于已建立合作。</p>`:'<p>先补充周边商户资料，再选择访谈对象。没有可确认的合作商户。</p>';
  return `<p>${a.task}</p><ol>${a.steps.map(s=>`<li>${s}</li>`).join('')}</ol><p><strong>记录：</strong>${a.metric}。</p><p>“${esc(config().stage)}”阶段先核实可执行条件。${config().stage==='刚开业，正在找客人'?'先确认入口、营业与首批顾客反馈。':config().stage==='增长遇到瓶颈'?'先记录现状与额外成本，再判断活动是否有效。':'保留现有经营节奏，小范围测试后再扩大。'}</p>`;
}
function merchants(){
  const entries=Object.entries(reportState().records);
  return [{id:'primary',name:config().name||'我的门店',tag:knownLocation(config())&&config().name===DEMO.defaults.name?'公开 POI · 未参与试点':'用户输入 · 未核实',signal:entries.length?'有店主执行反馈':'等待本周行动反馈',label:entries.length?'待回访':'待了解',product:'云喇叭 / 到店服务支持',why:'先了解活动执行与高峰服务的困难。需要收款提醒时再评估设备，不根据天气或模拟人流推断流失。',note:entries.length?entries.map(([id,r])=>`${actions().find(a=>a.id===id)?.label||id}：${r.result}；${r.note}`).join('；'):'尚未记录店主反馈。回访时了解本周动作、实际困难和是否需要帮助。',task:'了解执行反馈与高峰服务需求'},...DEMO.managerSamples];
}
const merchant=()=>merchants().find(m=>m.id===selectedMerchant)||merchants()[0];
function managerRows(){
  const rows=merchants().filter(m=>(filter==='all'||(filter==='feedback'?m.id==='primary'&&Object.keys(reportState().records).length:!saved.followups[m.id==='primary'?reportKey():m.id]))&&`${m.name}${m.signal}${m.product}`.includes(query));
  return rows.length?rows.map(m=>`<tr class="${m.id===selectedMerchant?'selected':''}"><td><button data-merchant="${m.id}"><strong>${esc(m.name)}</strong><small>${m.tag}</small></button></td><td>${m.label}</td><td>${saved.followups[m.id==='primary'?reportKey():m.id]?'跟进已安排':'待跟进'}</td><td><button class="text-btn" data-merchant="${m.id}" aria-label="查看${esc(m.name)}">查看 →</button></td></tr>`).join(''):'<tr><td colspan="4" class="empty">没有符合条件的商户。可清空搜索或切换“全部”。</td></tr>';
}
function manager(){
  const m=merchant(),f=saved.followups[followKey()];
  return `<div class="context-line"><span>小微商户服务 · 1 个主案例 + 2 个虚构样本</span><span>同一浏览器内的演示联动</span></div><div class="hero service-hero"><div><p class="eyebrow">客户经理与服务伙伴</p><h1>商户做了什么，<br><em>下一次回访就有了话题。</em></h1></div><div class="hero-side"><span class="simulation">经营信号与需求均待核实</span><button class="primary" id="pilot">套餐与试点讨论 →</button></div></div>
  <div class="service-grid"><div class="service-left"><div class="table-heading"><h2>哪些商户，值得跟进？</h2><span>${Object.keys(reportState().records).length} 条本店反馈</span></div><div class="table-toolbar"><div class="filters">${[['all','全部'],['pending','待跟进'],['feedback','有反馈']].map(([id,title])=>`<button data-filter="${id}" class="${filter===id?'active':''}">${title}</button>`).join('')}</div><input id="search" type="search" value="${esc(query)}" placeholder="搜索商户或需求" aria-label="搜索商户或需求"></div><div class="table-wrap"><table><thead><tr><th>商户</th><th>需求信号</th><th>服务进展</th><th>详情</th></tr></thead><tbody id="rows">${managerRows()}</tbody></table></div><div class="service-record"><div><p class="eyebrow">${esc(m.name)} / ${m.id==='primary'?'店主反馈':'虚构回访情景'}</p><h3>${m.signal}</h3><p>${esc(m.note)}</p></div>${m.id==='primary'?'<button class="text-btn" id="same-report">查看同店报告 →</button>':''}</div></div>
  <aside class="service-detail"><span class="eyebrow">${esc(m.name)} / 下一步</span><h2>${m.product}</h2><p>${m.why}</p><div class="service-owner"><span>匹配顺序</span><strong>先核实需求<br>再讨论产品</strong></div>${f?`<div class="followup-saved"><span>已安排 · ${esc(f.date)}</span><strong>${esc(f.owner)}</strong><p>${esc(f.task)}</p></div>`:'<p class="detail-note">产品能力、价格与供货以实际对接为准。</p>'}<button class="primary" id="follow">${f?'修改跟进安排':'安排服务跟进'} →</button><button class="text-btn" id="export-records">下载行动与跟进记录 ↓</button></aside></div>
  <div class="kit-strip"><div><span>可以怎样提供服务</span><strong>商圈周报 + 行动工具 + 按需服务</strong></div><ol><li>公开信息</li><li>经营建议</li><li>执行反馈</li><li>客户回访</li></ol></div><div class="under-note"><span>不以模拟人流判断经营下滑，不自动推荐升档。</span><span>当前没有真实试点或成交记录</span></div>`;
}
function message(){return `<div class="message-stage"><div><p class="eyebrow">从一条提醒开始</p><h1>这周的机会，<br><em>一打开就有重点。</em></h1><p class="lede">先看一件值得做的事，再决定要不要行动。</p><p class="message-note">模拟消息 · 未发送短信或邮件</p></div><div class="phone"><div class="phone-bar">09:42 <span>商圈周报</span></div><div class="sms"><span>${esc(config().name||'我的门店')} · 演示周报</span><h2>${action().title}${action().conclusion}</h2><p>3 件本周行动建议，天气与周边资料可展开查看。</p><button class="primary" id="open-report">打开本周报告 →</button><small>公开快照与模拟情景，不是实时分析</small></div><div class="phone-bottom"></div></div></div>`;}
function render(){
  const [route,search]=location.hash.slice(1).split('?');
  if(search){const p=new URLSearchParams(search);if(p.has('address')){const c={...DEMO.defaults};for(const k of ['name','address'])c[k]=(p.get(k)||c[k]).slice(0,k==='name'?30:120);for(const [k,list] of [['industry',DEMO.industries],['stage',DEMO.stages],['goal',DEMO.goals],['radius',['500 米','1 公里','3 公里']]])if(list.includes(p.get(k)))c[k]=p.get(k);saved.config=c;persist();}}
  view=['report','manager','message'].includes(route)?route:'home';
  $('#main').innerHTML=`<section class="page page-${view}">${view==='home'?home():view==='report'?report():view==='manager'?manager():message()}</section>`;
  document.querySelectorAll('[data-view]').forEach(b=>{const active=(b.dataset.view==='manager')===(view==='manager');b.classList.toggle('active',active);b.setAttribute('aria-current',active?'page':'false');b.onclick=()=>go(b.dataset.view==='merchant'?'report':'manager');});
  bind();
}
function bind(){
  document.querySelectorAll('[data-topic]').forEach(b=>b.onclick=()=>{const t=DEMO.topics.find(t=>t.id===b.dataset.topic);modal(t.title,`<h2>${t.short}</h2>${topicContent(t.id)}`);});
  document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>{selectedAction=b.dataset.action;render();});
  document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;render();});
  const bindRows=()=>document.querySelectorAll('[data-merchant]').forEach(b=>b.onclick=()=>{selectedMerchant=b.dataset.merchant;render();});
  bindRows();
  if($('#search'))$('#search').oninput=e=>{query=e.target.value.trim();$('#rows').innerHTML=managerRows();bindRows();};
  if($('#setup-form')){
    $('#sample-fill').onclick=()=>{saved.config={...DEMO.defaults};selectedAction='';persist();render();};
    document.querySelectorAll('[data-radius]').forEach(b=>b.onclick=()=>{$('#radius').value=b.dataset.radius;document.querySelectorAll('[data-radius]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',x===b?'true':'false');});});
    $('#setup-form').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);if(!f.get('address').trim())return;const c={};for(const k of Object.keys(DEMO.defaults))c[k]=String(f.get(k)||'').trim();saved.config=c;selectedAction='';selectedMerchant='primary';persist();go('report');};
  }
  const handlers={'edit-input':()=>go('home'),'same-report':()=>go('report'),'open-report':()=>go('report'),'message-entry':()=>go('message'),evidence,record,campaign,reminder,follow,pilot,'export-records':exportRecords,'download-report':downloadReport,'share-report':shareReport,'print-report':()=>window.print()};
  for(const [id,fn] of Object.entries(handlers))if($('#'+id))$('#'+id).onclick=fn;
  if($('#plan'))$('#plan').onclick=()=>{reportState().plans[action().id]=true;persist();render();notify('已加入本周计划 · 只保存在当前浏览器');};
}
function evidence(){const a=action();modal(`${a.label} / 依据与下一步`,`<h2>为什么建议这件事？</h2><div class="draft"><span>经营建议 · 本地模板演示</span><p>${a.reason}</p></div><h3>可查看的依据</h3>${a.evidence.length?sourceLinks(a.evidence):'<p>当前地址没有可核实的本地资料，不提供商机结论。</p>'}<h3>具体怎么做</h3><ol>${a.steps.map(s=>`<li>${s}</li>`).join('')}</ol><p class="modal-note">门店未参与试点，能力、价格与效果需要确认。没有使用真实交易、人流或个人数据。</p>`);}
function record(){
  const a=action(),previous=reportState().records[a.id];
  modal(`${a.label} / 执行反馈`,`<h2>试过之后，留一点真实反馈。</h2><p>演示填写，仅保存在本浏览器；客户经理端可查看。</p><form id="record-form"><label for="record-result">这件事进行到哪了？</label><select id="record-result" required><option value="">请选择</option>${optionList(['已执行，继续观察','执行遇到困难，需要帮助','暂未执行','不适合本店，暂不做'],previous?.result)}</select><label for="record-note">做了什么、看到了什么？</label><textarea id="record-note" maxlength="400" required placeholder="例如：已更新打包提示，但尚未统计订单变化。">${esc(previous?.note||'')}</textarea><small class="field-note">可记录：${a.metric}。没有统计就写“暂无”。</small><button class="primary" type="submit">保存执行反馈 →</button><p id="form-error" role="status"></p></form>`);
  $('#record-form').onsubmit=e=>{e.preventDefault();const result=$('#record-result').value,note=$('#record-note').value.trim();if(!result||!note){$('#form-error').textContent='请填写执行状态和反馈。';return;}reportState().records[a.id]={result,note};persist();$('#dialog').close();render();notify('执行反馈已保存，客户经理端可查看');};
}
function posterSVG(fields){
  const lines=(text,n)=>Array.from(text).reduce((rows,ch,i)=>{if(i%n===0)rows.push('');rows[rows.length-1]+=ch;return rows;},[]);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1440" viewBox="0 0 1080 1440"><rect width="1080" height="1440" fill="#f6f8f3"/><path d="M0 0h1080v170H0z" fill="#355e43"/>${lines(config().name||'我的门店',18).map((x,i)=>`<text x="76" y="${84+i*50}" fill="white" font-size="38" font-family="sans-serif">${esc(x)}</text>`).join('')}<text x="76" y="260" fill="#66756b" font-size="30" font-family="sans-serif">本周到店提醒 · 演示草稿</text>${lines(fields.title,11).map((x,i)=>`<text x="76" y="${400+i*105}" fill="#20382b" font-size="82" font-weight="bold" font-family="sans-serif">${esc(x)}</text>`).join('')}<path d="M76 650h928" stroke="#355e43" stroke-width="3"/>${lines(fields.subtitle,22).map((x,i)=>`<text x="76" y="${745+i*60}" fill="#355e43" font-size="38" font-family="sans-serif">${esc(x)}</text>`).join('')}${lines(config().address.length>64?config().address.slice(0,63)+'…':config().address,24).map((x,i)=>`<text x="76" y="${1130+i*48}" fill="#20382b" font-size="34" font-family="sans-serif">${esc(x)}</text>`).join('')}<text x="76" y="1290" fill="#66756b" font-size="27" font-family="sans-serif">营业、服务与活动信息须经门店确认后发布。</text><text x="76" y="1350" fill="#66756b" font-size="27" font-family="sans-serif">素材模板演示 · 不代表该门店真实活动</text></svg>`;
}
function campaign(){
  const a=action(),fields=reportState().materials[a.id]||{title:a.campaign,subtitle:a.subtitle};
  modal(`${a.label} / 活动方案与素材`,`<h2>把一个想法，变成一张能用的图。</h2><p>${a.task}</p><details class="campaign-plan"><summary>查看执行步骤与复盘指标</summary><ol>${a.steps.map(s=>`<li>${s}</li>`).join('')}</ol><p>观察：${a.metric}。</p></details><div class="material-grid"><form id="material-form"><label for="poster-title">海报标题</label><input id="poster-title" required maxlength="22" value="${esc(fields.title)}"><label for="poster-subtitle">补充说明</label><textarea id="poster-subtitle" required maxlength="66">${esc(fields.subtitle)}</textarea><p class="modal-note">模板排版，未调用图片模型。门店确认后才能对外使用。</p><button class="primary" id="download-poster" type="submit">下载海报 SVG ↓</button><button class="secondary" id="copy-copy" type="button">复制推广文案</button><p id="material-error" role="status"></p></form><div class="poster-preview" id="poster-preview" aria-label="海报预览">${posterSVG(fields)}</div></div>`);
  const read=()=>({title:$('#poster-title').value.trim(),subtitle:$('#poster-subtitle').value.trim()});
  const valid=()=>{const f=read();if(!f.title||!f.subtitle){$('#material-error').textContent='请填写标题和补充说明。';return false;}return f;};
  const update=()=>{$('#poster-preview').innerHTML=posterSVG(read());};
  $('#poster-title').oninput=update;$('#poster-subtitle').oninput=update;
  $('#material-form').onsubmit=e=>{e.preventDefault();const f=valid();if(!f)return;reportState().materials[a.id]=f;persist();download('沃商圈_推广海报_演示草稿.svg',posterSVG(f),'image/svg+xml;charset=utf-8');};
  $('#copy-copy').onclick=async()=>{const f=valid();if(!f)return;reportState().materials[a.id]=f;persist();await copyText(`${f.title}\n${f.subtitle}\n${config().name||'我的门店'} · ${config().address}\n演示草稿，门店确认后发布。`);};
}
function reminder(){
  const prev=reportState().reminder||{cycle:'每周一',time:'09:00'};
  modal('下周商机报告 / 提醒设置',`<h2>下次，什么时候再看？</h2><p>本演示只保存频率，不发送邮件或短信。</p><form id="reminder-form"><label for="cycle">查看频率</label><select id="cycle">${optionList(['每周一','每周五','每 3 天','每月 1 日'],prev.cycle)}</select><label for="reminder-time">提醒时间</label><input id="reminder-time" type="time" required value="${esc(prev.time)}"><button class="primary" type="submit">保存演示设置</button></form><p class="modal-note">正式服务需接入数据更新、邮件验证与定时发送。当前没有后台任务。</p>`);
  $('#reminder-form').onsubmit=e=>{e.preventDefault();reportState().reminder={cycle:$('#cycle').value,time:$('#reminder-time').value};persist();$('#dialog').close();notify('频率已保存 · 不会发送提醒');};
}
function follow(){
  const m=merchant(),previous=saved.followups[followKey()];
  modal(`${m.name} / 服务跟进`,`<h2>带着具体问题，安排下一次回访。</h2><p>本机演示待办，不联系商户、不提交业务系统。</p><form id="follow-form"><label for="follow-owner">跟进角色</label><select id="follow-owner">${optionList(['客户经理','网络与设备服务伙伴','商户运营服务伙伴'],previous?.owner)}</select><label for="follow-date">计划日期</label><input id="follow-date" type="date" required value="${esc(previous?.date||'2026-10-22')}"><label for="follow-task">需要了解什么</label><textarea id="follow-task" required maxlength="400">${esc(previous?.task||m.task)}</textarea><button class="primary" type="submit">保存跟进安排 →</button><p id="form-error" role="status"></p></form>`);
  $('#follow-form').onsubmit=e=>{e.preventDefault();const task=$('#follow-task').value.trim();if(!task){$('#form-error').textContent='请填写跟进事项。';return;}saved.followups[followKey()]={owner:$('#follow-owner').value,date:$('#follow-date').value,task};persist();$('#dialog').close();render();notify('跟进安排已保存 · 未发送消息');};
}
function pilot(){modal('套餐与试点 / 待共同确认',`<h2>先让商户用起来，再讨论怎么卖。</h2><div class="kit-grid"><div><h3>商圈周报</h3><p>公开信息、经营建议与来源；区域数据需另行授权。</p></div><div><h3>行动工具</h3><p>活动素材、执行记录和效果复盘。</p></div><div><h3>按需服务</h3><p>客户经理核实需求后，再讨论网络、终端或运营支持。</p></div></div><h3>试点先看四件事</h3><ul><li>老板是否看得懂、愿意打开第二次。</li><li>有没有实际执行，修改和准备花多久。</li><li>客户经理是否获得可核实的服务需求。</li><li>内容、售后与获客成本能否被付费覆盖。</li></ul><p>价格、试点范围、责任和结算待确认；本演示无订单、交易或付费转化数据。</p><button id="download-pilot" class="primary">下载试点讨论清单 ↓</button>`);
  $('#download-pilot').onclick=()=>download('沃商圈_试点讨论清单.txt','沃商圈试点讨论清单\n合作提案演示，非真实订单。\n\n目标客户：已开业的小微商户。\n验证任务：读报告、做一个动作、记录反馈、客户经理跟进。\n先确认：数据来源、门店授权、试点人数、收费与分工。\n观测：阅读理解、再次打开、执行率、修改时间、服务线索真实性与付费反馈。\n成本：数据、模型、素材、运营、渠道与售后分别核算。\n停止或调整：建议不被执行、数据无法获取、售后成本无法覆盖，或商户不愿付费。\n价格、产品授权及交付责任均待确认。');}
function download(name,text,type='text/plain;charset=utf-8'){const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([text],{type}));link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);notify('文件已生成 · 演示用途');}
async function copyText(text){try{await navigator.clipboard.writeText(text);notify('已复制');}catch{modal('复制内容',`<h2>可手动选中复制</h2><textarea class="copy-area" readonly>${esc(text)}</textarea>`);}}
function shareReport(){const params=new URLSearchParams(config());copyText(`${location.origin}${location.pathname}#report?${params}`);}
function downloadReport(){
  const known=knownLocation(config()),r=reportState();
  const blocks=actions().map(a=>`${a.label}\n建议：${a.task}\n理由：${a.reason}\n步骤：${a.steps.join('；')}\n记录：${a.metric}\n计划：${r.plans[a.id]?'已加入':'未加入'}\n反馈：${r.records[a.id]?r.records[a.id].result+'；'+r.records[a.id].note:'暂无'}\n依据：${a.evidence.map(id=>DEMO.sources[id].url).join('\n')||'暂无本地依据'}`);
  download('沃商圈_报告摘要.txt',`${config().name||'我的门店'} · 商圈报告\n地址：${config().address}\n行业：${config().industry}\n意向范围：${config().radius}，未完成半径穷尽检索。\n阶段：${config().stage}\n目标：${config().goal}\n数据：${known?'2026-10-20 公开快照，非实时':'本地址数据待接入，仅门店自查模板'}\n\n${blocks.join('\n\n')}\n\n人口、实际客流、交易和商业效果均未接入。门店未参与试点，活动素材和用户记录属于演示。`);
}
function exportRecords(){const r=reportState();download('沃商圈_行动与跟进记录.txt',`沃商圈｜本机演示记录\n经营反馈未经核实；不代表实际商业效果。\n\n${actions().map(a=>`${a.label}：${r.plans[a.id]?'已加入计划':'未加入计划'}\n${r.records[a.id]?r.records[a.id].result+'；'+r.records[a.id].note:'暂无反馈'}`).join('\n\n')}\n\n${merchants().map(m=>{const f=saved.followups[m.id==='primary'?reportKey():m.id];return `${m.name}\n${f?`${f.date} / ${f.owner}\n${f.task}`:'暂无跟进安排'}`;}).join('\n\n')}`);}
function about(){modal('资料依据 / 演示边界',`<h2>先分清资料，再讨论机会。</h2><p>本版参考 LocalSpark 商机雷达的“输入 → 重点结论 → 分层依据 → 行动”流程，沿用大棚版的大字布局与两端交互。</p><h3>公开资料</h3><p>思南路门店与两家邻店的高德 POI，以及 2026-10-20 留存的天气、日历资料。公开样本并不代表完整商圈。</p>${sourceLinks(['store','restaurant','coffee','weather','calendar'])}<h3>模拟与未接入</h3><p>真实门店未参与试点。经营建议、活动、客户需求与产品匹配均为演示假设。区域人流图只是示意；没有人口、真实客流、交易、实时 API、模型、短信、CRM、计费或邮件发送。</p><p>更换地址后不会继续使用思南路资料。输入配置、行动与跟进保存在当前浏览器，角色切换不是正式权限系统。分享链接包含填写的门店信息，不包含本机执行记录。</p><h3>业务归属</h3><p>名称用于合作提案演示，没有使用联通 logo，也不代表联通或任何门店授权。</p><a class="source-link" href="https://localspark.vercel.app/business-radar" target="_blank" rel="noopener">参考流程：LocalSpark 商机雷达 ↗</a>`);}
$('#about').onclick=about;$('#source-footer').onclick=about;
$('#close-dialog').onclick=()=>$('#dialog').close();
$('#dialog').addEventListener('click',e=>{if(e.target!==$('#dialog'))return;const r=$('#dialog').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('#dialog').close();});
window.addEventListener('hashchange',()=>{render();window.scrollTo({top:0,behavior:'instant'});});
window.addEventListener('storage',e=>{if(e.key===STORAGE&&e.newValue){try{const d=JSON.parse(e.newValue);if(d.config&&d.reports&&d.followups){saved=d;render();}}catch{}}});
render();
