// AthleteLink AI - site interaction + real platform features
const PROTECTED_TABS = ["dashboard", "trials", "scouts"];
const ALL_TABS = ["home", "challenge", "solution", "dashboard", "matching", "directory", "scouts", "trials", "opportunities"];

function switchTab(tabId) {
    if (PROTECTED_TABS.includes(tabId) && !window.AuthState?.isLoggedIn()) { openAuth("login"); return; }
    ALL_TABS.forEach(t => document.getElementById("page-" + t)?.classList.toggle("hidden", t !== tabId));
    if (tabId === "dashboard") loadDashboard();
    if (tabId === "scouts") loadScouts();
    if (tabId === "trials") loadTrials();
    window.scrollTo({top:0, behavior:"smooth"});
}

document.addEventListener("DOMContentLoaded", () => {
    const mobileMenuBtn = document.getElementById("mobile-menu-btn");
    const mobileMenuBtn2 = document.getElementById("mobile-menu-btn-2");
    const mobileMenu = document.getElementById("mobile-menu");
    const toggle = () => mobileMenu?.classList.toggle("hidden");
    mobileMenuBtn?.addEventListener("click", toggle); mobileMenuBtn2?.addEventListener("click", toggle);
    loadOpportunityCards();
});
function toggleMobileMenu(){document.getElementById("mobile-menu")?.classList.add("hidden");}
function filterAthletes(){const q=(document.getElementById("athlete-search")?.value||"").toLowerCase();const sport=document.getElementById("filter-sport")?.value||"all";document.querySelectorAll(".athlete-card").forEach(c=>c.style.display=c.dataset.name.toLowerCase().includes(q)&&(sport==="all"||c.dataset.sport===sport)?"block":"none");}
function showFeatureToast(message,type="info"){let t=document.getElementById("feature-toast");if(!t){t=document.createElement("div");t.id="feature-toast";document.body.appendChild(t);}t.className="fixed bottom-6 right-6 z-[200] max-w-md px-5 py-3 rounded-xl border shadow-2xl text-sm font-bold "+(type==="error"?"bg-red-950 border-red-500 text-red-200":(type==="success"?"bg-emerald-950 border-emerald-500 text-emerald-200":"bg-gray-950 border-accentBlue text-white"));t.textContent=message;clearTimeout(window.__toastTimer);window.__toastTimer=setTimeout(()=>t.remove(),4000);}
function esc(v){return String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));}

async function runAIMatching(){const box=document.getElementById("matching-results");if(box)box.style.opacity=".4";try{const results=await apiRequest("/matching",{auth:true});box.innerHTML=results.map(r=>`<div class="p-4 rounded-2xl bg-darkbg/60 border border-gray-800"><div class="flex justify-between gap-3"><div><div class="text-xs font-bold text-accentBlue">${esc(r.type)}</div><h4 class="font-bold mt-1">${esc(r.name)}</h4><p class="text-xs text-gray-400 mt-1">${esc(r.reason)}</p></div><span class="text-sm font-black text-accentGreen">${r.score}%</span></div></div>`).join("");showFeatureToast("AI matching completed — recommendations updated.","success");}catch(e){showFeatureToast(e.message,"error");}finally{if(box)box.style.opacity="1";}}

async function loadAthleteFeatures(){if(!AuthState?.isLoggedIn())return;try{await Promise.all([loadAchievements(),loadApplications(),loadBookings(),loadConnections(),loadNotifications(),loadProfileIntoDashboard(),loadDashboardTrials(),loadMyScholarship()]);}catch(e){console.warn(e);}}
async function loadAchievements(){const list=document.getElementById("achievements-list");if(!list)return;const rows=await apiRequest("/achievements",{auth:true});if(!rows.length){list.innerHTML='<p class="text-xs text-gray-500">No achievements added yet.</p>';return;}list.innerHTML=rows.map(a=>`<div class="p-3.5 rounded-xl bg-darkbg/60 border border-gray-800"><div class="flex items-start justify-between gap-3"><div><div class="font-bold text-sm">${esc(a.title)}</div><div class="text-xs text-gray-400 mt-1">${esc(a.sport||"Sport not set")} • ${esc(a.level||"Level not set")}</div><div class="text-[11px] text-gray-500 mt-1">${esc(a.institution||"Institution not set")} • ${esc(a.achievement_year||a.achieved_on||"Year not set")}</div></div><button onclick="deleteAchievement(${a.id})" class="text-gray-500 hover:text-red-300" title="Delete"><i class="fa-solid fa-trash"></i></button></div><div class="mt-2 text-xs text-yellow-400 font-bold">${esc(a.medal_award||a.position||a.result_label||"Achievement")}</div></div>`).join("");}
async function addAchievement(){openAchievementModal();}
async function deleteAchievement(id){if(!confirm("Delete this achievement?"))return;try{await apiRequest(`/achievements/${id}`,{method:"DELETE",auth:true});await loadAchievements();showFeatureToast("Achievement deleted.","success");}catch(e){showFeatureToast(e.message,"error");}}

async function submitAchievement(event){event.preventDefault();const f=event.target;const body=Object.fromEntries(new FormData(f).entries());body.year=Number(body.year);try{await apiRequest("/achievements",{method:"POST",auth:true,body});closeModal("achievement-modal");f.reset();await loadAchievements();showFeatureToast("Achievement saved securely to MySQL.","success");}catch(e){showFeatureToast(e.message,"error");}}

async function loadTrials(){const box=document.getElementById("trials-grid");if(!box)return;box.innerHTML='<div class="md:col-span-3 text-center text-gray-500 py-10">Loading trials…</div>';try{const rows=await apiRequest("/trials");box.innerHTML=renderTrialCards(rows,false);}catch(e){box.innerHTML=`<div class="md:col-span-3 text-red-300">${esc(e.message)}</div>`;}}
function renderTrialCards(rows,dashboard=false){if(!rows?.length)return '<div class="md:col-span-3 text-xs text-gray-500 py-8 text-center">No live trial opportunities are available right now.</div>';return rows.map(t=>{const remaining=Number(t.remaining_slots??0);const status=t.registration_status||"REG OPEN";const category=t.category||"Open Category";const age=t.age_category||"Youth";return `<div class="group glass-card p-5 rounded-3xl border border-gray-800 hover:border-accentBlue/60 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"><div class="absolute -right-12 -top-12 w-32 h-32 rounded-full bg-accentBlue/10 blur-2xl group-hover:bg-accentGreen/10 transition"></div><div class="relative space-y-4"><div class="flex items-start justify-between gap-3"><div><span class="inline-flex px-2.5 py-1 rounded-full bg-accentBlue/10 border border-accentBlue/20 text-accentBlue text-[10px] font-black uppercase tracking-wider">${esc(t.sport)}</span><h4 class="text-lg font-black mt-3 leading-tight">${esc(t.name)}</h4></div><span class="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accentGreen/10 border border-accentGreen/20 text-accentGreen text-[9px] font-black">● ${esc(status)}</span></div><div class="grid grid-cols-2 gap-2 text-[11px]"><div class="rounded-xl bg-darkbg/60 border border-gray-800 p-3"><span class="text-gray-500 block mb-1">Category</span><span class="font-bold text-gray-200">${esc(category)}</span></div><div class="rounded-xl bg-darkbg/60 border border-gray-800 p-3"><span class="text-gray-500 block mb-1">Age</span><span class="font-bold text-gray-200">${esc(age)}</span></div><div class="rounded-xl bg-darkbg/60 border border-gray-800 p-3"><span class="text-gray-500 block mb-1">Venue</span><span class="font-bold text-gray-200 truncate" title="${esc(t.venue)}">${esc(t.venue)}</span></div><div class="rounded-xl bg-darkbg/60 border border-gray-800 p-3"><span class="text-gray-500 block mb-1">Trial Date</span><span class="font-bold text-gray-200">${esc(t.trial_date)}</span></div></div><div class="flex items-center justify-between pt-1"><div><span class="text-[10px] text-gray-500 uppercase tracking-wider block">Available Slots</span><span class="text-sm font-black ${remaining>0?'text-accentNeon':'text-red-300'}">${remaining} places</span></div><button ${remaining<1?'disabled':''} onclick="openTrialApplication(${t.id})" class="px-4 py-2.5 rounded-xl ${remaining<1?'bg-gray-800 text-gray-500 cursor-not-allowed':'bg-gradient-to-r from-cyan-400 to-emerald-400 text-darkbg hover:shadow-lg hover:shadow-cyan-400/10'} text-[11px] font-black uppercase tracking-wider transition">${remaining<1?'Full':'Apply Now'}</button></div></div></div>`;}).join('');}
async function loadDashboardTrials(){const box=document.getElementById("dashboard-trials-grid");if(!box)return;try{const rows=await apiRequest("/trials/featured");box.innerHTML=renderTrialCards(rows,true);}catch(e){box.innerHTML=`<div class="md:col-span-2 text-red-300 text-xs">${esc(e.message)}</div>`;}}
async function openTrialApplication(trialId){if(!AuthState.isLoggedIn()){openAuth("login");return;}try{const [trial,profile,apps]=await Promise.all([apiRequest(`/trials/${trialId}`),apiRequest("/user/profile",{auth:true}),apiRequest("/applications",{auth:true})]);const existing=apps.find(a=>Number(a.trial_id)===Number(trialId));if(existing){showApplicationResult(existing);return;}document.getElementById("trial-modal-title").textContent=`Apply — ${trial.name}`;document.getElementById("trial-modal-meta").textContent=`${trial.organization||"Verified trial organizer"} • Complete your athlete details below. Profile information has been pre-filled where available.`;document.getElementById("trial-id").value=trialId;document.getElementById("trial-form-summary").innerHTML=`<div class="rounded-xl bg-darkbg/60 border border-gray-800 p-3"><span class="text-[9px] text-gray-500 uppercase block">Category</span><b class="text-xs">${esc(trial.category||"Open")}</b></div><div class="rounded-xl bg-darkbg/60 border border-gray-800 p-3"><span class="text-[9px] text-gray-500 uppercase block">Age</span><b class="text-xs">${esc(trial.age_category||"Youth")}</b></div><div class="rounded-xl bg-darkbg/60 border border-gray-800 p-3"><span class="text-[9px] text-gray-500 uppercase block">Venue</span><b class="text-xs truncate block" title="${esc(trial.venue)}">${esc(trial.venue)}</b></div><div class="rounded-xl bg-darkbg/60 border border-gray-800 p-3"><span class="text-[9px] text-gray-500 uppercase block">Date</span><b class="text-xs">${esc(trial.trial_date)}</b></div>`;const fields={athleteName:profile.fullName,email:profile.email,sport:profile.sport||trial.sport||"",location:profile.location||""};Object.entries(fields).forEach(([k,v])=>{const el=document.querySelector(`#trial-form [name="${k}"]`);if(el)el.value=v||"";});const submit=document.getElementById("trial-submit-btn");if(submit){submit.disabled=false;submit.textContent="Submit Application";}openModal("trial-modal");}catch(e){showFeatureToast(e.message,"error");}}
async function submitTrialApplication(event){event.preventDefault();const f=event.target;const trialId=document.getElementById("trial-id").value;const body=Object.fromEntries(new FormData(f).entries());delete body.trialId;if(body.age)body.age=Number(body.age);const submit=document.getElementById("trial-submit-btn");if(submit){submit.disabled=true;submit.textContent="Submitting…";}try{const r=await apiRequest(`/trials/${trialId}/apply`,{method:"POST",auth:true,body});closeModal("trial-modal");showApplicationResult(r);await loadDashboard();showFeatureToast(r.emailSent?"Trial application saved and confirmation email sent via sreevaib@gmail.com.":"Trial application saved successfully.","success");}catch(e){showFeatureToast(e.message,"error");if(submit){submit.disabled=false;submit.textContent="Submit Application";}}}
function showApplicationResult(r){const trialId=r.trialId||r.trial_id;const appId=r.applicationId||r.application_id;const emailSent=r.emailSent??r.email_sent;document.getElementById("result-modal-content").innerHTML=`<div class="text-center space-y-4"><div class="w-16 h-16 mx-auto rounded-2xl bg-accentGreen/10 border border-accentGreen/30 flex items-center justify-center text-accentGreen text-3xl"><i class="fa-solid fa-check"></i></div><h3 class="text-xl font-black">Application ${appId?"Submitted":"Status"}</h3><p class="text-sm text-gray-400">${esc(r.trial||r.trial_name||"Trial application")}</p><div class="inline-flex px-4 py-2 rounded-full bg-accentBlue/10 text-accentNeon font-bold">Status: ${esc(r.status||"SUBMITTED")}</div>${appId?`<p class="text-xs text-gray-500">Application ID: #${esc(appId)}</p>`:""}${emailSent?`<div class="p-3 rounded-xl border border-accentGreen/30 bg-accentGreen/5 text-xs text-accentGreen">Confirmation email sent from sreevaib@gmail.com to ${esc(r.email||"your email")}.</div>`:`<div class="p-3 rounded-xl border border-accentBlue/30 bg-accentBlue/5 text-xs text-gray-300">Application record saved securely in database. Confirmation dispatched to ${esc(r.email||"your registered email")}.</div>`}${r.confirmationUrl?`<a target="_blank" href="${esc(r.confirmationUrl)}" class="block text-center py-3 rounded-xl bg-gray-800 text-white font-bold text-sm hover:bg-gray-700 transition">Open Application Confirmation</a>`:""}${trialId?`<button onclick="showTrialSlots(${trialId})" class="w-full py-3 rounded-xl bg-accentBlue text-darkbg font-black text-sm hover:bg-accentNeon transition">View Available Slots</button>`:""}</div>`;openModal("result-modal");}

async function showTrialSlots(trialId){try{const [trial,slots]=await Promise.all([apiRequest(`/trials/${trialId}`),apiRequest(`/trials/${trialId}/slots`)]);document.getElementById("result-modal-content").innerHTML=`<div><div class="flex justify-between items-center mb-4"><div><h3 class="text-xl font-black">Available Slots</h3><p class="text-xs text-gray-500">${esc(trial.name)} • ${esc(trial.venue)}</p></div></div><div class="space-y-3">${slots.map(s=>`<div class="p-4 rounded-xl border border-gray-800 bg-darkbg/60 flex items-center justify-between gap-4"><div><div class="font-bold text-sm">${esc(s.slot_date)} • ${esc(s.slot_time)}</div><div class="text-xs text-gray-500 mt-1">${s.remaining_slots} of ${s.capacity} places available</div></div><button ${s.remaining_slots<1?"disabled":""} onclick="bookSlot(${s.id})" class="px-4 py-2 rounded-lg ${s.remaining_slots<1?"bg-gray-800 text-gray-500":"bg-accentGreen text-darkbg hover:bg-emerald-300"} text-xs font-black">${s.remaining_slots<1?"Full":"Confirm Booking"}</button></div>`).join("")}</div></div>`;}catch(e){showFeatureToast(e.message,"error");}}
async function bookSlot(slotId){try{const b=await apiRequest("/bookings",{method:"POST",auth:true,body:{slotId}});showBookingCard(b);await loadBookings();showFeatureToast(b.emailSent?"Booking confirmed and email sent via sreevaib@gmail.com.":"Booking confirmed. Confirmation URL is available.","success");}catch(e){showFeatureToast(e.message,"error");}}

async function loadScouts(){
 const box=document.getElementById("scouts-grid"); if(!box)return;
 box.innerHTML='<div class="md:col-span-3 text-center text-gray-500 py-10">Finding coaches near you…</div>';
 try{
  const render=async(lat=null,lon=null,radius=100)=>{
   const qs=lat!=null&&lon!=null?`?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&radiusKm=${radius}`:"";
   const [coaches,connections]=await Promise.all([apiRequest(`/coaches/nearby${qs}`,{auth:true}),apiRequest('/coach-connections',{auth:true})]);
   if(!coaches.length){box.innerHTML='<div class="md:col-span-3 text-center py-10"><div class="text-lg font-black">No coaches found nearby</div><p class="text-sm text-gray-500 mt-2">Allow location access or search a wider radius.</p><button onclick="findNearbyCoaches(true)" class="mt-4 px-5 py-2 rounded-xl bg-accentBlue text-darkbg font-bold text-xs">Search within 500 km</button></div>';return;}
   box.innerHTML=coaches.map(c=>{const conn=connections.find(x=>x.coach_id===c.id);const label=conn?(conn.status==='CONNECTED'?'Connected':'Pending'):'Connect';return `<div class="glass-card p-6 rounded-3xl border border-gray-800 space-y-4 hover:border-accentBlue/50 transition"><div class="flex items-center gap-4"><div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-emerald-400/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 text-2xl"><i class="fa-solid fa-person-chalkboard"></i></div><div><h3 class="font-bold text-lg">${esc(c.name)}</h3><p class="text-xs text-accentBlue font-bold">${esc(c.organization)}</p></div></div><p class="text-xs text-gray-400"><b class="text-gray-300">Sports:</b> ${esc(c.sports)}</p><p class="text-xs text-gray-400"><b class="text-gray-300">Specialization:</b> ${esc(c.specialization)}</p><div class="flex flex-wrap justify-between gap-2 text-xs text-gray-500"><span><i class="fa-solid fa-location-dot text-red-400 mr-1"></i>${esc(c.location)}</span><span class="text-accentGreen font-bold">${esc(c.distance_km)} km away</span></div><div class="text-[11px] text-gray-500">${esc(c.experience)} • Profile match ${esc(c.match_score)}%</div><button ${conn?'disabled':''} onclick="openCoachConnection(${c.id},'${esc(c.name)}')" class="w-full py-2.5 rounded-xl ${conn?'bg-gray-800 text-accentGreen':'bg-accentBlue hover:bg-accentNeon text-darkbg'} text-xs font-bold transition">${label}</button></div>`;}).join('');
  };
  if(navigator.geolocation){navigator.geolocation.getCurrentPosition(pos=>render(pos.coords.latitude,pos.coords.longitude,100),()=>render(),{enableHighAccuracy:true,timeout:7000,maximumAge:300000});} else await render();
  await loadScoutNetwork();
 }catch(e){box.innerHTML=`<div class="md:col-span-3 text-red-300">${esc(e.message)}</div>`;}
}
async function findNearbyCoaches(wide=false){
 if(!AuthState.isLoggedIn()){openAuth('login');return;}
 if(!navigator.geolocation){showFeatureToast('Your browser does not support location services.','error');return;}
 navigator.geolocation.getCurrentPosition(async pos=>{try{const radius=wide?500:100;const [coaches,connections]=await Promise.all([apiRequest(`/coaches/nearby?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&radiusKm=${radius}`,{auth:true}),apiRequest('/coach-connections',{auth:true})]);const box=document.getElementById('scouts-grid');box.innerHTML=coaches.length?coaches.map(c=>{const conn=connections.find(x=>x.coach_id===c.id);return `<div class="glass-card p-6 rounded-3xl border border-gray-800 space-y-4"><div class="flex items-center gap-4"><div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-emerald-400/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 text-2xl"><i class="fa-solid fa-person-chalkboard"></i></div><div><h3 class="font-bold text-lg">${esc(c.name)}</h3><p class="text-xs text-accentBlue font-bold">${esc(c.organization)}</p></div></div><p class="text-xs text-gray-400"><b class="text-gray-300">Sports:</b> ${esc(c.sports)}</p><p class="text-xs text-gray-400"><b class="text-gray-300">Specialization:</b> ${esc(c.specialization)}</p><div class="flex justify-between text-xs text-gray-500"><span>${esc(c.location)}</span><span class="text-accentGreen font-bold">${esc(c.distance_km)} km away</span></div><button ${conn?'disabled':''} onclick="openCoachConnection(${c.id},'${esc(c.name)}')" class="w-full py-2.5 rounded-xl ${conn?'bg-gray-800 text-accentGreen':'bg-accentBlue hover:bg-accentNeon text-darkbg'} text-xs font-bold">${conn?(conn.status==='CONNECTED'?'Connected':'Pending'):'Connect'}</button></div>`;}).join(''):'<div class="md:col-span-3 text-center text-gray-500 py-10">No coaches found in this radius.</div>';}catch(e){showFeatureToast(e.message,'error');}},()=>showFeatureToast('Location permission is needed to find nearby coaches.','error'),{enableHighAccuracy:true,timeout:10000});
}

function openCoachConnection(id,name){document.getElementById('coach-connection-id').value=id;document.getElementById('coach-connection-name').textContent=name;document.getElementById('coach-connection-message').value='';openModal('coach-connection-modal');}
async function submitCoachConnection(event){event.preventDefault();const id=document.getElementById('coach-connection-id').value;const message=document.getElementById('coach-connection-message').value.trim();try{await apiRequest(`/coaches/${id}/connect`,{method:'POST',auth:true,body:{message}});closeModal('coach-connection-modal');showFeatureToast('Coach connection request sent — status is now Pending.','success');await loadScouts();await loadConnections();}catch(e){showFeatureToast(e.message,'error');}}
function openScoutConnection(id,name){document.getElementById('scout-connection-id').value=id;document.getElementById('scout-connection-name').textContent=name;document.getElementById('scout-connection-message').value='';openModal('scout-connection-modal');}
async function submitScoutConnection(event){event.preventDefault();const id=document.getElementById('scout-connection-id').value;try{const message=document.getElementById('scout-connection-message').value.trim();await apiRequest(`/scouts/${id}/connect`,{method:'POST',auth:true,body:{message}});closeModal('scout-connection-modal');showFeatureToast('Scout connection request sent — status is now Pending.','success');await loadScoutNetwork();await loadConnections();}catch(e){showFeatureToast(e.message,'error');}}
async function loadScoutNetwork(){const box=document.getElementById('scouts-network-grid');if(!box)return;try{const [scouts,connections]=await Promise.all([apiRequest('/scouts'),apiRequest('/connections',{auth:true})]);box.innerHTML=scouts.map(s=>{const conn=connections.find(x=>x.scout_id===s.id);return `<div class="glass-card p-6 rounded-3xl border border-gray-800 space-y-3"><div class="flex items-center gap-3"><div class="w-12 h-12 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center text-yellow-300"><i class="fa-solid fa-binoculars"></i></div><div><h4 class="font-bold">${esc(s.name)}</h4><p class="text-xs text-accentBlue">${esc(s.organization)}</p></div></div><p class="text-xs text-gray-400">${esc(s.sports)} • ${esc(s.specialization)}</p><p class="text-xs text-gray-500">${esc(s.location)} • ${esc(s.experience)}</p><button ${conn?'disabled':''} onclick="openScoutConnection(${s.id},'${esc(s.name)}')" class="w-full py-2.5 rounded-xl ${conn?'bg-gray-800 text-accentGreen':'bg-accentBlue text-darkbg hover:bg-accentNeon'} text-xs font-bold">${conn?(conn.status==='CONNECTED'?'Connected':'Pending'):'Connect'}</button></div>`;}).join('')}catch(e){box.innerHTML=`<div class="text-red-300">${esc(e.message)}</div>`;}}
async function loadConnections(){const box=document.getElementById("connections-list");if(!box)return;const rows=await apiRequest("/connections",{auth:true});box.innerHTML=rows.length?rows.map(c=>`<div class="flex items-center justify-between p-3 rounded-xl bg-darkbg/60 border border-gray-800"><div><div class="font-bold text-sm">${esc(c.name)}</div><div class="text-xs text-gray-500">${esc(c.organization)}</div></div><span class="text-[10px] font-bold px-2 py-1 rounded-full ${c.status==="CONNECTED"?"bg-accentGreen/10 text-accentGreen":"bg-yellow-400/10 text-yellow-300"}">${esc(c.status)}</span></div>`).join(""):"<p class='text-xs text-gray-500'>No scout connections yet.</p>";}

async function loadApplications(){const box=document.getElementById("applications-list");if(!box)return;const rows=await apiRequest("/applications",{auth:true});box.innerHTML=rows.length?rows.map(a=>`<div class="p-3 rounded-xl bg-darkbg/60 border border-gray-800"><div class="flex justify-between gap-2"><b class="text-sm">${esc(a.trial_name)}</b><span class="text-[10px] font-bold text-accentNeon">${esc(a.status)}</span></div><div class="text-[11px] text-gray-500 mt-1">Application #${esc(a.application_id)} • ${esc(a.trial_date)}</div></div>`).join(""):"<p class='text-xs text-gray-500'>No trial applications yet.</p>";}
async function loadBookings(){const box=document.getElementById("bookings-list");if(!box)return;const rows=await apiRequest("/bookings",{auth:true});box.innerHTML=rows.length?rows.map(b=>`<div class="p-4 rounded-xl bg-darkbg/60 border border-gray-800"><div class="flex justify-between gap-2"><b class="text-sm">${esc(b.trial_name)}</b><span class="text-[10px] font-bold text-accentGreen">${esc(b.status)}</span></div><div class="text-xs text-gray-400 mt-1">${esc(b.venue)}</div><div class="text-xs text-gray-500 mt-1">${esc(b.slot_date)} • ${esc(b.slot_time)} • Booking #${esc(b.booking_id)}</div><button onclick="showBooking(${b.booking_id})" class="mt-3 text-xs text-accentBlue hover:text-white font-bold">View confirmation →</button></div>`).join(""):"<p class='text-xs text-gray-500'>No booked trials yet.</p>";}
async function showBooking(id){try{const b=await apiRequest(`/bookings/${id}`,{auth:true});showBookingCard(b);}catch(e){showFeatureToast(e.message,"error");}}
function showBookingCard(b){document.getElementById("result-modal-content").innerHTML=`<div class="space-y-5"><div class="flex items-center gap-3"><div class="w-12 h-12 rounded-xl bg-accentGreen/10 text-accentGreen flex items-center justify-center"><i class="fa-solid fa-ticket"></i></div><div><h3 class="text-xl font-black">Booking Confirmed</h3><p class="text-xs text-gray-500">Booking #${esc(b.booking_id)}</p></div></div><div class="grid grid-cols-2 gap-3 text-sm"><div class="p-3 rounded-xl bg-darkbg/60"><span class="text-gray-500 block text-xs">Trial</span>${esc(b.trial_name)}</div><div class="p-3 rounded-xl bg-darkbg/60"><span class="text-gray-500 block text-xs">Sport</span>${esc(b.sport)}</div><div class="p-3 rounded-xl bg-darkbg/60"><span class="text-gray-500 block text-xs">Venue</span>${esc(b.venue)}</div><div class="p-3 rounded-xl bg-darkbg/60"><span class="text-gray-500 block text-xs">Date & Time</span>${esc(b.slot_date)} • ${esc(b.slot_time)}</div></div><div class="p-4 rounded-xl border border-accentBlue/30 bg-accentBlue/5 text-xs text-gray-300">${b.email_sent?"Confirmation email sent from sreevaib@gmail.com.":"Booking saved securely in database."}</div>${b.confirmation_token?`<a target="_blank" href="/api/confirm-booking?token=${encodeURIComponent(b.confirmation_token)}" class="block text-center py-3 rounded-xl bg-accentBlue text-darkbg font-bold text-sm hover:bg-accentNeon transition">Open Confirmation</a>`:""}</div>`;openModal("result-modal");}

async function loadOpportunityCards(){/* static cards retain current design; their buttons use the real API */}
async function loadNotifications(){if(!AuthState.isLoggedIn())return;const rows=await apiRequest("/notifications",{auth:true});let bell=document.getElementById("notification-bell");if(!bell){bell=document.createElement("button");bell.id="notification-bell";bell.className="fixed top-24 right-5 z-40 w-11 h-11 rounded-full bg-gray-950/90 border border-gray-700 text-white shadow-xl hover:border-accentBlue transition";document.body.appendChild(bell);}const unread=rows.filter(n=>!n.is_read).length;bell.innerHTML='<i class="fa-solid fa-bell"></i>'+(unread?`<span class="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-5 h-5 rounded-full flex items-center justify-center">${unread}</span>`:"");bell.onclick=()=>showNotifications(rows);}
function showNotifications(rows){document.getElementById("result-modal-content").innerHTML=`<div><h3 class="text-xl font-black mb-4">Notifications</h3><div class="space-y-2">${rows.length?rows.slice(0,12).map(n=>`<div class="p-3 rounded-xl border border-gray-800 bg-darkbg/60"><div class="font-bold text-sm">${esc(n.title)}</div><div class="text-xs text-gray-400 mt-1">${esc(n.message)}</div></div>`).join(""):"<p class='text-sm text-gray-500'>No notifications yet.</p>"}</div></div>`;openModal("result-modal");rows.filter(n=>!n.is_read).forEach(n=>apiRequest(`/notifications/${n.id}/read`,{method:"POST",auth:true}).catch(()=>{}));setTimeout(loadNotifications,400);}
async function loadProfileIntoDashboard(){try{const p=await apiRequest("/user/profile",{auth:true});document.getElementById("dash-user-name")?.replaceChildren(document.createTextNode(p.fullName||"Athlete"));const sport=document.getElementById("dash-user-sport");if(sport)sport.textContent=p.sport||"Athlete";const email=document.getElementById("dash-user-email");if(email)email.textContent=p.email||"";const loc=document.querySelector("#dash-user-location span");if(loc)loc.textContent=p.location||"Location not set";const avatar=document.getElementById("profile-avatar");if(avatar){const initials=(p.fullName||"A").split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join("").toUpperCase();avatar.textContent=initials;}}catch(e){if(e.status===401||e.status===403){AuthState.clearSession();refreshAuthUI();}}}
async function loadDashboard(){if(!AuthState.isLoggedIn())return;await loadAthleteFeatures();}
function openModal(id){document.getElementById(id)?.classList.remove("hidden");}
function closeModal(id){document.getElementById(id)?.classList.add("hidden");}
function openAchievementModal(){openModal("achievement-modal");}

// =========================================================================
// 5 SEPARATE SCHOLARSHIP CATEGORIES & APPLICATION WORKFLOW
// =========================================================================

const SCHOLARSHIP_CATEGORY_CONFIG = {
    "UNDER_18": {
        title: "Scholarship for Under 18",
        badge: "Under 18 Category",
        subtitle: "Dedicated financial support for youth athletes under 18 years old.",
        sections: ["section-age-dob-income", "section-under18", "section-age-proof"],
        ageMin: 1, ageMax: 17, ageValidationMsg: "Age must be below 18 years."
    },
    "ABOVE_18": {
        title: "Scholarship for Above 18",
        badge: "Above 18 Category",
        subtitle: "Financial assistance for adult athletes aged 18 and above.",
        sections: ["section-age-dob-income", "section-applicant-id", "section-age-proof"],
        ageMin: 18, ageMax: 100, ageValidationMsg: "Age must be 18 years or older."
    },
    "WOMEN": {
        title: "Scholarship for Women",
        badge: "Women in Sports",
        subtitle: "Dedicated grant and resources supporting women athletes.",
        sections: ["section-women"]
    },
    "DEFENCE_CHILDREN": {
        title: "Scholarships for Children of Defence Personnel",
        badge: "Armed Forces Support",
        subtitle: "Financial & stationery grants for wards of Indian Defence Personnel.",
        sections: ["section-applicant-id", "section-defence"]
    },
    "SINGLE_PARENT": {
        title: "Scholarship for Single Parents",
        badge: "Single Parent Support",
        subtitle: "Financial aid for athletes and dependents from single-parent families.",
        sections: ["section-single-parent", "section-applicant-id"]
    }
};

function normalizeCategoryKey(raw) {
    const s = String(raw || "").toLowerCase();
    if (s.includes("under 18") || s === "under_18") return "UNDER_18";
    if (s.includes("above 18") || s === "above_18") return "ABOVE_18";
    if (s.includes("women")) return "WOMEN";
    if (s.includes("defence") || s.includes("defense")) return "DEFENCE_CHILDREN";
    if (s.includes("single")) return "SINGLE_PARENT";
    return "UNDER_18";
}

function toggleDefenceResourcesList(value) {
    const wrap = document.getElementById("defence-resources-list-wrap");
    if (wrap) {
        wrap.classList.toggle("hidden", value !== "Yes");
    }
}

async function openScholarshipForm(categoryName) {
    if (!AuthState?.isLoggedIn()) {
        openAuth("login");
        return;
    }

    const catKey = normalizeCategoryKey(categoryName);
    const config = SCHOLARSHIP_CATEGORY_CONFIG[catKey] || SCHOLARSHIP_CATEGORY_CONFIG["UNDER_18"];

    // Check if athlete already has an existing or cancelled scholarship application
    try {
        const existing = await apiRequest("/scholarships/my-application", { auth: true });
        if (existing && existing.applied) {
            if (existing.is_cancelled || existing.status === "CANCELLED") {
                showFeatureToast("You have already used your scholarship application. Cancelling an application does not allow you to apply for another scholarship.", "error");
            } else {
                showFeatureToast("You have already applied for a scholarship. You can apply for only one scholarship.", "error");
            }
            showExistingScholarshipModal(existing);
            return;
        }
    } catch (_) {}

    // Reset Form and Errors
    const form = document.getElementById("scholarshipForm");
    if (form) form.reset();
    clearScholarshipErrors();

    // Set Hidden Inputs
    document.getElementById("selectedScholarshipCategory").value = catKey;
    document.getElementById("selectedScholarshipTitle").value = config.title;

    // Set Header
    document.getElementById("scholarshipCategoryBadge").textContent = config.badge;
    document.getElementById("scholarshipTitle").textContent = config.title;
    document.getElementById("scholarshipSubtitle").textContent = config.subtitle;

    // Toggle Specific Category Sections
    const allSections = ["section-age-dob-income", "section-under18", "section-age-proof", "section-applicant-id", "section-women", "section-defence", "section-single-parent"];
    allSections.forEach(secId => {
        const el = document.getElementById(secId);
        if (el) el.classList.toggle("hidden", !config.sections.includes(secId));
    });

    const resListWrap = document.getElementById("defence-resources-list-wrap");
    if (resListWrap) resListWrap.classList.add("hidden");

    // Pre-fill profile info
    try {
        const profile = await apiRequest("/user/profile", { auth: true });
        if (profile) {
            if (profile.fullName) document.getElementById("scholarshipFullName").value = profile.fullName;
            if (profile.email) document.getElementById("scholarshipEmail").value = profile.email;
        }
    } catch (_) {}

    // Open modal
    const modal = document.getElementById("scholarshipModal");
    if (modal) {
        modal.classList.remove("hidden");
        modal.classList.add("flex");
    }
}

function closeScholarshipForm() {
    const modal = document.getElementById("scholarshipModal");
    if (modal) {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
    }
}

function closeScholarshipSuccess() {
    const el = document.getElementById("scholarshipSuccess");
    if (el) {
        el.classList.add("hidden");
        el.classList.remove("flex");
    }
}

function clearScholarshipErrors() {
    document.querySelectorAll("#scholarshipForm .inline-error").forEach(el => el.classList.add("hidden"));
    const genErr = document.getElementById("scholarshipFormGeneralError");
    if (genErr) { genErr.classList.add("hidden"); genErr.textContent = ""; }
    const qWarn = document.getElementById("scholarshipQuotaWarning");
    if (qWarn) qWarn.classList.add("hidden");
}

function setScholarshipError(fieldId, errorMsg) {
    const errEl = document.getElementById("error-" + fieldId);
    if (errEl) {
        if (errorMsg) errEl.textContent = errorMsg;
        errEl.classList.remove("hidden");
    }
}

function readFileAsBase64(fileInput) {
    return new Promise((resolve) => {
        if (!fileInput || !fileInput.files || !fileInput.files[0]) {
            resolve(null);
            return;
        }
        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
    });
}

function calculateAgeFromDob(dobString) {
    if (!dobString) return null;
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
        age--;
    }
    return age;
}

async function submitScholarshipApplication(event) {
    event.preventDefault();
    clearScholarshipErrors();

    const catKey = document.getElementById("selectedScholarshipCategory").value;
    const catTitle = document.getElementById("selectedScholarshipTitle").value;
    const config = SCHOLARSHIP_CATEGORY_CONFIG[catKey];

    const fullName = document.getElementById("scholarshipFullName").value.trim();
    const email = document.getElementById("scholarshipEmail").value.trim();
    const phone = document.getElementById("scholarshipPhone").value.trim();

    let hasErrors = false;

    // 1. Common questions
    if (!fullName) {
        setScholarshipError("scholarshipFullName", "Full name is required.");
        hasErrors = true;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        setScholarshipError("scholarshipEmail", "Please enter a valid email address.");
        hasErrors = true;
    }
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phone || !phoneRegex.test(phone)) {
        setScholarshipError("scholarshipPhone", "Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.");
        hasErrors = true;
    }

    // Category-specific validations
    let age = null;
    let dob = null;
    let familyAnnualIncome = null;
    let parentGuardianName = null;
    let defenceRelationship = null;
    let supportingPersonName = null;
    let currentGrade = null;
    let maintainedGrade = null;
    let stationeryRequired = null;
    let resourcesRequired = null;
    let requiredResourcesList = null;
    let lossYear = null;

    if (catKey === "UNDER_18" || catKey === "ABOVE_18") {
        const ageVal = document.getElementById("scholarshipAge").value;
        age = ageVal ? parseInt(ageVal, 10) : null;
        dob = document.getElementById("scholarshipDob").value;
        const incomeVal = document.getElementById("scholarshipFamilyIncome").value;
        familyAnnualIncome = incomeVal ? parseFloat(incomeVal) : null;

        if (catKey === "UNDER_18") {
            if (!age || age < 1 || age >= 18) {
                setScholarshipError("scholarshipAge", "Current age is required and must be strictly below 18.");
                hasErrors = true;
            }
        } else {
            if (!age || age < 18) {
                setScholarshipError("scholarshipAge", "Current age is required and must be 18 or above.");
                hasErrors = true;
            }
        }

        if (!dob) {
            setScholarshipError("scholarshipDob", "Date of birth is required.");
            hasErrors = true;
        } else {
            const calculatedAge = calculateAgeFromDob(dob);
            const dobDate = new Date(dob);
            if (dobDate > new Date()) {
                setScholarshipError("scholarshipDob", "Date of birth cannot be in the future.");
                hasErrors = true;
            } else if (catKey === "UNDER_18" && calculatedAge >= 18) {
                setScholarshipError("scholarshipDob", "Date of birth indicates an age of 18 or older. Must be under 18.");
                hasErrors = true;
            } else if (catKey === "ABOVE_18" && calculatedAge < 18) {
                setScholarshipError("scholarshipDob", "Date of birth indicates an age below 18. Must be 18 or older.");
                hasErrors = true;
            }
        }

        if (!familyAnnualIncome || familyAnnualIncome <= 0 || isNaN(familyAnnualIncome)) {
            setScholarshipError("scholarshipFamilyIncome", "Family annual income is required and must be a positive amount.");
            hasErrors = true;
        }

        const ageProofInput = document.getElementById("scholarshipAgeProofDoc");
        if (!ageProofInput.files || !ageProofInput.files[0]) {
            setScholarshipError("scholarshipAgeProofDoc", "Age proof document is required.");
            hasErrors = true;
        }
    }

    if (catKey === "UNDER_18") {
        parentGuardianName = document.getElementById("scholarshipParentName").value.trim();
        if (!parentGuardianName) {
            setScholarshipError("scholarshipParentName", "Parent / Guardian name is required.");
            hasErrors = true;
        }
        const parentIdInput = document.getElementById("scholarshipParentIdDoc");
        if (!parentIdInput.files || !parentIdInput.files[0]) {
            setScholarshipError("scholarshipParentIdDoc", "Parent / Guardian ID proof is required.");
            hasErrors = true;
        }
    }

    if (catKey === "ABOVE_18" || catKey === "DEFENCE_CHILDREN" || catKey === "SINGLE_PARENT") {
        const applicantIdInput = document.getElementById("scholarshipApplicantIdDoc");
        if (!applicantIdInput.files || !applicantIdInput.files[0]) {
            setScholarshipError("scholarshipApplicantIdDoc", "Applicant ID proof is required.");
            hasErrors = true;
        }
    }

    if (catKey === "WOMEN") {
        const womenAadhaarInput = document.getElementById("scholarshipWomenAadhaarDoc");
        if (!womenAadhaarInput.files || !womenAadhaarInput.files[0]) {
            setScholarshipError("scholarshipWomenAadhaarDoc", "Aadhaar Card is required.");
            hasErrors = true;
        }
    }

    if (catKey === "DEFENCE_CHILDREN") {
        defenceRelationship = document.getElementById("scholarshipDefenceRelationship").value;
        const validRels = ["Mother", "Father", "Other blood relative only"];
        if (!defenceRelationship || !validRels.includes(defenceRelationship)) {
            setScholarshipError("scholarshipDefenceRelationship", "Relationship must be Mother, Father, or Other blood relative only.");
            hasErrors = true;
        }

        supportingPersonName = document.getElementById("scholarshipSupportingName").value.trim();
        if (!supportingPersonName) {
            setScholarshipError("scholarshipSupportingName", "Supporting person's full name is required.");
            hasErrors = true;
        }

        currentGrade = document.getElementById("scholarshipCurrentGrade").value.trim();
        if (!currentGrade) {
            setScholarshipError("scholarshipCurrentGrade", "Current grade / year is required.");
            hasErrors = true;
        }

        maintainedGrade = document.getElementById("scholarshipMaintainedGrade").value.trim();
        if (!maintainedGrade) {
            setScholarshipError("scholarshipMaintainedGrade", "Maintained grade / year is required.");
            hasErrors = true;
        }

        stationeryRequired = document.getElementById("scholarshipStationery").value;
        if (!stationeryRequired) {
            setScholarshipError("scholarshipStationery", "Please select whether stationery is required.");
            hasErrors = true;
        }

        resourcesRequired = document.getElementById("scholarshipResources").value;
        if (!resourcesRequired) {
            setScholarshipError("scholarshipResources", "Please select whether educational resources are required.");
            hasErrors = true;
        }

        if (resourcesRequired === "Yes") {
            requiredResourcesList = document.getElementById("scholarshipResourceList").value.trim();
            if (!requiredResourcesList) {
                setScholarshipError("scholarshipResourceList", "Please list the required resources when Yes is selected.");
                hasErrors = true;
            }
        }

        const defenceIdInput = document.getElementById("scholarshipDefenceIdDoc");
        if (!defenceIdInput.files || !defenceIdInput.files[0]) {
            setScholarshipError("scholarshipDefenceIdDoc", "Defence personnel ID proof is required.");
            hasErrors = true;
        }
    }

    if (catKey === "SINGLE_PARENT") {
        const lossYearVal = document.getElementById("scholarshipLossYear").value;
        lossYear = lossYearVal ? parseInt(lossYearVal, 10) : null;
        const currentYear = new Date().getFullYear();
        if (!lossYear || lossYear < 1950 || lossYear > currentYear) {
            setScholarshipError("scholarshipLossYear", `Loss year is required, must be between 1950 and ${currentYear}.`);
            hasErrors = true;
        }

        const singleIncomeVal = document.getElementById("scholarshipSingleIncome").value;
        familyAnnualIncome = singleIncomeVal ? parseFloat(singleIncomeVal) : null;
        if (!familyAnnualIncome || familyAnnualIncome <= 0 || isNaN(familyAnnualIncome)) {
            setScholarshipError("scholarshipSingleIncome", "Family annual income is required and must be a positive amount.");
            hasErrors = true;
        }
    }

    if (hasErrors) {
        showFeatureToast("Please fix the highlighted errors before submitting.", "error");
        return;
    }

    // Submit Guard
    const submitBtn = document.getElementById("scholarshipSubmitBtn");
    const submitBtnText = document.getElementById("scholarshipSubmitBtnText");
    if (submitBtn) submitBtn.disabled = true;
    if (submitBtnText) submitBtnText.textContent = "Processing Application…";

    try {
        // Read file payloads as Base64
        const [ageProofDoc, applicantIdDoc, parentIdDoc, aadhaarDoc, defenceIdDoc] = await Promise.all([
            readFileAsBase64(document.getElementById("scholarshipAgeProofDoc")),
            readFileAsBase64(document.getElementById("scholarshipApplicantIdDoc")),
            readFileAsBase64(document.getElementById("scholarshipParentIdDoc")),
            readFileAsBase64(document.getElementById("scholarshipWomenAadhaarDoc")),
            readFileAsBase64(document.getElementById("scholarshipDefenceIdDoc"))
        ]);

        const payload = {
            category: catKey,
            categoryTitle: catTitle,
            fullName,
            email,
            phone,
            age,
            dob,
            familyAnnualIncome,
            parentGuardianName,
            defenceRelationship,
            supportingPersonName,
            currentGrade,
            maintainedGrade,
            stationeryRequired,
            resourcesRequired,
            requiredResourcesList,
            lossYear,
            ageProofDocument: ageProofDoc,
            applicantIdDocument: applicantIdDoc,
            parentIdDocument: parentIdDoc,
            aadhaarDocument: aadhaarDoc,
            defenceIdDocument: defenceIdDoc
        };

        const result = await apiRequest("/scholarships/apply", {
            method: "POST",
            auth: true,
            body: payload
        });

        closeScholarshipForm();

        // Show Success modal
        const successModal = document.getElementById("scholarshipSuccess");
        const successMsg = document.getElementById("scholarshipSuccessMsg");
        if (successMsg) {
            successMsg.textContent = result.emailSent
                ? `Your application for "${catTitle}" was received successfully. A confirmation email has been sent to ${email}.`
                : `Your application for "${catTitle}" was received and saved in MySQL.`;
        }
        if (successModal) {
            successModal.classList.remove("hidden");
            successModal.classList.add("flex");
        }

        showFeatureToast("Scholarship application submitted successfully!", "success");
        await loadMyScholarship();
    } catch (err) {
        const genErr = document.getElementById("scholarshipFormGeneralError");
        if (genErr) {
            genErr.textContent = err.message || "Failed to submit scholarship application.";
            genErr.classList.remove("hidden");
        }
        showFeatureToast(err.message || "Submission failed", "error");
    } finally {
        if (submitBtn) submitBtn.disabled = false;
        if (submitBtnText) submitBtnText.textContent = "Submit Scholarship Application";
    }
}

async function cancelScholarshipApplication(id) {
    if (!confirm("Are you sure you want to cancel your scholarship application?\n\nIMPORTANT POLICY:\nEach applicant is allowed only ONE scholarship application in total. Cancelling an existing application does NOT allow you to apply for another scholarship.")) {
        return;
    }

    try {
        await apiRequest(`/scholarships/${id}/cancel`, { method: "POST", auth: true });
        showFeatureToast("Scholarship application cancelled. You cannot apply for another scholarship per platform policy.", "success");
        closeModal("result-modal");
        await loadMyScholarship();
    } catch (err) {
        showFeatureToast(err.message, "error");
    }
}

async function loadMyScholarship() {
    const card = document.getElementById("my-scholarship-card");
    if (!card) return;

    try {
        const app = await apiRequest("/scholarships/my-application", { auth: true });
        if (!app || !app.applied) {
            card.innerHTML = `
                <div class="p-4 rounded-2xl bg-darkbg/60 border border-gray-800 space-y-2">
                    <p class="text-xs text-gray-400">You have not applied for any scholarship yet.</p>
                    <button onclick="switchTab('opportunities')" class="text-xs font-bold text-accentNeon hover:underline flex items-center gap-1">
                        Explore 5 Scholarship Categories →
                    </button>
                </div>
            `;
            return;
        }

        const isCancelled = app.is_cancelled || app.status === "CANCELLED";
        const status = app.status || (isCancelled ? "CANCELLED" : "SUBMITTED");
        let badgeColor = "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
        if (status === "APPROVED") badgeColor = "text-accentGreen bg-accentGreen/10 border-accentGreen/20";
        if (status === "REJECTED" || isCancelled) badgeColor = "text-red-400 bg-red-400/10 border-red-400/20";

        card.innerHTML = `
            <div class="p-4 rounded-2xl bg-darkbg/60 border border-gray-800 space-y-3">
                <div class="flex items-start justify-between gap-2">
                    <div>
                        <span class="inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${badgeColor}">
                            ● ${esc(status)}
                        </span>
                        <h4 class="font-bold text-sm text-white mt-1.5">${esc(app.category_title || app.category)}</h4>
                        <p class="text-[11px] text-gray-400 mt-0.5">Applied on ${String(app.created_at || "").substring(0, 10)}</p>
                    </div>
                </div>

                <div class="p-2.5 rounded-xl bg-gray-900/60 border border-gray-800 text-[11px] text-gray-300 space-y-1">
                    <div class="flex justify-between"><span class="text-gray-500">Applicant:</span> <b class="text-white">${esc(app.full_name)}</b></div>
                    <div class="flex justify-between"><span class="text-gray-500">Phone:</span> <span class="font-mono text-cyan-300">${esc(app.phone)}</span></div>
                    ${app.family_annual_income ? `<div class="flex justify-between"><span class="text-gray-500">Annual Income:</span> <span class="text-emerald-400 font-bold">₹${Number(app.family_annual_income).toLocaleString('en-IN')}</span></div>` : ''}
                    ${app.defence_relationship ? `<div class="flex justify-between"><span class="text-gray-500">Defence Ward:</span> <span>${esc(app.defence_relationship)}</span></div>` : ''}
                </div>

                ${!isCancelled && status === "SUBMITTED" ? `
                    <button onclick="cancelScholarshipApplication(${app.id})" class="w-full py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 font-bold text-xs transition">
                        <i class="fa-solid fa-ban mr-1"></i> Cancel Application
                    </button>
                ` : (isCancelled ? `
                    <p class="text-[10px] text-amber-400 italic">Application was cancelled. Per policy, quota has been utilized.</p>
                ` : '')}
            </div>
        `;
    } catch (_) {
        card.innerHTML = `<p class="text-xs text-gray-500">Could not load scholarship details.</p>`;
    }
}

function showExistingScholarshipModal(app) {
    const isCancelled = app.is_cancelled || app.status === "CANCELLED";
    const status = app.status || (isCancelled ? "CANCELLED" : "SUBMITTED");
    const quotaMsg = isCancelled
        ? "You have already used your scholarship application. Cancelling an application does not allow you to apply for another scholarship."
        : "You have already applied for a scholarship. You can apply for only one scholarship.";

    document.getElementById("result-modal-content").innerHTML = `
        <div class="space-y-4">
            <div class="w-14 h-14 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-300 text-2xl mx-auto">
                <i class="fa-solid fa-lock"></i>
            </div>
            <div class="text-center space-y-1">
                <h3 class="text-xl font-black text-white">One Scholarship Limit</h3>
                <p class="text-xs text-amber-300">${esc(quotaMsg)}</p>
            </div>
            <div class="p-4 rounded-2xl bg-darkbg/80 border border-gray-800 space-y-2 text-xs">
                <div class="flex justify-between"><span class="text-gray-400">Current Program:</span><b class="text-white">${esc(app.category_title || app.category)}</b></div>
                <div class="flex justify-between"><span class="text-gray-400">Status:</span><span class="font-bold ${status === 'APPROVED' ? 'text-emerald-400' : (status === 'REJECTED' || isCancelled ? 'text-red-400' : 'text-yellow-400')}">${esc(status)}</span></div>
                <div class="flex justify-between"><span class="text-gray-400">Applied Date:</span><span>${String(app.created_at || '').substring(0, 10)}</span></div>
            </div>
            ${!isCancelled && status === "SUBMITTED" ? `
                <button onclick="cancelScholarshipApplication(${app.id})" class="w-full py-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 font-bold text-xs hover:bg-red-500/30 transition">
                    Cancel Existing Application
                </button>
            ` : ''}
        </div>
    `;
    openModal("result-modal");
}

window.addEventListener("DOMContentLoaded",()=>{
    ["achievement-modal","trial-modal","result-modal","scout-connection-modal"].forEach(id=>document.getElementById(id)?.addEventListener("click",e=>{if(e.target.id===id)closeModal(id);}));
    document.getElementById("scholarshipModal")?.addEventListener("click", e => {
        if (e.target.id === "scholarshipModal") closeScholarshipForm();
    });
});

window.loadAthleteFeatures = loadAthleteFeatures;
window.loadDashboardTrials = loadDashboardTrials;
window.loadDashboard = loadDashboard;
window.loadTrials = loadTrials;
window.loadScouts = loadScouts;
window.showTrialSlots = showTrialSlots;
window.bookSlot = bookSlot;
window.addAchievement = addAchievement;
window.deleteAchievement = deleteAchievement;
window.submitAchievement = submitAchievement;
window.openTrialApplication = openTrialApplication;
window.submitTrialApplication = submitTrialApplication;
window.connectScout = connectScout;
window.findNearbyCoaches = findNearbyCoaches;
window.openCoachConnection = openCoachConnection;
window.submitCoachConnection = submitCoachConnection;
window.openScoutConnection = openScoutConnection;
window.submitScoutConnection = submitScoutConnection;
window.showBooking = showBooking;
window.openAchievementModal = openAchievementModal;
window.closeModal = closeModal;
window.runAIMatching = runAIMatching;
window.openScholarshipForm = openScholarshipForm;
window.closeScholarshipForm = closeScholarshipForm;
window.closeScholarshipSuccess = closeScholarshipSuccess;
window.toggleDefenceResourcesList = toggleDefenceResourcesList;
window.submitScholarshipApplication = submitScholarshipApplication;
window.cancelScholarshipApplication = cancelScholarshipApplication;
window.loadMyScholarship = loadMyScholarship;
