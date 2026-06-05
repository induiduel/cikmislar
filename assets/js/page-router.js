(function(){
  function readRoute(){
    try{
      const raw = sessionStorage.getItem("QB_ROUTE_REQUEST");
      sessionStorage.removeItem("QB_ROUTE_REQUEST");
      return raw ? JSON.parse(raw) : null;
    }catch(e){
      return null;
    }
  }

  function clearFastNavSoon(){
    setTimeout(()=>{
      try{sessionStorage.removeItem("QB_FAST_NAV");}catch(e){}
      if(window.QuestionBankPublicAPI && window.QuestionBankPublicAPI.clearFastNavigation){
        window.QuestionBankPublicAPI.clearFastNavigation();
      }
    }, 250);
  }

  function openQuestionRoute(){
    const page = document.body.dataset.page || "main";

    if(page !== "question"){
      clearFastNavSoon();
      return;
    }

    const route = readRoute() || {action:"continueCourse", subject:"all", teacher:"all"};
    window.QB_ALLOW_LOCAL_LANDING = true;

    setTimeout(()=>{
      try{
        if(route.action === "startCourseWithTeacher"){
          window.QuestionBankPublicAPI.startCourseWithTeacher(route.subject || "all", route.teacher || "all");
        }else if(route.action === "startCourse"){
          window.QuestionBankPublicAPI.startCourse(route.subject || "all");
        }else{
          window.QuestionBankPublicAPI.continueCourse(route.subject || "all", route.teacher || "all");
        }
      }finally{
        window.QB_ALLOW_LOCAL_LANDING = false;
        clearFastNavSoon();
      }
    }, 0);
  }

  openQuestionRoute();
})();