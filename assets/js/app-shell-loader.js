(function(){
  async function injectShell(){
    const mount = document.getElementById("appMount");
    if(!mount) throw new Error("appMount bulunamadı.");

    const response = await fetch("partials/app-shell.html", {cache:"no-store"});
    if(!response.ok) throw new Error("app-shell.html yüklenemedi: " + response.status);

    mount.innerHTML = await response.text();
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
      await loadScript("assets/js/page-router.js");
    }catch(err){
      const mount = document.getElementById("appMount");
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