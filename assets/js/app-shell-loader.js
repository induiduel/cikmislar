(function(){
  const SHELL_CACHE_KEY = "QB_APP_SHELL_CACHE_V3";

  function isFastNav(){
    try{return sessionStorage.getItem("QB_FAST_NAV") === "1";}catch(e){return false;}
  }

  function suppressVisibleLoader(){
    if(!isFastNav()) return;
    document.body.classList.remove("is-loading");
    const overlays = document.querySelectorAll(".initial-loading-overlay");
    overlays.forEach(o=>{
      o.classList.add("hidden");
      o.setAttribute("aria-busy","false");
    });
  }

  async function fetchShellFresh(){
    const response = await fetch("partials/app-shell.html", {cache:"force-cache"});
    if(!response.ok) throw new Error("app-shell.html yüklenemedi: " + response.status);
    const html = await response.text();
    try{localStorage.setItem(SHELL_CACHE_KEY, html);}catch(e){}
    return html;
  }

  async function injectShell(){
    const mount = document.getElementById("appMount");
    if(!mount) throw new Error("appMount bulunamadı.");

    let cached = "";
    try{cached = localStorage.getItem(SHELL_CACHE_KEY) || "";}catch(e){}

    if(cached){
      mount.innerHTML = cached;
      suppressVisibleLoader();

      // Arka planda taze shell al. Bu geçişi yavaşlatmaz.
      fetchShellFresh().then(fresh=>{
        if(fresh && fresh !== cached){
          try{localStorage.setItem(SHELL_CACHE_KEY, fresh);}catch(e){}
        }
      }).catch(()=>{});
      return;
    }

    mount.innerHTML = await fetchShellFresh();
    suppressVisibleLoader();
  }

  function loadScript(src){
    return new Promise((resolve, reject)=>{
      const s = document.createElement("script");
      s.src = src;
      s.defer = true;
      s.onload = resolve;
      s.onerror = ()=>reject(new Error(src + " yüklenemedi."));
      document.body.appendChild(s);
    });
  }

  window.QuestionBankLoad = async function QuestionBankLoad(){
    try{
      await injectShell();
      await loadScript("assets/js/app.js");
      if(window.QuestionBankInitPromise) await window.QuestionBankInitPromise;
      suppressVisibleLoader();
      await loadScript("assets/js/page-router.js");
    }catch(err){
      const mount = document.getElementById("appMount");
      document.body.classList.remove("is-loading");
      if(mount){
        mount.innerHTML = '<main class="wrap"><section class="panel status warn"><b>Sayfa yüklenemedi:</b> ' + 
          String(err.message || err).replace(/[<>&]/g, ch => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[ch])) +
          '</section></main>';
      }
      console.error(err);
    }
  };

  document.addEventListener("DOMContentLoaded", window.QuestionBankLoad);
})();