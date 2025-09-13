/* work.js — split view controller: placeholder on left, hover/focus/scroll to swap,
   click to open panel, hamburger dropdown menu. ES5 style for broad support. */

(function () {
  /* --- DOM refs --- */
  var panel = document.getElementById('panel');
  var hero = document.getElementById('hero');
  var content = document.getElementById('content');
  var panelTitle = document.getElementById('panelTitle');
  var backBtn = document.getElementById('backBtn');

  var menuBtn = document.getElementById('menuBtn');
  var menuDropdown = document.getElementById('menuDropdown');

  var leftStack = document.getElementById('projectsLeft') || document.querySelector('.projects-left-inside');

  // Works with both: '.projects-right .row a[data-slug]' or any '.row a[data-slug]'
  var links = document.querySelectorAll('.row a[data-slug]');
  var rows  = document.querySelectorAll('.row');

  /* --- settings --- */
  var PLACEHOLDER_SRC = 'assets/portfolio-cover.png'; // put your "holder" image here
  var ENABLE_SCROLL_SYNC_AFTER_USER_SCROLL = true;    // image follows the row in view *after* a scroll starts
  var SCROLL_THRESHOLD = 0.6;                         // how much of a row must be visible to count

  /* --- helpers --- */
  function preload(src){ if(src){ var img=new Image(); img.src=src; } }

  /* --- Build the left image stack from PROJECTS --- */
  var imageBySlug = {};

  // 0) Insert placeholder (if file exists)
  (function insertPlaceholder(){
    if (!leftStack || !PLACEHOLDER_SRC) return;
    var wrap = document.createElement('div');
    wrap.className = 'projects-image active placeholder';
    var img = new Image();
    img.src = PLACEHOLDER_SRC;
    img.alt = 'Portfolio cover';
    img.loading = 'eager';
    wrap.appendChild(img);
    leftStack.appendChild(wrap);
    imageBySlug.__placeholder = wrap;
  })();

  // 1) Add one image layer per project in the list
  (function buildFromProjects(){
    for (var i=0;i<links.length;i++){
      var a = links[i];
      var slug = a.getAttribute('data-slug');
      var p = (window.PROJECTS || {})[slug]; // read from projects.js
      if (!p || !p.hero || imageBySlug[slug]) continue;

      var wrap = document.createElement('div');
      wrap.className = 'projects-image';
      wrap.dataset.slug = slug;

      var img = new Image();
      img.src = p.hero;
      img.alt = (p.title || slug) + ' cover';
      img.loading = 'lazy';
      img.decoding = 'async';

      wrap.appendChild(img);
      leftStack.appendChild(wrap);
      imageBySlug[slug] = wrap;

      preload(p.hero);
    }
  })();

  /* --- show/hide layers --- */
  function setActiveImage(slug){
    // prefer the requested slug; otherwise fall back to placeholder; otherwise first available
    var target = imageBySlug[slug] || imageBySlug.__placeholder;
    if (!target){
      // final fallback: first key, if any
      for (var k in imageBySlug){ target = imageBySlug[k]; break; }
    }
    if (!target) return;

    for (var key in imageBySlug){
      imageBySlug[key].classList.toggle('active', imageBySlug[key] === target);
    }
  }

  /* --- open/close project panel (reuses your existing structure) --- */
  function openProject(slug, push){
    if (typeof push === 'undefined') push = true;
    var p = (window.PROJECTS || {})[slug];
    if (!p) return;

    panelTitle.textContent = p.title || slug;
    panel.style.setProperty('--theme-hero', p.themeHero || '#111');

    hero.innerHTML = p.hero ? '<img src="' + p.hero + '" alt="' + (p.title||slug) + ' hero">' : '';

    var metaChips = '';
    if (p.meta){
      for (var k in p.meta){
        metaChips += '<span class="chip">' + k + ': ' + p.meta[k] + '</span>';
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
      '<h1 class="h1">' + (p.title||slug) + '</h1>' +
      '<p class="lead">' + (p.lead||'') + '</p>' +
      tagLine +
      '<div class="meta">' + metaChips + '</div>' +
      bodyHTML;

    panel.classList.add('open');
    panel.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
    if (push) history.pushState({slug:slug}, '', '#' + slug);
    backBtn && backBtn.focus();
  }

  function closePanel(pop){
    if (typeof pop === 'undefined') pop = true;
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
    if (pop && location.hash) history.back();
  }

  /* --- interactions on the right list --- */
  var hovering = false;

  for (var i=0;i<links.length;i++){
    (function(a){
      var slug = a.getAttribute('data-slug');

      // Click opens panel
      a.addEventListener('click', function(e){
        e.preventDefault();
        openProject(slug, true);
      });

      // Hover/focus swaps image
      a.addEventListener('mouseenter', function(){
        hovering = true;
        setActiveImage(slug);
      });
      a.addEventListener('mouseleave', function(){
        hovering = false;
      });
      a.addEventListener('focus', function(){
        setActiveImage(slug);
      });
    })(links[i]);
  }

  /* --- optional: scroll-driven swap (kicks in after user scrolls) --- */
  var userScrolled = false;
  if (ENABLE_SCROLL_SYNC_AFTER_USER_SCROLL){
    window.addEventListener('scroll', function(){ userScrolled = true; }, { passive:true });
  }

  if ('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      // Only sync if user has scrolled and we are not hovering another row
      if (ENABLE_SCROLL_SYNC_AFTER_USER_SCROLL && !userScrolled) return;
      if (hovering) return;

      for (var i=0;i<entries.length;i++){
        var entry = entries[i];
        if (entry.isIntersecting){
          var a = entry.target.querySelector('a[data-slug]');
          if (a) setActiveImage(a.getAttribute('data-slug'));
        }
      }
    }, { root:null, threshold: SCROLL_THRESHOLD });

    for (var r=0;r<rows.length;r++){ io.observe(rows[r]); }
  }

  /* --- initial state: keep the placeholder visible on open --- */
  setActiveImage(null);

  /* --- deep link support: /work.html#project3 --- */
  var initial = (location.hash||'').replace('#','');
  if (initial && (window.PROJECTS||{})[initial]){
    setActiveImage(initial);
    setTimeout(function(){ openProject(initial, false); }, 40);
  }

  /* --- close + esc --- */
  if (backBtn) backBtn.addEventListener('click', function(){ closePanel(false); });
  window.addEventListener('keydown', function(e){
    if (e.key === 'Escape'){
      if (panel.classList.contains('open')) closePanel(false);
      else if (menuBtn && menuBtn.getAttribute('aria-expanded') === 'true') toggleMenu(false);
    }
  });

  window.addEventListener('popstate', function(){
    var slug = (location.hash||'').replace('#','');
    if (slug && (window.PROJECTS||{})[slug]) openProject(slug, false);
    else if (panel.classList.contains('open')) closePanel(false);
  });

  /* --- hamburger menu --- */
  function toggleMenu(force){
    var isOpen = (typeof force !== 'undefined') ? force : (menuBtn.getAttribute('aria-expanded') !== 'true');
    menuBtn.setAttribute('aria-expanded', String(isOpen));
    menuDropdown.classList.toggle('open', isOpen);
    menuDropdown.setAttribute('aria-hidden', String(!isOpen));
  }
  if (menuBtn) menuBtn.addEventListener('click', function(){ toggleMenu(); });

  document.addEventListener('click', function(e){
    if (!menuBtn) return;
    var isOpen = menuBtn.getAttribute('aria-expanded') === 'true';
    if(!isOpen) return;
    if(!menuDropdown.contains(e.target) && e.target !== menuBtn) toggleMenu(false);
  });
})();
