const DB_DIRS = ["db", ""];
    const DB_EXTENSIONS = [".db", ".sdb"];
    const SEQUENTIAL_SCAN_MAX = 500;
    const STORAGE_KEY = "database_loader_question_bank_progress_v4";
    const DB_FILE_LIST_CACHE_KEY = "question_bank_db_file_list_cache_v2";
    const DB_CONTENT_CACHE_NAME = "question_bank_indexeddb_cache_v2";
    const DB_CONTENT_STORE_NAME = "dbFiles";
    const LAST_POSITION_KEY = "question_bank_last_positions_v1";
    const STUDY_TIME_KEY = "question_bank_study_time_v1";

    let dbFiles = [];
    let questions = [];
    let answers = {};
    let current = 0;
    let filters = {subject:"all", exam:"all", year:"all", teacher:"all", sourceGroup:"all", search:""};
    let infoOpen = false;
    let listMode = "all";
    let hiddenQuestionIds = [];
    let starredQuestionIds = [];
    let unknownQuestionIds = [];
    let quizActive = false;
    let quizIds = [];
    let quizTitle = "";
    let examMode = false;
    let examSubject = "all";
    let examTeacher = "all";
    let examIds = [];
    let examRemaining = 20;
    let examTimerHandle = null;
    let lastExamQuestionKey = "";
    let selectedDbFiles = [];
    let fontSize = "normal";
    let designMode = "standard";
    let themeColor = "blue";
    let duplicateMode = "all";
    let duplicateFilterEnabled = true; // eski kayıtlarla uyumluluk için tutulur
    let allLoadedQuestions = [];
    let questionWideMode = false;
    let listWideMode = false;
    let shuffleQuestions = false;
    let shuffleSeed = Date.now();
    let currentListIndexes = [];
    let renderedListCount = 0;
    let questionIndexById = new Map();
    let filteredIndexesCacheKey = "";
    let filteredIndexesCache = [];
    let lastFilterControlsKey = "";
    let lastJumpGridKey = "";
    let headerJumpMenuKey = "";
    let renderStructureDirty = true;
    let answerVersion = 0;
    let lastPositions = {};
    let currentChatGPTPrompt = "";
    let currentChatGPTUrl = "";
    let studyTimes = {questions:{}, subjects:{}, sessions:{}, total:0};
    let activeStudyQuestionKey = "";
    let activeStudySubject = "";
    let activeStudySessionStart = 0;
    let activeStudySessionSeconds = 0;
    let lastStudyTick = 0;
    let lastStudySave = 0;
    let studyTimerHandle = null;
    let breakModeActive = false;
    let initialLoadingStartedAt = Date.now();
    const INITIAL_LOADING_MIN_MS = 1200;
    let suppressHistoryAction = false;
    const LIST_BATCH_SIZE = 60;

    const $ = id => document.getElementById(id);
    const els = {
      landing:$("landing"), appView:$("appView"), quizView:$("quizView"), listView:$("listView"),
      topMenu:$("topMenu"), menuHomeBtn:$("menuHomeBtn"), menuSourceBtn:$("menuSourceBtn"), menuViewBtn:$("menuViewBtn"), menuDuplicateBtn:$("menuDuplicateBtn"), menuShuffleBtn:$("menuShuffleBtn"), menuCacheBtn:$("menuCacheBtn"),
      menuInfoBtn:$("menuInfoBtn"), menuShowAllBtn:$("menuShowAllBtn"), menuStarredBtn:$("menuStarredBtn"), menuExamBtn:$("menuExamBtn"), menuWideToggleBtn:$("menuWideToggleBtn"), menuResetVisibleBtn:$("menuResetVisibleBtn"), menuClearCacheBtn:$("menuClearCacheBtn"),
      courseGrid:$("courseGrid"), courseEmpty:$("courseEmpty"), courseSearch:$("courseSearch"),
      clearCourseSearch:$("clearCourseSearch"), continueBtn:$("continueBtn"), wrongHomeBtn:$("wrongHomeBtn"), hiddenHomeBtn:$("hiddenHomeBtn"), starredHomeBtn:$("starredHomeBtn"), quizAllBtn:$("quizAllBtn"), startAllBtn:$("startAllBtn"),
      backHomeBtn:$("backHomeBtn"), changeCourseBtn:$("changeCourseBtn"), activeTitle:$("activeTitle"),
      wideQuestionBtn:$("wideQuestionBtn"), showAllBtn:$("showAllBtn"), compactHomeBtn:$("compactHomeBtn"), compactShowAllBtn:$("compactShowAllBtn"), backToQuizBtn:$("backToQuizBtn"), wideListBtn:$("wideListBtn"), pdfListBtn:$("pdfListBtn"), restoreHiddenBtn:$("restoreHiddenBtn"), refreshListBtn:$("refreshListBtn"),
      listTitle:$("listTitle"), listSubtitle:$("listSubtitle"), allList:$("allList"),
      totalQuestionsHero:$("totalQuestionsHero"), totalSubjectsHero:$("totalSubjectsHero"), status:$("statusBox"),
      manualDbBox:$("manualDbBox"), manualDbInput:$("manualDbInput"), dbList:$("dbList"),
      selectAllDbBtn:$("selectAllDbBtn"), clearDbBtn:$("clearDbBtn"), fontSizeSelect:$("fontSizeSelect"), designModeSelect:$("designModeSelect"), themeSelect:$("themeSelect"), duplicateFilterSelect:$("duplicateFilterSelect"), questionOrderSelect:$("questionOrderSelect"), reshuffleBtn:$("reshuffleBtn"),
      examTopbar:$("examTopbar"), examModeTitle:$("examModeTitle"), examTimerText:$("examTimerText"), cancelExamBtn:$("cancelExamBtn"),
      questionFullscreenBtn:$("questionFullscreenBtn"), questionBreakBtn:$("questionBreakBtn"), questionInfoToggleBtn:$("questionInfoToggleBtn"), questionChatGPTBtn:$("questionChatGPTBtn"), questionStarBtn:$("questionStarBtn"), questionStudyTimeBadge:$("questionStudyTimeBadge"), questionHistoryDetails:$("questionHistoryDetails"), questionHistoryPanel:$("questionHistoryPanel"), questionJumpMenuDetails:$("questionJumpMenuDetails"), questionJumpMenuGrid:$("questionJumpMenuGrid"),
      chatgptWebviewModal:$("chatgptWebviewModal"), chatgptWebviewFrame:$("chatgptWebviewFrame"), chatgptWebviewCloseBtn:$("chatgptWebviewCloseBtn"), chatgptOpenNewTabBtn:$("chatgptOpenNewTabBtn"), chatgptCopyPromptBtn:$("chatgptCopyPromptBtn"), chatgptWebviewNote:$("chatgptWebviewNote"),
      progress:$("progress"), counter:$("counter"), section:$("section"), meta:$("meta"), question:$("question"), options:$("options"),
      feedback:$("feedback"), aiWarningBox:$("aiWarningBox"), infoBox:$("infoBox"), showInfoBtn:$("showInfoBtn"), cardShowAllBtn:$("cardShowAllBtn"), hideQuestionBtn:$("hideQuestionBtn"), unknownQuestionBtn:$("unknownQuestionBtn"), wideExitBtn:$("wideExitBtn"), prevBtn:$("prevBtn"), nextBtn:$("nextBtn"),
      clearCacheBtn:$("clearCacheBtn"), resetVisibleBtn:$("resetVisibleBtn"), answeredCount:$("answeredCount"),
      correctCount:$("correctCount"), wrongCount:$("wrongCount"), emptyCount:$("emptyCount"), jumpGrid:$("jumpGrid"),
      subjectSelect:$("subjectSelect"), examSelect:$("examSelect"), yearSelect:$("yearSelect"), teacherSelect:$("teacherSelect"),
      sourceGroupSelect:$("sourceGroupSelect"), searchInput:$("searchInput"), activeFilterSummary:$("activeFilterSummary"),
      clearFiltersBtn:$("clearFiltersBtn"), goFirstFilteredBtn:$("goFirstFilteredBtn"), subjectButtons:$("subjectButtons"),
      results:$("results"), scoreCircle:$("scoreCircle"), scoreText:$("scoreText"), resultSubtitle:$("resultSubtitle"),
      review:$("review"), reviewToggleBtn:$("reviewToggleBtn"), hideResultBtn:$("hideResultBtn"), askReviewChatGPTBtn:$("askReviewChatGPTBtn"), breakModal:$("breakModal"), breakContinueBtn:$("breakContinueBtn"), initialLoadingOverlay:$("initialLoadingOverlay"), initialLoadingText:$("initialLoadingText"), fullscreenResultsModal:$("fullscreenResultsModal"), fullscreenResultSubtitle:$("fullscreenResultSubtitle"), fullscreenScoreCircle:$("fullscreenScoreCircle"), fullscreenScoreText:$("fullscreenScoreText"), fullscreenResultCloseBtn:$("fullscreenResultCloseBtn"), fullscreenAskReviewChatGPTBtn:$("fullscreenAskReviewChatGPTBtn"), fullscreenReviewToggleBtn:$("fullscreenReviewToggleBtn"), fullscreenReview:$("fullscreenReview")
    };

    function escapeHTML(str){return String(str ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");}
    function debounce(fn, wait=160){
      let timer;
      return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), wait);
      };
    }
    function normalize(str){let s=String(str ?? "").toLocaleLowerCase("tr-TR");try{s=s.normalize("NFKD").replace(/[\u0300-\u036f]/g,"");}catch(e){} return s.replace(/ı/g,"i");}
    function initials(name){return String(name||"?").split(/\s+/).map(x=>x[0]).join("").slice(0,2).toUpperCase();}
    function optionList(q){return Array.isArray(q.options) ? q.options : [];}
    function meta(q,key){return (q.metadata && q.metadata[key]) || "";}
    function answerKey(q){return duplicateMode === "all" ? (q._instanceId || q.id) : q.id;}

    function safeStudyNumber(value){
      const n = Number(value);
      return Number.isFinite(n) && n > 0 ? n : 0;
    }

    function loadStudyTimes(){
      try{
        const raw = localStorage.getItem(STUDY_TIME_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        if(parsed && typeof parsed === "object"){
          studyTimes = {
            questions: parsed.questions && typeof parsed.questions === "object" ? parsed.questions : {},
            subjects: parsed.subjects && typeof parsed.subjects === "object" ? parsed.subjects : {},
            sessions: parsed.sessions && typeof parsed.sessions === "object" ? parsed.sessions : {},
            total: safeStudyNumber(parsed.total)
          };
        }
      }catch(e){
        studyTimes = {questions:{}, subjects:{}, sessions:{}, total:0};
      }
    }

    function saveStudyTimes(force=false){
      const now = Date.now();
      if(!force && now - lastStudySave < 10000) return;
      lastStudySave = now;
      try{
        localStorage.setItem(STUDY_TIME_KEY, JSON.stringify(studyTimes));
      }catch(e){}
    }

    function finalizeStudySession(){
      if(!activeStudyQuestionKey || activeStudySessionSeconds <= 0 || !activeStudySessionStart) return;
      if(!studyTimes.sessions || typeof studyTimes.sessions !== "object") studyTimes.sessions = {};
      if(!Array.isArray(studyTimes.sessions[activeStudyQuestionKey])) studyTimes.sessions[activeStudyQuestionKey] = [];

      studyTimes.sessions[activeStudyQuestionKey].push({
        startedAt: activeStudySessionStart,
        endedAt: Date.now(),
        duration: Math.max(1, Math.floor(activeStudySessionSeconds)),
        subject: activeStudySubject || "Ders yok"
      });

      if(studyTimes.sessions[activeStudyQuestionKey].length > 80){
        studyTimes.sessions[activeStudyQuestionKey] = studyTimes.sessions[activeStudyQuestionKey].slice(-80);
      }

      activeStudySessionSeconds = 0;
      activeStudySessionStart = Date.now();
      saveStudyTimes(true);
    }

    function formatStudyTime(seconds){
      seconds = Math.max(0, Math.floor(Number(seconds) || 0));
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      if(h > 0) return `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
      return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
    }

    function questionStudySeconds(q){
      if(!q) return 0;
      return safeStudyNumber(studyTimes.questions[answerKey(q)]);
    }

    function subjectStudySeconds(subject){
      return safeStudyNumber(studyTimes.subjects[subject || "Ders yok"]);
    }

    function updateQuestionStudyTimeBadge(q=null){
      if(!els.questionStudyTimeBadge) return;
      if(!q) q = questions[current];
      if(!q){
        els.questionStudyTimeBadge.textContent = "00:00";
        els.questionStudyTimeBadge.title = "Çalışma süresi";
        return;
      }
      const qSec = questionStudySeconds(q);
      const subjectSec = subjectStudySeconds(q.subject || "Ders yok");
      els.questionStudyTimeBadge.textContent = formatStudyTime(qSec);
      els.questionStudyTimeBadge.title = `Bu soru: ${formatStudyTime(qSec)} · ${q.subject || "Ders"} toplam: ${formatStudyTime(subjectSec)} · Genel toplam: ${formatStudyTime(studyTimes.total)}`;
    }

    function formatStudyDate(ts){
      try{
        return new Date(ts).toLocaleString("tr-TR", {day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit"});
      }catch(e){return "";}
    }

    function renderQuestionHistoryPanel(q=null){
      if(!els.questionHistoryPanel) return;
      if(!q) q = questions[current];
      if(!q){
        els.questionHistoryPanel.innerHTML = `<div class="history-empty">Geçmiş yok.</div>`;
        return;
      }

      const key = answerKey(q);
      const sessions = (studyTimes.sessions && Array.isArray(studyTimes.sessions[key])) ? studyTimes.sessions[key].slice().reverse() : [];
      const qTotal = questionStudySeconds(q);
      const subjectTotal = subjectStudySeconds(q.subject || "Ders yok");

      const rows = sessions.slice(0, 12).map(s => `
        <div class="history-row">
          <span>${escapeHTML(formatStudyDate(s.startedAt))}</span>
          <b>${escapeHTML(formatStudyTime(s.duration))}</b>
        </div>
      `).join("");

      els.questionHistoryPanel.innerHTML = `
        <div class="history-title">Çalışma geçmişi</div>
        <div class="history-total">Bu soru: <b>${escapeHTML(formatStudyTime(qTotal))}</b></div>
        <div class="history-total">Ders toplamı: <b>${escapeHTML(formatStudyTime(subjectTotal))}</b></div>
        <div class="history-list">${rows || `<div class="history-empty">Bu soru için kayıtlı oturum yok.</div>`}</div>
      `;
    }


    function commitStudyTime(force=false){
      if(breakModeActive) return;
      if(!activeStudyQuestionKey || !lastStudyTick) return;
      const now = Date.now();
      let delta = Math.floor((now - lastStudyTick) / 1000);
      if(delta <= 0 && !force) return;
      if(delta <= 0) delta = 0;

      // Uzun süre sekme arka planda kaldıysa tek seferde büyük süre yazılmasın.
      if(delta > 30) delta = 30;

      if(delta > 0){
        studyTimes.questions[activeStudyQuestionKey] = safeStudyNumber(studyTimes.questions[activeStudyQuestionKey]) + delta;
        studyTimes.subjects[activeStudySubject || "Ders yok"] = safeStudyNumber(studyTimes.subjects[activeStudySubject || "Ders yok"]) + delta;
        studyTimes.total = safeStudyNumber(studyTimes.total) + delta;
        activeStudySessionSeconds += delta;
        saveStudyTimes(false);
      }
      lastStudyTick = now;
    }

    function setActiveStudyQuestion(q){
      const nextKey = q && answerKey(q) ? answerKey(q) : "";
      if(activeStudyQuestionKey && activeStudyQuestionKey !== nextKey){
        commitStudyTime(true);
        finalizeStudySession();
      }else{
        commitStudyTime(true);
      }

      if(!q || !answerKey(q)){
        finalizeStudySession();
        activeStudyQuestionKey = "";
        activeStudySubject = "";
        activeStudySessionStart = 0;
        activeStudySessionSeconds = 0;
        lastStudyTick = 0;
        return;
      }

      if(activeStudyQuestionKey !== nextKey){
        activeStudySessionStart = Date.now();
        activeStudySessionSeconds = 0;
      }

      activeStudyQuestionKey = nextKey;
      activeStudySubject = q.subject || "Ders yok";
      lastStudyTick = Date.now();
      updateQuestionStudyTimeBadge(q);
      renderQuestionHistoryPanel(q);
    }

    function startStudyTimer(){
      if(studyTimerHandle) return;
      studyTimerHandle = setInterval(()=>{
        if(breakModeActive) return;
        if(document.hidden || !document.body.classList.contains("app-screen-active")){
          commitStudyTime(true);
          return;
        }
        commitStudyTime(false);
        updateQuestionStudyTimeBadge();
        if(els.questionHistoryDetails && els.questionHistoryDetails.open) renderQuestionHistoryPanel();
      }, 1000);
    }

    function pauseStudyTimer(){
      commitStudyTime(true);
      finalizeStudySession();
      activeStudyQuestionKey = "";
      activeStudySubject = "";
      activeStudySessionStart = 0;
      activeStudySessionSeconds = 0;
      lastStudyTick = 0;
      saveStudyTimes(true);
    }



    function lastPositionKey(subject="all", teacher="all"){
      return `${subject || "all"}::${teacher || "all"}::${selectedDbFiles.map(dbCanonicalName).sort().join("|") || "all-db"}`;
    }

    function loadLastPositions(){
      try{
        const raw = localStorage.getItem(LAST_POSITION_KEY);
        lastPositions = raw ? (JSON.parse(raw) || {}) : {};
      }catch(e){
        lastPositions = {};
      }
    }

    function saveLastPositions(){
      try{
        localStorage.setItem(LAST_POSITION_KEY, JSON.stringify(lastPositions));
      }catch(e){}
    }

    function recordLastPosition(q=null){
      if(!q) q = questions[current];
      if(!q || examMode) return;

      const idxs = filteredIndexes();
      const pos = Math.max(0, idxs.indexOf(current));
      const record = {
        questionKey: answerKey(q),
        index: current,
        position: pos,
        subject: q.subject || filters.subject || "all",
        teacher: meta(q,"teacher") || filters.teacher || "all",
        filters: {...filters},
        selectedDbFiles: selectedDbFiles.slice(),
        savedAt: Date.now()
      };

      lastPositions["__global__"] = record;
      lastPositions[lastPositionKey("all","all")] = record;
      if(q.subject) lastPositions[lastPositionKey(q.subject,"all")] = record;
      if(q.subject && record.teacher) lastPositions[lastPositionKey(q.subject,record.teacher)] = record;
      saveLastPositions();
    }

    function findSavedQuestionIndex(record){
      if(!record) return -1;
      if(record.questionKey){
        const idx = questions.findIndex(q => answerKey(q) === record.questionKey);
        if(idx >= 0 && matchesFilters(questions[idx], null)) return idx;
      }
      if(typeof record.index === "number" && questions[record.index] && matchesFilters(questions[record.index], null)){
        return record.index;
      }
      const idxs = filteredIndexes();
      if(idxs.length && typeof record.position === "number"){
        return idxs[Math.min(Math.max(0, record.position), idxs.length-1)] ?? idxs[0];
      }
      return idxs.length ? idxs[0] : -1;
    }

    function restoreLastPosition(subject="all", teacher="all"){
      const keys = [
        lastPositionKey(subject, teacher),
        lastPositionKey(subject, "all"),
        lastPositionKey("all", "all"),
        "__global__"
      ];
      const record = keys.map(k => lastPositions[k]).find(Boolean);
      if(record && record.filters){
        filters = {...filters, ...record.filters};
        if(subject && subject !== "all") filters.subject = subject;
        if(teacher && teacher !== "all") filters.teacher = teacher;
        sanitizeFilters();
      }
      const idx = findSavedQuestionIndex(record);
      if(idx >= 0){
        current = idx;
        return true;
      }
      ensureCurrent();
      return false;
    }

    function hasLastPosition(subject="all", teacher="all"){
      return !!(
        lastPositions[lastPositionKey(subject, teacher)] ||
        lastPositions[lastPositionKey(subject, "all")] ||
        (subject === "all" && lastPositions["__global__"])
      );
    }

    function continueCourse(subject="all", teacher="all"){
      pushAppHistoryState("question");
      stopQuizMode();
      document.body.classList.add("app-screen-active");
      if(subject && subject !== "all"){
        filters={subject, exam:"all", year:"all", teacher:teacher||"all", sourceGroup:"all", search:""};
      }
      restoreLastPosition(subject, teacher || "all");
      els.landing.classList.add("hidden");
      els.appView.classList.add("active");
      els.quizView.classList.remove("hidden");
      els.listView.classList.remove("active");
      els.activeTitle.textContent = filters.subject && filters.subject !== "all"
        ? (filters.teacher && filters.teacher !== "all" ? filters.subject + " · " + filters.teacher : filters.subject + " soru bankası")
        : "Tüm dersler soru bankası";
      els.results.style.display="none";
      render();
      scrollToQuestion("auto");
    }



    function prepareQuestionRecord(q){
      if(!q) return q;
      q._searchText = normalize([
        q.subject, q.question, q.explanation, q.spot, q.sourceNote,
        meta(q,"examGroup"), meta(q,"year"), meta(q,"teacher"), meta(q,"topic"),
        meta(q,"target"), meta(q,"sourceGroup"), meta(q,"source"),
        ...optionList(q).map(o=>o.text)
      ].join(" "));
      return q;
    }

    function invalidateQuestionIndexes(){
      filteredIndexesCacheKey = "";
      filteredIndexesCache = [];
      lastJumpGridKey = "";
      headerJumpMenuKey = "";
      renderStructureDirty = true;
    }

    function filterCacheKey(){
      return JSON.stringify([
        questions.length,
        filters.subject, filters.exam, filters.year, filters.teacher, filters.sourceGroup, filters.search,
        selectedDbFiles.map(dbCanonicalName).sort().join("|"),
        hiddenQuestionIds.join("|"),
        duplicateMode,
        quizActive ? "quiz" : "normal",
        quizIds.join("|"),
        shuffleQuestions ? shuffleSeed : "normal"
      ]);
    }

    function filterControlsKey(){
      return JSON.stringify([
        questions.length,
        filters.subject, filters.exam, filters.year, filters.teacher, filters.sourceGroup, filters.search,
        selectedDbFiles.map(dbCanonicalName).sort().join("|"),
        hiddenQuestionIds.length,
        duplicateMode
      ]);
    }

    function dbFileListCacheRead(){
      try{
        const raw = localStorage.getItem(DB_FILE_LIST_CACHE_KEY);
        if(!raw) return null;
        const parsed = JSON.parse(raw);
        if(!parsed || !Array.isArray(parsed.files) || !parsed.files.length) return null;
        return parsed.files;
      }catch(e){return null;}
    }

    function cachedListHasCoreDbs(files){
      if(!Array.isArray(files)) return false;
      const names = new Set(files.map(f => dbCanonicalName(f.name)));
      // Bu uygulamada soru3-soru10 dosyaları özellikle bekleniyor; varsa cache doğrudan kullanılır.
      for(let i=1;i<=10;i++){
        if(!names.has(`soru${i}.db`) && !names.has(`soru${i}.sdb`)) return false;
      }
      return true;
    }

    function dbFileListCacheWrite(files){
      try{
        const compact = files.map(f=>({name:f.name, url:f.url, source:f.source || "cache"}));
        localStorage.setItem(DB_FILE_LIST_CACHE_KEY, JSON.stringify({createdAt:Date.now(), files:compact}));
      }catch(e){}
    }

    function openContentCache(){
      return new Promise((resolve,reject)=>{
        if(!("indexedDB" in window)) { reject(new Error("IndexedDB desteklenmiyor.")); return; }
        const req = indexedDB.open(DB_CONTENT_CACHE_NAME, 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          if(!db.objectStoreNames.contains(DB_CONTENT_STORE_NAME)) db.createObjectStore(DB_CONTENT_STORE_NAME, {keyPath:"key"});
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error || new Error("IndexedDB açılamadı."));
      });
    }

    async function getCachedDbPayload(key){
      try{
        const db = await openContentCache();
        return await new Promise(resolve=>{
          const tx = db.transaction(DB_CONTENT_STORE_NAME, "readonly");
          const store = tx.objectStore(DB_CONTENT_STORE_NAME);
          const req = store.get(key);
          req.onsuccess = () => { db.close(); resolve(req.result || null); };
          req.onerror = () => { db.close(); resolve(null); };
        });
      }catch(e){return null;}
    }

    async function setCachedDbPayload(key, payload){
      try{
        const db = await openContentCache();
        await new Promise(resolve=>{
          const tx = db.transaction(DB_CONTENT_STORE_NAME, "readwrite");
          const store = tx.objectStore(DB_CONTENT_STORE_NAME);
          store.put({key, createdAt:Date.now(), payload});
          tx.oncomplete = () => { db.close(); resolve(); };
          tx.onerror = () => { db.close(); resolve(); };
        });
      }catch(e){}
    }

    function deleteIndexedDbCache(){
      return new Promise(resolve=>{
        try{
          const req = indexedDB.deleteDatabase(DB_CONTENT_CACHE_NAME);
          req.onsuccess = req.onerror = req.onblocked = () => resolve();
        }catch(e){resolve();}
      });
    }

    async function clearDatabaseCacheAndReload(){
      if(!confirm("Soru dosyası önbelleği temizlenip sayfa yeniden yüklensin mi?")) return;
      try{localStorage.removeItem(DB_FILE_LIST_CACHE_KEY);}catch(e){}
      await deleteIndexedDbCache();
      location.reload();
    }

    async function fetchWithTimeout(url, options={}, timeoutMs=8000){
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try{
        return await fetch(url, {...options, signal: controller.signal});
      }finally{
        clearTimeout(timer);
      }
    }

    function aiAnswerObj(q){
      return q && q.aiAnswer && typeof q.aiAnswer === "object" ? q.aiAnswer : null;
    }
    function normalizeLetterValue(value){
      return String(value ?? "").trim().toLocaleUpperCase("tr-TR");
    }
    function normalizeAnswerText(value){
      return String(value ?? "")
        .toLocaleLowerCase("tr-TR")
        .replace(/\s+/g," ")
        .trim();
    }
    function storedAnswerLabel(q){
      const ans = q && q.answer ? q.answer : {};
      const opts = optionList(q || {});
      const idx = typeof ans.index === "number" ? ans.index : null;
      const letter = ans.letter || (idx !== null && opts[idx] ? opts[idx].letter : "");
      const text = ans.text || ans.raw || (idx !== null && opts[idx] ? opts[idx].text : "");
      return `${letter ? letter + ") " : ""}${text || "Kaynak cevap yok"}`;
    }
    function aiAnswerLabel(q){
      const ai = aiAnswerObj(q);
      if(!ai) return "";
      const opts = optionList(q || {});
      const idx = typeof ai.index === "number" ? ai.index : null;
      const letter = ai.letter || (idx !== null && opts[idx] ? opts[idx].letter : "");
      const text = ai.text || (idx !== null && opts[idx] ? opts[idx].text : "") || ai.raw || "";
      return `${letter ? letter + ") " : ""}${text || "Yapay zeka cevabı metni yok"}`;
    }
    function aiAnswerDiffers(q){
      const ai = aiAnswerObj(q);
      if(!ai || !q || !q.answer) return false;

      const ans = q.answer || {};
      const storedIdx = typeof ans.index === "number" ? ans.index : null;
      const aiIdx = typeof ai.index === "number" ? ai.index : null;

      const storedLetter = normalizeLetterValue(ans.letter || (storedIdx !== null ? String.fromCharCode(65+storedIdx) : ""));
      const aiLetter = normalizeLetterValue(ai.letter || (aiIdx !== null ? String.fromCharCode(65+aiIdx) : ""));

      const indexDiff = storedIdx !== null && aiIdx !== null && storedIdx !== aiIdx;
      const letterDiff = storedLetter && aiLetter && storedLetter !== aiLetter;

      const storedText = normalizeAnswerText(ans.text || ans.raw || "");
      const aiText = normalizeAnswerText(ai.text || ai.raw || "");
      const textDiff = storedText && aiText && storedText !== aiText && (indexDiff || letterDiff);

      return indexDiff || letterDiff || textDiff;
    }
    function hasAiDiscrepancy(q){
      const ai = aiAnswerObj(q);
      if(!ai) return false;
      const status = normalizeAnswerText(ai.verificationStatus || "");
      const explicitMismatch = ai.matchesStoredAnswer === false || status.includes("uyumsuz") || status.includes("farkli") || status.includes("farklı") || status.includes("hata");
      return explicitMismatch || aiAnswerDiffers(q);
    }
    function aiDiscrepancyHTML(q){
      if(!hasAiDiscrepancy(q)) return "";
      const ai = aiAnswerObj(q) || {};
      const status = ai.verificationStatus ? `\nDurum: ${ai.verificationStatus}` : "";
      const confidence = ai.confidence ? `\nGüven: ${ai.confidence}` : "";
      const explanation = ai.explanation ? `\n\nYapay zeka açıklaması: ${ai.explanation}` : (q.yapayZekaCevabi ? `\n\nYapay zeka açıklaması: ${q.yapayZekaCevabi}` : "");
      return `<span class="ai-diff-title">⚠ Yapay zeka doğrulama uyarısı</span><span class="ai-diff-row"><b>Kaynakta kayıtlı cevap:</b> ${escapeHTML(storedAnswerLabel(q))}</span><span class="ai-diff-row"><b>Yapay zeka cevabı:</b> ${escapeHTML(aiAnswerLabel(q))}</span>${escapeHTML(status + confidence + explanation)}`;
    }
    function aiPlainWarningText(q){
      if(!hasAiDiscrepancy(q)) return "";
      const ai = aiAnswerObj(q) || {};
      const parts = [
        "Yapay zeka doğrulama uyarısı",
        "Kaynakta kayıtlı cevap: " + storedAnswerLabel(q),
        "Yapay zeka cevabı: " + aiAnswerLabel(q)
      ];
      if(ai.verificationStatus) parts.push("Durum: " + ai.verificationStatus);
      if(ai.confidence) parts.push("Güven: " + ai.confidence);
      if(ai.explanation) parts.push("Yapay zeka açıklaması: " + ai.explanation);
      else if(q.yapayZekaCevabi) parts.push("Yapay zeka açıklaması: " + q.yapayZekaCevabi);
      return parts.join("\n");
    }
    function aiExplanationText(q){
      const ai = aiAnswerObj(q);
      if(ai && ai.explanation) return ai.explanation;
      if(q && q.yapayZekaCevabi) return q.yapayZekaCevabi;
      return "";
    }

    function hasAnyAiAnswer(q){
      const ai = aiAnswerObj(q);
      if(ai && (ai.letter || typeof ai.index === "number" || ai.text || ai.raw || ai.explanation || ai.verificationStatus)) return true;
      if(q && typeof q.yapayZekaCevabi === "string" && q.yapayZekaCevabi.trim()) return true;
      return false;
    }

    function aiQualityScore(q){
      let score = 0;
      if(hasAnyAiAnswer(q)) score += 1000;
      if(hasAiDiscrepancy(q)) score += 120;
      const ai = aiAnswerObj(q);
      if(ai && ai.explanation) score += 40;
      if(ai && ai.verificationStatus) score += 20;
      if(q && q.yapayZekaCevabi) score += 25;
      if(q && q.explanation) score += 10;
      if(q && q.spot) score += 8;
      if(q && q.sourceNote) score += 5;
      if(q && q.metadata && q.metadata.source) score += 3;
      return score;
    }

    function preferredDuplicateQuestion(a,b){
      return aiQualityScore(b) > aiQualityScore(a) ? b : a;
    }



    function hiddenSet(){return new Set(hiddenQuestionIds);}
    function isHiddenQuestion(q){return !!(q && answerKey(q) && hiddenSet().has(answerKey(q)));}
    function activeVisibleQuestions(){return activeQuestions().filter(q => !isHiddenQuestion(q));}
    function visibleQuestionCount(){return activeVisibleQuestions().length;}
    function hiddenQuestionCount(){return activeQuestions().filter(q => isHiddenQuestion(q)).length;}

    function starredSet(){return new Set(starredQuestionIds);}
    function isStarredQuestion(q){return !!(q && answerKey(q) && starredSet().has(answerKey(q)));}
    function starredQuestionCount(){return activeQuestions().filter(q => isStarredQuestion(q)).length;}
    function toggleStarQuestion(q=null){
      if(!q) q = questions[current];
      if(!q) return;
      const id = answerKey(q);
      if(!id) return;
      if(starredQuestionIds.includes(id)){
        starredQuestionIds = starredQuestionIds.filter(x => x !== id);
      }else{
        starredQuestionIds.push(id);
      }
      saveState();
    }

    
    function unknownSet(){return new Set(unknownQuestionIds);}
    function isUnknownQuestion(q){return !!(q && answerKey(q) && unknownSet().has(answerKey(q)));}
    function markUnknownQuestion(q=null, value=true){
      if(!q) q = questions[current];
      if(!q) return;
      const id = answerKey(q);
      if(!id) return;
      const exists = unknownQuestionIds.includes(id);
      if(value && !exists) unknownQuestionIds.push(id);
      if(!value && exists) unknownQuestionIds = unknownQuestionIds.filter(x => x !== id);
      saveState();
    }
    function toggleUnknownQuestion(q=null){
      if(!q) q = questions[current];
      if(!q) return;
      markUnknownQuestion(q, !isUnknownQuestion(q));
    }
    function isWrongAnswerQuestion(q){
      if(!q) return false;
      const a = answers[answerKey(q)];
      if(a === undefined || a === null) return false;
      const ci = q.answer ? q.answer.index : null;
      return ci !== null && ci !== undefined && ci >= 0 && a !== ci;
    }
    function isReviewNeededQuestion(q){
      return isUnknownQuestion(q) || isWrongAnswerQuestion(q);
    }
    function reviewIndexes(){
      return filteredIndexes().filter(i => isReviewNeededQuestion(questions[i]));
    }
    function selectedAnswerText(q){
      const a = answers[answerKey(q)];
      const opts = optionList(q);
      if(isUnknownQuestion(q)) return "Bilmiyorum olarak işaretlendi";
      if(a === undefined || a === null) return "Boş";
      return `${opts[a]?.letter || ""}) ${opts[a]?.text || ""}`.trim();
    }
    function correctAnswerText(q){
      const opts = optionList(q);
      const ans = q.answer || {};
      return ans.index !== null && ans.index !== undefined && opts[ans.index]
        ? `${opts[ans.index].letter}) ${opts[ans.index].text}`
        : (ans.raw || ans.text || "");
    }
    function buildBatchReviewPrompt(){
      const idxs = reviewIndexes();
      const parts = [];
      parts.push("Aşağıdaki çoktan seçmeli soruları tek tek çöz ve öğretici şekilde açıkla.");
      parts.push("Bu liste yanlış yaptığım ve/veya 'bilmiyorum' olarak işaretlediğim sorulardan oluşuyor.");
      parts.push("Her soru için: doğru cevabı, neden doğru olduğunu, benim cevabımın neden yanlış/eksik olduğunu ve kısa konu özetini yaz.");
      parts.push("");
      idxs.forEach((i,n)=>{
        const q = questions[i], opts = optionList(q);
        parts.push(`--- Soru ${n+1} ---`);
        parts.push([q.subject ? `Ders: ${q.subject}` : "", meta(q,"examGroup") ? `Kurul/Sınav: ${meta(q,"examGroup")}` : "", meta(q,"year") ? `Yıl: ${meta(q,"year")}` : "", meta(q,"teacher") ? `Hoca: ${meta(q,"teacher")}` : "", meta(q,"topic") ? `Konu: ${meta(q,"topic")}` : ""].filter(Boolean).join(" | "));
        parts.push("");
        parts.push("Durum: " + [isWrongAnswerQuestion(q) ? "Yanlış cevaplandı" : "", isUnknownQuestion(q) ? "Bilmiyorum olarak işaretlendi" : ""].filter(Boolean).join(" + "));
        parts.push("Benim cevabım: " + selectedAnswerText(q));
        parts.push("Sistemdeki doğru cevap: " + correctAnswerText(q));
        parts.push("");
        parts.push("Soru:");
        parts.push(q.question || "");
        if(opts.length){
          parts.push("");
          parts.push("Şıklar:");
          opts.forEach((opt, idx)=>parts.push(`${opt.letter || String.fromCharCode(65+idx)}) ${opt.text || ""}`));
        }
        if(q.explanation) parts.push("\nMevcut açıklama: " + q.explanation);
        if(q.spot) parts.push("Spot bilgi: " + q.spot);
        parts.push("");
      });
      return parts.join("\n");
    }
    async function askReviewQuestionsInChatGPT(){
      const idxs = reviewIndexes();
      if(!idxs.length){
        alert("ChatGPT'ye gönderilecek yanlış veya bilmiyorum işaretli soru yok.");
        return;
      }
      const prompt = buildBatchReviewPrompt();
      currentChatGPTPrompt = prompt;
      const url = "https://chatgpt.com/?q=" + encodeURIComponent(prompt);
      currentChatGPTUrl = url;
      if(url.length > 7500){
        const copied = await copyTextSafely(prompt);
        window.open("https://chatgpt.com/", "_blank", "noopener,noreferrer");
        alert(copied ? "Prompt uzun olduğu için panoya kopyalandı. Açılan ChatGPT sekmesine yapıştırabilirsin." : "Prompt çok uzun olduğu için otomatik aktarılamadı.");
        return;
      }
      window.open(url, "_blank", "noopener,noreferrer");
    }

    function hideQuestionById(id){
      if(!id) return;
      if(!hiddenQuestionIds.includes(id)) hiddenQuestionIds.push(id);
      if(quizActive) quizIds = quizIds.filter(qid => qid !== id);
      saveState();
    }
    function unhideQuestionById(id){
      hiddenQuestionIds = hiddenQuestionIds.filter(qid => qid !== id);
      saveState();
    }
    function restoreAllHiddenQuestions(){
      if(!confirm("Gizlenen tüm sorular yeniden gösterilsin mi?")) return;
      hiddenQuestionIds = [];
      saveState();
      renderLanding();
      // Liste ekranı açıkken ağır yeniden çizim yalnızca liste komutlarıyla yapılır.
    }
    function shuffleArray(arr){
      const copy = arr.slice();
      for(let i=copy.length-1; i>0; i--){
        const j = Math.floor(Math.random() * (i+1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    }
    function startQuiz(subject, count){
      document.body.classList.add("app-screen-active");
      const pool = activeVisibleQuestions().filter(q => !subject || subject === "all" || q.subject === subject);
      if(!pool.length){
        alert("Bu seçimde quiz için uygun soru yok. Gizlenen sorular veya aktif soru dosyası seçimini kontrol et.");
        return;
      }
      const chosen = shuffleArray(pool).slice(0, Math.min(count, pool.length));
      quizActive = true;
      quizIds = chosen.map(q => answerKey(q));
      quizTitle = subject && subject !== "all" ? `${subject} quiz modu · ${chosen.length} soru` : `Tüm dersler quiz modu · ${chosen.length} soru`;
      filters = {subject: subject || "all", exam:"all", year:"all", teacher:"all", sourceGroup:"all", search:""};
      const firstIndex = questions.findIndex(q => answerKey(q) === quizIds[0]);
      if(firstIndex >= 0) current = firstIndex;
      els.landing.classList.add("hidden");
      els.appView.classList.add("active");
      els.quizView.classList.remove("hidden");
      els.listView.classList.remove("active");
      els.activeTitle.textContent = quizTitle;
      els.results.style.display = "none";
      render();
      window.scrollTo(0,0);
    }
    function scrollToQuestion(behavior="auto"){
      const target = document.getElementById("question") || document.getElementById("testArea");
      if(!target) return;
      const menu = document.getElementById("topMenu");
      const examBar = document.getElementById("examTopbar");
      const stickyHeight =
        (menu && getComputedStyle(menu).display !== "none" ? menu.getBoundingClientRect().height : 0) +
        (document.body.classList.contains("exam-mode") && examBar ? examBar.getBoundingClientRect().height : 0);
      const top = target.getBoundingClientRect().top + window.scrollY - Math.max(8, stickyHeight + 8);
      window.scrollTo({top:Math.max(0, top), behavior});
    }

    function renderPreserveScroll(){
      const x = window.scrollX;
      const y = window.scrollY;
      render();
      requestAnimationFrame(()=>window.scrollTo(x, y));
    }

    function stopQuizMode(){
      quizActive = false;
      quizIds = [];
      quizTitle = "";
      document.body.classList.remove("quiz-active-mode");
      saveState();
    }


    function numericAnswerValue(value){
      if (typeof value === "number" && Number.isFinite(value)) return value;
      if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) return Number(value);
      return null;
    }
    function correctAnswerIndex(q){
      const idx = q && q.answer ? q.answer.index : null;
      return (typeof idx === "number" && Number.isFinite(idx) && idx >= 0) ? idx : null;
    }
    function isWrongFromCache(q){
      if (!q || !q.id) return false;
      const cached = answers[answerKey(q)];
      const selected = numericAnswerValue(cached);
      const correct = correctAnswerIndex(q);
      if (selected === null || correct === null) return false;
      return selected !== correct;
    }
    function cachedSelectedText(q){
      const selected = numericAnswerValue(answers[answerKey(q)]);
      const opts = optionList(q);
      if (selected === null) return "Kayıt yok";
      if (opts[selected]) return `${opts[selected].letter || String.fromCharCode(65+selected)}) ${opts[selected].text || ""}`;
      return `Seçilen indeks: ${selected}`;
    }
    function cachedCorrectText(q){
      const correct = correctAnswerIndex(q);
      const opts = optionList(q);
      const ans = q && q.answer ? q.answer : {};
      if (correct !== null && opts[correct]) return `${opts[correct].letter || String.fromCharCode(65+correct)}) ${opts[correct].text || ""}`;
      return ans.raw || ans.text || "Cevap anahtarı yok";
    }
    function activeWrongCount(){
      return activeVisibleQuestions().filter(q => isWrongFromCache(q)).length;
    }

    function activeDbSet(){return new Set(selectedDbFiles.map(dbCanonicalName));}

    function dbBaseName(name){
      return String(name || "").split("/").pop().trim();
    }
    function dbCanonicalName(name){
      return dbBaseName(name).toLocaleLowerCase("tr-TR");
    }
    function dbDisplayName(file){
      return dbBaseName(file && file.name ? file.name : "");
    }

    function isDbActive(q){return selectedDbFiles.length && activeDbSet().has(dbCanonicalName(q._dbFile));}
    function activeQuestions(){return questions.filter(isDbActive);}

    function inferRepoFromGithubPages(){
      const host = location.hostname;
      if (!host.endsWith(".github.io")) return null;
      const owner = host.split(".")[0];
      const parts = location.pathname.split("/").filter(Boolean);
      const repo = parts.length > 0 ? parts[0] : owner + ".github.io";
      return {owner, repo};
    }

    async function listDbFilesFromGithubApi(){
      const info = inferRepoFromGithubPages();
      if (!info) throw new Error("GitHub Pages host algılanmadı.");
      const out = [];
      for (const dir of DB_DIRS){
        const apiPath = dir ? `/contents/${dir}` : `/contents`;
        const api = `https://api.github.com/repos/${info.owner}/${info.repo}${apiPath}`;
        try{
          const res = await fetchWithTimeout(api, {headers: {"Accept":"application/vnd.github+json"}}, 6000);
          if (!res.ok) continue;
          const items = await res.json();
          if (!Array.isArray(items)) continue;
          items.filter(x => x.type === "file" && DB_EXTENSIONS.some(ext => x.name.toLowerCase().endsWith(ext)))
               .forEach(x => out.push({name: dir ? `${dir}/${x.name}` : x.name, url:x.download_url, source:"github-api"}));
        }catch(e){}
      }
      if (!out.length) throw new Error("GitHub API ile .db/.sdb bulunamadı.");
      return out;
    }

    async function listDbFilesFromManifest(){
      const out = [];
      for (const dir of DB_DIRS){
        const manifestUrl = dir ? `${dir}/manifest.json` : "manifest.json";
        try{
          const res = await fetchWithTimeout(manifestUrl, {cache:"no-store"}, 5000);
          if (!res.ok) continue;
          const manifest = await res.json();
          const files = Array.isArray(manifest.files) ? manifest.files : [];
          files.filter(name => DB_EXTENSIONS.some(ext => String(name).toLowerCase().endsWith(ext))).forEach(name => {
            const nameStr = String(name);
            const alreadyHasDir = nameStr.includes("/");
            const url = alreadyHasDir ? nameStr : (dir ? `${dir}/${encodeURIComponent(nameStr)}` : encodeURIComponent(nameStr));
            out.push({name: alreadyHasDir ? nameStr : (dir ? `${dir}/${nameStr}` : nameStr), url, source:"manifest"});
          });
        }catch(e){}
      }
      if (!out.length) throw new Error("manifest.json içinde .db/.sdb bulunamadı.");
      return out;
    }

    async function listDbFilesBySequentialProbe(maxScan=SEQUENTIAL_SCAN_MAX){
      const found = [];
      const candidates = [];
      const limit = Math.max(1, Math.min(Number(maxScan) || SEQUENTIAL_SCAN_MAX, SEQUENTIAL_SCAN_MAX));
      for (let i=1;i<=limit;i++){
        candidates.push(`soru${i}.db`);
        candidates.push(`soru${i}.sdb`);
      }

      const already = new Set();
      for (const dir of DB_DIRS){
        const batchSize = 24;
        for (let start=0; start<candidates.length; start+=batchSize){
          const batch = candidates.slice(start,start+batchSize);
          await Promise.all(batch.map(async name => {
            const url = dir ? `${dir}/${encodeURIComponent(name)}` : encodeURIComponent(name);
            const key = `${dir}/${name}`;
            if(already.has(key)) return;
            try{
              // Bazı GitHub/CDN ortamlarında HEAD güvenilir olmayabiliyor. Önce küçük GET deniyoruz.
              let res = await fetchWithTimeout(url, {cache:"no-store", headers: {"Range":"bytes=0-0"}}, 3500);
              if(!res.ok){
                res = await fetchWithTimeout(url, {cache:"no-store", method:"HEAD"}, 2500);
              }
              if (res.ok || res.status === 206) {
                already.add(key);
                found.push({name:dir?`${dir}/${name}`:name, url, source:"sequential"});
              }
            }catch(e){}
          }));
        }
      }
      if (!found.length) throw new Error(`soru1.db-soru${limit}.db taramasında dosya bulunamadı.`);
      return found;
    }

    async function discoverDbFiles(){
      const cachedList = dbFileListCacheRead();
      const candidates = [];
      const errors = [];

      function addList(list, label){
        (list || []).forEach(file => {
          if(!file || !file.name || !file.url) return;
          candidates.push({...file, source:file.source || label, canonicalName: dbCanonicalName(file.name)});
        });
      }

      // Eğer daha önce soru1-soru10 dahil tüm temel dosyalar bulunmuşsa tekrar tarama yapma.
      if(cachedList && cachedList.length && cachedListHasCoreDbs(cachedList)){
        els.status.classList.remove("hidden");
        els.status.innerHTML = "Soru dosyası listesi önbellekten yükleniyor...";
        return cachedList.map(file => ({...file, source:file.source || "cache"}));
      }

      if(cachedList && cachedList.length){
        addList(cachedList, "cache");
      }

      async function addFrom(fn,label){
        try{
          const list = await fn();
          addList(list, label);
        }catch(e){
          errors.push(label+": "+e.message);
        }
      }

      els.status.classList.remove("hidden");
      els.status.innerHTML = cachedList && cachedList.length
        ? "Eksik soru3-soru10 dosyaları için hızlı tarama yapılıyor..."
        : "Soru dosyaları ilk kez aranıyor...";

      // Küçük manifest hızlıdır; önce bunu dene.
      await addFrom(listDbFilesFromManifest,"manifest");

      // Özellikle soru3.db-soru10.db gözden kaçmasın diye sadece ilk 20 dosya hızlı taranır.
      await addFrom(()=>listDbFilesBySequentialProbe(20),"sequential-fast");

      // Hâlâ hiçbir dosya yoksa daha ağır yollar denenir.
      if(!candidates.length){
        await addFrom(listDbFilesFromGithubApi,"github-api");
      }

      if(!candidates.length){
        els.status.innerHTML = "Soru dosyaları geniş tarama ile aranıyor...";
        await addFrom(()=>listDbFilesBySequentialProbe(SEQUENTIAL_SCAN_MAX),"sequential-full");
      }

      if(!candidates.length) throw new Error(errors.join(" | "));

      const priority = {"manifest":0, "github-api":1, "sequential-fast":2, "sequential":2, "sequential-full":3, "cache":4};
      const best = new Map();
      candidates.forEach(file=>{
        const key = dbCanonicalName(file.name);
        const prev = best.get(key);
        if(!prev || (priority[file.source] ?? 9) < (priority[prev.source] ?? 9)){
          best.set(key, file);
        }
      });

      const files = [...best.values()].sort((a,b)=>dbBaseName(a.name).localeCompare(dbBaseName(b.name),"tr", {numeric:true}));
      dbFileListCacheWrite(files);
      return files;
    }

    async function loadDbFile(file){
      const cacheKey = `v3::${dbCanonicalName(file.name)}::${file.url || ""}`;
      const cached = await getCachedDbPayload(cacheKey);
      if(cached && cached.payload && Array.isArray(cached.payload.questions)){
        return cached.payload.questions.map((q,idx) => {
          const qq = {...q, _dbFile:dbBaseName(file.name), _dbSource:file.source || "cache"};
          if(!qq.id) qq.id = fallbackId(qq);
          qq._instanceId = `${dbBaseName(file.name)}::${idx}::${qq.id}`;
          return prepareQuestionRecord(qq);
        });
      }

      const res = await fetchWithTimeout(file.url, {cache:"force-cache"}, 15000);
      if(!res.ok) throw new Error(file.name+" okunamadı: HTTP "+res.status);

      let db;
      try{
        const text = await res.text();
        db = JSON.parse(text);
      }catch(e){
        throw new Error(file.name+" JSON olarak okunamadı. Dosya gerçekten JSON tabanlı .db formatında mı?");
      }

      if(!db || !Array.isArray(db.questions)) {
        throw new Error(file.name+" geçerli soru dosyası değil. İçinde questions dizisi olmalı.");
      }

      await setCachedDbPayload(cacheKey, {schemaVersion:db.schemaVersion || "", questions:db.questions});

      return db.questions.map((q,idx) => {
        const qq = {...q, _dbFile:dbBaseName(file.name), _dbSource:file.source};
        if(!qq.id) qq.id = fallbackId(qq);
        qq._instanceId = `${dbBaseName(file.name)}::${idx}::${qq.id}`;
        return prepareQuestionRecord(qq);
      });
    }

    async function loadManualDbFiles(fileList){
      const all = [];
      const files = Array.from(fileList || []);
      dbFiles = [];
      for (const file of files){
        const text = await file.text();
        let db;
        try{db = JSON.parse(text);}catch(e){throw new Error(file.name+" JSON olarak okunamadı.");}
        if(!db || !Array.isArray(db.questions)) throw new Error(file.name+" geçerli database değil. questions dizisi bulunamadı.");
        dbFiles.push({name:dbBaseName(file.name), url:file.name, source:"manual", displayName:dbBaseName(file.name)});
        all.push(...db.questions.map((q,idx) => {
          const qq = {...q, _dbFile:dbBaseName(file.name), _dbSource:"manual"};
          if(!qq.id) qq.id = fallbackId(qq);
          qq._instanceId = `${dbBaseName(file.name)}::${idx}::${qq.id}`;
          return prepareQuestionRecord(qq);
        }));
      }
      allLoadedQuestions = all;
      selectedDbFiles = dbFiles.map(f => dbBaseName(f.name));
      const duplicates = rebuildQuestionsFromActiveFiles(false);
      els.status.className = "panel status";
      els.status.innerHTML = `<b>${files.length}</b> manuel database dosyası yüklendi. <b>${activeQuestions().length}</b> benzersiz aktif soru kullanılıyor${duplicates ? `; ${duplicates} tekrar otomatik ayıklandı` : ""}.`;
      els.manualDbBox.classList.add("hidden");
      sanitizeFilters(); saveState(); renderLanding();
    }

    
    function normalizeQuestionTextForDedupe(value){
      let s = String(value ?? "").toLocaleLowerCase("tr-TR");
      try { s = s.normalize("NFKD").replace(/[\u0300-\u036f]/g, ""); } catch(e) {}
      s = s
        .replace(/ı/g, "i")
        .replace(/[abcde]\s*\)/g, " ")
        .replace(/\b(i|ii|iii|iv|v|vi|vii|viii|ix|x)\s*[\.\)]/g, " ")
        .replace(/[^a-z0-9çğıöşü\s]/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
      return s;
    }

    function dedupeSignature(q){
      const optionText = optionList(q).map(o => o && o.text ? o.text : "").join(" ");
      return normalizeQuestionTextForDedupe([q.question || "", optionText].join(" "));
    }

    function tokenSet(value){
      const stop = new Set(["ve","veya","ile","icin","hangisi","asagidakilerden","degildir","dogrudur","olan","olarak","en","bir","bu","da","de","mi","midir","nedir"]);
      return new Set(normalizeQuestionTextForDedupe(value).split(" ").filter(t => t.length > 1 && !stop.has(t)));
    }

    function jaccardSimilarity(a, b){
      if (!a.size && !b.size) return 1;
      let inter = 0;
      a.forEach(x => { if (b.has(x)) inter++; });
      const union = a.size + b.size - inter;
      return union ? inter / union : 0;
    }

    function isNearDuplicateQuestion(a, b){
      if (!a || !b) return false;

      // Aynı dosya içindeki soruları agresif şekilde silmemek için asıl hedef farklı soru dosyalarıdır.
      if (a._dbFile && b._dbFile && dbCanonicalName(a._dbFile) === dbCanonicalName(b._dbFile)) return false;

      const sigA = dedupeSignature(a);
      const sigB = dedupeSignature(b);
      if (!sigA || !sigB) return false;
      if (sigA === sigB) return true;

      const lenRatio = Math.min(sigA.length, sigB.length) / Math.max(sigA.length, sigB.length);
      if (lenRatio < 0.72) return false;

      const sim = jaccardSimilarity(tokenSet(sigA), tokenSet(sigB));
      return sim >= 0.90;
    }

    function dedupeKeyBucket(q){
      const subject = normalizeQuestionTextForDedupe(q.subject || "genel");
      const tokens = Array.from(tokenSet(dedupeSignature(q))).slice(0, 6).sort().join("|");
      return subject + "::" + tokens.slice(0, 80);
    }


    function fallbackId(q){
      try{return "qid_"+btoa(unescape(encodeURIComponent([q.subject,q.question,JSON.stringify(q.options),JSON.stringify(q.answer)].join("|")))).slice(0,24).replace(/[^a-zA-Z0-9]/g,"");}
      catch(e){return "qid_"+Math.random().toString(36).slice(2);}
    }

    function dedupeAndSetQuestions(all){
      if(duplicateMode === "all"){
        all.forEach((q,idx)=>{
          if(!q.id) q.id = fallbackId(q);
          if(!q._instanceId) q._instanceId = `${q._dbFile || "db"}::${idx}::${q.id}`;
        });
        questions = all.slice();
        window.__lastDedupeStats = {duplicates:0, nearDuplicates:0, disabled:true, mode:"all"};
        return 0;
      }

      const exactMap = new Map();
      const kept = [];
      const buckets = new Map();
      const subjectRecent = new Map();
      const chosenReplacements = new Map();
      let duplicates = 0;
      let nearDuplicates = 0;
      let aiPreferred = 0;

      function replaceRepresentative(oldQ, newQ){
        const oldKey = oldQ._instanceId || oldQ.id;
        const idx = kept.findIndex(x => (x._instanceId || x.id) === oldKey);
        if(idx >= 0){
          kept[idx] = newQ;
          chosenReplacements.set(oldKey, newQ);
          aiPreferred++;
          return true;
        }
        return false;
      }

      function resolveReplacement(q){
        const key = q && (q._instanceId || q.id);
        return chosenReplacements.get(key) || q;
      }

      all.forEach((q,idx) => {
        if(!q.id) q.id = fallbackId(q);
        if(!q._instanceId) q._instanceId = `${q._dbFile || "db"}::${idx}::${q.id}`;

        // 1) Aynı id tekrar ederse doğrudan silme; AI cevabı olan/kaliteli kaydı temsilci yap.
        if(exactMap.has(q.id)){
          duplicates++;
          const prev = exactMap.get(q.id);
          const better = preferredDuplicateQuestion(prev, q);
          if(better !== prev){
            replaceRepresentative(prev, better);
            exactMap.set(q.id, better);
          }
          return;
        }

        // 2) Benzer soru tekrarında da AI cevaplı sürüm tercih edilir.
        const bucket = dedupeKeyBucket(q);
        const localCandidates = [];

        if (buckets.has(bucket)) {
          localCandidates.push(...buckets.get(bucket).map(resolveReplacement));
        }

        const subjectKey = normalizeQuestionTextForDedupe(q.subject || "");
        if (localCandidates.length < 10 && subjectRecent.has(subjectKey)) {
          localCandidates.push(...subjectRecent.get(subjectKey).map(resolveReplacement));
        }

        const nearPrev = localCandidates.find(prev => isNearDuplicateQuestion(prev, q));
        if(nearPrev){
          nearDuplicates++;
          const better = preferredDuplicateQuestion(nearPrev, q);
          if(better !== nearPrev){
            replaceRepresentative(nearPrev, better);
            exactMap.set(better.id, better);
          }
          return;
        }

        exactMap.set(q.id, q);
        kept.push(q);

        if(!buckets.has(bucket)) buckets.set(bucket, []);
        const bucketArr = buckets.get(bucket);
        bucketArr.push(q);
        if (bucketArr.length > 80) bucketArr.shift();

        if(!subjectRecent.has(subjectKey)) subjectRecent.set(subjectKey, []);
        const recent = subjectRecent.get(subjectKey);
        recent.push(q);
        if (recent.length > 120) recent.shift();
      });

      questions = kept;
      window.__lastDedupeStats = {duplicates, nearDuplicates, aiPreferred, mode:"smart"};
      return duplicates + nearDuplicates;
    }

    
    
    function selectedRawQuestions(){
      if(!allLoadedQuestions.length) return questions.slice();
      const selected = activeDbSet();
      if(!selected.size) return allLoadedQuestions.slice();
      return allLoadedQuestions.filter(q => selected.has(dbCanonicalName(q._dbFile)));
    }

    function rebuildQuestionsFromActiveFiles(preserveCurrent=true){
      invalidateQuestionIndexes();
      const currentKey = preserveCurrent && questions[current] ? answerKey(questions[current]) : null;
      const raw = selectedRawQuestions();
      const duplicates = dedupeAndSetQuestions(raw);
      questionIndexById = new Map(questions.map((q,i)=>[answerKey(q),i]));

      sanitizeFilters();

      if(currentKey && questionIndexById.has(currentKey)){
        current = questionIndexById.get(currentKey);
      }else{
        const idxs = filteredIndexes();
        current = idxs.length ? idxs[0] : 0;
      }

      return duplicates;
    }

    function rebuildQuestionsAfterDuplicateToggle(){
      const duplicates = rebuildQuestionsFromActiveFiles(true);
      saveState();
      renderLanding();

      if(els.appView.classList.contains("active")){
        render();
      }

      if(els.listView.classList.contains("active")){
        renderAllList(true);
      }

      if(els.status){
        els.status.className = "panel status";
        els.status.innerHTML = duplicateMode === "smart"
          ? `Tekrarlar kapatıldı. ${duplicates ? duplicates + " aynı/benzer kayıt tekilleştirildi; AI cevaplı sürüm varsa o gösterildi." : "Tekrarlı kayıt bulunmadı."}`
          : "Tekrarlar açıldı. Seçili soru dosyalarındaki tüm kayıtlar ayrı ayrı gösteriliyor.";
        els.status.classList.remove("hidden");
        setTimeout(()=>els.status.classList.add("hidden"), 2500);
      }
    }

    function saveState(){
      try{localStorage.setItem(STORAGE_KEY, JSON.stringify({answers,current,filters,infoOpen,selectedDbFiles,fontSize,designMode,themeColor,duplicateMode,duplicateFilterEnabled,questionWideMode,listWideMode,shuffleQuestions,shuffleSeed,hiddenQuestionIds,starredQuestionIds,unknownQuestionIds,quizActive,quizIds,quizTitle}));}catch(e){}
    }
    function loadState(){
      loadLastPositions();
      loadStudyTimes();
      try{
        const raw=localStorage.getItem(STORAGE_KEY);
        if(!raw) return false;
        const data=JSON.parse(raw);
        if(data.answers && typeof data.answers==="object") answers=data.answers;
        if(Number.isInteger(data.current)) current=data.current;
        if(data.filters) filters={...filters,...data.filters};
        if(typeof data.infoOpen==="boolean") infoOpen=data.infoOpen;
        if(Array.isArray(data.selectedDbFiles)) selectedDbFiles=data.selectedDbFiles;
        if(["xsmall","small","normal","large"].includes(data.fontSize)) fontSize=data.fontSize;
        if(["standard","compact"].includes(data.designMode)) designMode=data.designMode;
        if(["blue","green","purple","rose"].includes(data.themeColor)) themeColor=data.themeColor;
        if(typeof data.duplicateFilterEnabled === "boolean") duplicateFilterEnabled=data.duplicateFilterEnabled;
        if(["smart","all"].includes(data.duplicateMode)) duplicateMode=data.duplicateMode;
        else duplicateMode = "all";
        if(typeof data.questionWideMode === "boolean") questionWideMode=data.questionWideMode;
        if(typeof data.listWideMode === "boolean") listWideMode=data.listWideMode;
        if(typeof data.shuffleQuestions === "boolean") shuffleQuestions=data.shuffleQuestions;
        if(Number.isFinite(data.shuffleSeed)) shuffleSeed=data.shuffleSeed;
        if(Array.isArray(data.hiddenQuestionIds)) hiddenQuestionIds=data.hiddenQuestionIds;
        if(Array.isArray(data.starredQuestionIds)) starredQuestionIds=data.starredQuestionIds;
        if(Array.isArray(data.unknownQuestionIds)) unknownQuestionIds=data.unknownQuestionIds;
        if(typeof data.quizActive === "boolean") quizActive=data.quizActive;
        if(Array.isArray(data.quizIds)) quizIds=data.quizIds;
        if(typeof data.quizTitle === "string") quizTitle=data.quizTitle;
        return true;
      }catch(e){return false;}
    }

    function applyThemeColor(){
      document.body.classList.remove("theme-blue","theme-green","theme-purple","theme-rose");
      document.body.classList.add("theme-" + themeColor);
      if(els.themeSelect) els.themeSelect.value = themeColor;
    }

    function applyFontSize(){
      applyThemeColor();
      document.body.classList.remove("font-xsmall","font-small","font-normal","font-large");
      document.body.classList.add("font-"+fontSize);
      if (els.fontSizeSelect) els.fontSizeSelect.value = fontSize;
      applyDesignMode();
    }

    function applyDesignMode(){
      document.body.classList.toggle("compact-mode", designMode === "compact");
      if (els.designModeSelect) els.designModeSelect.value = designMode;
      if (els.duplicateFilterSelect) els.duplicateFilterSelect.value = duplicateMode;
      if (els.questionOrderSelect) els.questionOrderSelect.value = shuffleQuestions ? "shuffle" : "normal";
      if (els.menuDuplicateBtn) els.menuDuplicateBtn.textContent = duplicateMode === "all" ? "Tekrarları kapat" : "Tekrarları aç";
      if (els.menuShuffleBtn) els.menuShuffleBtn.textContent = shuffleQuestions ? "Karışık sırayı kapat" : "Karışık sırayı aç";
      applyWideModes();
    }

    function applyWideModes(){
      document.body.classList.toggle("question-wide-mode", !!questionWideMode);
      document.body.classList.toggle("list-wide-mode", !!listWideMode);
      document.body.classList.toggle("quiz-active-mode", !!quizActive);

      if (els.wideQuestionBtn) {
        els.wideQuestionBtn.textContent = questionWideMode ? "↔ Tekli çözüm ekranından çık" : "⛶ Tekli çözüm ekranı";
        els.wideQuestionBtn.title = questionWideMode ? "Tekli soru ekranını normal genişliğe döndür" : "Tekli soru ekranını genişlet";
      }
      if (els.menuWideToggleBtn) {
        els.menuWideToggleBtn.textContent = questionWideMode ? "Tekli ekranı daralt" : "Tekli ekranı genişlet";
      }
      if (els.wideListBtn) {
        els.wideListBtn.textContent = listWideMode ? "↔ Listeyi daralt" : "⛶ Listeyi genişlet";
        els.wideListBtn.title = listWideMode ? "Tüm sorular ekranını normal genişliğe döndür" : "Tüm sorular ekranını genişlet";
      }
      updateBreakButtonVisibility();
    }

    function ensureSelectedDbFiles(){
      const available = new Set(dbFiles.map(f => dbCanonicalName(f.name)));
      selectedDbFiles = selectedDbFiles.map(dbBaseName).filter(name => available.has(dbCanonicalName(name)));
      if (!selectedDbFiles.length) selectedDbFiles = dbFiles.map(f => dbBaseName(f.name));
    }

    function matchesFilters(q, excludeField){
      if(!isDbActive(q)) return false;
      if(isHiddenQuestion(q)) return false;
      const term = normalize(filters.search.trim());
      if(excludeField!=="subject" && filters.subject!=="all" && q.subject!==filters.subject) return false;
      if(excludeField!=="exam" && filters.exam!=="all" && meta(q,"examGroup")!==filters.exam) return false;
      if(excludeField!=="year" && filters.year!=="all" && meta(q,"year")!==filters.year) return false;
      if(excludeField!=="teacher" && filters.teacher!=="all" && meta(q,"teacher")!==filters.teacher) return false;
      if(excludeField!=="sourceGroup" && filters.sourceGroup!=="all" && meta(q,"sourceGroup")!==filters.sourceGroup) return false;
      if(term){
        const haystack = q._searchText || prepareQuestionRecord(q)._searchText || "";
        if(!haystack.includes(term)) return false;
      }
      return true;
    }
    
    function hashStringToNumber(value){
      let h = 2166136261;
      const s = String(value ?? "");
      for(let i=0;i<s.length;i++){
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      return h >>> 0;
    }

    function shuffleRankForQuestion(q){
      return hashStringToNumber(`${shuffleSeed}::${answerKey(q)}::${q.subject || ""}::${q.question || ""}`);
    }

    function orderIndexes(idxs){
      if(!shuffleQuestions) return idxs;
      return idxs.slice().sort((a,b)=>{
        const ra = shuffleRankForQuestion(questions[a]);
        const rb = shuffleRankForQuestion(questions[b]);
        if(ra !== rb) return ra - rb;
        return a - b;
      });
    }

    function setShuffleMode(enabled, regenerate=false){
      shuffleQuestions = !!enabled;
      invalidateQuestionIndexes();
      if(regenerate || !Number.isFinite(shuffleSeed)) shuffleSeed = Date.now();
      if(els.questionOrderSelect) els.questionOrderSelect.value = shuffleQuestions ? "shuffle" : "normal";
      saveState();
      ensureCurrent();
      renderLanding();
      if(els.appView.classList.contains("active")) render();
      if(els.listView.classList.contains("active")) renderAllList(true);
    }

    function filteredIndexes(){
      const key = filterCacheKey();
      if(key === filteredIndexesCacheKey && Array.isArray(filteredIndexesCache)){
        return filteredIndexesCache;
      }

      let idxs;
      if(examMode && examIds.length){
        idxs = examIds
          .map(id => questionIndexById.has(id) ? questionIndexById.get(id) : questions.findIndex(q => answerKey(q) === id))
          .filter(i => i >= 0 && isDbActive(questions[i]) && !isHiddenQuestion(questions[i]));
      }else if(quizActive && quizIds.length){
        idxs = quizIds
          .map(id => questionIndexById.has(id) ? questionIndexById.get(id) : questions.findIndex(q => answerKey(q) === id))
          .filter(i => i >= 0 && isDbActive(questions[i]) && !isHiddenQuestion(questions[i]));
      }else{
        idxs = orderIndexes(questions.map((q,i)=>[q,i]).filter(([q])=>matchesFilters(q,null)).map(([,i])=>i));
      }

      filteredIndexesCacheKey = key;
      filteredIndexesCache = idxs;
      return idxs;
    }
    function filteredQuestionsForOptions(excludeField){return questions.filter(q=>matchesFilters(q, excludeField));}
    function countValuesForOptions(fieldFn, excludeField){
      const map=new Map();
      filteredQuestionsForOptions(excludeField).forEach(q=>{const v=fieldFn(q)||"Belirtilmemiş"; map.set(v,(map.get(v)||0)+1);});
      return [...map.entries()].map(([value,count])=>({value,count})).sort((a,b)=>a.value.localeCompare(b.value,"tr"));
    }
    function countValues(fieldFn, baseQuestions = activeQuestions()){
      const map=new Map();
      baseQuestions.forEach(q=>{const v=fieldFn(q)||"Belirtilmemiş"; map.set(v,(map.get(v)||0)+1);});
      return [...map.entries()].map(([value,count])=>({value,count})).sort((a,b)=>a.value.localeCompare(b.value,"tr"));
    }
    function optionSet(fieldFn, excludeField){return new Set(countValuesForOptions(fieldFn, excludeField).map(x=>x.value));}
    function sanitizeFilters(){
      let changed=true, guard=0;
      while(changed && guard<10){
        changed=false; guard++;
        [["subject",q=>q.subject,"subject"],["exam",q=>meta(q,"examGroup"),"exam"],["year",q=>meta(q,"year"),"year"],["teacher",q=>meta(q,"teacher"),"teacher"],["sourceGroup",q=>meta(q,"sourceGroup"),"sourceGroup"]].forEach(([key,fn,exclude])=>{
          if(filters[key]!=="all" && !optionSet(fn,exclude).has(filters[key])){filters[key]="all"; changed=true;}
        });
      }
    }
    function ensureCurrent(){const idxs=filteredIndexes(); if(idxs.length && !idxs.includes(current)) current=idxs[0];}

    function stats(){
      const idxs=filteredIndexes();
      let answered=0, correct=0, wrong=0, neutral=0, unknown=0;
      idxs.forEach(i=>{
        const q=questions[i], a=answers[answerKey(q)];
        if(isUnknownQuestion(q)) unknown++;
        if(a!==undefined && a!==null){
          answered++;
          const ci=q.answer ? q.answer.index : null;
          if(ci===null || ci===undefined || ci<0) neutral++;
          else if(a===ci) correct++;
          else wrong++;
        }
      });
      const reviewCount = reviewIndexes().length;
      return {total:idxs.length, answered, correct, wrong, neutral, unknown, reviewCount, empty:idxs.length-answered, percent:answered?Math.round((correct/answered)*100):0};
    }

    function setSelect(select, items, allLabel, value){
      select.innerHTML="";
      const all=document.createElement("option"); all.value="all"; all.textContent=allLabel; select.appendChild(all);
      items.forEach(item=>{const opt=document.createElement("option"); opt.value=item.value; opt.textContent=`${item.value} (${item.count})`; select.appendChild(opt);});
      select.value=value;
      if(select.value!==value) select.value="all";
    }

    function makeFilterButton(label,count,active,onClick,wide=false){
      const b=document.createElement("button");
      b.className="filter-btn"+(active?" active":"")+(wide?" wide":"");
      b.innerHTML=`${escapeHTML(label)} <span class="small">(${count})</span>`;
      b.addEventListener("click", onClick);
      return b;
    }

    function renderDbSelector(){
      els.dbList.innerHTML = "";
      const activeCounts = new Map();
      (allLoadedQuestions.length ? allLoadedQuestions : questions).forEach(q => { const n=dbBaseName(q._dbFile); activeCounts.set(n, (activeCounts.get(n) || 0) + 1); });
      [...new Map(dbFiles.map(f=>[dbCanonicalName(f.name), f])).values()].forEach(file => {
        const label = document.createElement("label");
        label.className = "db-item";
        const shownName = dbBaseName(file.name);
        const checked = activeDbSet().has(dbCanonicalName(shownName));
        label.innerHTML = `
          <input type="checkbox" value="${escapeHTML(shownName)}" ${checked ? "checked" : ""}>
          <span><b>${escapeHTML(shownName)}</b><br><span class="small">${activeCounts.get(shownName) || activeCounts.get(file.name) || 0} ${duplicateMode === "smart" ? "seçili soru" : "soru kaydı"} · ${escapeHTML(file.source || "")}</span></span>
        `;
        const input = label.querySelector("input");
        input.addEventListener("change", () => {
          if (input.checked) {
            if (!activeDbSet().has(dbCanonicalName(shownName))) selectedDbFiles.push(shownName);
          } else {
            selectedDbFiles = selectedDbFiles.filter(x => dbCanonicalName(x) !== dbCanonicalName(shownName));
          }
          rebuildQuestionsFromActiveFiles(true); saveState(); renderLanding(); if(els.appView.classList.contains("active")) render();
        });
        els.dbList.appendChild(label);
      });
    }

    function renderLanding(){
      ensureSelectedDbFiles();
      sanitizeFilters();
      const aq = activeVisibleQuestions();
      els.totalQuestionsHero.textContent=aq.length;
      els.totalSubjectsHero.textContent=countValues(q=>q.subject, aq).length;
      renderDbSelector();
      applyFontSize();

      const term=normalize(els.courseSearch.value.trim());
      els.courseGrid.innerHTML="";
      const courseCounts=countValues(q=>q.subject, aq);
      const filtered=courseCounts.filter(item=>!term || normalize(item.value).includes(term));
      filtered.forEach(item=>{
        const subjectQuestions=aq.filter(q=>q.subject===item.value);
        const examCount=new Set(subjectQuestions.map(q=>meta(q,"examGroup")).filter(Boolean)).size;
        const teacherCount=new Set(subjectQuestions.map(q=>meta(q,"teacher")).filter(Boolean)).size;
        const card=document.createElement("article");
        card.className="course-card panel"; card.tabIndex=0;
        const teachers = [...new Set(subjectQuestions.map(q=>meta(q,"teacher")).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"tr"));
        const teacherOptions = [`<option value="all">Tüm hocalar</option>`].concat(teachers.map(t=>`<option value="${escapeHTML(t)}">${escapeHTML(t)}</option>`)).join("");
        card.innerHTML=`
          <div>
            <div class="course-icon">${escapeHTML(initials(item.value))}</div>
            <h2>${escapeHTML(item.value)}</h2>
            <p>${item.count} soru · ${examCount} grup · ${teacherCount} hoca</p>
            <div class="course-study-time">Çalışma: ${formatStudyTime(subjectStudySeconds(item.value))}</div>
            <select class="teacher-select-mini" aria-label="${escapeHTML(item.value)} hoca seçimi">${teacherOptions}</select>
          </div>
          <div class="course-meta">
            <span class="chip">${item.count} soru</span>
            <span class="chip">Dersi aç</span>
            <button class="quiz-card-btn" type="button" data-subject="${escapeHTML(item.value)}">Quiz (${Math.min(30, item.count)})</button>
            <button class="exam-card-btn" type="button" data-subject="${escapeHTML(item.value)}">Sınav modu</button>
            <button class="continue-card-btn" type="button" data-subject="${escapeHTML(item.value)}">Kaldığım yerden devam</button>
          </div>
        `;
        const quizBtn = card.querySelector(".quiz-card-btn");
        const examBtn = card.querySelector(".exam-card-btn");
        const continueCourseBtn = card.querySelector(".continue-card-btn");
        const teacherSelect = card.querySelector(".teacher-select-mini");
        teacherSelect.addEventListener("click", ev => ev.stopPropagation());
        teacherSelect.addEventListener("change", ev => ev.stopPropagation());
        if(examBtn) examBtn.addEventListener("click",(ev)=>{
          ev.stopPropagation();
          startExamMode(item.value, teacherSelect ? teacherSelect.value : "all");
        });
        if(continueCourseBtn) {
          const updateContinueButton = () => {
            const teacher = teacherSelect ? teacherSelect.value : "all";
            const available = hasLastPosition(item.value, teacher);
            continueCourseBtn.disabled = !available;
            continueCourseBtn.textContent = available ? "Kaldığım yerden devam" : "Kayıt yok";
          };
          updateContinueButton();
          teacherSelect.addEventListener("change", updateContinueButton);
          continueCourseBtn.addEventListener("click",(ev)=>{
            ev.stopPropagation();
            const teacher = teacherSelect ? teacherSelect.value : "all";
            continueCourse(item.value, teacher);
          });
        }
        quizBtn.addEventListener("click",(ev)=>{
          ev.stopPropagation();
          const teacher = teacherSelect ? teacherSelect.value : "all";
          if(teacher && teacher !== "all"){
            const pool = activeVisibleQuestions().filter(q => q.subject === item.value && meta(q,"teacher") === teacher);
            if(!pool.length){ alert("Bu hoca için quiz sorusu bulunamadı."); return; }
            const chosen = shuffleArray(pool).slice(0, Math.min(30, pool.length));
            quizActive = true;
            quizIds = chosen.map(q => answerKey(q));
            quizTitle = `${item.value} · ${teacher} quiz modu · ${chosen.length} soru`;
            document.body.classList.add("app-screen-active");
            filters = {subject:item.value, exam:"all", year:"all", teacher:teacher, sourceGroup:"all", search:""};
            const firstIndex = questions.findIndex(q => answerKey(q) === quizIds[0]);
            if(firstIndex >= 0) current = firstIndex;
            els.landing.classList.add("hidden");
            els.appView.classList.add("active");
            els.quizView.classList.remove("hidden");
            els.listView.classList.remove("active");
            els.activeTitle.textContent = quizTitle;
            els.results.style.display = "none";
            render();
            scrollToQuestion("auto");
            return;
          }
          startQuiz(item.value, 30);
        });
        card.addEventListener("click",()=>startCourseWithTeacher(item.value, teacherSelect ? teacherSelect.value : "all"));
        card.addEventListener("keydown",ev=>{if(ev.key==="Enter"||ev.key===" "){ev.preventDefault();startCourseWithTeacher(item.value, teacherSelect ? teacherSelect.value : "all");}});
        els.courseGrid.appendChild(card);
      });
      els.courseEmpty.style.display=filtered.length?"none":"block";
      els.continueBtn.disabled=!aq.length || !hasLastPosition("all","all");
      const wrongCount = activeWrongCount();
      els.wrongHomeBtn.disabled = wrongCount === 0;
      els.wrongHomeBtn.textContent = wrongCount ? `Yanlışlarımı aç (${wrongCount})` : "Yanlışlarımı aç";
      const hiddenCount = hiddenQuestionCount();
      els.hiddenHomeBtn.disabled = hiddenCount === 0;
      els.hiddenHomeBtn.textContent = hiddenCount ? `Gizlenen soruları yönet (${hiddenCount})` : "Gizlenen soruları yönet";
      const starredCount = starredQuestionCount();
      if(els.starredHomeBtn){
        els.starredHomeBtn.disabled = starredCount === 0;
        els.starredHomeBtn.textContent = starredCount ? `Yıldızlı sorular (${starredCount})` : "Yıldızlı sorular";
      }
      els.quizAllBtn.disabled = aq.length === 0;
      els.quizAllBtn.textContent = aq.length ? `Tüm dersler quiz modu (${Math.min(150, aq.length)})` : "Tüm dersler quiz modu";
    }

    function openHomeSettingsPanel(panelId){
      document.body.classList.remove("app-screen-active");
      els.landing.classList.remove("hidden");
      els.appView.classList.remove("active");
      els.quizView.classList.remove("hidden");
      els.listView.classList.remove("active");
      els.results.style.display="none";
      renderLanding();

      const panel = document.getElementById(panelId);
      if(panel){
        panel.open = true;
        setTimeout(()=>panel.scrollIntoView({behavior:"smooth", block:"start"}), 60);
      }
      if(els.topMenu) els.topMenu.open = false;
    }

    
    
    function pushAppHistoryState(screen){
      if(suppressHistoryAction) return;
      try{
        const state = {screen, fullscreen:document.body.classList.contains("question-card-fullscreen"), listMode};
        history.pushState(state, "", location.href);
      }catch(e){}
    }

    function replaceAppHistoryState(screen){
      try{
        history.replaceState({screen, fullscreen:document.body.classList.contains("question-card-fullscreen"), listMode}, "", location.href);
      }catch(e){}
    }

    async function exitQuestionFullscreenOnly(){
      try{
        if(document.fullscreenElement) await document.exitFullscreen();
      }catch(e){}
      document.body.classList.remove("question-card-fullscreen");
      updateQuestionFullscreenIcon();
    }

    function handleBrowserBack(){
      if(document.body.classList.contains("question-card-fullscreen") || document.fullscreenElement){
        exitQuestionFullscreenOnly();
        return;
      }
      if(els.listView && els.listView.classList.contains("active")){
        suppressHistoryAction = true;
        showQuizView();
        suppressHistoryAction = false;
        return;
      }
      if(els.appView && els.appView.classList.contains("active")){
        suppressHistoryAction = true;
        showLanding();
        suppressHistoryAction = false;
        return;
      }
    }

    function currentSubjectForExam(){
      if(filters.subject && filters.subject !== "all") return filters.subject;
      const q = questions[current];
      if(q && q.subject) return q.subject;
      return "all";
    }

    function buildExamPool(subject, teacher="all"){
      return activeVisibleQuestions().filter(q=>{
        if(!subject || subject === "all") return false;
        if(q.subject !== subject) return false;
        if(teacher && teacher !== "all" && meta(q,"teacher") !== teacher) return false;
        return true;
      });
    }

    function stopExamTimer(){
      if(examTimerHandle){
        clearInterval(examTimerHandle);
        examTimerHandle = null;
      }
    }

    function updateExamTimerUI(){
      if(!els.examTimerText) return;
      els.examTimerText.textContent = `${examRemaining} sn`;
      els.examTimerText.classList.toggle("danger-time", examRemaining <= 5);
    }

    function startExamTimer(){
      stopExamTimer();
      examRemaining = 20;
      updateExamTimerUI();
      examTimerHandle = setInterval(()=>{
        if(!examMode) { stopExamTimer(); return; }
        if(breakModeActive) return;
        examRemaining -= 1;
        updateExamTimerUI();
        if(examRemaining <= 0){
          const idxs = filteredIndexes();
          const pos = idxs.indexOf(current);
          if(pos >= 0 && pos < idxs.length - 1){
            current = idxs[pos+1];
            render();
            scrollToQuestion("auto");
          }else{
            stopExamTimer();
            renderResults();
          }
        }
      }, 1000);
    }

    function startExamMode(subject, teacher="all"){
      stopQuizMode();
      const pool = buildExamPool(subject, teacher);
      if(!pool.length){
        alert("Bu ders için sınav modunda gösterilecek soru bulunamadı.");
        return;
      }
      examMode = true;
      examSubject = subject;
      examTeacher = teacher || "all";
      examIds = pool.map(q=>answerKey(q));
      filters = {subject:subject, exam:"all", year:"all", teacher:examTeacher, sourceGroup:"all", search:""};
      const firstIndex = questions.findIndex(q => answerKey(q) === examIds[0]);
      current = firstIndex >= 0 ? firstIndex : 0;
      document.body.classList.add("app-screen-active","exam-mode");
      els.landing.classList.add("hidden");
      els.appView.classList.add("active");
      els.quizView.classList.remove("hidden");
      els.listView.classList.remove("active");
      els.results.style.display="none";
      if(els.examModeTitle) els.examModeTitle.textContent = `${subject}${examTeacher !== "all" ? " · " + examTeacher : ""} · Sınav modu`;
      if(els.topMenu) els.topMenu.open = false;
      render();
      startExamTimer();
      scrollToQuestion("auto");
    }

    function cancelExamMode(){
      if(!examMode) return;
      if(!confirm("Sınav modu iptal edilsin mi?")) return;
      examMode = false;
      examIds = [];
      stopExamTimer();
      document.body.classList.remove("exam-mode");
      showLanding();
    }

    function exitExamModeWithoutConfirm(){
      examMode = false;
      examIds = [];
      stopExamTimer();
      document.body.classList.remove("exam-mode");
    }

    
    
    function buildQuestionForChatGPT(q){
      const opts = optionList(q);
      const parts = [];

      parts.push("Aşağıdaki çoktan seçmeli soruyu çöz.");
      parts.push("Bu sorunun cevabı nedir? Doğru şıkkı ve kısa gerekçesini yaz.");
      parts.push("");

      const info = [
        q.subject ? `Ders: ${q.subject}` : "",
        meta(q,"examGroup") ? `Kurul/Sınav: ${meta(q,"examGroup")}` : "",
        meta(q,"year") ? `Yıl: ${meta(q,"year")}` : "",
        meta(q,"teacher") ? `Hoca: ${meta(q,"teacher")}` : "",
        meta(q,"topic") ? `Konu: ${meta(q,"topic")}` : "",
        meta(q,"target") ? `Hedef/Kazanım: ${meta(q,"target")}` : ""
      ].filter(Boolean);

      if(info.length){
        parts.push("Soru bilgisi:");
        parts.push(info.join(" | "));
        parts.push("");
      }

      parts.push("Soru:");
      parts.push(q.question || "");

      if(opts.length){
        parts.push("");
        parts.push("Şıklar:");
        opts.forEach((opt, idx)=>{
          parts.push(`${opt.letter || String.fromCharCode(65+idx)}) ${opt.text || ""}`);
        });
      }

      parts.push("");
      parts.push("Lütfen yalnızca soruyu çöz; doğru cevabı, neden doğru olduğunu ve diğer şıkların neden uygun olmadığını kısa şekilde açıkla.");
      return parts.join("\n");
    }

    async function copyTextSafely(text){
      try{
        if(navigator.clipboard && window.isSecureContext){
          await navigator.clipboard.writeText(text);
          return true;
        }
      }catch(e){}
      try{
        const area = document.createElement("textarea");
        area.value = text;
        area.style.position = "fixed";
        area.style.left = "-9999px";
        area.style.top = "0";
        document.body.appendChild(area);
        area.focus();
        area.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(area);
        return ok;
      }catch(e){
        return false;
      }
    }

    
    function closeChatGPTWebview(){
      if(els.chatgptWebviewFrame) els.chatgptWebviewFrame.removeAttribute("src");
      if(els.chatgptWebviewModal){
        els.chatgptWebviewModal.classList.add("hidden");
        els.chatgptWebviewModal.setAttribute("aria-hidden","true");
      }
    }

    function openChatGPTNewTab(){
      if(currentChatGPTUrl){
        window.open(currentChatGPTUrl, "_blank", "noopener,noreferrer");
      }else{
        window.open("https://chatgpt.com/", "_blank", "noopener,noreferrer");
      }
    }

    async function copyCurrentChatGPTPrompt(){
      if(!currentChatGPTPrompt){
        alert("Kopyalanacak prompt bulunamadı.");
        return;
      }
      const ok = await copyTextSafely(currentChatGPTPrompt);
      alert(ok ? "Prompt panoya kopyalandı." : "Prompt otomatik kopyalanamadı.");
    }

    function openChatGPTWebview(url, promptWasCopied=false){
      currentChatGPTUrl = url;
      if(!els.chatgptWebviewModal || !els.chatgptWebviewFrame){
        openChatGPTNewTab();
        return;
      }

      els.chatgptWebviewModal.classList.remove("hidden");
      els.chatgptWebviewModal.setAttribute("aria-hidden","false");

      if(els.chatgptWebviewNote){
        els.chatgptWebviewNote.textContent = promptWasCopied
          ? "Soru metni çok uzun olduğu için prompt panoya kopyalandı. Webview içinde ChatGPT açılırsa promptu yapıştırabilirsin. Açılmazsa yeni sekmede aç."
          : "ChatGPT bazı tarayıcılarda güvenlik nedeniyle sayfa içinde açılmayabilir. Açılmazsa “Yeni sekmede aç” butonunu kullan.";
      }

      try{
        els.chatgptWebviewFrame.src = url;
      }catch(e){
        openChatGPTNewTab();
      }

      setTimeout(()=>{
        if(!els.chatgptWebviewModal.classList.contains("hidden") && els.chatgptWebviewNote){
          els.chatgptWebviewNote.textContent = "Webview boş/engellenmiş görünüyorsa ChatGPT sayfa içinde açılmıyor olabilir. “Yeni sekmede aç” ya da “Promptu kopyala” seçeneklerini kullan.";
        }
      }, 2800);
    }

async function openCurrentQuestionInChatGPT(){
      const q = questions[current];
      if(!q){
        alert("Gönderilecek soru bulunamadı.");
        return;
      }

      const prompt = buildQuestionForChatGPT(q);
      currentChatGPTPrompt = prompt;
      let url = "https://chatgpt.com/?q=" + encodeURIComponent(prompt);
      currentChatGPTUrl = url;

      if(url.length > 7500){
        const copied = await copyTextSafely(prompt);
        window.open("https://chatgpt.com/", "_blank", "noopener,noreferrer");
        alert(copied
          ? "Soru metni çok uzun olduğu için panoya kopyalandı. Açılan ChatGPT sekmesine yapıştırabilirsin."
          : "Soru metni çok uzun olduğu için doğrudan aktarılamadı. ChatGPT açıldı; soruyu manuel kopyalaman gerekebilir.");
        return;
      }

      window.open(url, "_blank", "noopener,noreferrer");
    }

    function questionCardElement(){
      return document.querySelector(".question-card");
    }

    
    function showBreakModal(){
      if(breakModeActive) return;
      commitStudyTime(true);
      saveStudyTimes(true);
      breakModeActive = true;
      lastStudyTick = 0;
      document.body.classList.add("break-active");
      if(els.breakModal){
        attachModalToFullscreenHost(els.breakModal);
        els.breakModal.classList.remove("hidden");
        els.breakModal.style.display = "flex";
        els.breakModal.setAttribute("aria-hidden","false");
        requestAnimationFrame(()=>els.breakContinueBtn && els.breakContinueBtn.focus());
      }
    }

    function resumeFromBreak(){
      breakModeActive = false;
      lastStudyTick = Date.now();
      document.body.classList.remove("break-active");
      if(els.breakModal){
        els.breakModal.classList.add("hidden");
        els.breakModal.style.display = "";
        els.breakModal.setAttribute("aria-hidden","true");
      }
      updateQuestionStudyTimeBadge();
    }

    function updateBreakButtonVisibility(){
      if(!els.questionBreakBtn) return;
      const activeFullscreen =
        document.body.classList.contains("question-card-fullscreen") ||
        document.body.classList.contains("question-wide-mode") ||
        !!(document.fullscreenElement && (
          document.fullscreenElement.classList?.contains("question-card") ||
          document.fullscreenElement.querySelector?.("#questionBreakBtn")
        ));
      els.questionBreakBtn.classList.toggle("break-visible", activeFullscreen);
      els.questionBreakBtn.style.display = activeFullscreen ? "inline-flex" : "none";
    }

    function updateQuestionFullscreenIcon(){
      const btn = els.questionFullscreenBtn;
      if(!btn) return;
      const active = document.body.classList.contains("question-card-fullscreen") ||
        (document.fullscreenElement && document.fullscreenElement.classList && document.fullscreenElement.classList.contains("question-card"));
      btn.title = active ? "Tam ekrandan çık" : "Tam ekran yap";
      btn.setAttribute("aria-label", active ? "Tam ekrandan çık" : "Tam ekran yap");
      btn.innerHTML = active
        ? `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
        : `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      updateBreakButtonVisibility();
    }

    async function toggleQuestionFullscreen(){
      const card = questionCardElement();
      if(!card) return;

      try{
        if(document.fullscreenElement){
          await document.exitFullscreen();
          document.body.classList.remove("question-card-fullscreen");
        }else if(card.requestFullscreen){
          pushAppHistoryState("fullscreen");
          await card.requestFullscreen();
          document.body.classList.add("question-card-fullscreen");
        }else{
          const willEnter = !document.body.classList.contains("question-card-fullscreen");
          if(willEnter) pushAppHistoryState("fullscreen");
          document.body.classList.toggle("question-card-fullscreen");
        }
      }catch(e){
        document.body.classList.toggle("question-card-fullscreen");
      }

      updateQuestionFullscreenIcon();
      requestAnimationFrame(()=>scrollToQuestion("auto"));
    }

    
    function qbCurrentPage(){
      return document.body && document.body.dataset ? (document.body.dataset.page || "main") : "main";
    }

    function qbIsFastNavigation(){
      try{return sessionStorage.getItem("QB_FAST_NAV") === "1";}catch(e){return false;}
    }

    function qbSetFastNavigation(){
      try{sessionStorage.setItem("QB_FAST_NAV","1");}catch(e){}
    }

    function qbClearFastNavigation(){
      try{sessionStorage.removeItem("QB_FAST_NAV");}catch(e){}
    }

    function qbGoQuestionPage(payload){
      try{
        sessionStorage.setItem("QB_ROUTE_REQUEST", JSON.stringify(payload || {}));
        sessionStorage.setItem("QB_FAST_NAV","1");
      }catch(e){}
      window.location.href = "question.html";
    }


    function showLanding(){
      if(qbCurrentPage() === "question" && !window.QB_ALLOW_LOCAL_LANDING){ qbSetFastNavigation(); window.location.href = "main.html"; return; }
      resumeFromBreak();
      replaceAppHistoryState("home");
      pauseStudyTimer();
      closeChatGPTWebview();
      document.body.classList.remove("question-card-fullscreen");
      exitExamModeWithoutConfirm();
      stopQuizMode();
      document.body.classList.remove("app-screen-active");
      els.landing.classList.remove("hidden"); els.appView.classList.remove("active");
      els.quizView.classList.remove("hidden"); els.listView.classList.remove("active");
      els.results.style.display="none"; if(els.topMenu) els.topMenu.open=false; window.scrollTo(0,0); renderLanding();
    }
    function startCourseWithTeacher(subject, teacher){
      if(qbCurrentPage() === "main"){ qbGoQuestionPage({action:"startCourseWithTeacher", subject, teacher}); return; }
      pushAppHistoryState("question");
      stopQuizMode();
      document.body.classList.add("app-screen-active");
      document.body.classList.add("app-screen-active");
      filters={subject:subject||"all", exam:"all", year:"all", teacher:teacher||"all", sourceGroup:"all", search:""};
      restoreLastPosition(subject||"all", teacher||"all");
      els.landing.classList.add("hidden");
      els.appView.classList.add("active");
      els.quizView.classList.remove("hidden");
      els.listView.classList.remove("active");
      els.activeTitle.textContent = subject && subject !== "all"
        ? (teacher && teacher !== "all" ? subject + " · " + teacher : subject + " soru bankası")
        : "Tüm dersler soru bankası";
      els.results.style.display="none";
      render();
      scrollToQuestion("auto");
    }

    function startCourse(subject){
      if(qbCurrentPage() === "main"){ qbGoQuestionPage({action:"startCourse", subject}); return; }
      pushAppHistoryState("question");
      stopQuizMode();
      document.body.classList.add("app-screen-active");
      document.body.classList.add("app-screen-active");
      filters={subject:subject||"all", exam:"all", year:"all", teacher:"all", sourceGroup:"all", search:""};
      restoreLastPosition(subject||"all","all"); els.landing.classList.add("hidden"); els.appView.classList.add("active");
      els.quizView.classList.remove("hidden"); els.listView.classList.remove("active");
      els.activeTitle.textContent=subject&&subject!=="all"?subject+" soru bankası":"Tüm dersler soru bankası";
      els.results.style.display="none"; render(); scrollToQuestion("auto");
    }
    function continueLast(){
      if(qbCurrentPage() === "main"){ qbGoQuestionPage({action:"continueCourse", subject:filters.subject || "all", teacher:filters.teacher || "all"}); return; }
      continueCourse(filters.subject || "all", filters.teacher || "all");
    }

    function renderFilters(){
      sanitizeFilters();
      setSelect(els.subjectSelect, countValuesForOptions(q=>q.subject,"subject"), "Tüm dersler", filters.subject);
      setSelect(els.examSelect, countValuesForOptions(q=>meta(q,"examGroup"),"exam"), "Tüm kurul/sınav grupları", filters.exam);
      setSelect(els.yearSelect, countValuesForOptions(q=>meta(q,"year"),"year"), "Tüm yıllar", filters.year);
      setSelect(els.teacherSelect, countValuesForOptions(q=>meta(q,"teacher"),"teacher"), "Tüm hocalar", filters.teacher);
      setSelect(els.sourceGroupSelect, countValuesForOptions(q=>meta(q,"sourceGroup"),"sourceGroup"), "Tüm kaynak türleri", filters.sourceGroup);
      els.searchInput.value=filters.search;
      els.subjectButtons.innerHTML="";
      els.subjectButtons.appendChild(makeFilterButton("Tüm dersler",activeVisibleQuestions().length,filters.subject==="all",()=>{filters.subject="all";ensureCurrent();render();},true));
      countValuesForOptions(q=>q.subject,"subject").forEach(item=>els.subjectButtons.appendChild(makeFilterButton(item.value,item.count,filters.subject===item.value,()=>{filters.subject=item.value;ensureCurrent();render();})));
    }

    
    function escapeHTMLWithBreaks(value){
      return escapeHTML(value).replace(/\r?\n/g, "<br>");
    }

    function formatQuestionHTML(raw){
      const text = String(raw || "");
      const markerRe = /(^|[\n\r]|\s)(I{1,3}|IV|V|VI{0,3}|IX|X)\.\s+/g;
      const matches = [];
      let m;
      while((m = markerRe.exec(text)) !== null){
        const romanStart = m.index + m[1].length;
        matches.push({
          start: romanStart,
          end: markerRe.lastIndex,
          roman: m[2]
        });
      }

      if(matches.length < 2){
        return escapeHTMLWithBreaks(text);
      }

      const lead = text.slice(0, matches[0].start).trim();
      const items = matches.map((mark, idx)=>{
        const nextStart = idx < matches.length - 1 ? matches[idx+1].start : text.length;
        const body = text.slice(mark.end, nextStart).trim();
        return {roman:mark.roman, body};
      }).filter(item => item.body);

      if(items.length < 2){
        return escapeHTMLWithBreaks(text);
      }

      const leadHTML = lead ? `<div class="question-lead">${escapeHTMLWithBreaks(lead)}</div>` : "";
      const itemHTML = items.map(item => `
        <div class="premise-row">
          <span class="premise-roman">${escapeHTML(item.roman)}.</span>
          <span class="premise-text">${escapeHTMLWithBreaks(item.body)}</span>
        </div>
      `).join("");

      return `${leadHTML}<div class="premise-list">${itemHTML}</div>`;
    }

    function questionAnswerStatusClass(q){
      const a = answers[answerKey(q)];
      if(a === undefined || a === null) return "";
      const ci = q && q.answer ? q.answer.index : null;
      if(ci === null || ci === undefined || ci < 0) return "jump-neutral";
      return a === ci ? "jump-ok" : "jump-bad";
    }

    function updateHeaderJumpMenuState(){
      if(!els.questionJumpMenuGrid) return;
      els.questionJumpMenuGrid.querySelectorAll("button.header-jump").forEach(btn=>{
        const i = Number(btn.dataset.index);
        const q = questions[i];
        btn.classList.toggle("active", i === current);
        btn.classList.remove("jump-ok","jump-bad","jump-neutral");
        if(q){
          const cls = questionAnswerStatusClass(q);
          if(cls) btn.classList.add(cls);
        }
      });
    }

    function renderHeaderJumpMenu(idxs){
      if(!els.questionJumpMenuGrid) return;
      const key = idxs.length + ":" + idxs.join("|");
      if(key === headerJumpMenuKey && els.questionJumpMenuGrid.children.length){
        updateHeaderJumpMenuState();
        return;
      }

      headerJumpMenuKey = key;
      els.questionJumpMenuGrid.innerHTML = "";

      if(!idxs.length){
        els.questionJumpMenuGrid.innerHTML = `<div class="small">Soru yok.</div>`;
        return;
      }

      const frag = document.createDocumentFragment();
      idxs.forEach((i,pos)=>{
        const q = questions[i];
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "header-jump";
        btn.dataset.index = String(i);
        btn.textContent = pos + 1;
        btn.title = `${pos+1}. soru · ${q ? (q.subject || "") : ""} · ${q ? meta(q,"examGroup") : ""}`;
        if(i === current) btn.classList.add("active");
        const cls = q ? questionAnswerStatusClass(q) : "";
        if(cls) btn.classList.add(cls);
        btn.addEventListener("click",()=>{
          current = i;
          if(els.questionJumpMenuDetails) els.questionJumpMenuDetails.open = false;
          render();
          requestAnimationFrame(()=>scrollToQuestion("auto"));
        });
        frag.appendChild(btn);
      });

      els.questionJumpMenuGrid.appendChild(frag);
    }

    function renderQuestion(){
      const idxs=filteredIndexes();
      if(!idxs.length){
        pauseStudyTimer();
        document.body.classList.add("no-question-active");
        els.section.textContent="Soru bulunamadı"; els.meta.innerHTML=""; els.question.textContent=questions.length?"Seçili filtrelerle veya aktif database seçimiyle eşleşen soru yok.":"Soru dosyası yüklenemedi veya soru bulunamadı.";
        els.options.innerHTML=""; els.feedback.className="feedback"; els.feedback.innerHTML=""; if(els.aiWarningBox){els.aiWarningBox.className="ai-warning-box"; els.aiWarningBox.innerHTML="";} els.infoBox.className="info-box"; els.infoBox.innerHTML=""; if(els.questionJumpMenuGrid) els.questionJumpMenuGrid.innerHTML=""; if(els.questionChatGPTBtn) els.questionChatGPTBtn.disabled=true; if(els.questionInfoToggleBtn) els.questionInfoToggleBtn.disabled=true; if(els.unknownQuestionBtn) els.unknownQuestionBtn.disabled=true; if(els.questionStarBtn){els.questionStarBtn.disabled=true; els.questionStarBtn.classList.remove("starred"); els.questionStarBtn.textContent="☆";} els.prevBtn.disabled=true; els.nextBtn.disabled=true; updateStats(); return;
      }
      document.body.classList.remove("no-question-active");
      ensureCurrent();
      const q=questions[current], pos=idxs.indexOf(current), selected=answers[answerKey(q)], opts=optionList(q), answer=q.answer||{};
      if(els.questionChatGPTBtn) els.questionChatGPTBtn.disabled=false;
      if(els.questionInfoToggleBtn) els.questionInfoToggleBtn.disabled=false;
      if(els.unknownQuestionBtn){
        els.unknownQuestionBtn.disabled=false;
        const unk = isUnknownQuestion(q);
        els.unknownQuestionBtn.classList.toggle("active", unk);
        els.unknownQuestionBtn.textContent = unk ? "Bilmiyorum ✓" : "Bilmiyorum";
        els.unknownQuestionBtn.title = unk ? "Bilmiyorum işaretini kaldır" : "Bu soruyu bilmiyorum olarak işaretle";
      }
      setActiveStudyQuestion(q);
      if(els.questionStarBtn){
        els.questionStarBtn.disabled=false;
        const starred = isStarredQuestion(q);
        els.questionStarBtn.classList.toggle("starred", starred);
        els.questionStarBtn.textContent = starred ? "★" : "☆";
        els.questionStarBtn.title = starred ? "Yıldızı kaldır" : "Soruyu yıldızla";
        els.questionStarBtn.setAttribute("aria-label", starred ? "Yıldızı kaldır" : "Soruyu yıldızla");
      }
      if(examMode){
        if(els.examModeTitle) els.examModeTitle.textContent = `${examSubject}${examTeacher !== "all" ? " · " + examTeacher : ""} · ${pos+1}/${idxs.length}`;
        const qKey = answerKey(q);
        if(qKey !== lastExamQuestionKey){
          lastExamQuestionKey = qKey;
          startExamTimer();
        }
      }
      els.activeTitle.textContent=quizActive ? quizTitle : (filters.subject!=="all"?filters.subject+" soru bankası":"Tüm dersler soru bankası");
      els.section.textContent=`${q.subject || "Ders yok"} · Soru ${pos+1}/${idxs.length} · ${meta(q,"examGroup")||"Kurul yok"} · ${meta(q,"teacher")||"Hoca yok"}`;
      renderHeaderJumpMenu(idxs);
      const rows=[["Ders",q.subject],["Dosya",q._dbFile||""],["Kurul / sınav grubu",meta(q,"examGroup")],["Yıl / sene",meta(q,"year")],["Hoca",meta(q,"teacher")],["Konu",meta(q,"topic")],["Hedef / kazanım",meta(q,"target")],["Kaynak türü",meta(q,"sourceGroup")],["Kaynak",meta(q,"source")],["Kaynak soru no",meta(q,"sourceNo")],["Durum / güven",meta(q,"status")]];
      els.meta.innerHTML=rows.filter(([,v])=>String(v??"").trim()).map(([k,v])=>`<div><b>${escapeHTML(k)}:</b> ${escapeHTML(v)}</div>`).join("");
      els.question.innerHTML=formatQuestionHTML(q.question||"");
      els.options.innerHTML="";
      if(!opts.length){
        els.options.innerHTML=`<div class="feedback neutral" style="display:block"><b>Şık yok:</b> Bu kayıtta seçenekler bulunmuyor. Cevap anahtarı bilgi alanında gösterilir.</div>`;
      }else{
        opts.forEach((opt,idx)=>{
          const div=document.createElement("div");
          div.className="option";
          if(selected!==undefined&&selected!==null){
            div.classList.add("answered");
            if(idx === selected) div.classList.add("selected");
            if(!examMode){
              if(answer.index!==null&&answer.index!==undefined&&idx===answer.index) div.classList.add("correct");
              if(answer.index!==null&&answer.index!==undefined&&idx===selected&&selected!==answer.index) div.classList.add("wrong");
            }
          }
          div.innerHTML=`<span class="letter">${escapeHTML(opt.letter||String.fromCharCode(65+idx))}</span><span class="option-text">${escapeHTML(opt.text||"")}</span>`;
          div.addEventListener("click",()=>{answers[answerKey(q)]=idx; answerVersion++; renderPreserveScroll();});
          els.options.appendChild(div);
        });
      }
      if(!examMode && selected!==undefined&&selected!==null){
        const letter=answer.letter||(answer.index!==null&&answer.index!==undefined&&opts[answer.index]?opts[answer.index].letter:"");
        const text=answer.text||answer.raw||"";
        if(answer.index===null||answer.index===undefined||answer.index<0){els.feedback.className="feedback neutral"; els.feedback.innerHTML=`<b>Cevap anahtarı:</b> ${escapeHTML(answer.raw||text)}`;}
        else if(selected===answer.index){els.feedback.className="feedback ok"; els.feedback.innerHTML=`<b>Doğru.</b> Doğru cevap: <b>${escapeHTML(letter)} şıkkı</b> — ${escapeHTML(text)}`;}
        else{els.feedback.className="feedback bad"; els.feedback.innerHTML=`<b>Yanlış.</b> Doğru cevap: <b>${escapeHTML(letter)} şıkkı</b> — ${escapeHTML(text)}`;}
      }else if(!examMode && isUnknownQuestion(q)){
        els.feedback.className="feedback neutral";
        els.feedback.innerHTML="<b>Bilmiyorum:</b> Bu soru gözden geçirilecekler listesine eklendi.";
      }else{els.feedback.className="feedback"; els.feedback.innerHTML="";}
      const aiWarning = aiDiscrepancyHTML(q);
      if(els.aiWarningBox){
        els.aiWarningBox.innerHTML = aiWarning;
        els.aiWarningBox.className = aiWarning ? "ai-warning-box show" : "ai-warning-box";
      }
      const infoParts=[];
      if(q.explanation) infoParts.push("<b>Açıklama:</b> "+escapeHTML(q.explanation));
      if(q.spot) infoParts.push("<b>Spot bilgi:</b> "+escapeHTML(q.spot));
      if(q.sourceNote) infoParts.push("<b>Kaynak notu:</b> "+escapeHTML(q.sourceNote));
      if(answer.raw) infoParts.push("<b>Cevap anahtarı:</b> "+escapeHTML(answer.raw));
      const aiExplanation = aiExplanationText(q);
      if(aiExplanation) infoParts.push("<b>Yapay zeka cevabı:</b> "+escapeHTML(aiExplanation));
      els.infoBox.innerHTML=infoParts.join("\n\n")||"<b>Bilgi:</b> Bu kayıtta açıklama/spot alanı boş.";
      els.infoBox.className=infoOpen?"info-box show":"info-box";
      if(els.questionInfoToggleBtn){
        els.questionInfoToggleBtn.textContent = infoOpen ? "✕" : "💬";
        els.questionInfoToggleBtn.title = infoOpen ? "Açıklamayı gizle" : "Açıklama/spot göster";
        els.questionInfoToggleBtn.setAttribute("aria-label", infoOpen ? "Açıklamayı gizle" : "Açıklama/spot göster");
      }
      els.showInfoBtn.textContent=infoOpen?"Açıklamayı gizle":"Açıklama/spot";
      if(els.menuInfoBtn) els.menuInfoBtn.textContent = infoOpen ? "Açıklamayı gizle" : "Açıklama/spot";
      els.prevBtn.disabled=pos<=0;
      els.nextBtn.disabled=false;
      els.nextBtn.textContent=pos===idxs.length-1?"Sonucu göster":"Sonraki";
      if(els.hideQuestionBtn) els.hideQuestionBtn.disabled = !q || isHiddenQuestion(q);
      updateStats();
      recordLastPosition(q);
    }

    function updateStats(){
      const st=stats();
      els.progress.style.width=st.total?((st.answered/st.total)*100)+"%":"0%";
      const idxsForCounter = filteredIndexes();
      els.counter.textContent=st.total?`Soru ${idxsForCounter.indexOf(current)+1} / ${st.total} · Genel no: ${current+1}`:"0 soru";
      els.answeredCount.textContent=st.answered; els.correctCount.textContent=st.correct; els.wrongCount.textContent=st.wrong+(st.neutral?` (+${st.neutral} manuel)`:""); els.emptyCount.textContent=st.empty;
      els.activeFilterSummary.textContent=[filters.subject==="all"?"Tüm dersler":filters.subject,filters.exam==="all"?"Tüm gruplar":filters.exam,filters.year==="all"?"Tüm yıllar":filters.year,filters.teacher==="all"?"Tüm hocalar":filters.teacher,filters.sourceGroup==="all"?"Tüm kaynak türleri":filters.sourceGroup,filters.search.trim()?`Arama: “${filters.search.trim()}”`:"Arama yok"].join(" + ")+` → ${st.total} soru`;
    }

    function updateJumpGridState(){
      const buttons = els.jumpGrid.querySelectorAll("button.jump");
      buttons.forEach(btn=>{
        const i = Number(btn.dataset.index);
        const q = questions[i];
        if(!q) return;
        btn.classList.toggle("active", i === current);
        btn.classList.remove("done-neutral","done-ok","done-bad");
        const a = answers[answerKey(q)];
        if(a!==undefined && a!==null){
          const ci=q.answer?q.answer.index:null;
          if(ci===null||ci===undefined||ci<0) btn.classList.add("done-neutral");
          else btn.classList.add(a===ci?"done-ok":"done-bad");
        }
      });
    }

    function renderJumpGrid(force=false){
      const idxs=filteredIndexes();
      const key = idxs.length + ":" + idxs.join("|");
      if(!force && key === lastJumpGridKey && els.jumpGrid.children.length){
        updateJumpGridState();
        return;
      }

      els.jumpGrid.innerHTML="";
      lastJumpGridKey = key;
      if(!idxs.length){els.jumpGrid.innerHTML=`<div class="small" style="grid-column:1 / -1;">Bu filtre/arama ile eşleşen soru yok.</div>`; return;}

      const frag = document.createDocumentFragment();
      idxs.forEach((i,pos)=>{
        const q=questions[i], b=document.createElement("button");
        b.className="jump";
        b.dataset.index = String(i);
        if(i===current) b.classList.add("active");
        const a=answers[answerKey(q)];
        if(a!==undefined&&a!==null){const ci=q.answer?q.answer.index:null; if(ci===null||ci===undefined||ci<0)b.classList.add("done-neutral"); else b.classList.add(a===ci?"done-ok":"done-bad");}
        b.textContent=pos+1; b.title=`${shuffleQuestions ? "Karışık sıra: " + (pos+1) + " · " : ""}${q.subject} · ${meta(q,"examGroup")} · ${meta(q,"topic")}`;
        b.addEventListener("click",()=>{current=i; render(); requestAnimationFrame(()=>scrollToQuestion("auto"));});
        frag.appendChild(b);
      });
      els.jumpGrid.appendChild(frag);
    }

    
    
    function attachModalToFullscreenHost(modalEl){
      if(!modalEl) return;
      const card = document.querySelector(".question-card");
      const fullscreenHost = document.fullscreenElement || card;
      if(fullscreenHost && fullscreenHost.contains && !fullscreenHost.contains(modalEl)){
        fullscreenHost.appendChild(modalEl);
      }else if(card && modalEl.parentElement !== card && !document.fullscreenElement){
        card.appendChild(modalEl);
      }
    }

    function isQuestionFullscreenActive(){
      return document.body.classList.contains("question-card-fullscreen") ||
        document.body.classList.contains("question-wide-mode") ||
        !!(document.fullscreenElement && (document.fullscreenElement.classList?.contains("question-card") || document.fullscreenElement.querySelector?.("#fullscreenResultsModal")));
    }
    function showFullscreenResultsModal(){
      if(!els.fullscreenResultsModal) return false;
      attachModalToFullscreenHost(els.fullscreenResultsModal);
      els.fullscreenResultsModal.classList.remove("hidden");
      els.fullscreenResultsModal.style.display = "flex";
      els.fullscreenResultsModal.setAttribute("aria-hidden","false");
      requestAnimationFrame(()=>els.fullscreenResultCloseBtn && els.fullscreenResultCloseBtn.focus());
      return true;
    }
    function closeFullscreenResultsModal(){
      if(!els.fullscreenResultsModal) return;
      els.fullscreenResultsModal.classList.add("hidden");
      els.fullscreenResultsModal.style.display = "";
      els.fullscreenResultsModal.setAttribute("aria-hidden","true");
    }
    function updateFullscreenResultsFromMain(){
      if(!els.fullscreenResultSubtitle) return;
      els.fullscreenResultSubtitle.textContent = els.resultSubtitle ? els.resultSubtitle.textContent : "";
      if(els.fullscreenScoreText && els.scoreText) els.fullscreenScoreText.textContent = els.scoreText.textContent;
      if(els.fullscreenScoreCircle && els.scoreCircle) els.fullscreenScoreCircle.style.background = els.scoreCircle.style.background;
      if(els.fullscreenReview && els.review) els.fullscreenReview.innerHTML = els.review.innerHTML;
      if(els.fullscreenAskReviewChatGPTBtn && els.askReviewChatGPTBtn) els.fullscreenAskReviewChatGPTBtn.disabled = els.askReviewChatGPTBtn.disabled;
      if(els.fullscreenReviewToggleBtn && els.reviewToggleBtn) els.fullscreenReviewToggleBtn.textContent = els.reviewToggleBtn.textContent;
    }

    function renderReview(){
      const targetEls = [els.review, els.fullscreenReview].filter(Boolean);
      targetEls.forEach(t=>t.innerHTML="");
      const idxs = reviewIndexes();
      if(!idxs.length){
        targetEls.forEach(t=>t.innerHTML = `<div class="review-item"><div class="q">Yanlış yapılan veya bilmiyorum olarak işaretlenen soru yok.</div></div>`);
        return;
      }
      idxs.forEach(i=>{
        const q=questions[i];
        const flags = [
          isWrongAnswerQuestion(q) ? `<span class="review-flag wrong">Yanlış</span>` : "",
          isUnknownQuestion(q) ? `<span class="review-flag unknown">Bilmiyorum</span>` : ""
        ].filter(Boolean).join(" ");
        const itemHTML = `<div class="small"><b>${i+1}. soru</b> · ${escapeHTML(q.subject)} · ${escapeHTML(meta(q,"examGroup"))} · ${escapeHTML(meta(q,"topic"))} ${flags}</div><div class="q">${escapeHTML(q.question)}</div><div class="small"><b>Senin cevabın:</b> ${escapeHTML(selectedAnswerText(q))}</div><div class="small"><b>Doğru cevap:</b> ${escapeHTML(correctAnswerText(q))}</div><div class="small"><b>Dosya:</b> ${escapeHTML(q._dbFile||"")}</div>`;
        targetEls.forEach(t=>{
          const item=document.createElement("div");
          item.className="review-item";
          item.innerHTML=itemHTML;
          t.appendChild(item);
        });
      });
    }

    function renderResults(){
      if(examMode){
        examMode = false;
        examIds = [];
        stopExamTimer();
        document.body.classList.remove("exam-mode");
      }
      const st=stats(), score=st.total?Math.round((st.correct/st.total)*100):0, deg=Math.round((score/100)*360);
      els.scoreText.textContent=score+"%";
      els.scoreCircle.style.background=`conic-gradient(var(--primary) 0deg, var(--primary) ${deg}deg, #e8edf5 ${deg}deg)`;
      els.resultSubtitle.textContent=`${st.total} soru üzerinden ${st.correct} doğru, ${st.wrong} yanlış, ${st.unknown} bilmiyorum, ${st.neutral} manuel/indekslenemeyen cevaplı, ${st.empty} boş. Gözden geçirilecek: ${st.reviewCount}.`;
      if(els.askReviewChatGPTBtn) els.askReviewChatGPTBtn.disabled = !st.reviewCount;
      if(els.reviewToggleBtn) els.reviewToggleBtn.textContent = st.reviewCount ? `Gözden geçirilecekleri göster (${st.reviewCount})` : "Gözden geçirilecek yok";
      els.results.style.display="block";
      renderReview();
      updateFullscreenResultsFromMain();
      if(isQuestionFullscreenActive()){
        els.results.style.display="none";
        showFullscreenResultsModal();
      }
    }

    function getListIndexesForCurrentMode(){
      let idxs = listMode === "hidden"
        ? questions.map((q,i)=>[q,i]).filter(([q]) => isDbActive(q) && isHiddenQuestion(q)).map(([,i])=>i)
        : (listMode === "starred"
          ? orderIndexes(questions.map((q,i)=>[q,i]).filter(([q]) => isDbActive(q) && !isHiddenQuestion(q) && isStarredQuestion(q)).map(([,i])=>i))
          : filteredIndexes());

      if (listMode === "wrong") idxs = idxs.filter(i => isWrongFromCache(questions[i]) || isUnknownQuestion(questions[i]));
      return idxs;
    }

    function listModeTitle(){
      return listMode === "hidden"
        ? "Gizlenen sorular"
        : (listMode === "starred"
          ? "Yıldızlı sorular"
          : (listMode === "wrong"
            ? "Yanlış yapılan sorular"
            : (filters.subject !== "all" ? filters.subject + " · tüm sorular" : "Tüm dersler · tüm sorular")));
    }

    function listModeSubtitle(total){
      const base = listMode === "hidden"
        ? `${total} gizlenen soru · buradan yeniden görünür yapabilirsin`
        : (listMode === "starred"
          ? `${total} yıldızlı soru · buradan yıldızları kaldırabilir veya soruları inceleyebilirsin`
          : (listMode === "wrong"
            ? `${total} yanlış / bilmiyorum soru · kaydedilmiş cevaplarına göre`
            : (quizActive ? `${total} quiz sorusu` : (els.activeFilterSummary.textContent || `${total} soru`))));
      return shuffleQuestions && listMode !== "hidden" ? base + " · karışık sıra" : base;
    }

    function buildListCardHTML(i, pos){
      const q = questions[i], opts = optionList(q), ans = q.answer || {};
      const optHtml = opts.length ? opts.map((opt, idx) => {
        const isCorrect = ans.index !== null && ans.index !== undefined && idx === ans.index;
        const selected = numericAnswerValue(answers[answerKey(q)]);
        const isSelectedWrong = listMode === "wrong" && selected !== null && idx === selected && !isCorrect;
        return `<div class="all-q-option ${isCorrect ? "correct" : ""}" style="${isSelectedWrong ? "background:var(--badbg);border-color:rgba(166,29,53,.35);color:var(--bad);font-weight:780;" : ""}"><b>${escapeHTML(opt.letter || String.fromCharCode(65+idx))})</b> ${escapeHTML(opt.text || "")}</div>`;
      }).join("") : `<div class="all-q-option correct"><b>Cevap:</b> ${escapeHTML(ans.raw || ans.text || "")}</div>`;

      const info = [q.explanation ? "Açıklama: " + q.explanation : "", q.spot ? "Spot: " + q.spot : "", ans.raw ? "Cevap anahtarı: " + ans.raw : ""].filter(Boolean).join("\n");

      const wrongNotes = listMode === "wrong"
        ? `<div class="wrong-answer-note"><b>Senin cevabın:</b> ${escapeHTML(cachedSelectedText(q))}</div><div class="correct-answer-note"><b>Doğru cevap:</b> ${escapeHTML(cachedCorrectText(q))}</div>`
        : "";
      const aiWarning = aiDiscrepancyHTML(q);

      const cardActions = listMode === "hidden"
        ? `<div class="all-q-actions"><button class="secondary unhide-question-btn" type="button" data-qid="${escapeHTML(answerKey(q))}">Bu soruyu tekrar göster</button></div>`
        : (listMode === "starred"
          ? `<div class="all-q-actions"><button class="secondary unstar-question-btn" type="button" data-qid="${escapeHTML(answerKey(q))}">Yıldızı kaldır</button><button class="secondary hide-list-question-btn" type="button" data-qid="${escapeHTML(answerKey(q))}">Bu soruyu bir daha gösterme</button></div>`
          : `<div class="all-q-actions"><button class="secondary star-list-question-btn" type="button" data-qid="${escapeHTML(answerKey(q))}">${isStarredQuestion(q) ? "Yıldızı kaldır" : "Yıldızla"}</button><button class="secondary hide-list-question-btn" type="button" data-qid="${escapeHTML(answerKey(q))}">Bu soruyu bir daha gösterme</button></div>`);

      return `
        <article class="all-q-card">
          <div class="all-q-meta">
            <span class="chip">${pos+1}. soru</span>
            <span class="chip">${escapeHTML(q.subject || "")}</span>
            <span class="chip">${escapeHTML(meta(q,"examGroup") || "")}</span>
            <span class="chip">${escapeHTML(meta(q,"topic") || "")}</span>
            <span class="chip">${escapeHTML(q._dbFile || "")}</span>
          </div>
          <div class="all-q-question">${escapeHTML(q.question || "")}</div>
          <div class="all-q-options">${optHtml}</div>
          ${wrongNotes}
          ${aiWarning ? `<div class="all-q-ai-warning">${aiWarning}</div>` : ""}
          ${cardActions}
          ${listMode === "hidden" ? `<div class="hidden-manager-note">Bu soru gizlendiği için normal soru akışında ve quizlerde görünmez.</div>` : ""}
          ${listMode === "starred" ? `<div class="hidden-manager-note">Bu soru yıldızlı listendedir.</div>` : ""}
          ${info ? `<div class="all-q-info">${escapeHTML(info)}</div>` : ""}
        </article>
      `;
    }

    function attachListActionEvents(){
      els.allList.querySelectorAll(".hide-list-question-btn").forEach(btn=>{
        if(btn.dataset.bound === "1") return;
        btn.dataset.bound = "1";
        btn.addEventListener("click",()=>{
          hideQuestionById(btn.getAttribute("data-qid"));
          renderAllList(true);
          renderLanding();
        });
      });
      els.allList.querySelectorAll(".star-list-question-btn,.unstar-question-btn").forEach(btn=>{
        if(btn.dataset.bound === "1") return;
        btn.dataset.bound = "1";
        btn.addEventListener("click",()=>{
          const id = btn.getAttribute("data-qid");
          const q = questions.find(x => answerKey(x) === id);
          if(q) toggleStarQuestion(q);
          renderAllList(true);
          renderLanding();
          if(els.appView.classList.contains("active")) render();
        });
      });
      els.allList.querySelectorAll(".unhide-question-btn").forEach(btn=>{
        if(btn.dataset.bound === "1") return;
        btn.dataset.bound = "1";
        btn.addEventListener("click",()=>{
          unhideQuestionById(btn.getAttribute("data-qid"));
          renderAllList(true);
          renderLanding();
        });
      });
      if(els.restoreHiddenBtn) els.restoreHiddenBtn.style.display = listMode === "hidden" ? "" : "none";
    }

    function renderAllList(reset=true){
      if(reset){
        currentListIndexes = getListIndexesForCurrentMode();
        renderedListCount = 0;
      }

      const total = currentListIndexes.length;
      els.listTitle.textContent = listModeTitle();
      els.listSubtitle.textContent = listModeSubtitle(total) + (total > LIST_BATCH_SIZE ? ` · performans için ${LIST_BATCH_SIZE}'lik parçalarla gösteriliyor` : "");
      els.allList.innerHTML = "";

      if(!total){
        els.allList.innerHTML = `<section class="panel status warn">${listMode === "hidden" ? "Gizlenen soru bulunamadı." : (listMode === "starred" ? "Yıldızlı soru bulunamadı." : (listMode === "wrong" ? "Seçili soru dosyalarında yanlış yaptığın soru bulunamadı." : "Bu filtreye uygun soru bulunamadı."))}</section>`;
        return;
      }

      renderMoreListItems();
    }

    function renderMoreListItems(){
      const start = renderedListCount;
      const end = Math.min(start + LIST_BATCH_SIZE, currentListIndexes.length);
      const htmlParts = [];

      for(let pos=start; pos<end; pos++){
        htmlParts.push(buildListCardHTML(currentListIndexes[pos], pos));
      }

      const existingLoader = els.allList.querySelector(".load-more-wrap");
      if(existingLoader) existingLoader.remove();

      els.allList.insertAdjacentHTML("beforeend", htmlParts.join(""));
      renderedListCount = end;

      if(renderedListCount < currentListIndexes.length){
        els.allList.insertAdjacentHTML("beforeend", `
          <div class="load-more-wrap">
            <button class="secondary" id="loadMoreListBtn" type="button">Daha fazla göster (${renderedListCount}/${currentListIndexes.length})</button>
          </div>
        `);
        const btn = document.getElementById("loadMoreListBtn");
        btn.addEventListener("click", renderMoreListItems);
      } else {
        els.allList.insertAdjacentHTML("beforeend", `<div class="list-performance-note">Tüm liste gösteriliyor. Toplam ${currentListIndexes.length} soru.</div>`);
      }

      attachListActionEvents();
    }

    function buildPrintableQuestionHTML(i, pos){
      const q = questions[i], opts = optionList(q), ans = q.answer || {};
      const options = opts.map((opt, idx) => {
        const isCorrect = ans.index !== null && ans.index !== undefined && idx === ans.index;
        return `<div class="p-option ${isCorrect ? "p-correct" : ""}"><b>${escapeHTML(opt.letter || String.fromCharCode(65+idx))})</b> ${escapeHTML(opt.text || "")}</div>`;
      }).join("");
      const correctText = cachedCorrectText(q);
      const aiWarningText = aiPlainWarningText(q);
      const aiExplanation = aiExplanationText(q);
      const info = [q.explanation ? "Açıklama: " + q.explanation : "", q.spot ? "Spot: " + q.spot : "", ans.raw ? "Cevap anahtarı: " + ans.raw : "", aiExplanation ? "Yapay zeka cevabı: " + aiExplanation : ""].filter(Boolean).join("<br>");
      return `
        <section class="p-card">
          <div class="p-meta">${pos+1}. soru · ${escapeHTML(q.subject || "")} · ${escapeHTML(meta(q,"examGroup") || "")} · ${escapeHTML(meta(q,"topic") || "")}</div>
          <div class="p-question">${escapeHTML(q.question || "")}</div>
          <div class="p-options">${options || `<div class="p-option p-correct"><b>Cevap:</b> ${escapeHTML(ans.raw || ans.text || "")}</div>`}</div>
          <div class="p-answer"><b>Doğru cevap:</b> ${escapeHTML(correctText)}</div>
          ${aiWarningText ? `<div class="p-ai-warning">${escapeHTML(aiWarningText).replace(/\n/g,"<br>")}</div>` : ""}
          ${info ? `<div class="p-info">${info}</div>` : ""}
        </section>
      `;
    }

    function createPdfFromCurrentList(){
      const idxs = currentListIndexes.length ? currentListIndexes : getListIndexesForCurrentMode();
      if(!idxs.length){
        alert("PDF oluşturmak için uygun soru bulunamadı.");
        return;
      }

      const title = listModeTitle();
      const body = idxs.map((i,pos)=>buildPrintableQuestionHTML(i,pos)).join("");
      const printDoc = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<title>${escapeHTML(title)}</title>
<style>
  body{font-family:Arial, sans-serif;color:#111827;margin:24px;line-height:1.45}
  h1{font-size:20px;margin:0 0 6px}
  .sub{font-size:12px;color:#475467;margin-bottom:18px}
  .p-card{page-break-inside:avoid;border:1px solid #d0d5dd;border-radius:10px;padding:12px;margin:0 0 12px}
  .p-meta{font-size:11px;color:#475467;margin-bottom:8px}
  .p-question{font-weight:700;font-size:14px;white-space:pre-wrap;margin-bottom:8px}
  .p-option{border:1px solid #eaecf0;border-radius:8px;padding:6px 8px;margin:5px 0;white-space:pre-wrap;font-size:12.5px}
  .p-correct{background:#e8f7ee;border-color:#9bd6b3}
  .p-answer{margin-top:7px;font-size:12.5px;color:#12633a}
  .p-ai-warning{margin-top:7px;padding:7px 8px;border-radius:8px;background:#fff7df;border:1px solid #d4a72c;color:#573a09;font-size:11.5px}
  .p-info{margin-top:6px;font-size:11.5px;color:#344054}
  @media print{body{margin:12mm}.p-card{break-inside:avoid}}
</style>
</head>
<body>
<h1>${escapeHTML(title)}</h1>
<div class="sub">${idxs.length} soru · PDF olarak kaydetmek için yazdırma penceresinde “PDF olarak kaydet” seçeneğini kullan.</div>
${body}
<script>
  window.onload = function(){ setTimeout(function(){ window.print(); }, 250); };
<\/script>
</body>
</html>`;

      const w = window.open("", "_blank");
      if(!w){
        alert("PDF penceresi açılamadı. Tarayıcı açılır pencereyi engellemiş olabilir.");
        return;
      }
      w.document.open();
      w.document.write(printDoc);
      w.document.close();
    }

    function showListView(mode="all"){
      resumeFromBreak();
      pushAppHistoryState("list");
      pauseStudyTimer();
      if(examMode) return;
      listMode = mode;
      render();
      els.quizView.classList.add("hidden");
      els.listView.classList.add("active");
      els.results.style.display = "none";
      renderAllList(true);
      window.scrollTo(0,0);
    }

    function showWrongFromHome(){
      stopQuizMode();
      document.body.classList.add("app-screen-active");
      document.body.classList.add("app-screen-active");
      filters={subject:"all", exam:"all", year:"all", teacher:"all", sourceGroup:"all", search:""};
      sanitizeFilters(); ensureCurrent();
      els.landing.classList.add("hidden");
      els.appView.classList.add("active");
      els.activeTitle.textContent="Yanlış yapılan sorular";
      showListView("wrong");
    }

    function showHiddenFromHome(){
      stopQuizMode();
      document.body.classList.add("app-screen-active");
      document.body.classList.add("app-screen-active");
      filters={subject:"all", exam:"all", year:"all", teacher:"all", sourceGroup:"all", search:""};
      els.landing.classList.add("hidden");
      els.appView.classList.add("active");
      els.activeTitle.textContent="Gizlenen sorular";
      showListView("hidden");
    }

    function showStarredFromHome(){
      stopQuizMode();
      document.body.classList.add("app-screen-active");
      filters={subject:"all", exam:"all", year:"all", teacher:"all", sourceGroup:"all", search:""};
      sanitizeFilters();
      els.landing.classList.add("hidden");
      els.appView.classList.add("active");
      els.activeTitle.textContent="Yıldızlı sorular";
      showListView("starred");
    }

    function showQuizView(){
      listMode = "all";
      els.listView.classList.remove("active");
      els.quizView.classList.remove("hidden");
      render();
      window.scrollTo(0,0);
    }

    function render(){
      applyFontSize();
      applyDesignMode();
      applyWideModes();

      const controlsKey = filterControlsKey();
      const shouldRenderFilters = renderStructureDirty || controlsKey !== lastFilterControlsKey;
      if(shouldRenderFilters){
        renderFilters();
        lastFilterControlsKey = filterControlsKey();
      }

      renderQuestion();
      updateQuestionFullscreenIcon();
      updateBreakButtonVisibility();
      renderJumpGrid(renderStructureDirty);
      renderStructureDirty = false;

      if(els.results && els.results.style.display === "block" && !els.review.classList.contains("hidden")) renderReview();
      saveState();
      // Liste ekranı açıkken ağır yeniden çizim yalnızca liste komutlarıyla yapılır.
    }

    
    function setInitialLoading(text){
      // FAST-NAV: suppress visible loader when moving between already-loaded pages.
      if(qbIsFastNavigation()){
        document.body.classList.remove("is-loading");
        if(els.initialLoadingOverlay){
          els.initialLoadingOverlay.classList.add("hidden");
          els.initialLoadingOverlay.setAttribute("aria-busy","false");
        }
        if(els.status && text) els.status.textContent = text;
        return;
      }
      if(!initialLoadingStartedAt) initialLoadingStartedAt = Date.now();
      document.body.classList.add("is-loading");
      if(els.initialLoadingText && text) els.initialLoadingText.textContent = text;
      if(els.initialLoadingOverlay){
        els.initialLoadingOverlay.classList.remove("hidden");
        els.initialLoadingOverlay.setAttribute("aria-busy","true");
      }
    }

    function hideInitialLoading(){
      const finish = () => {
        if(els.initialLoadingOverlay){
          els.initialLoadingOverlay.classList.add("hidden");
          els.initialLoadingOverlay.setAttribute("aria-busy","false");
        }
        document.body.classList.remove("is-loading");
      };
      const elapsed = Date.now() - initialLoadingStartedAt;
      const delay = qbIsFastNavigation() ? 0 : Math.max(0, INITIAL_LOADING_MIN_MS - elapsed);
      setTimeout(finish, delay);
    }

    function bindEvents(){
      startStudyTimer();
      document.addEventListener("visibilitychange",()=>{ if(document.hidden){ commitStudyTime(true); saveStudyTimes(true); } else lastStudyTick = Date.now(); });
      window.addEventListener("beforeunload",()=>{ commitStudyTime(true); finalizeStudySession(); saveStudyTimes(true); });
      window.addEventListener("popstate",()=>handleBrowserBack());
      if(els.questionFullscreenBtn) els.questionFullscreenBtn.addEventListener("click", toggleQuestionFullscreen);
      if(els.questionBreakBtn) els.questionBreakBtn.addEventListener("click", showBreakModal);
      if(els.breakContinueBtn) els.breakContinueBtn.addEventListener("click", resumeFromBreak);
      if(els.questionInfoToggleBtn) els.questionInfoToggleBtn.addEventListener("click",()=>{infoOpen=!infoOpen; renderPreserveScroll(); saveState();});
      if(els.questionChatGPTBtn) els.questionChatGPTBtn.addEventListener("click", openCurrentQuestionInChatGPT);
      if(els.questionStarBtn) els.questionStarBtn.addEventListener("click",()=>{
        toggleStarQuestion();
        renderPreserveScroll();
        renderLanding();
      });
      if(els.chatgptWebviewCloseBtn) els.chatgptWebviewCloseBtn.addEventListener("click", closeChatGPTWebview);
      if(els.chatgptOpenNewTabBtn) els.chatgptOpenNewTabBtn.addEventListener("click", openChatGPTNewTab);
      if(els.chatgptCopyPromptBtn) els.chatgptCopyPromptBtn.addEventListener("click", copyCurrentChatGPTPrompt);
      if(els.chatgptWebviewModal) els.chatgptWebviewModal.addEventListener("click",(ev)=>{ if(ev.target === els.chatgptWebviewModal) closeChatGPTWebview(); });
      document.addEventListener("keydown",(ev)=>{ if(ev.key === "Escape" && els.chatgptWebviewModal && !els.chatgptWebviewModal.classList.contains("hidden")) closeChatGPTWebview(); });
      window.addEventListener("orientationchange",()=>setTimeout(()=>{ if(document.body.classList.contains("question-card-fullscreen")) scrollToQuestion("auto"); }, 250));
      window.addEventListener("resize",()=>{ if(document.body.classList.contains("question-card-fullscreen")) updateQuestionFullscreenIcon(); });
      document.addEventListener("fullscreenchange",()=>{
        const active = !!(document.fullscreenElement && document.fullscreenElement.classList && document.fullscreenElement.classList.contains("question-card"));
        document.body.classList.toggle("question-card-fullscreen", active);
        updateQuestionFullscreenIcon();
        updateBreakButtonVisibility();
      });
      els.menuHomeBtn.addEventListener("click",()=>{ showLanding(); if(els.topMenu) els.topMenu.open=false; });
      els.menuSourceBtn.addEventListener("click",()=>openHomeSettingsPanel("dbSettingsDetails"));
      els.menuViewBtn.addEventListener("click",()=>openHomeSettingsPanel("viewSettingsDetails"));
      els.menuDuplicateBtn.addEventListener("click",()=>{
        duplicateMode = duplicateMode === "all" ? "smart" : "all";
        duplicateFilterEnabled = duplicateMode === "smart";
        applyDesignMode();
        rebuildQuestionsAfterDuplicateToggle();
        if(els.topMenu) els.topMenu.open=false;
      });
      els.menuShuffleBtn.addEventListener("click",()=>{
        setShuffleMode(!shuffleQuestions, true);
        applyDesignMode();
        if(els.topMenu) els.topMenu.open=false;
      });
      els.menuCacheBtn.addEventListener("click", clearDatabaseCacheAndReload);
      if(els.cancelExamBtn) els.cancelExamBtn.addEventListener("click", cancelExamMode);
      els.menuInfoBtn.addEventListener("click",()=>{
        const x = window.scrollX;
        const y = window.scrollY;
        infoOpen = !infoOpen;
        if(els.topMenu) els.topMenu.open = false;
        render();
        requestAnimationFrame(()=>window.scrollTo(x, y));
      });
      els.menuShowAllBtn.addEventListener("click",()=>{
        if(examMode) return;
        showListView("all");
        if(els.topMenu) els.topMenu.open = false;
      });
      if(els.menuStarredBtn) els.menuStarredBtn.addEventListener("click",()=>{
        if(examMode) return;
        showStarredFromHome();
        if(els.topMenu) els.topMenu.open = false;
      });
      if(els.menuExamBtn) els.menuExamBtn.addEventListener("click",()=>{
        const subject = currentSubjectForExam();
        if(subject === "all"){
          alert("Sınav modu için önce bir ders seçmelisin.");
          return;
        }
        startExamMode(subject, filters.teacher || "all");
      });
      els.menuWideToggleBtn.addEventListener("click",()=>{
        questionWideMode = !questionWideMode;
        applyWideModes();
        saveState();
        renderPreserveScroll();
        if(els.topMenu) els.topMenu.open = false;
      });
      els.menuResetVisibleBtn.addEventListener("click",()=>{
        if(els.resetVisibleBtn) els.resetVisibleBtn.click();
        if(els.topMenu) els.topMenu.open = false;
      });
      els.menuClearCacheBtn.addEventListener("click",()=>{
        if(els.clearCacheBtn) els.clearCacheBtn.click();
        if(els.topMenu) els.topMenu.open = false;
      });
      els.courseSearch.addEventListener("input", debounce(renderLanding, 180));
      els.clearCourseSearch.addEventListener("click",()=>{els.courseSearch.value=""; renderLanding(); els.courseSearch.focus();});
      els.manualDbInput.addEventListener("change",async()=>{try{await loadManualDbFiles(els.manualDbInput.files);}catch(e){els.status.className="panel status warn"; els.status.innerHTML=`<b>Manuel database yüklenemedi:</b> ${escapeHTML(e.message)}`;}});
      els.continueBtn.addEventListener("click", continueLast);
      els.wrongHomeBtn.addEventListener("click", showWrongFromHome);
      els.hiddenHomeBtn.addEventListener("click", showHiddenFromHome);
      if(els.starredHomeBtn) els.starredHomeBtn.addEventListener("click", showStarredFromHome);
      els.quizAllBtn.addEventListener("click",()=>startQuiz("all",150));
      els.startAllBtn.addEventListener("click",()=>startCourse("all"));
      els.backHomeBtn.addEventListener("click", showLanding);
      els.changeCourseBtn.addEventListener("click", showLanding);
      if(els.wideQuestionBtn) els.wideQuestionBtn.addEventListener("click",()=>{
        questionWideMode = !questionWideMode;
        applyWideModes();
        saveState();
      });
      els.showAllBtn.addEventListener("click",()=>showListView("all"));
      if(els.cardShowAllBtn) els.cardShowAllBtn.addEventListener("click",()=>showListView("all"));
      if(els.compactHomeBtn) els.compactHomeBtn.addEventListener("click", showLanding);
      if(els.compactShowAllBtn) els.compactShowAllBtn.addEventListener("click",()=>showListView("all"));
      els.backToQuizBtn.addEventListener("click", showQuizView);
      els.wideListBtn.addEventListener("click",()=>{
        listWideMode = !listWideMode;
        applyWideModes();
        saveState();
        renderAllList();
      });
      if(els.restoreHiddenBtn) els.restoreHiddenBtn.addEventListener("click", restoreAllHiddenQuestions);
      if(els.pdfListBtn) els.pdfListBtn.addEventListener("click", createPdfFromCurrentList);
      els.refreshListBtn.addEventListener("click",()=>renderAllList(true));
      els.selectAllDbBtn.addEventListener("click",()=>{selectedDbFiles=dbFiles.map(f=>dbBaseName(f.name)); rebuildQuestionsFromActiveFiles(true); saveState(); renderLanding(); if(els.appView.classList.contains("active")) render();});
      els.clearDbBtn.addEventListener("click",()=>{selectedDbFiles=[]; rebuildQuestionsFromActiveFiles(true); saveState(); renderLanding(); if(els.appView.classList.contains("active")) render();});
      els.fontSizeSelect.addEventListener("change",()=>{fontSize=els.fontSizeSelect.value; applyFontSize(); saveState(); renderLanding(); if(els.appView.classList.contains("active")) render();});
      els.designModeSelect.addEventListener("change",()=>{designMode=els.designModeSelect.value; applyDesignMode(); saveState(); renderLanding(); if(els.appView.classList.contains("active")) render();});
      if(els.themeSelect) els.themeSelect.addEventListener("change",()=>{themeColor=els.themeSelect.value; applyThemeColor(); saveState();});
      els.duplicateFilterSelect.addEventListener("change",()=>{
        duplicateMode = els.duplicateFilterSelect.value === "all" ? "all" : "smart";
        duplicateFilterEnabled = duplicateMode === "smart";
        applyDesignMode();
        rebuildQuestionsAfterDuplicateToggle();
      });
      els.questionOrderSelect.addEventListener("change",()=>{
        setShuffleMode(els.questionOrderSelect.value === "shuffle", true);
      });
      els.reshuffleBtn.addEventListener("click",()=>{
        shuffleSeed = Date.now();
        shuffleQuestions = true;
        setShuffleMode(true, true);
      });
      els.subjectSelect.addEventListener("change",()=>{filters.subject=els.subjectSelect.value; ensureCurrent(); render();});
      els.examSelect.addEventListener("change",()=>{filters.exam=els.examSelect.value; ensureCurrent(); render();});
      els.yearSelect.addEventListener("change",()=>{filters.year=els.yearSelect.value; ensureCurrent(); render();});
      els.teacherSelect.addEventListener("change",()=>{filters.teacher=els.teacherSelect.value; ensureCurrent(); render();});
      els.sourceGroupSelect.addEventListener("change",()=>{filters.sourceGroup=els.sourceGroupSelect.value; ensureCurrent(); render();});
      els.searchInput.addEventListener("input", debounce(()=>{filters.search=els.searchInput.value; ensureCurrent(); render();}, 180));
      els.clearFiltersBtn.addEventListener("click",()=>{filters={subject:filters.subject,exam:"all",year:"all",teacher:"all",sourceGroup:"all",search:""}; ensureCurrent(); render();});
      els.goFirstFilteredBtn.addEventListener("click",()=>{const idxs=filteredIndexes(); if(idxs.length){current=idxs[0]; render();}});
      els.prevBtn.addEventListener("click",()=>{const idxs=filteredIndexes(); const pos=idxs.indexOf(current); if(pos>0){current=idxs[pos-1]; render(); requestAnimationFrame(()=>scrollToQuestion("auto"));}});
      els.nextBtn.addEventListener("click",()=>{const idxs=filteredIndexes(); const pos=idxs.indexOf(current); if(pos<idxs.length-1){current=idxs[pos+1]; render(); requestAnimationFrame(()=>scrollToQuestion("auto"));}else{ if(examMode) stopExamTimer(); renderResults(); }});
      els.showInfoBtn.addEventListener("click",()=>{infoOpen=!infoOpen; renderPreserveScroll();});
      if(els.unknownQuestionBtn) els.unknownQuestionBtn.addEventListener("click",()=>{toggleUnknownQuestion(); answerVersion++; renderPreserveScroll();});
      if(els.wideExitBtn) els.wideExitBtn.addEventListener("click",()=>{
        questionWideMode = false;
        applyWideModes();
        saveState();
        render();
      });
      if(els.hideQuestionBtn) els.hideQuestionBtn.addEventListener("click",()=>{
        const idxs=filteredIndexes();
        if(!idxs.length) return;
        const q=questions[current];
        if(!q) return;
        const doHide = examMode ? true : confirm("Bu soruyu bundan sonra normal akışta ve quizlerde gizlemek istiyor musun?");
        if(doHide){
          hideQuestionById(answerKey(q));
          ensureCurrent();
          const beforeY = window.scrollY;
          render();
          if(!examMode) renderLanding();
          requestAnimationFrame(()=>window.scrollTo(window.scrollX, beforeY));
        }
      });
      els.clearCacheBtn.addEventListener("click",()=>{
        if(!confirm("Tüm cevaplar, filtreler ve kaldığın yer silinsin mi?")) return;
        answers={}; current=0; filters={subject:"all",exam:"all",year:"all",teacher:"all",sourceGroup:"all",search:""}; infoOpen=false; listMode="all"; hiddenQuestionIds=[]; starredQuestionIds=[]; unknownQuestionIds=[]; stopQuizMode();
        try{localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(LAST_POSITION_KEY); lastPositions={};}catch(e){}
        els.results.style.display="none"; showLanding();
      });
      els.resetVisibleBtn.addEventListener("click",()=>{
        if(!confirm("Sadece şu anki filtrede görünen soruların cevapları silinsin mi?")) return;
        filteredIndexes().forEach(i=>delete answers[answerKey(questions[i])]);
        els.results.style.display="none"; render();
      });
      els.hideResultBtn.addEventListener("click",()=>{els.results.style.display="none";});
      if(els.askReviewChatGPTBtn) els.askReviewChatGPTBtn.addEventListener("click", askReviewQuestionsInChatGPT);
      if(els.fullscreenAskReviewChatGPTBtn) els.fullscreenAskReviewChatGPTBtn.addEventListener("click", askReviewQuestionsInChatGPT);
      if(els.fullscreenResultCloseBtn) els.fullscreenResultCloseBtn.addEventListener("click", closeFullscreenResultsModal);
      if(els.fullscreenReviewToggleBtn) els.fullscreenReviewToggleBtn.addEventListener("click",()=>{
        if(!els.fullscreenReview) return;
        els.fullscreenReview.classList.toggle("hidden");
        els.fullscreenReviewToggleBtn.textContent = els.fullscreenReview.classList.contains("hidden") ? "Gözden geçirilecekleri göster" : "Gözden geçirilecekleri gizle";
      });
      els.reviewToggleBtn.addEventListener("click",()=>{
        els.review.classList.toggle("hidden");
        els.reviewToggleBtn.textContent=els.review.classList.contains("hidden")?"Cevap dökümünü göster":"Cevap dökümünü gizle";
      });
    }

    
    async function loadCandidateGroups(candidates){
      const groups = new Map();
      candidates.forEach(file => {
        const key = dbCanonicalName(file.name);
        if(!groups.has(key)) groups.set(key, []);
        groups.get(key).push(file);
      });

      const priority = {"manifest":0, "github-api":1, "sequential-fast":2, "sequential":2, "sequential-full":3, "cache":4, "manual":5};
      const results = await Promise.all([...groups.entries()].map(async ([key, files])=>{
        files.sort((a,b)=>(priority[a.source] ?? 9) - (priority[b.source] ?? 9));
        const errors = [];
        for(const file of files){
          try{
            const qs = await loadDbFile(file);
            return {ok:true, file:{name:dbBaseName(file.name), url:file.url, source:file.source}, qs};
          }catch(e){
            errors.push(`${file.name}: ${e.message}`);
          }
        }
        console.warn("Bu soru dosyası okunamadı:", key, files);
        return {ok:false, errors};
      }));

      const loadedFiles = [];
      const all = [];
      const loadErrors = [];
      results.forEach(result=>{
        if(result.ok){
          loadedFiles.push(result.file);
          all.push(...result.qs);
        }else{
          loadErrors.push(...(result.errors || []));
        }
      });

      return {loadedFiles, all, loadErrors};
    }

async function init(){
      setInitialLoading("Database dosyaları kontrol ediliyor...");
      replaceAppHistoryState("home");
      document.body.classList.remove("app-screen-active");
      bindEvents();
      loadState();
      applyFontSize();
      applyDesignMode();
      try{
        setInitialLoading("Soru dosyaları aranıyor...");
        const candidates = await discoverDbFiles();
        setInitialLoading("Sorular database/önbellekten alınıyor...");
        const loaded = await loadCandidateGroups(candidates);

        if(!loaded.loadedFiles.length){
          throw new Error("Dosya adı bulundu fakat hiçbir soru dosyası okunamadı. " + loaded.loadErrors.slice(0,6).join(" | "));
        }

        dbFiles=[...new Map(loaded.loadedFiles.map(f=>[dbCanonicalName(f.name), {...f, name:dbBaseName(f.name)}])).values()];
        const all = loaded.all;

        setInitialLoading("Sorular hazırlanıyor...");
        els.status.innerHTML = "Sorular hazırlanıyor; önbellek ve indeksler kuruluyor...";
        allLoadedQuestions = all;
        ensureSelectedDbFiles();
        const duplicates = rebuildQuestionsFromActiveFiles(false);

        els.status.className="panel status";
        els.status.innerHTML=`<b>${dbFiles.length}</b> soru dosyası yüklendi: ${[...new Set(dbFiles.map(f=>dbBaseName(f.name)))].map(escapeHTML).join(", ")}. <b>${questions.length}</b> benzersiz soru bulundu${duplicateMode === "smart" && duplicates?`; ${duplicates} aynı/benzer soru tekilleştirildi`: (duplicateMode === "all" ? `; tekrarlar açık` : "")}.`;
        els.status.classList.add("hidden");
        els.manualDbBox.classList.add("hidden");
        renderLanding();
        hideInitialLoading();
      }catch(e){
        els.status.className="panel status warn";
        els.status.classList.remove("hidden");
        els.status.innerHTML=`<b>Soru dosyası yüklenemedi:</b> ${escapeHTML(e.message)}<br><br>
        <b>Kontrol:</b> Repository içinde <b>db/soru6.db</b> ve <b>db/soru7.db</b> dosyalarının gerçekten bulunduğundan emin ol. 
        Bu sürüm manifest eski olsa bile <b>db/</b> ve kök dizindeki <b>soru1.db-soru500.db</b> dosyalarını ayrıca tarar.
        Gerekirse aşağıdaki manuel yükleme alanından .db dosyalarını seçebilirsin.`;
        els.manualDbBox.classList.remove("hidden");
        renderLanding();
        hideInitialLoading();
      }
    }
    window.QuestionBankInitPromise = init();

    window.QuestionBankPublicAPI = {
      startCourse: (...args)=>startCourse(...args),
      startCourseWithTeacher: (...args)=>startCourseWithTeacher(...args),
      continueCourse: (...args)=>continueCourse(...args),
      showLanding: (...args)=>showLanding(...args),
      clearFastNavigation: ()=>qbClearFastNavigation()
    };
