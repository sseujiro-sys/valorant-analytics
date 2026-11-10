const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const maps=["Ascent","Haven","Lotus","Sunset","Bind","Icebox","Abyss"];
const agents=[["Jett","Duelist","#9fc9e8"],["Reyna","Duelist","#a56aa8"],["Omen","Controller","#7d8cb4"],["Sova","Initiator","#8ba9b8"],["Raze","Duelist","#e0a06e"],["Killjoy","Sentinel","#d9c77c"],["Clove","Controller","#c88bb5"],["Cypher","Sentinel","#b4c4c7"]];
const raw=[
["win","Ascent","Jett",22,15,287],["loss","Haven","Omen",17,19,214],["win","Lotus","Reyna",25,18,301],["win","Sunset","Jett",24,16,278],["loss","Bind","Sova",13,18,176],
["win","Icebox","Raze",27,20,315],["win","Ascent","Jett",21,14,269],["loss","Haven","Cypher",16,19,201],["win","Lotus","Reyna",28,17,332],["loss","Sunset","Omen",14,18,188],
["win","Bind","Jett",23,16,276],["win","Ascent","Killjoy",19,13,244],["loss","Abyss","Sova",15,20,195],["win","Haven","Raze",26,18,309],["win","Icebox","Jett",22,15,281],
["loss","Lotus","Clove",17,20,221],["win","Sunset","Reyna",29,19,342],["loss","Bind","Omen",16,19,205],["win","Ascent","Jett",25,17,298],["win","Abyss","Raze",24,18,289]
];
const matches=raw.map((r,i)=>({id:20-i,result:r[0],map:r[1],agent:r[2],kills:r[3],deaths:r[4],acs:r[5],date:`${String(8-Math.floor(i/3)).padStart(2,'0')}.11.2026`}));
const profiles=[{name:"Kaan#TR1",rank:"Diamond II",matches},{name:"Mert#EUW",rank:"Ascendant I",matches:matches.map((m,i)=>({...m,result:i%4===0?"loss":m.result,kills:m.kills+(i%3),deaths:m.deaths+(i%2),acs:m.acs+12,agent:i%3===0?"Omen":m.agent}))},{name:"Efe#TR2",rank:"Platinum III",matches:matches.map((m,i)=>({...m,result:i%3===0?"loss":m.result,kills:m.kills-2,deaths:m.deaths+2,acs:m.acs-24,agent:i%2===0?"Reyna":m.agent}))}];
let current=profiles[0];
const pct=n=>`${Math.round(n*100)}%`, wr=arr=>arr.filter(m=>m.result==="win").length/arr.length;
const avg=(arr,k)=>arr.reduce((s,m)=>s+m[k],0)/arr.length;
const kd=arr=>arr.reduce((s,m)=>s+m.kills,0)/arr.reduce((s,m)=>s+m.deaths,0);
function group(arr,key){return Object.groupBy?Object.groupBy(arr,m=>m[key]):arr.reduce((o,m)=>(o[m[key]]??=[]).push(m),{});}
function spark(el,arr,key){let vals=arr.map(m=>m[key]),min=Math.min(...vals),max=Math.max(...vals),pts=vals.map((v,i)=>`${i*80/(vals.length-1)},${32-(v-min)/(max-min||1)*28}`).join(" ");el.innerHTML=`<svg viewBox="0 0 80 36"><polyline points="${pts}" fill="none" stroke="#43d6a0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`}
function metrics(arr){return {wins:arr.filter(m=>m.result==="win").length,loss:arr.filter(m=>m.result==="loss").length,wr:wr(arr),kd:kd(arr),acs:avg(arr,"acs")}}
function renderOverview(){let a=metrics(matches);$("#winRate").textContent=pct(a.wr);$("#winRecord").textContent=`${a.wins}W – ${a.loss}L` ;$("#kd").textContent=a.kd.toFixed(2);$("#acs").textContent=Math.round(a.acs);$("#total").textContent=matches.length;
$("#winBars").innerHTML=matches.slice().reverse().map(m=>`<i style="height:${m.result==="win"?24:11}px;background:${m.result==="win"?"#43d6a0":"#ff4655"}"></i>`).join("");spark($("#kdSpark"),matches,"kills");spark($("#acsSpark"),matches,"acs");
$("#matchTrend").innerHTML=matches.slice().reverse().map(m=>`<i class="${m.result}" title="${m.map} · ${m.result.toUpperCase()}" style="height:${Math.max(15,m.acs/3.8)}px"></i>`).join("");
let ag=group(matches,"agent"),top=Object.entries(ag).sort((a,b)=>b[1].length-a[1].length)[0];$("#topAgent").textContent=top[0];$("#topAgentArt").textContent=top[0][0];$("#topAgentMeta").textContent=`${top[1].length} maç · ${pct(wr(top[1]))} WR`;$("#topAgentKd").textContent=kd(top[1]).toFixed(2);
$("#mapPreview").innerHTML=Object.entries(group(matches,"map")).sort((a,b)=>wr(b[1])-wr(a[1])).slice(0,4).map(([n,ms])=>`<div class="map-card"><strong>${n}</strong><div class="map-wr">${pct(wr(ms))}</div><small>${ms.length} maç · ${ms.filter(m=>m.result==="win").length} galibiyet</small><div class="map-bar"><i style="width:${wr(ms)*100}%"></i></div></div>`).join("")}
function renderMatches(){let f=$("#matchFilter").value;let arr=matches.filter(m=>f==="all"||m.result===f);$("#matchTable").innerHTML=`<div class="match-row header"><span>SONUÇ</span><span>HARİTA</span><span>AJAN</span><span>K / D</span><span>ACS</span><span>TARİH</span><span>MOD</span></div>`+arr.map(m=>`<div class="match-row"><span class="result ${m.result}">${m.result==="win"?"VICTORY":"DEFEAT"}</span><span>${m.map}</span><span class="agent-name">${m.agent}</span><span>${m.kills} / ${m.deaths}<small class="sub">${(m.kills/m.deaths).toFixed(2)} K/D</small></span><b>${m.acs}</b><span>${m.date}</span><span class="muted">COMP</span></div>`).join("")}
function renderAgents(){let ag=Object.entries(group(matches,"agent")).sort((a,b)=>b[1].length-a[1].length);$("#agentGrid").innerHTML=ag.map(([name,ms])=>`<article class="agent-card"><div class="agent-icon">${name[0]}</div><div><h4>${name}</h4><p>${ms.length} karşılaşma · ${ms.filter(m=>m.result==="win").length} galibiyet</p></div><div class="agent-stat"><b>${pct(wr(ms))}</b><small>WIN RATE</small><p class="sub">${kd(ms).toFixed(2)} K/D</p></div></article>`).join("")}
function renderMaps(){let mg=Object.entries(group(matches,"map")).sort((a,b)=>wr(b[1])-wr(a[1]));$("#mapGrid").innerHTML=mg.map(([name,ms])=>`<article class="map-card"><strong>${name}</strong><div class="map-wr">${pct(wr(ms))} <small>WIN RATE</small></div><div class="map-bar"><i style="width:${wr(ms)*100}%"></i></div><div class="map-meta"><span>${ms.length} maç</span><span>${ms.filter(m=>m.result==="win").length}G / ${ms.filter(m=>m.result==="loss").length}M</span><span>${kd(ms).toFixed(2)} K/D</span></div></article>`).join("")}
function renderCompare(){let friend=profiles[$("#friendSelect").selectedIndex+1]||profiles[1],a=metrics(matches),b=metrics(friend.matches);const row=(label,x,y,better)=>`<div class="compare-stat"><span>${label}</span><b class="${better(x,y)?"better":""}">${x}</b><b class="${better(y,x)?"better":""}">${y}</b></div>`;$("#compareGrid").innerHTML=[current,friend].map(p=>`<div class="compare-card"><h3>${p.name} <span class="sub">${p.rank}</span></h3><div class="compare-stat"><span>İSTATİSTİK</span><b>DEĞER</b><b> </b></div>${row("Win Rate",pct(a.wr),pct(b.wr),(x,y)=>parseInt(x)>parseInt(y))}${row("K/D",a.kd.toFixed(2),b.kd.toFixed(2),(x,y)=>+x>+y)}${row("Ortalama ACS",Math.round(a.acs),Math.round(b.acs),(x,y)=>+x>+y)}${row("Galibiyet",a.wins,b.wins,(x,y)=>+x>+y)}</div>`).join("")}
function go(page){$$(".page").forEach(p=>p.classList.toggle("active",p.id===page));$$(".nav").forEach(n=>n.classList.toggle("active",n.dataset.page===page));let labels={overview:["Oyuncu Özeti","GENEL BAKIŞ"],matches:["Maç Geçmişi","MAÇ GEÇMİŞİ"],agents:["Ajan Analizi","AJAN ANALİZİ"],maps:["Harita Analizi","HARİTA ANALİZİ"],compare:["Arkadaş Karşılaştır","KARŞILAŞTIRMA"]};$("#pageTitle").textContent=labels[page][0];$("#crumb").textContent=labels[page][1];}
$$(".nav").forEach(n=>n.addEventListener("click",()=>go(n.dataset.page)));$$("[data-go]").forEach(n=>n.addEventListener("click",()=>go(n.dataset.go)));$("#matchFilter").addEventListener("change",renderMatches);$("#friendSelect").innerHTML=profiles.slice(1).map(p=>`<option>${p.name}</option>`).join("");$("#friendSelect").addEventListener("change",renderCompare);$("#refreshBtn").addEventListener("click",()=>{renderOverview();renderMatches();renderAgents();renderMaps();renderCompare();$("#refreshBtn").textContent="✓";setTimeout(()=>$("#refreshBtn").textContent="↻",700)});$("#profileBtn").addEventListener("click",()=>alert("V1 demo profili: Kaan#TR1\nGerçek Riot hesabı bağlantısı V2 aşamasında."));renderOverview();renderMatches();renderAgents();renderMaps();renderCompare();


// ===== SUPABASE KULLANICI HESABI SİSTEMİ =====
(() => {
  const client = supabase.createClient(
    window.SUPABASE_URL,
    window.SUPABASE_PUBLISHABLE_KEY
  );

  let authMode = "login";

  const style = document.createElement("style");
  style.textContent = `
    .auth-overlay {
      position:fixed; inset:0; z-index:9999;
      display:none; align-items:center; justify-content:center;
      background:rgba(0,0,0,.82); padding:20px;
    }
    .auth-overlay.open { display:flex; }
    .auth-box {
      width:100%; max-width:420px; padding:30px;
      background:#151922; border:1px solid #343b49;
      border-radius:14px; color:#fff;
    }
    .auth-box h2 { margin:0 0 8px; font-size:28px; }
    .auth-box p { color:#9ba4b5; margin-bottom:22px; }
    .auth-box label { display:block; margin:14px 0 6px; color:#cbd0da; }
    .auth-box input {
      width:100%; padding:13px; border-radius:7px;
      border:1px solid #394252; background:#0d1119;
      color:white; box-sizing:border-box;
    }
    .auth-box button {
      cursor:pointer; padding:12px; border:0;
      border-radius:7px; font-weight:700;
    }
    .auth-submit {
      width:100%; margin-top:20px;
      background:#ff4655; color:white;
    }
    .auth-switch {
      background:transparent; color:#ff6975;
      margin-top:12px; width:100%;
    }
    .auth-close {
      float:right; background:transparent; color:white;
      font-size:20px;
    }
    .auth-message { margin-top:14px; font-size:13px; color:#f2c66d; }
    .auth-logout {
      width:100%; margin-top:12px;
      background:#303847; color:white;
    }
  `;
  document.head.appendChild(style);

  const overlay = document.createElement("div");
  overlay.className = "auth-overlay";
  overlay.innerHTML = `
    <div class="auth-box">
      <button class="auth-close" type="button">✕</button>
      <div class="eyebrow red">VALORANT ANALYTICS</div>
      <h2 id="authTitle">Hesabına giriş yap</h2>
      <p id="authDescription">İstatistiklerini takip etmek için giriş yap.</p>
      <form id="authForm">
        <label for="authEmail">E-posta</label>
        <input id="authEmail" type="email" required placeholder="ornek@mail.com">
        <label for="authPassword">Şifre</label>
        <input id="authPassword" type="password" required minlength="6" placeholder="En az 6 karakter">
        <label id="authNameLabel" for="authName" style="display:none">Görünen ad</label>
        <input id="authName" type="text" placeholder="Oyuncu adın" style="display:none">
        <button class="auth-submit" id="authSubmit" type="submit">GİRİŞ YAP</button>
      </form>
      <button class="auth-switch" id="authSwitch" type="button">Hesabın yok mu? Kayıt ol</button>
      <button class="auth-logout" id="authLogout" type="button" style="display:none">ÇIKIŞ YAP</button>
      <div class="auth-message" id="authMessage"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  const el = id => document.getElementById(id);
  const message = text => el("authMessage").textContent = text;

  function setMode(mode) {
    authMode = mode;
    el("authTitle").textContent = mode === "login" ? "Hesabına giriş yap" : "Yeni hesap oluştur";
    el("authDescription").textContent = mode === "login"
      ? "İstatistiklerini takip etmek için giriş yap."
      : "VALORANT Analytics topluluğuna katıl.";
    el("authSubmit").textContent = mode === "login" ? "GİRİŞ YAP" : "KAYIT OL";
    el("authSwitch").textContent = mode === "login"
      ? "Hesabın yok mu? Kayıt ol"
      : "Zaten hesabın var mı? Giriş yap";
    el("authName").style.display = mode === "signup" ? "block" : "none";
    el("authNameLabel").style.display = mode === "signup" ? "block" : "none";
    el("authName").required = mode === "signup";
    message("");
  }

  function openModal() {
    overlay.classList.add("open");
    message("");
  }

  function closeModal() {
    overlay.classList.remove("open");
  }

  el("authSwitch").addEventListener("click", () => {
    setMode(authMode === "login" ? "signup" : "login");
  });

  overlay.querySelector(".auth-close").addEventListener("click", closeModal);
  overlay.addEventListener("click", e => {
    if (e.target === overlay) closeModal();
  });

  el("authForm").addEventListener("submit", async e => {
    e.preventDefault();
    const email = el("authEmail").value.trim();
    const password = el("authPassword").value;
    const displayName = el("authName").value.trim();

    el("authSubmit").disabled = true;
    message("İşlem yapılıyor...");

    try {
      if (authMode === "signup") {
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName }
          }
        });
        if (error) throw error;

        if (data.session) {
          message("Hesabın oluşturuldu!");
        } else {
          message("Kayıt başarılı! E-posta adresine gelen doğrulama bağlantısına tıkla.");
        }
      } else {
        const { error } = await client.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        message("Giriş başarılı!");
        closeModal();
      }
    } catch (error) {
      message("Hata: " + error.message);
    } finally {
      el("authSubmit").disabled = false;
    }
  });

  el("authLogout").addEventListener("click", async () => {
    const { error } = await client.auth.signOut();
    if (error) message("Çıkış yapılamadı: " + error.message);
    else {
      message("Çıkış yapıldı.");
      closeModal();
    }
  });

  async function updateUser(user) {
    const name = user
      ? (user.user_metadata?.display_name || user.email)
      : "Misafir";

    ["topName", "sideName"].forEach(id => {
      const node = document.getElementById(id);
      if (node) node.textContent = name;
    });

    el("authLogout").style.display = user ? "block" : "none";
    el("authSwitch").style.display = user ? "none" : "block";
    el("authForm").style.display = user ? "none" : "block";

    el("authTitle").textContent = user ? "Hesabın" : "Hesabına giriş yap";
    el("authDescription").textContent = user
      ? "Oturumun açık."
      : "İstatistiklerini takip etmek için giriş yap.";
  }

  // Eski demo profil uyarısını kaldırıp yeni hesap penceresini bağla.
  const oldButton = document.getElementById("profileBtn");
  const newButton = oldButton.cloneNode(true);
  oldButton.parentNode.replaceChild(newButton, oldButton);
  newButton.addEventListener("click", async () => {
  const { data: { user } } = await client.auth.getUser();
  if (user && window.openValorantProfile) {
    window.openValorantProfile();
  } else {
    openModal();
  }
});

  client.auth.onAuthStateChange((_event, session) => {
    updateUser(session?.user || null);
  });

  client.auth.getSession().then(({ data, error }) => {
    if (error) {
      console.error("Oturum kontrolü:", error.message);
      return;
    }
    updateUser(data.session?.user || null);
  });

  window.valorantSupabase = client;
})();
