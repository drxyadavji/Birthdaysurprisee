(() => {
"use strict";
const $ = id => document.getElementById(id);
const audio = $("audioPlayer");
let currentItems = [], currentIndex = 0, musicEnabled = false;

/* ===================== MUSIC ENGINE =====================
   Two separate players so each one keeps its own position:
   - themeAudio   : the #audioPlayer element (website theme song, CONFIG.themeSong)
   - episodeAudio : created here, plays the current episode's song (episode.song)
   syncMusic() is the single place that decides what should be playing.
   Priority: modal music / playing video / music off  ->  everything paused
             inside an episode with a song             ->  episode song
             otherwise                                 ->  theme song               */
const themeAudio = audio;
const episodeAudio = new Audio();
const mediaAudio = new Audio(); // optional song for ONE photo/video (item.song)
themeAudio.loop = true; episodeAudio.loop = true; mediaAudio.loop = true;
episodeAudio.addEventListener("error",()=>{episodeAudio._bad=episodeAudio._src;syncMusic();});
mediaAudio.addEventListener("error",()=>{mediaAudio._bad=mediaAudio._src;syncMusic();});
let activeEpisode = null, appEntered = false, videoPlaying = false, modalOpen = false, needsGesture = false, viewerVideo = null, viewerItem = null;
function fadeIn(el){clearInterval(el._fade);el.volume=0;el._fade=setInterval(()=>{el.volume=Math.min(1,el.volume+.08);if(el.volume>=1)clearInterval(el._fade);},80);}
function pauseAudio(el){el._tok=(el._tok||0)+1;clearInterval(el._fade);el.pause();} // pause() keeps currentTime, so it can resume
function startAudio(el,src){
 if(!src) return;
 if(el._src!==src){el.src=src;el._src=src;try{el.currentTime=0;}catch(e){}}
 if(!el.paused) return;
 const tok=(el._tok=(el._tok||0)+1);
 el.volume=0;
 const p=el.play();
 if(p&&p.then) p.then(()=>{if(tok===el._tok)fadeIn(el);}).catch(err=>{if(err&&err.name==="NotAllowedError")needsGesture=true;});
}
function syncMusic(){
 if(!musicEnabled||!appEntered||videoPlaying||modalOpen){pauseAudio(themeAudio);pauseAudio(episodeAudio);pauseAudio(mediaAudio);return;}
 // Priority: photo/video song -> episode song -> theme song
 const mSong=viewerItem&&viewerItem.song&&mediaAudio._bad!==viewerItem.song?viewerItem.song:"";
 const epSong=activeEpisode&&activeEpisode.song&&episodeAudio._bad!==activeEpisode.song?activeEpisode.song:"";
 if(mSong){pauseAudio(themeAudio);pauseAudio(episodeAudio);startAudio(mediaAudio,mSong);}
 else if(epSong){pauseAudio(themeAudio);pauseAudio(mediaAudio);startAudio(episodeAudio,epSong);}
 else{pauseAudio(episodeAudio);pauseAudio(mediaAudio);startAudio(themeAudio,CONFIG.themeSong);}
}
function setMusicLabel(){$("musicToggle").innerHTML=musicEnabled?"♫ <span>Music on</span>":"♫ <span>Music off</span>";}
function exitEpisode(){activeEpisode=null;episodeAudio._src="";mediaAudio._src="";syncMusic();}
// If the browser blocked autoplay, the next tap anywhere starts the music.
document.addEventListener("click",()=>{if(needsGesture){needsGesture=false;syncMusic();}});
/* =================== END MUSIC ENGINE =================== */
let countdownAudio = null, suspenseContext = null, suspenseNodes = [], suspenseTimer = null;
let countdownMusicStarted = false;
const istTarget = new Date(CONFIG.birthdayISO).getTime();
const isBirthdayUnlocked = Date.now() >= istTarget;
$("gateName").textContent = CONFIG.name; $("gateSubtitle").textContent = CONFIG.introMessage;
$("introName").textContent = "My " + CONFIG.name; $("heroName").textContent = CONFIG.name;
$("heroSubtitle").textContent = `Every little memory has a place here. Every song has a reason. And every page says the same thing: you are loved, ${CONFIG.name}.`;
/* Optional hero picture (banner or background) from CONFIG.hero */
(function(){
  const cfg=CONFIG.hero; if(!cfg||!cfg.image) return;
  const hero=document.getElementById("home"), media=document.getElementById("heroMedia"); if(!hero||!media) return;
  const mode=cfg.mode==="banner"?"banner":"bg";
  const overlay=(typeof cfg.overlay==="number")?cfg.overlay:(mode==="bg"?0.55:0.15);
  hero.classList.add("hero--"+mode);
  media.style.setProperty("--hero-img",'url("'+String(cfg.image).replace(/"/g,"%22")+'")');
  media.style.setProperty("--hero-overlay",overlay);
  if(cfg.position) media.style.setProperty("--hero-pos",cfg.position);
})();

let birthdayAudioContext = null;
let birthdaySongAudio = null;
let birthdayCelebrationStarted = false;
let birthdayMusicTimer = null;
let birthdayMusicActive = false;
let birthdayHeartsTimer = null;
let birthdayMelodyIndex = 0;
let candlesBlown = false;
let cakeCut = false;

function birthdayHeartShower(){
 const layer = $("birthdayHearts");
 if(!layer || birthdayHeartsTimer) return;
 const symbols = ["♥","♡","💗","💕","💖","✦"];
 const makeHeart = () => {
  const heart = document.createElement("span");
  heart.className = "birthday-falling-heart";
  heart.textContent = symbols[Math.floor(Math.random()*symbols.length)];
  heart.style.left = `${Math.random()*100}%`;
  heart.style.fontSize = `${15+Math.random()*25}px`;
  heart.style.setProperty("--fall-time",`${4+Math.random()*4}s`);
  heart.style.setProperty("--heart-drift",`${Math.round(Math.random()*150-75)}px`);
  layer.append(heart);
  setTimeout(()=>heart.remove(),8500);
 };
 for(let i=0;i<32;i++) setTimeout(makeHeart,i*75);
 birthdayHeartsTimer = setInterval(makeHeart,230);
}

function playBirthdayInstrumental(){
 const AudioCtx = window.AudioContext || window.webkitAudioContext;
 if(!AudioCtx) return false;
 try {
  if(!birthdayAudioContext || birthdayAudioContext.state === "closed"){
   birthdayAudioContext = new AudioCtx();
  }
  const ctx = birthdayAudioContext;
  const melody = [
   [392.00,.42],[392.00,.22],[440.00,.65],[392.00,.65],[523.25,.65],[493.88,1.0],
   [392.00,.42],[392.00,.22],[440.00,.65],[392.00,.65],[587.33,.65],[523.25,1.0],
   [392.00,.42],[392.00,.22],[783.99,.65],[659.25,.65],[523.25,.65],[493.88,.65],[440.00,1.0],
   [698.46,.42],[698.46,.22],[659.25,.65],[523.25,.65],[587.33,.65],[523.25,1.1]
  ];
  const startMelody = () => {
   if(!birthdayAudioContext || ctx.state !== "running" || birthdayMusicActive) return;
   birthdayMusicActive = true;
   const playNext = () => {
    if(!birthdayMusicActive || !birthdayAudioContext || ctx.state !== "running") return;
    const [frequency,duration] = melody[birthdayMelodyIndex % melody.length];
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const overtone = ctx.createOscillator();
    const gain = ctx.createGain();
    const tone = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = "triangle";
    osc.frequency.value = frequency;
    overtone.type = "sine";
    overtone.frequency.value = frequency*2;
    tone.gain.value = .17;
    filter.type = "lowpass";
    filter.frequency.value = 2600;
    gain.gain.setValueAtTime(.0001,now);
    gain.gain.exponentialRampToValueAtTime(.32,now+.035);
    gain.gain.setValueAtTime(.32,now+Math.max(.08,duration*.55));
    gain.gain.exponentialRampToValueAtTime(.0001,now+duration*.92);
    osc.connect(filter); overtone.connect(tone); tone.connect(filter);
    filter.connect(gain); gain.connect(ctx.destination);
    osc.start(now); overtone.start(now);
    osc.stop(now+duration); overtone.stop(now+duration);
    birthdayMelodyIndex++;
    birthdayMusicTimer = setTimeout(playNext, duration*850);
   };
   playNext();
  };
  ctx.resume().then(() => {
   if(ctx.state === "running") startMelody();
  }).catch(()=>{});
  return true;
 } catch(err) {
  console.warn("Birthday instrumental could not start:",err);
  return false;
 }
}

function startBirthdayMusic(){
 stopBirthdayInstrumental();
 const customTrack = (CONFIG.birthdaySong || "").trim();
 if(customTrack){
  try {
   birthdaySongAudio = new Audio(customTrack);
   birthdaySongAudio.loop = true;
   birthdaySongAudio.volume = 0.82;
   const playPromise = birthdaySongAudio.play();
   if(playPromise && playPromise.then){
    playPromise.then(()=>{
     $("birthdayMusicBtn").textContent = "♫ Birthday music playing";
     $("birthdayMusicHint").textContent = "Enjoy your birthday song, Bhavuuu! 💗";
    }).catch(()=>{
     $("birthdayMusicBtn").textContent = "♫ Tap to play birthday music";
     $("birthdayMusicHint").textContent = "Your browser blocked automatic sound. Tap the music button to start it.";
    });
   }
   return;
  } catch(err) {
   console.warn("Could not load custom birthday song:",err);
  }
 }
 const started = playBirthdayInstrumental();
 $("birthdayMusicBtn").textContent = started ? "♫ Birthday music playing" : "♫ Tap to play birthday music";
 $("birthdayMusicHint").textContent = "Using the built-in birthday instrumental. If sound is blocked, tap the music button.";
}

function stopBirthdayInstrumental(){
 birthdayMusicActive = false;
 if(birthdaySongAudio){
  birthdaySongAudio.pause();
  birthdaySongAudio.currentTime = 0;
  birthdaySongAudio = null;
 }
 if(birthdayMusicTimer) clearTimeout(birthdayMusicTimer);
 birthdayMusicTimer = null;
 if(birthdayAudioContext && birthdayAudioContext.state !== "closed"){
  birthdayAudioContext.close().catch(()=>{});
 }
 birthdayAudioContext = null;
 birthdayMelodyIndex = 0;
}

function startBirthdayCelebration(){
 if(birthdayCelebrationStarted) return;
 birthdayCelebrationStarted = true;
 stopCountdownMusic();
 $("countdown").classList.add("hidden");
 $("birthdayIntro").classList.remove("hidden");
 birthdayHeartShower();
 // Attempt autoplay immediately; browsers may require a tap before allowing sound.
 startBirthdayMusic();
}


function showApp(){ stopBirthdayInstrumental(); if(birthdayHeartsTimer) clearInterval(birthdayHeartsTimer); birthdayHeartsTimer=null; $("birthdayIntro").classList.add("hidden"); $("app").classList.remove("hidden"); }
function updateCountdown(){
 const diff=istTarget-Date.now();
 if(diff<=0){ startBirthdayCelebration(); return; }
 const d=Math.floor(diff/86400000),h=Math.floor(diff%86400000/3600000),m=Math.floor(diff%3600000/60000),s=Math.floor(diff%60000/1000);
 $("days").textContent=String(d).padStart(2,"0");$("hours").textContent=String(h).padStart(2,"0");$("minutes").textContent=String(m).padStart(2,"0");$("seconds").textContent=String(s).padStart(2,"0");
}
function stopCountdownMusic(){
 if(countdownAudio){countdownAudio.pause();countdownAudio.currentTime=0;countdownAudio=null;}
 if(suspenseTimer){clearInterval(suspenseTimer);suspenseTimer=null;}
 suspenseNodes.forEach(node=>{try{node.stop?.();}catch(e){} try{node.disconnect?.();}catch(e){}});
 suspenseNodes=[];
 if(suspenseContext && suspenseContext.state!="closed") suspenseContext.close().catch(()=>{});
 suspenseContext=null;
}
function playSuspenseInstrumental(){
 const AudioCtx=window.AudioContext||window.webkitAudioContext;
 if(!AudioCtx) return false;
 try{
  suspenseContext=new AudioCtx();
  const ctx=suspenseContext;
  const master=ctx.createGain(); master.gain.value=0.12; master.connect(ctx.destination);
  const drone=ctx.createOscillator(); drone.type="sawtooth"; drone.frequency.value=55;
  const droneGain=ctx.createGain(); droneGain.gain.value=0.18; drone.connect(droneGain); droneGain.connect(master); drone.start(); suspenseNodes.push(drone,droneGain,master);
  const notes=[110,130.81,146.83,123.47,98,116.54]; let step=0;
  const playPulse=()=>{
   if(!suspenseContext||ctx.state!=="running") return;
   const osc=ctx.createOscillator(), gain=ctx.createGain();
   osc.type="triangle"; osc.frequency.value=notes[step++%notes.length];
   gain.gain.setValueAtTime(0.0001,ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.20,ctx.currentTime+.08); gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+1.35);
   osc.connect(gain);gain.connect(master);osc.start();osc.stop(ctx.currentTime+1.4);suspenseNodes.push(osc,gain);
  };
  playPulse(); suspenseTimer=setInterval(playPulse,1450); return true;
 }catch(err){console.warn("Suspense instrumental could not start:",err);return false;}
}
function startCountdownMusic(){
 if(countdownMusicStarted) stopCountdownMusic();
 countdownMusicStarted=true;
 const custom=(CONFIG.countdownSong||"").trim();
 if(custom){
  try{
   countdownAudio=new Audio(custom); countdownAudio.loop=true; countdownAudio.volume=.68;
   const promise=countdownAudio.play();
   if(promise&&promise.catch) promise.catch(()=>{
    $("countdownMusicBtn").textContent="♫ Tap to play suspense music";
    $("countdownMusicHint").textContent="Your browser blocked autoplay. Tap the music button to start your chosen track.";
   });
   $("countdownMusicBtn").textContent="♫ Suspense music playing";
   $("countdownMusicHint").textContent="The countdown has its own soundtrack. Change it any time in config.js.";
   return;
  }catch(err){console.warn("Could not load countdown track:",err);}
 }
 const started=playSuspenseInstrumental();
 $("countdownMusicBtn").textContent=started?"♫ Suspense music playing":"♫ Tap to play suspense music";
 $("countdownMusicHint").textContent="Using the built-in suspense instrumental. If sound is blocked, tap the music button.";
}
function unlockWebsite(){
 $("passwordGate").classList.add("hidden");
 if(isBirthdayUnlocked){startBirthdayCelebration();}
 else{
  $("countdown").classList.remove("hidden");
  updateCountdown(); setInterval(updateCountdown,1000);
  startCountdownMusic();
 }
}
$("passwordForm").addEventListener("submit",event=>{
 event.preventDefault();
 const entered=$("sitePasswordInput").value;
 if(entered===String(CONFIG.sitePassword||"")){
  $("passwordError").textContent="";
  unlockWebsite();
 }else{
  $("passwordError").textContent="That password doesn't match. Try again, sweetheart. ♡";
  $("sitePasswordInput").select();
 }
});
$("countdownMusicBtn").addEventListener("click",()=>{countdownMusicStarted=false;startCountdownMusic();});
// Password gate always comes first. Audio starts immediately after the visitor unlocks the countdown.
$("birthdayMusicBtn").addEventListener("click",()=>{
 birthdayMelodyIndex=0;
 startBirthdayMusic();
});
$("blowCandlesBtn").addEventListener("click",()=>{
 if(candlesBlown) return;
 candlesBlown=true;
 $("birthdayCake").classList.add("candles-blown");
 $("cakeMessage").textContent="Wish made! All your candles are glowing in the stars now. ✨";
 $("blowCandlesBtn").classList.add("hidden");
 $("cutCakeBtn").classList.remove("hidden");
 birthdayHeartShower();
 if(!birthdayMusicActive) playBirthdayInstrumental();
});
$("cutCakeBtn").addEventListener("click",()=>{
 if(cakeCut) return;
 cakeCut=true;
 $("birthdayCake").classList.add("cake-cut");
 $("cakeMessage").textContent="A sweet slice for the sweetest girl. Happy Birthday, Bhavuuu! 💗";
 $("cutCakeBtn").textContent="Cake cut! 💗";
 $("cutCakeBtn").disabled=true;
 birthdayHeartShower();
});
$("enterBtn").addEventListener("click",()=>{showApp(); appEntered=true; musicEnabled=true; setMusicLabel(); syncMusic();});
$("browseBtn").addEventListener("click",()=>$("seasons").scrollIntoView({behavior:"smooth"}));
document.querySelectorAll("[data-home]").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();window.scrollTo({top:0,behavior:"smooth"});}));
function mediaSlots(ep){return ep.media||[];}
function card(title,desc,num,fn){const el=document.createElement("article");el.className="season-card";el.innerHTML=`<div class="number">${num}</div><h3>${escapeHTML(title)}</h3><p>${escapeHTML(desc||"A chapter in our little universe.")}</p><span class="open">Open chapter ↗</span>`;el.addEventListener("click",fn);return el;}
function escapeHTML(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
const seasonGrid=$("seasonGrid");
CONFIG.seasons.forEach((season,i)=>seasonGrid.append(card(season.title,season.description,`0${i+1}`,()=>renderEpisodeList(season,`SEASON ${i+1}`))));
seasonGrid.append(card(CONFIG.friendsSeason.title,CONFIG.friendsSeason.description||"Birthday wishes from the people who love you.",String(CONFIG.seasons.length+1).padStart(2,"0"),()=>renderFriendEpisodes()));
function renderEpisodeList(season,kicker){
 exitEpisode();
 $("episodeKicker").textContent=kicker;$("episodeTitle").textContent=season.title;$("episodeDesc").textContent=season.description||"Choose a memory collection.";
 const grid=$("mediaGrid");grid.className="season-grid";grid.innerHTML="";
 (season.episodes||[]).forEach((ep,i)=>grid.append(card(ep.title,ep.description,`EP ${i+1}`,()=>openEpisode(ep,ep.title))));
 $("episodeView").classList.remove("hidden");$("episodeView").scrollIntoView({behavior:"smooth"});
}
function renderFriendEpisodes(){
 const fs=CONFIG.friendsSeason;
 const toMedia=ep=>ep.media||(ep.friends||[]).map(f=>({type:f.video?"video":(f.voice?"audio":(f.photo?"image":"text")),src:f.video||f.voice||f.photo||"",caption:f.name||"",message:f.message||""}));
 const pseudo={title:fs.title,description:fs.description||"Choose a collection of birthday wishes.",episodes:fs.episodes.map(ep=>{const media=toMedia(ep);return{title:ep.title,song:ep.song||"",songTitle:ep.songTitle||"",description:ep.description||`${media.length} wishes`,media};})};
 renderEpisodeList(pseudo,"FRIENDS' WISHES");
}
function openEpisode(ep,title){
 currentItems=mediaSlots(ep);currentIndex=0;activeEpisode=ep;episodeAudio._src="";episodeAudio._bad="";syncMusic();$("episodeKicker").textContent="NOW PLAYING";$("episodeTitle").textContent=title;$("episodeDesc").textContent=ep.description||"";
 const grid=$("mediaGrid");grid.className="media-grid";grid.innerHTML="";
 currentItems.forEach((item,i)=>{const c=document.createElement("article");c.className="media-card";const thumb=document.createElement("div");thumb.className="media-thumb";
 if(item.type==="text"){thumb.textContent="✉️ Written message";}else if(item.type==="audio"){thumb.textContent="🎙️ Voice message";}else if(item.src){const el=document.createElement(item.type==="video"?"video":"img");el.src=item.src;el.muted=true;el.preload="metadata";el.alt=item.caption||"Memory";thumb.append(el);}else{thumb.textContent=`♡ Memory ${i+1} · add your media`;}
 const p=document.createElement("p");p.textContent=CONFIG.showCaptionsInGrid?(item.caption||`Memory ${i+1}`):(item.type==="video"?`Video ${i+1}`:(item.type==="audio"?"Voice message":(item.type==="text"?"Written message":`Memory ${i+1}`)));c.append(thumb,p);c.addEventListener("click",()=>{currentItems=mediaSlots(ep);openViewer(i);});grid.append(c);});
 $("episodeView").classList.remove("hidden");$("episodeView").scrollIntoView({behavior:"smooth"});
}
$("backSeasons").addEventListener("click",()=>{$("episodeView").classList.add("hidden");$("seasons").scrollIntoView({behavior:"smooth"});exitEpisode();});
function openViewer(i){currentIndex=i;renderViewer();$("viewer").classList.remove("hidden");document.body.style.overflow="hidden";}
function renderViewer(){
 const item=currentItems[currentIndex];if(!item)return;viewerItem=item;const host=$("viewerMedia");viewerVideo=null;host.innerHTML="";
 if(item.type==="text"){const card=document.createElement("div");card.className="written-card";const icon=document.createElement("div");icon.className="written-icon";icon.textContent="✉️";const txt=document.createElement("p");txt.textContent=item.message||"";card.append(icon,txt);host.append(card);}
 else if(item.type==="audio"){const card=document.createElement("div");card.className="voice-card";const icon=document.createElement("div");icon.className="voice-icon";icon.textContent="🎙️";card.append(icon);if(item.src){const el=document.createElement("audio");el.src=item.src;el.controls=true;el.preload="auto";viewerVideo=el;const sync=()=>{if(viewerVideo!==el)return;videoPlaying=!el.paused&&!el.ended;syncMusic();};["play","playing","pause","ended"].forEach(ev=>el.addEventListener(ev,sync));card.append(el);host.append(card);const ap=el.play();if(ap&&ap.catch)ap.catch(()=>{if(viewerVideo===el){videoPlaying=false;syncMusic();}});}else{const n=document.createElement("p");n.textContent="Add the voice message file path in config.js";card.append(n);host.append(card);}}
 else if(item.src){const el=document.createElement(item.type==="video"?"video":"img");el.src=item.src;el.alt=item.caption||"Memory";if(item.type==="video"){el.controls=true;el.playsInline=true;viewerVideo=el;const sync=()=>{if(viewerVideo!==el)return;videoPlaying=!el.paused&&!el.ended;syncMusic();};["play","playing","pause","ended"].forEach(ev=>el.addEventListener(ev,sync));}host.append(el);if(item.type==="video"){const vp=el.play();if(vp&&vp.catch)vp.catch(()=>{if(viewerVideo===el){videoPlaying=false;syncMusic();}});}}
 else {const placeholder=document.createElement("div");placeholder.textContent="Add your photograph or video path in config.js";placeholder.style.cssText="font:1.5rem Caveat;color:#efb9c8";host.append(placeholder);}
 $("viewerCaption").textContent=item.caption||"";$("viewerSong").textContent=(item.song&&item.songTitle)||(activeEpisode&&activeEpisode.songTitle)||"";$("viewerMessage").textContent=item.type==="text"?"":(item.message||"");
 videoPlaying=!!viewerVideo;syncMusic(); // a new video autoplays, so keep the music paused straight away; otherwise music may resume
}
function closeViewer(){$("viewer").classList.add("hidden");document.body.style.overflow="";viewerVideo=null;viewerItem=null;$("viewerMedia").innerHTML="";videoPlaying=false;syncMusic();}
$("closeViewer").addEventListener("click",closeViewer);
$("prevMedia").addEventListener("click",()=>{currentIndex=(currentIndex-1+currentItems.length)%currentItems.length;renderViewer();});
$("nextMedia").addEventListener("click",()=>{currentIndex=(currentIndex+1)%currentItems.length;renderViewer();});
$("viewer").addEventListener("click",e=>{if(e.target===$("viewer"))closeViewer();});
document.addEventListener("keydown",e=>{if(!$("viewer").classList.contains("hidden")){if(e.key==="Escape")closeViewer();if(e.key==="ArrowLeft")$("prevMedia").click();if(e.key==="ArrowRight")$("nextMedia").click();}});
let touchX=0;$("viewer").addEventListener("touchstart",e=>touchX=e.changedTouches[0].screenX,{passive:true});$("viewer").addEventListener("touchend",e=>{const dx=e.changedTouches[0].screenX-touchX;if(Math.abs(dx)>55)(dx<0?$("nextMedia"):$("prevMedia")).click();},{passive:true});
$("musicToggle").addEventListener("click",()=>{musicEnabled=!musicEnabled;setMusicLabel();syncMusic();});
const notes=$("notesGrid");CONFIG.loveNotes.forEach((note,i)=>{const b=document.createElement("button");b.className="note-card";b.style.setProperty("--tilt",`${(i%2?1:-1)*((i%3)+1)}deg`);b.textContent="Open me ♡";b.addEventListener("click",()=>openLetter(note));notes.append(b);});
let loveRainTimer = null;
let noteAudioContext = null;
let noteMusicTimer = null;
let noteMusicNodes = [];
let noteRainActive = false;

function startLoveHeartRain(){
 noteRainActive = true;
 const makeHeart = () => {
  if(!noteRainActive) return;
  const heart = document.createElement("span");
  heart.className = "love-rain-heart";
  heart.textContent = ["♡","♥","💗","💕"][Math.floor(Math.random()*4)];
  heart.style.left = `${Math.random()*100}vw`;
  heart.style.fontSize = `${16+Math.random()*22}px`;
  heart.style.setProperty("--fall-duration",`${3.4+Math.random()*2.4}s`);
  heart.style.setProperty("--drift",`${Math.round(Math.random()*140-70)}px`);
  document.body.append(heart);
  setTimeout(()=>heart.remove(),6200);
 };
 for(let i=0;i<18;i++) setTimeout(makeHeart,i*95);
 loveRainTimer = setInterval(makeHeart,260);
}
function stopLoveHeartRain(){
 noteRainActive = false;
 if(loveRainTimer) clearInterval(loveRainTimer);
 loveRainTimer = null;
 document.querySelectorAll(".love-rain-heart").forEach(el=>el.remove());
}
function startOriginalNoteMusic(){
 const AudioCtx = window.AudioContext || window.webkitAudioContext;
 if(!AudioCtx) return;
 try {
  noteAudioContext = new AudioCtx();
  const ctx = noteAudioContext;
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -18;
  compressor.knee.value = 18;
  compressor.ratio.value = 4;
  compressor.attack.value = 0.008;
  compressor.release.value = 0.22;
  const master = ctx.createGain();
  master.gain.value = 0.78;
  master.connect(compressor);
  compressor.connect(ctx.destination);

  // Warm, romantic C–G–Am–F progression with soft sustained chords
  // and a gentle piano-like arpeggio. All sound is synthesized locally.
  const chords = [
   [261.63,329.63,392.00], // C
   [196.00,246.94,293.66], // G
   [220.00,261.63,329.63], // Am
   [174.61,220.00,261.63]  // F
  ];
  const arpeggios = [
   [523.25,659.25,783.99,659.25],
   [493.88,587.33,783.99,587.33],
   [440.00,523.25,659.25,523.25],
   [440.00,523.25,698.46,523.25]
  ];
  let chordIndex = 0;
  let arpIndex = 0;

  const playPad = (frequencies) => {
   const now = ctx.currentTime;
   frequencies.forEach((frequency, index) => {
    const osc = ctx.createOscillator();
    const voiceGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = "sine";
    osc.frequency.value = frequency;
    filter.type = "lowpass";
    filter.frequency.value = 1100;
    voiceGain.gain.setValueAtTime(0.0001, now);
    voiceGain.gain.exponentialRampToValueAtTime(0.075, now + 0.45);
    voiceGain.gain.setValueAtTime(0.075, now + 1.65);
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.35);
    osc.connect(filter);
    filter.connect(voiceGain);
    voiceGain.connect(master);
    osc.start(now);
    osc.stop(now + 2.4);
    noteMusicNodes.push(osc);
    osc.onended = () => { noteMusicNodes = noteMusicNodes.filter(n => n !== osc); };
   });
  };

  const playArpeggio = () => {
   if(!noteAudioContext || ctx.state === "closed") return;
   const now = ctx.currentTime;
   const frequency = arpeggios[chordIndex][arpIndex % 4];
   arpIndex++;
   const osc = ctx.createOscillator();
   const voiceGain = ctx.createGain();
   const low = ctx.createBiquadFilter();
   osc.type = "triangle";
   osc.frequency.value = frequency;
   low.type = "lowpass";
   low.frequency.value = 2400;
   voiceGain.gain.setValueAtTime(0.0001, now);
   voiceGain.gain.exponentialRampToValueAtTime(0.20, now + 0.025);
   voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.62);
   osc.connect(low);
   low.connect(voiceGain);
   voiceGain.connect(master);
   osc.start(now);
   osc.stop(now + 0.65);
   noteMusicNodes.push(osc);
   osc.onended = () => { noteMusicNodes = noteMusicNodes.filter(n => n !== osc); };
  };

  const begin = () => {
   if(!noteAudioContext || ctx.state === "closed") return;
   ctx.resume().then(() => {
    if(!noteAudioContext || ctx.state !== "running") return;
    playPad(chords[chordIndex]);
    playArpeggio();
   }).catch(() => {});
  };

  begin();
  noteMusicTimer = setInterval(() => {
   if(!noteAudioContext || ctx.state === "closed") return;
   arpIndex = 0;
   chordIndex = (chordIndex + 1) % chords.length;
   begin();
   const arpTimer = setInterval(() => {
    if(!noteAudioContext || ctx.state === "closed") { clearInterval(arpTimer); return; }
    playArpeggio();
   }, 390);
   setTimeout(() => clearInterval(arpTimer), 1550);
  }, 2400);
  ctx.resume().catch(() => {});
 } catch(e) {
  noteAudioContext = null;
  console.warn("Love-note music could not start:", e);
 }
}
let modalSongAudio = null;
function stopModalMusic(){
 if(modalSongAudio){
  modalSongAudio.pause();
  modalSongAudio.currentTime = 0;
  modalSongAudio = null;
 }
 if(noteMusicTimer) clearInterval(noteMusicTimer);
 noteMusicTimer = null;
 noteMusicNodes.forEach(n=>{try{n.stop();}catch(e){}});
 noteMusicNodes = [];
 if(noteAudioContext){noteAudioContext.close().catch(()=>{});noteAudioContext=null;}
}
function startModalMusic(songPath, sectionLabel){
 stopModalMusic();
 modalOpen = true; syncMusic();
 const customTrack = (songPath || "").trim();
 if(customTrack){
  try {
   modalSongAudio = new Audio(customTrack);
   modalSongAudio.loop = true;
   modalSongAudio.volume = 0.72;
   modalSongAudio.play().catch(err=>{
    console.warn(`${sectionLabel} music was blocked or could not load:`,err);
   });
   return;
  } catch(err) {
   console.warn(`Could not load ${sectionLabel} song:`,err);
  }
 }
 // If no custom MP3 is supplied, play the built-in romantic instrumental.
 startOriginalNoteMusic();
}
function stopLoveNoteMusic(){
 stopModalMusic();
 modalOpen = false; syncMusic();
}

function openLetter(text){
 $("letterText").textContent=text;
 $("letterModal").classList.remove("hidden");
 startLoveHeartRain();
 startModalMusic(CONFIG.loveNoteSong, "Love notes");
}
function closeLetter(){
 $("letterModal").classList.add("hidden");
 stopLoveHeartRain();
 stopLoveNoteMusic();
}
$("closeLetter").addEventListener("click",closeLetter);
$("letterModal").addEventListener("click",e=>{if(e.target===$("letterModal"))closeLetter();});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("letterModal").classList.contains("hidden"))closeLetter();});
/* ---- Friends' wishes (home section): shows every message from CONFIG.friends and from the Season 4 friends' episodes ---- */
(function(){
 const grid=$("friendsGrid");if(!grid)return;
 const wishes=[];
 (CONFIG.friends||[]).forEach(f=>wishes.push({type:f.video?"video":(f.voice?"audio":(f.photo?"image":"text")),src:f.video||f.voice||f.photo||"",caption:f.name||"",message:f.message||"",song:f.song||"",songTitle:f.songTitle||"",title:f.name||"A friend"}));
 ((CONFIG.friendsSeason&&CONFIG.friendsSeason.episodes)||[]).forEach(ep=>{
  const list=ep.media||(ep.friends||[]).map(f=>({type:f.video?"video":(f.voice?"audio":(f.photo?"image":"text")),src:f.video||f.voice||f.photo||"",caption:f.name||"",message:f.message||""}));
  list.forEach((m,k)=>wishes.push({...m,title:m.caption||(list.length>1?`${ep.title} · ${k+1}`:ep.title)}));
 });
 if(!wishes.length)return;
 grid.innerHTML="";
 const label={video:"🎥 Video message",audio:"🎙️ Voice message",text:"✉️ Written message",image:"📷 Photo message"};
 const items=wishes.map(w=>{const{title,...item}=w;return item;});
 wishes.forEach((w,i)=>{
  const c=document.createElement("article");c.className="friend-card wish-card";c.tabIndex=0;c.setAttribute("role","button");
  const t=document.createElement("p");t.className="wish-type";t.textContent=label[w.type]||label.text;
  const h=document.createElement("h3");h.textContent=w.title;
  const p=document.createElement("p");p.className="wish-preview";const msg=(w.message||"").trim();p.textContent=msg.length>150?msg.slice(0,150).trim()+"…":msg;
  const o=document.createElement("span");o.className="wish-open";o.textContent="Open wish ↗";
  c.append(t,h);if(msg)c.append(p);c.append(o);
  const open=()=>{currentItems=items;openViewer(i);};
  c.addEventListener("click",open);c.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();open();}});
  grid.append(c);
 });
})();
$("surpriseBtn").addEventListener("click",()=>{$("surpriseText").textContent=CONFIG.surprises[Math.floor(Math.random()*CONFIG.surprises.length)];});
$("randomBtn").addEventListener("click",()=>{const all=CONFIG.seasons.flatMap(s=>s.episodes.flatMap(e=>e.media)).filter(m=>m.src);if(all.length){currentItems=all;openViewer(Math.floor(Math.random()*all.length));}else{$("surpriseText").textContent="Your favourite memories are waiting to be added in config.js. ♡";$("surprises").scrollIntoView({behavior:"smooth"});}});
/* **text** -> bold + highlighted (escaped first, so it is safe) */
function richText(s){return escapeHTML(s).replace(/\*\*([\s\S]+?)\*\*/g,'<mark class="hl">$1</mark>');}
$("proposalText").innerHTML=richText(CONFIG.proposal.message);
function openProposal(){
 $("proposalModal").classList.remove("hidden");
 startModalMusic(CONFIG.proposalSong, "Proposal");
}
function closeProposal(){
 hideYesSurprise();
 $("proposalModal").classList.add("hidden");
 stopLoveNoteMusic();
}
$("proposalBtn").addEventListener("click",openProposal);
$("closeProposal").addEventListener("click",closeProposal);
$("proposalModal").addEventListener("click",e=>{if(e.target===$("proposalModal"))closeProposal();});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("proposalModal").classList.contains("hidden"))closeProposal();});
/* ---- Surprise after YES (CONFIG.proposal.yesSurprise) ----
   Hidden until YES is clicked. Order: YES response first -> short delay -> animated surprise. */
let yesSurpriseTimer=null;
function hideYesSurprise(){
 clearTimeout(yesSurpriseTimer);yesSurpriseTimer=null;
 const box=$("yesSurprise");if(!box)return;
 box.classList.add("hidden");box.innerHTML="";
}
function showYesSurprise(){
 const cfg=CONFIG.proposal.yesSurprise;
 const box=$("yesSurprise");
 if(!cfg||cfg.enabled===false||!box)return;
 box.innerHTML="";
 const title=document.createElement("h3");title.className="ys-title";title.textContent=cfg.title||"One more surprise... 🎁";box.append(title);
 const step=.9;
 (cfg.lines||[]).forEach((txt,i)=>{const p=document.createElement("p");p.className="ys-line";p.style.animationDelay=`${.6+i*step}s`;p.textContent=txt;box.append(p);});
 if(cfg.signature){const s=document.createElement("p");s.className="ys-sign";s.style.animationDelay=`${.6+(cfg.lines||[]).length*step+.4}s`;s.textContent=cfg.signature;box.append(s);}
 for(let i=0;i<14;i++){const h=document.createElement("span");h.className="ys-heart";h.textContent=["❤️","💖","✨","💗"][i%4];h.style.left=`${4+Math.random()*90}%`;h.style.animationDelay=`${Math.random()*4}s`;box.append(h);}
 box.classList.remove("hidden");
 box.scrollIntoView({behavior:"smooth",block:"center"});
 if((cfg.song||"").trim()) startModalMusic(cfg.song,"Surprise"); // optional; otherwise the proposal music keeps playing
}
$("yesBtn").addEventListener("click",()=>{
 $("proposalResponse").textContent=CONFIG.proposal.yesResponse;confetti();
 hideYesSurprise();
 const cfg=CONFIG.proposal.yesSurprise;
 if(cfg&&cfg.enabled!==false) yesSurpriseTimer=setTimeout(showYesSurprise,cfg.delayMs==null?3500:Math.max(0,cfg.delayMs));
});
$("hugBtn").addEventListener("click",()=>{hideYesSurprise();$("proposalResponse").textContent=CONFIG.proposal.hugResponse;});
/* ---- One Little Thing From My Heart: layer 1 warning -> layer 2 note ---- */
(function(){
 const cfg=CONFIG.heartNote;const sec=$("heartNote");
 if(!cfg||cfg.enabled===false||!sec)return;
 $("heartEyebrow").textContent=cfg.sectionEyebrow;$("heartTitle").textContent=cfg.sectionTitle;$("heartSectionText").textContent=cfg.sectionText;
 $("heartOpenBtn").textContent=cfg.openButton;$("heartWarnTitle").textContent=cfg.warningTitle;$("heartWarnText").textContent=cfg.warningText;
 $("heartContinueBtn").textContent=cfg.continueButton;$("heartBackBtn").textContent=cfg.backButton;
 $("heartNoteText").innerHTML=richText(cfg.message);
 sec.classList.remove("hidden");
 const warn=$("heartWarnModal"),note=$("heartNoteModal");
 const closeAll=()=>{warn.classList.add("hidden");note.classList.add("hidden");};
 $("heartOpenBtn").addEventListener("click",()=>warn.classList.remove("hidden"));
 $("heartBackBtn").addEventListener("click",closeAll);
 $("heartContinueBtn").addEventListener("click",()=>{warn.classList.add("hidden");note.classList.remove("hidden");note.scrollTop=0;});
 $("closeHeartNote").addEventListener("click",closeAll);
 [warn,note].forEach(m=>m.addEventListener("click",e=>{if(e.target===m)closeAll();}));
 document.addEventListener("keydown",e=>{if(e.key==="Escape")closeAll();});
})();
function confetti(){for(let i=0;i<45;i++){const el=document.createElement("span");el.textContent=["♡","✦","🌹"][i%3];el.style.cssText=`position:fixed;z-index:40;left:${Math.random()*100}vw;top:-30px;color:#efb9c8;font-size:${16+Math.random()*20}px;pointer-events:none;transition:transform 2.5s ease,opacity 2.5s`;document.body.append(el);requestAnimationFrame(()=>{el.style.transform=`translateY(${80+Math.random()*100}vh) rotate(${Math.random()*500}deg)`;el.style.opacity=0;});setTimeout(()=>el.remove(),2700);}}
})();