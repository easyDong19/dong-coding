// FOUC 방지: 스타일 적용 전에 저장된 테마를 <html data-theme>에 반영 (design.md §2.1).
// <head> 최상단에서 렌더 전에 실행돼야 깜빡임이 없으므로 인라인 blocking 스크립트로 주입한다.
export const themeInitScript =
  "(function(){try{var t=localStorage.getItem('dc-theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}})();";
