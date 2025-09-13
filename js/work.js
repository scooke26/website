/* work.js - ES5 style */
(function () {
  var panel = document.getElementById('panel');
  var hero = document.getElementById('hero');
  var content = document.getElementById('content');
  var panelTitle = document.getElementById('panelTitle');
  var backBtn = document.getElementById('backBtn');

  var menuBtn = document.getElementById('menuBtn');
  var menuDropdown = document.getElementById('menuDropdown');

  var cursorPreview = document.getElementById('cursorPreview');
  var cursorPreviewImg = document.getElementById('cursorPreviewImg');

  /* helpers */
  var canHover = window.matchMedia && window.matchMedia('(any-hover: hover)').matches;
  function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }
  function preload(src){ if(src){ var img=new Image(); img.src=src; } }

  /* panel open/close */
  function openProject(slug, push){
    if (typeof push === 'undefined') push = true;
    var p = (window.PROJECTS || {})[slug];
    if (!p) return;

    panelTitle.textContent = p.title;
    panel.style.setProperty('--theme-hero', p.themeHero || '#111');

    hero.innerHTML = p.hero ? '<img src="' + p.hero + '" alt="' + p.title + ' hero">' : '';

    var metaChips = '';
    if (p.meta){
      var pairs = Object.keys(p.meta);
      for (var i=0;i<pairs.length;i++){
        var k = pairs[i]; var v = p.meta[k];
        metaChips += '<span class="chip">' + k + ': ' + v + '</span>';
      }
    }

    var tagLine = '';
    if (p.tags && p.tags.length){
      var chips = [];
      for (var j=0;j<p.tags.length;j++) chips.push('<span class="chip">' + p.tags[j] + '</span>');
      tagLine = '<div class="meta">' + chips.join('') + '</div>';
    }

    var bodyHTML = '';
    if (p.body && p.body.length){
      for (var b=0;b<p.body.length;b++){
        bodyHTML += '<p class="lead" style="color:var(--muted)">' + p.body[b] + '</p>';
      }
    }

    content.innerHTML =
      '<h1 class="h1">' + p.title + '</h1>' +
      '<p class="lead">' + (p.lead||'') + '</p>' +
      tagLine +
      '<div class="meta">' + metaChips + '</div>' +
      bodyHTML;

    panel.classList.add('open');
    panel.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
    if (push) history.pushState({slug:slug}, '', '#' + slug);
    backBtn.focus();
  }

  function closePanel(pop){
    if (typeof pop === 'undefined') pop = true;
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
    if (pop && location.hash) history.back();
  }

  /* bind rows */
  var links = document.querySelectorAll('.row a[data-slug]');
  for (var i=0;i<links.length;i++){
    (function(a){
      a.addEventListener('click', function(e){
        e.preventDefault();
        openProject(a.getAttribute('data-slug'), true);
      });
      a.addEventListener('mouseenter', function(){
        var p = (window.PROJECTS||{})[a.getAttribute('data-slug')];
        if (p && p.hero) preload(p.hero);
      });
    })(links[i]);
  }

  /* close + esc */
  backBtn.addEventListener('click', function(){ closePanel(false); });
  window.addEventListener('keydown', function(e){
    if (e.key === 'Escape'){
      if (panel.classList.contains('open')) closePanel(false);
      else if (menuBtn.getAttribute('aria-expanded') === 'true') toggleMenu(false);
    }
  });

  /* history */
  window.addEventListener('popstate', function(){
    var slug = (location.hash||'').replace('#','');
    if (slug && (window.PROJECTS||{})[slug]) openProject(slug, false);
    else if (panel.classList.contains('open')) closePanel(false);
  });

  /* deep link on load */
  var initial = (location.hash||'').replace('#','');
  if (initial && (window.PROJECTS||{})[initial]) setTimeout(function(){ openProject(initial, false); }, 40);

  /* hover preview follow pointer */
  var moveHandler = null;
  function showPreviewFor(slug){
    if(!canHover) return;
    var p = (window.PROJECTS||{})[slug];
    if(!(p && p.hero)) return;
    cursorPreviewImg.src = p.hero;
    cursorPreview.classList.add('show');
    cursorPreview.setAttribute('aria-hidden','false');
  }
  function hidePreview(){
    cursorPreview.classList.remove('show');
    cursorPreview.setAttribute('aria-hidden','true');
  }
  function positionPreview(e){
    var offset = 18;
    var vpW = window.innerWidth, vpH = window.innerHeight;
    var rect = cursorPreview.getBoundingClientRect();
    var w = rect.width || 240, h = rect.height || 180;
    var x = e.clientX + offset, y = e.clientY + offset;
    x = clamp(x, w/2 + 6, vpW - w/2 - 6);
    y = clamp(y, h/2 + 6, vpH - h/2 - 6);
    cursorPreview.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(1)';
  }

  if (canHover){
    for (var k=0;k<links.length;k++){
      (function(a){
        a.addEventListener('mouseenter', function(){
          showPreviewFor(a.getAttribute('data-slug'));
          moveHandler = positionPreview;
          window.addEventListener('mousemove', moveHandler, { passive:true });
        });
        a.addEventListener('mouseleave', function(){
          hidePreview();
          if (moveHandler){ window.removeEventListener('mousemove', moveHandler); moveHandler = null; }
        });
        a.addEventListener('mousemove', positionPreview, { passive:true });
      })(links[k]);
    }
    window.addEventListener('scroll', function(){
      if (cursorPreview.classList.contains('show')) cursorPreview.classList.remove('show');
    }, { passive:true });
  }

  /* menu */
  function toggleMenu(force){
    var isOpen = (typeof force !== 'undefined') ? force : (menuBtn.getAttribute('aria-expanded') !== 'true');
    menuBtn.setAttribute('aria-expanded', String(isOpen));
    menuDropdown.classList.toggle('open', isOpen);
    menuDropdown.setAttribute('aria-hidden', String(!isOpen));
  }
  menuBtn.addEventListener('click', function(){ toggleMenu(); });

  document.addEventListener('click', function(e){
    var isOpen = menuBtn.getAttribute('aria-expanded') === 'true';
    if(!isOpen) return;
    if(!menuDropdown.contains(e.target) && e.target !== menuBtn) toggleMenu(false);
  });
})();
