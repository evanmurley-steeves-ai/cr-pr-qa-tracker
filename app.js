
var SLA = 48;
var AGENTS = {
  "hend.hesham":   {name:"Hend Hesham",   team:"PR", ini:"HH", av:"at"},
  "fatma.eissa":   {name:"Fatma Eissa",   team:"PR", ini:"FE", av:"ap"},
  "khaled.mostafa":{name:"Khaled Mostafa", team:"CR", ini:"KM", av:"ab"},
  "hossam.mohamed":{name:"Hossam Mohamed", team:"CR", ini:"HM", av:"ac"}
};

var MONTHLY, MONTHS, RECENT, BATCHES, MLABELS;
var qaR={}, sampState={}, batchIdx={}, activeAg="hend.hesham", rvCtx=null, tChart=null;

function buildLabels(months) {
  var n=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return months.map(function(m){ var p=m.split("-"); return n[parseInt(p[1])-1]+" "+p[0]; });
}

function initApp() {
  var D = window.TRACKER_DATA;
  MONTHLY=D.monthly; MONTHS=D.months; RECENT=D.recent; BATCHES=D.batches;
  MLABELS=buildLabels(MONTHS);
  try {
    var s=localStorage.getItem("fh_qar"); if(s) qaR=JSON.parse(s);
    var s2=localStorage.getItem("fh_samp"); if(s2) sampState=JSON.parse(s2);
    var s3=localStorage.getItem("fh_bidx"); if(s3) batchIdx=JSON.parse(s3);
    var em=localStorage.getItem("fh_extra_monthly");
    if(em){ var obj=JSON.parse(em); for(var k in obj) MONTHLY[k]=obj[k]; }
    var en=localStorage.getItem("fh_extra_months");
    if(en){ var arr=JSON.parse(en); arr.forEach(function(m){ if(MONTHS.indexOf(m)===-1) MONTHS.push(m); }); MONTHS.sort(); MLABELS=buildLabels(MONTHS); }
    var er=localStorage.getItem("fh_extra_recent");
    if(er){ var extra=JSON.parse(er); var seen={}; RECENT.forEach(function(t){seen[t.caseId]=true;}); extra.forEach(function(t){if(!seen[t.caseId]){RECENT.push(t);seen[t.caseId]=true;}}); RECENT.sort(function(a,b){return b.date>a.date?1:-1;}); }
  } catch(e){}
  renderLB(); renderSC(); renderAU();
}

function saveQA(){try{localStorage.setItem("fh_qar",JSON.stringify(qaR));}catch(e){}}
function saveSamp(){try{localStorage.setItem("fh_samp",JSON.stringify(sampState));localStorage.setItem("fh_bidx",JSON.stringify(batchIdx));}catch(e){}}

function atot(k){
  var cases=0,rs=0,rc=0,sla=0,res=0,pr=0,cr=0;
  MONTHS.forEach(function(m){ var d=MONTHLY[k+"|"+m]; if(!d)return; cases+=d.cases;rs+=d.rt_sum;rc+=d.rt_count;sla+=d.sla;res+=d.resolved;pr+=d.pr;cr+=d.cr; });
  return{cases:cases,avgRt:rc?Math.round(rs/rc):0,slaRate:cases?Math.round(sla/cases*100):0,resRate:cases?Math.round(res/cases*100):0,pr:pr,cr:cr};
}
function scol(s){return s>=85?"#1a7a4a":s>=70?"#8a5c00":"#9b2c2c";}
function bcls(s){return s>=85?"bg":s>=70?"ba":"br";}
function rtcol(h){return h<=SLA?"#1a7a4a":h<=SLA*1.5?"#8a5c00":"#9b2c2c";}
function sbcls(r){return r>=70?"bg":r>=50?"ba":"br";}
function allS(k){
  var a=[];
  for(var id in qaR){ if(qaR[id].agentKey===k) a.push(qaR[id]); }
  (sampState[k]||[]).forEach(function(t){ if(t.finalScore!=null) a.push({score:t.finalScore}); });
  return a;
}
function avEl(k,sz){
  sz=sz||27; var ag=AGENTS[k];
  return '<span class="av '+ag.av+'" style="width:'+sz+'px;height:'+sz+'px;font-size:'+Math.round(sz*.38)+'px">'+ag.ini+'</span>';
}
function bdg(cls,txt){ return '<span class="badge '+cls+'">'+txt+'</span>'; }
function toast(msg){
  var t=document.getElementById("toast"); t.textContent=msg; t.classList.add("show");
  setTimeout(function(){ t.classList.remove("show"); },2400);
}

function renderLB(){
  var rows=Object.keys(AGENTS).map(function(k){return{k:k,ag:AGENTS[k],t:atot(k)};});
  rows.sort(function(a,b){return b.t.slaRate-a.t.slaRate;});
  var tC=0,tRt=0,tSla=0,tRr=0;
  rows.forEach(function(r){tC+=r.t.cases;tRt+=r.t.avgRt;tSla+=r.t.slaRate;tRr+=r.t.resRate;});
  var n=rows.length;
  document.getElementById("mc-cases").textContent=tC.toLocaleString();
  var aRt=Math.round(tRt/n); var eRt=document.getElementById("mc-rt"); eRt.textContent=aRt+"h"; eRt.className="val "+(aRt<=SLA?"good":"warn");
  var aSla=Math.round(tSla/n); var eSla=document.getElementById("mc-sla"); eSla.textContent=aSla+"%"; eSla.className="val "+(aSla>=70?"good":"warn");
  document.getElementById("mc-rr").textContent=Math.round(tRr/n)+"%";
  var h="";
  rows.forEach(function(row,i){
    var k=row.k,ag=row.ag,t=row.t;
    var s=allS(k); var avg=s.length?Math.round(s.reduce(function(a,r){return a+r.score;},0)/s.length):null;
    var qc=avg!=null
      ?'<div class="bar-wrap"><div class="bar-bg"><div class="bar-fill" style="width:'+avg+'%;background:'+scol(avg)+'"></div></div><span style="font-size:11px;font-weight:600;min-width:32px;color:'+scol(avg)+'">'+avg+'%</span></div>'
      :'<span style="font-size:11px;color:#9e9d99">No scores yet</span>';
    h+='<tr><td><span style="font-weight:600;font-size:13px;color:'+(i===0?"#c8961a":"#9e9d99")+'">'+(i+1)+'</span></td>'
      +'<td><div class="acell">'+avEl(k)+'<div><div style="font-weight:500">'+ag.name+'</div><div style="font-size:10px;color:#9e9d99">'+ag.team+' agent</div></div></div></td>'
      +'<td>'+bdg("bp",t.pr.toLocaleString())+'</td>'
      +'<td>'+bdg("bb",t.cr.toLocaleString())+'</td>'
      +'<td style="font-family:\'DM Mono\',monospace">'+t.cases.toLocaleString()+'</td>'
      +'<td style="font-weight:500;color:'+rtcol(t.avgRt)+';font-family:\'DM Mono\',monospace">'+t.avgRt+'h</td>'
      +'<td>'+bdg(sbcls(t.slaRate),t.slaRate+"%")+'</td>'
      +'<td>'+bdg("bg",t.resRate+"%")+'</td>'
      +'<td style="min-width:130px">'+qc+'</td></tr>';
  });
  document.getElementById("lb-body").innerHTML=h;
}

function renderSC(){
  var fl=document.getElementById("sc-fil").value; var h="";
  Object.keys(AGENTS).filter(function(k){return fl==="all"||AGENTS[k].team===fl;}).forEach(function(k){
    var ag=AGENTS[k],t=atot(k);
    var s=allS(k),avg=s.length?Math.round(s.reduce(function(a,r){return a+r.score;},0)/s.length):null;
    var rec=RECENT.filter(function(r){return r.agentKey===k;}).slice(0,4);
    var pp=t.cases?Math.round(t.pr/t.cases*100):0;
    var recHtml="";
    rec.forEach(function(r){
      recHtml+='<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:.5px solid rgba(0,0,0,0.08);font-size:12px">'
        +'<span style="font-family:\'DM Mono\',monospace;color:#6b6a66">#'+r.caseId+'</span>'
        +bdg(r.ticketTeam==="PR"?"bp":"bb",r.ticketTeam)
        +'<span style="color:#9e9d99">'+r.type+'</span>'
        +'<div style="display:flex;gap:5px;align-items:center"><span style="font-weight:500;color:'+rtcol(r.rt)+';font-family:\'DM Mono\',monospace">'+r.rt+'h</span>'+bdg(r.rt<=SLA?"bg":"br",r.rt<=SLA?"OK":"Late")+'</div>'
        +'</div>';
    });
    h+='<div class="scc">'
      +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">'
      +'<div style="display:flex;align-items:center;gap:10px">'+avEl(k,36)+'<div><div style="font-size:14px;font-weight:500">'+ag.name+'</div><div style="font-size:10px;color:#9e9d99">'+ag.team+' - '+t.cases.toLocaleString()+' cases</div></div></div>'
      +(avg!=null?bdg(bcls(avg),"QA "+avg+"%"):'<span style="font-size:10px;color:#9e9d99">No QA yet</span>')+'</div>'
      +'<div class="sg">'
      +'<div class="ss"><div class="ssv" style="color:'+rtcol(t.avgRt)+'">'+t.avgRt+'h</div><div class="ssl">Avg resp.</div></div>'
      +'<div class="ss"><div class="ssv" style="color:'+(t.slaRate>=70?"#1a7a4a":t.slaRate>=50?"#8a5c00":"#9b2c2c")+'">'+t.slaRate+'%</div><div class="ssl">SLA</div></div>'
      +'<div class="ss"><div class="ssv" style="color:#1a7a4a">'+t.resRate+'%</div><div class="ssl">Resolved</div></div>'
      +'</div>'
      +'<div style="margin-bottom:12px">'
      +'<div style="display:flex;justify-content:space-between;font-size:10px;color:#9e9d99;margin-bottom:3px"><span style="color:#5b3db5">PR '+t.pr.toLocaleString()+' ('+pp+'%)</span><span style="color:#1a4fa0">CR '+t.cr.toLocaleString()+' ('+(100-pp)+'%)</span></div>'
      +'<div class="split-bar"><div style="width:'+pp+'%;background:#5b3db5"></div><div style="width:'+(100-pp)+'%;background:#1a4fa0"></div></div></div>'
      +'<div style="font-size:10px;font-weight:600;text-transform:uppercase;color:#9e9d99;margin-bottom:6px;letter-spacing:.04em">Recent tickets</div>'
      +recHtml+'</div>';
  });
  document.getElementById("sc-cont").innerHTML=h;
}

function renderAU(){
  var q=(document.getElementById("au-q").value||"").toLowerCase();
  var ag=document.getElementById("au-ag").value;
  var tt=document.getElementById("au-tt").value;
  var rows=RECENT.filter(function(r){
    var mQ=!q||r.caseId.toString().includes(q)||(AGENTS[r.agentKey]?AGENTS[r.agentKey].name:"").toLowerCase().includes(q);
    return mQ&&(ag==="all"||r.agentKey===ag)&&(tt==="all"||r.ticketTeam===tt);
  }).slice(0,80).map(function(r){return Object.assign({},r,{score:(qaR[r.caseId]||{}).score});});
  var h=rows.map(function(r){
    var a=AGENTS[r.agentKey]; var ok=r.rt<=SLA;
    return '<tr><td style="font-family:\'DM Mono\',monospace;font-size:10px;color:#9e9d99">'+r.date+'</td>'
      +'<td style="font-family:\'DM Mono\',monospace;font-size:12px">#'+r.caseId+'</td>'
      +'<td><div class="acell">'+avEl(r.agentKey,22)+a.name+'</div></td>'
      +'<td>'+bdg(r.ticketTeam==="PR"?"bp":"bb",r.ticketTeam)+'</td>'
      +'<td style="font-size:11px;color:#6b6a66">'+r.type+'</td>'
      +'<td style="font-weight:500;color:'+rtcol(r.rt)+';font-family:\'DM Mono\',monospace">'+r.rt+'h</td>'
      +'<td>'+bdg(ok?"bg":"br",ok?"Yes":"No")+'</td>'
      +'<td>'+bdg("bg",r.resolution)+'</td>'
      +'<td>'+(r.score!=null?bdg(bcls(r.score),r.score+"%")
        :'<button onclick="quickScore(\''+r.caseId+'\',\''+r.agentKey+'\')" style="font-size:10px;padding:2px 8px;border-radius:999px;background:#eeede8;border:none;cursor:pointer;color:#6b6a66;font-family:\'DM Sans\',sans-serif">Score</button>')+'</td></tr>';
  }).join("");
  document.getElementById("au-body").innerHTML=h||'<tr><td colspan="9" style="text-align:center;padding:2rem;color:#9e9d99">No results</td></tr>';
}

function initSamp(k){
  var bi=batchIdx[k]||0;
  sampState[k]=BATCHES[k][bi%BATCHES[k].length].map(function(t){return Object.assign({},t,{finalScore:null});});
  batchIdx[k]=(bi+1)%BATCHES[k].length; saveSamp();
}
function ensureSamp(){ Object.keys(AGENTS).forEach(function(k){ if(!sampState[k]||!sampState[k].length) initSamp(k); }); }

function renderQSTabs(){
  var h="";
  Object.keys(AGENTS).forEach(function(k){
    var s=sampState[k]||[]; var d=s.filter(function(t){return t.finalScore!=null;}).length;
    h+='<button class="agtab '+(k===activeAg?"active":"")+'" onclick="setAg(\''+k+'\')">'+avEl(k,19)+" "+AGENTS[k].name.split(" ")[0]+' <span style="font-size:9px;opacity:.7">'+d+"/"+s.length+'</span>'+(d===s.length&&s.length>0?" V":"")+"</button>";
  });
  document.getElementById("ag-tabs").innerHTML=h;
}

function renderQSProg(){
  var h="";
  Object.keys(AGENTS).forEach(function(k){
    var s=sampState[k]||[]; var d=s.filter(function(t){return t.finalScore!=null;}).length;
    var p=s.length?Math.round(d/s.length*100):0;
    var sc2=s.filter(function(t){return t.finalScore!=null;});
    var avg=sc2.length?Math.round(sc2.reduce(function(a,t){return a+t.finalScore;},0)/sc2.length):null;
    h+='<div style="display:flex;align-items:center;gap:10px;min-width:170px;flex:1">'+avEl(k,24)+'<div style="flex:1">'
      +'<div style="display:flex;justify-content:space-between;font-size:11.5px;margin-bottom:3px">'
      +'<span style="font-weight:500">'+AGENTS[k].name.split(" ")[0]+'</span>'
      +'<span style="color:#9e9d99">'+d+"/"+s.length+(avg!=null?' - <strong style="color:'+scol(avg)+'">'+avg+"%</strong>":"")+'</span></div>'
      +'<div class="prog-bar-bg"><div class="prog-bar-fill" style="width:'+p+'%;background:'+(p===100?"#1a7a4a":"#8a5c00")+'"></div></div>'
      +'</div></div>';
  });
  document.getElementById("prog-card").innerHTML=h;
}

function buildPrompt(t,ag){
  var sla=t.rt<=48?"SLA MET":"SLA BREACHED";
  var tf=t.ticketTeam==="PR"?"Partner Relations":"Customer Relations";
  return "You are a QA analyst for Flighthub customer and partner relations.\n\n"
    +"TICKET CONTEXT:\n- Agent: "+ag.name+" ("+ag.team+" team)\n- Ticket #: "+t.caseId
    +"\n- Case type: "+t.type+"\n- Ticket team: "+t.ticketTeam+" ("+tf+")"
    +"\n- Response time: "+t.rt+" hours (SLA = 48h - "+sla+")"
    +"\n- Resolution: "+t.resolution+"\n\n"
    +"Score the email thread across 4 dimensions (0-100 each) with 1-2 sentence comment each, plus an Overall score and 2-3 sentence summary.\n\n"
    +"1. Tone & Professionalism\n2. Accuracy & Completeness (for a "+t.type+" case)\n"
    +"3. SLA Compliance (response time was "+t.rt+"h)\n4. Resolution Quality\n\n"
    +"---PASTE EMAIL THREAD BELOW THIS LINE---";
}

function renderQSTable(){
  var samp=sampState[activeAg]||[]; var h="";
  samp.forEach(function(t,i){
    var ok=t.rt<=SLA; var hf=t.finalScore!=null;
    var isOpen=rvCtx&&rvCtx.agentKey===activeAg&&rvCtx.idx===i;
    var act=hf
      ?'<div style="display:flex;gap:5px;align-items:center">'+bdg("bg","Done")+'<button onclick="openReview(\''+activeAg+'\','+i+')" style="font-size:10px;padding:2px 8px;border-radius:999px;background:#eeede8;border:none;cursor:pointer;color:#6b6a66;font-family:\'DM Sans\',sans-serif">Edit</button></div>'
      :'<button onclick="openReview(\''+activeAg+'\','+i+')" style="font-size:11px;padding:4px 12px;border-radius:6px;background:'+(isOpen?"#1a1917":"#e8eefb")+';color:'+(isOpen?"#fff":"#1a4fa0")+';border:none;cursor:pointer;font-family:\'DM Sans\',sans-serif;font-weight:500">'+(isOpen?"Reviewing...":"Review with Claude")+"</button>";
    h+='<tr class="'+(hf?"srow-done":"srow-pend")+'">'
      +'<td style="font-family:\'DM Mono\',monospace;font-size:10px;color:#9e9d99">'+t.date+'</td>'
      +'<td style="font-family:\'DM Mono\',monospace;font-size:12px">#'+t.caseId+'</td>'
      +'<td>'+bdg(t.ticketTeam==="PR"?"bp":"bb",t.ticketTeam)+'</td>'
      +'<td style="font-size:11.5px;color:#6b6a66">'+t.type+'</td>'
      +'<td style="font-weight:500;color:'+rtcol(t.rt)+';font-family:\'DM Mono\',monospace">'+t.rt+'h</td>'
      +'<td>'+bdg(ok?"bg":"br",ok?"Yes":"No")+'</td>'
      +'<td>'+(hf?bdg(bcls(t.finalScore),t.finalScore+"%"):'<span style="color:#9e9d99;font-size:11px">Pending</span>')+'</td>'
      +'<td>'+act+'</td></tr>';
  });
  var done=samp.filter(function(t){return t.finalScore!=null;});
  if(done.length===samp.length&&samp.length>0){
    var avg=Math.round(done.reduce(function(a,t){return a+t.finalScore;},0)/done.length);
    h+='<tr class="ssum"><td colspan="8"><strong>Batch complete</strong> - Avg QA: <strong style="color:'+scol(avg)+'">'+avg+'%</strong> - SLA met: '+samp.filter(function(t){return t.rt<=SLA;}).length+"/"+samp.length+'</td></tr>';
  }
  document.getElementById("qs-body").innerHTML=h;
}

function openReview(agKey,idx){
  rvCtx={agentKey:agKey,idx:idx};
  var t=sampState[agKey][idx]; var ag=AGENTS[agKey];
  document.getElementById("rv-meta").innerHTML='<strong style="font-size:13px">#'+t.caseId+'</strong>'+bdg(t.ticketTeam==="PR"?"bp":"bb",t.ticketTeam)+'<span style="font-size:12px;color:#6b6a66">'+t.type+'</span><span style="font-size:12px;font-weight:500;color:'+rtcol(t.rt)+'">'+t.rt+'h</span>'+bdg(t.rt<=SLA?"bg":"br","SLA "+(t.rt<=SLA?"OK":"Late"))+'<span style="font-size:12px;color:#9e9d99">'+ag.name+'</span>';
  document.getElementById("rv-prompt").textContent=buildPrompt(t,ag);
  document.getElementById("final-inp").value=t.finalScore!=null?t.finalScore:"";
  var panel=document.getElementById("rv-panel"); panel.classList.add("open");
  setTimeout(function(){panel.scrollIntoView({behavior:"smooth",block:"nearest"});},50);
  renderQSTable();
}
function closeReview(){ rvCtx=null; document.getElementById("rv-panel").classList.remove("open"); renderQSTable(); }
function copyPrompt(){
  var txt=document.getElementById("rv-prompt").textContent;
  navigator.clipboard.writeText(txt).then(function(){toast("Prompt copied! Open Claude extension and paste it.");}).catch(function(){
    var ta=document.createElement("textarea"); ta.value=txt; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta); toast("Prompt copied!");
  });
}
function saveScore(){
  var v=parseInt(document.getElementById("final-inp").value);
  if(isNaN(v)||v<0||v>100){alert("Enter 0-100");return;}
  sampState[rvCtx.agentKey][rvCtx.idx].finalScore=v; saveSamp(); closeReview();
  renderQSTabs(); renderQSProg(); renderQSTable(); renderLB(); renderSC(); toast("Score saved!");
}
function setAg(k){ activeAg=k; closeReview(); renderQSTabs(); renderQSTable(); }
function resample(){
  if(!confirm("New sample for "+AGENTS[activeAg].name+"?")) return;
  initSamp(activeAg); renderQSTabs(); renderQSProg(); renderQSTable(); closeReview();
}

function renderTR(){
  var ag=document.getElementById("tr-ag").value;
  var mt=document.getElementById("tr-mt").value;
  var colors=["#1a7a4a","#5b3db5","#1a4fa0","#8f3318"];
  var keys=ag==="team"?Object.keys(AGENTS):[ag];
  var datasets=keys.map(function(k,i){
    var data=MONTHS.map(function(m){
      var d=MONTHLY[k+"|"+m]; if(!d||d.cases<2) return null;
      if(mt==="rt") return d.rt_count?Math.round(d.rt_sum/d.rt_count):null;
      if(mt==="sla") return d.cases?Math.round(d.sla/d.cases*100):null;
      return d.cases;
    });
    return{label:AGENTS[k].name.split(" ")[0],data:data,borderColor:colors[i],backgroundColor:colors[i]+"18",tension:.3,pointRadius:5,fill:keys.length===1,borderWidth:2};
  });
  if(tChart) tChart.destroy();
  tChart=new Chart(document.getElementById("tr-chart"),{
    type:"line",data:{labels:MLABELS,datasets:datasets},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:ag==="team",labels:{color:"#6b6a66",boxWidth:10,padding:14,font:{size:12,family:"DM Sans"}}}},
      scales:{x:{grid:{color:"rgba(128,128,128,.08)"},ticks:{color:"#9e9d99",font:{size:11}}},
              y:{grid:{color:"rgba(128,128,128,.08)"},ticks:{color:"#9e9d99",font:{size:11}},beginAtZero:false}}}
  });
}

function sv(id,btn){
  document.querySelectorAll(".view").forEach(function(v){v.classList.remove("active");});
  document.querySelectorAll(".ni").forEach(function(b){b.classList.remove("active");});
  document.getElementById("v-"+id).classList.add("active"); btn.classList.add("active");
  if(id==="tr") renderTR();
  if(id==="qs"){ ensureSamp(); renderQSTabs(); renderQSProg(); renderQSTable(); }
}
function openModal(){ document.getElementById("modal").classList.add("open"); }
function closeModal(){ document.getElementById("modal").classList.remove("open"); }
function quickScore(cid,ak){ document.getElementById("m-case").value=cid; document.getElementById("m-ag").value=ak; openModal(); }
function submitManual(){
  var cid=document.getElementById("m-case").value.trim();
  var ak=document.getElementById("m-ag").value;
  var s=parseInt(document.getElementById("m-sc").value);
  var n=document.getElementById("m-no").value.trim();
  if(!cid||isNaN(s)||s<0||s>100){alert("Enter ticket # and score 0-100");return;}
  qaR[cid]={agentKey:ak,score:s,notes:n,caseId:cid}; saveQA();
  document.getElementById("m-case").value=""; document.getElementById("m-sc").value=""; document.getElementById("m-no").value="";
  closeModal(); renderLB(); renderSC(); renderAU(); toast("QA score saved!");
}

function parseCSVLine(line){
  var cols=[],cur="",inQ=false;
  for(var i=0;i<line.length;i++){
    var c=line[i];
    if(c==='"'){if(inQ&&line[i+1]==='"'){cur+='"';i++;}else{inQ=!inQ;}}
    else if(c===","&&!inQ){cols.push(cur);cur="";}
    else{cur+=c;}
  }
  cols.push(cur); return cols;
}
function classifyCase(srt,subj){
  if(srt==="Involuntary Exchange"||srt==="Voluntary Exchange") return "Schedule Change";
  if(srt==="Involuntary Refund"||srt==="Void"||srt==="Refund Investigation") return "Refund";
  if(srt==="Billing Inquiries") return "Billing";
  if(subj.indexOf("refund")>=0) return "Refund";
  if(subj.indexOf("kiwi")>=0) return "KIWI Refund";
  if(subj.indexOf("dot")>=0||subj.indexOf("oacp")>=0) return "DOT";
  if(subj.indexOf("cancel")>=0) return "Schedule Change";
  return "General Info";
}
function handleCSVUpload(event){
  var file=event.target.files[0]; if(!file) return;
  var status=document.getElementById("upload-status");
  status.textContent="Reading..."; status.style.color="#8a5c00";
  var reader=new FileReader();
  reader.onload=function(e){
    try {
      var lines=e.target.result.split("\n");
      if(lines.length<2){status.textContent="File appears empty";status.style.color="#9b2c2c";return;}
      var header=parseCSVLine(lines[0]);
      var ci={}; header.forEach(function(h,i){ci[h.trim()]=i;});
      var req=["Ticket Number","Assignee","Group","Status","Created At","Hours Between Creation and Resolution"];
      for(var i=0;i<req.length;i++){if(ci[req[i]]===undefined){status.textContent="Missing: "+req[i];status.style.color="#9b2c2c";return;}}
      var known=Object.keys(AGENTS),newTickets=[],seen={};
      RECENT.forEach(function(t){seen[t.caseId]=true;});
      for(var r=1;r<lines.length;r++){
        var line=lines[r].trim(); if(!line) continue;
        var cols=parseCSVLine(line);
        var ak=(cols[ci["Assignee"]]||"").trim();
        if(known.indexOf(ak)===-1) continue;
        var dateStr=(cols[ci["Created At"]]||"").trim(); if(!dateStr) continue;
        var rt=Math.max(0,parseInt((cols[ci["Hours Between Creation and Resolution"]]||"0").trim())||0);
        var st=(cols[ci["Status"]]||"").trim().toLowerCase();
        var grp=(cols[ci["Group"]]||"").trim().toUpperCase();
        var srt=(cols[ci["Service Request Type"]]||"").trim();
        var subj=(cols[ci["Subject"]]||"").trim().toLowerCase();
        var cid=(cols[ci["Ticket Number"]]||"").trim();
        if(!seen[cid]){
          var t2={date:dateStr.substring(0,10),caseId:cid,agentKey:ak,type:classifyCase(srt,subj),ticketTeam:grp.indexOf("PARTNER")>=0?"PR":"CR",rt:rt,sla:rt<=SLA?"Yes":"No",resolution:(st==="closed"||st==="solved")?"Resolved":"Pending"};
          newTickets.push(t2); seen[cid]=true;
        }
      }
      newTickets.forEach(function(t){
        RECENT.push(t);
        var month=t.date.substring(0,7); var key=t.agentKey+"|"+month;
        if(!MONTHLY[key]) MONTHLY[key]={cases:0,rt_sum:0,rt_count:0,sla:0,resolved:0,pr:0,cr:0};
        var d=MONTHLY[key]; d.cases++;d.rt_sum+=t.rt;d.rt_count++;
        if(t.rt<=SLA)d.sla++; if(t.resolution==="Resolved")d.resolved++;
        if(t.ticketTeam==="PR")d.pr++;else d.cr++;
        if(MONTHS.indexOf(month)===-1){MONTHS.push(month);MONTHS.sort();MLABELS=buildLabels(MONTHS);}
      });
      RECENT.sort(function(a,b){return b.date>a.date?1:-1;});
      try{localStorage.setItem("fh_extra_monthly",JSON.stringify(MONTHLY));localStorage.setItem("fh_extra_months",JSON.stringify(MONTHS));localStorage.setItem("fh_extra_recent",JSON.stringify(newTickets));}catch(ex){}
      var total=0; Object.values(MONTHLY).forEach(function(d){total+=d.cases;});
      var sm=MONTHS.slice().sort(); var fmt=function(m){var p=m.split("-");var n=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];return n[parseInt(p[1])-1]+" "+p[0];};
      var range=sm.length>=2?fmt(sm[0])+"-"+fmt(sm[sm.length-1]):(sm[0]||"");
      status.textContent="+"+newTickets.length+" new tickets ("+total.toLocaleString()+" total)"; status.style.color="#1a7a4a";
      document.getElementById("data-summary").textContent=range+" - "+total.toLocaleString()+" tickets";
      renderLB(); renderSC(); renderAU(); toast("+"+newTickets.length+" tickets added!");
    } catch(err){status.textContent="Error: "+err.message; status.style.color="#9b2c2c";}
  };
  reader.readAsText(file); event.target.value="";
}

document.addEventListener("DOMContentLoaded", function(){
  document.getElementById("modal").addEventListener("click",function(e){if(e.target===this)closeModal();});
  initApp();
});
