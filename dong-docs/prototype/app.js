/* dongCoding 프로토타입 — 공통 셸(머리글/바닥글) 주입 + 테마 토글 + 목차 스파이 + KaTeX.
   각 페이지는 <body data-page="home|posts|series|about|article"> 만 지정하면
   머리글의 현재 메뉴(aria-current)가 자동으로 맞춰진다. 모든 이동은 실제 <a href>. */
(function(){
  var SVG_DEFS =
    '<svg width="0" height="0" style="position:absolute" aria-hidden="true">'
    + '<symbol id="leaf" viewBox="0 0 24 24"><path d="M12 2C7 6 4 10 4 15a8 8 0 0 0 16 0c0-5-3-9-8-13Z" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M12 5v14" fill="none" stroke="currentColor" stroke-width="1.2"/></symbol>'
    + '<symbol id="leaf-fill" viewBox="0 0 24 24"><path d="M12 2C7 6 4 10 4 15a8 8 0 0 0 16 0c0-5-3-9-8-13Z" fill="currentColor"/></symbol>'
    + '</svg>';

  function masthead(page){
    function nav(href, key, label){
      var cur = key===page ? ' aria-current="page"' : '';
      return '<a href="'+href+'" data-nav="'+key+'"'+cur+'>'+label+'</a>';
    }
    return '<header class="masthead wrap">'
      + '<div class="masthead-top">'
      +   '<div>'
      +     '<a class="brand" href="index.html">'
      +       '<svg class="leaf" aria-hidden="true"><use href="#leaf"/></svg>'
      +       '<b>dongCoding</b><span class="sub">— 천천히 자라는 기록</span>'
      +     '</a>'
      +     '<p class="lede">코드와 식물 사이. 로딩 바도 팝업도 없이, 글에 집중하도록.</p>'
      +   '</div>'
      +   '<button class="theme-toggle" id="themeBtn" aria-pressed="false" aria-label="다크 모드 전환">'
      +     '<span id="themeIcon">◐</span><span id="themeLabel">다크</span>'
      +   '</button>'
      + '</div>'
      + '<nav class="top" aria-label="주 메뉴">'
      +   nav('index.html','home','Home')
      +   nav('posts.html','posts','Posts')
      +   nav('series.html','series','Series')
      +   nav('about.html','about','About')
      +   '<a class="spring" href="#" aria-label="RSS 피드">RSS</a>'
      + '</nav>'
      + '</header>';
  }

  var FOOTER =
    '<footer class="site wrap">'
    + '<span class="sig"><svg class="leaf" aria-hidden="true"><use href="#leaf-fill"/></svg> dongCoding에서 천천히</span>'
    + '<span class="links"><a href="#">RSS</a><a href="#">GitHub</a><a href="#">메일</a></span>'
    + '</footer>';

  function initTheme(){
    var root=document.documentElement, btn=document.getElementById('themeBtn');
    if(!btn) return;
    var icon=document.getElementById('themeIcon'), label=document.getElementById('themeLabel');
    var mq=window.matchMedia('(prefers-color-scheme: dark)');
    function effective(){ var t=root.getAttribute('data-theme'); return t ? t : (mq.matches?'dark':'light'); }
    function sync(){
      var dark=effective()==='dark';
      btn.setAttribute('aria-pressed',String(dark));
      icon.textContent=dark?'●':'◐';
      label.textContent=dark?'라이트':'다크';
    }
    btn.addEventListener('click',function(){
      var next=effective()==='dark'?'light':'dark';
      root.setAttribute('data-theme',next);
      try{ localStorage.setItem('dc-theme',next); }catch(e){}
      sync();
    });
    mq.addEventListener('change',sync);
    sync();
  }

  function initTocSpy(){
    var links={}; document.querySelectorAll('.toc a').forEach(function(a){ links[a.dataset.tgt]=a; });
    if(!Object.keys(links).length) return;
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if(e.isIntersecting){
        Object.values(links).forEach(function(l){ l.classList.remove('active'); });
        if(links[e.target.id]) links[e.target.id].classList.add('active');
      }});
    },{ rootMargin:'0px 0px -70% 0px' });
    document.querySelectorAll('article h2[id]').forEach(function(h){ io.observe(h); });
  }

  document.addEventListener('DOMContentLoaded',function(){
    document.body.insertAdjacentHTML('afterbegin', SVG_DEFS);
    var page=document.body.dataset.page||'';
    var h=document.getElementById('site-header'); if(h) h.innerHTML=masthead(page);
    var f=document.getElementById('site-footer'); if(f) f.innerHTML=FOOTER;
    initTheme();
    initTocSpy();
    if(window.renderMathInElement){
      renderMathInElement(document.body,{ delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}], throwOnError:false });
    }
  });
})();
