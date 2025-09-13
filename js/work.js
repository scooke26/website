/* work.js — split layout: left image changes on hover/scroll; click opens panel */
(function () {
  var panel = document.getElementById('panel');
  var hero = document.getElementById('hero');
  var content = document.getElementById('content');
  var panelTitle = document.getElementById('panelTitle');
  var backBtn = document.getElementById('backBtn');

  var menuBtn = document.getElementById('menuBtn');
  var menuDropdown = document.getElementById('menuDropdown');

  var leftStack = document.getElementById('projectsLeft');
  var rows = document.querySelectorAll('.projects-right .row');
  var links = document.querySelectorAll('.projects-right .row a[data-slug]');

  /* --- helpers --- */
  function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }
  function preload(src){ if(src){ var img=new Image(); img.src=src; } }

  /* --- build left image stack from PROJECTS --- */
  var imageBySlug = {};
  (function buildLeft(){
    for (var i=0;i<links.length;i++){
      var a = links[i];
      var slug = a.getAttribute('data-slug');
      var p = (window.PROJECTS||{})[slug];
      if (!p || !p.hero || imageBySlug[slug]) continue;

      var wrap = document.createElement('div');
      wrap.className = 'projects-image';
      wrap.dataset.slug = slug;

      var img = document.createElement('img');
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

  function setActiveImage(slug){
    if (!slug || !imageBySlug[slug]) return;
    for (var key in imageBySlug){
      imageBySlug[key].classList.toggle('active', key === slug);
    }
  }

  /* --- project panel open/close (same structure as your original) --- */
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
    backBtn.focus();
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

      // Hover/focus swap image
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

  // Scroll-based swap when not hovering
  if ('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      if (hovering) return;
      for (var i=0;i<entries.length;i++){
        var entry = entries[i];
        if (entry.isIntersecting){
          var row = entry.target;
          var a = row.querySelector('a[data-slug]');
          if (a) setActiveImage(a.getAttribute('data-slug'));
        }
      }
    }, { root:null, threshold:0.6 });
    for (var r=0;r<rows.length;r++){ io.observe(rows[r]); }
  }

  // Default image (first item) + deep link support
  if (links.length){ setActiveImage(links[0].getAttribute('data-slug')); }

  var initial = (location.hash||'').replace('#','');
  if (initial && (window.PROJECTS||{})[initial]){
    setActiveImage(initial);
    setTimeout(function(){ openProject(initial, false); }, 40);
  }

  /* --- close + esc --- */
  backBtn.addEventListener('click', function(){ closePanel(false); });
  window.addEventListener('keydown', function(e){
    if (e.key === 'Escape'){
      if (panel.classList.contains('open')) closePanel(false);
      else if (menuBtn.getAttribute('aria-expanded') === 'true') toggleMenu(false);
    }
  });

  // History
  window.addEventListener('popstate', function(){
    var slug = (location.hash||'').replace('#','');
    if (slug && (window.PROJECTS||{})[slug]) openProject(slug, false);
    else if (panel.classList.contains('open')) closePanel(false);
  });

  /* --- menu --- */
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
