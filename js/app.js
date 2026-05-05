(function(){
  // DIAG badge removed
  function mark(s,c){ /* diagnostic badge removed */ }

  // Basic error logging
  window.addEventListener('error', function(e){ console.error('JS error:', e.message, e.error||''); mark('error: '+e.message,'#a00'); });
  window.addEventListener('unhandledrejection', function(e){ console.error('Promise rejection:', e.reason||e); mark('promise err','#a00'); });

  // Constants
  var CATALOG_ENDPOINT = location.origin + '/api/catalog';
  var CATALOG_KEY = 'gojo_catalog_v4';
  var RATINGS_KEY = 'gojo_ratings';
  var API_TTL_MS = 6 * 60 * 60 * 1000;
  var VIDEOS_PER_PAGE = 12;

  // UI refs (guards)
  var loginBtn = document.getElementById('loginBtn');
  var userMenu = document.getElementById('userMenu');
  var userName = document.getElementById('userName');
  var userDropdown = document.getElementById('userDropdown');
  var logoutBtn = document.getElementById('logoutBtn');
  var myListBtn = document.getElementById('myListBtn');
  var adminLink = document.getElementById('adminLink');
  var authModal = document.getElementById('authModal');
  var langToggleBtn = document.getElementById('langToggle');

  // Safe Supabase helpers - check dynamically instead of caching
  function hasSB(){ return !!(window.supabase && window.supabase.auth && typeof window.supabase.auth.getUser === 'function'); }
  function safeGetUser(){
    if(!hasSB()) return Promise.resolve({ data:{ user:null }, error:null });
    return supabase.auth.getUser().catch(function(e){ console.warn('getUser',e); return { data:{ user:null }, error:e }; });
  }
  function safeSignIn(email,pass){ if(!hasSB()) return Promise.reject(new Error('Auth not available')); return supabase.auth.signInWithPassword({ email:email, password:pass }); }
  function safeSignUp(email,pass){ if(!hasSB()) return Promise.reject(new Error('Auth not available')); return supabase.auth.signUp({ email:email, password:pass }); }
  function safeSignOut(){ if(!hasSB()) return Promise.resolve(); return supabase.auth.signOut().catch(function(){}); }

  // Set up auth state listener when Supabase is ready
  setTimeout(function(){
    if(hasSB() && supabase.auth.onAuthStateChange){
      supabase.auth.onAuthStateChange(function(){ refreshAuthUI(); });
    }
  }, 1000);

  // Attach auth handlers immediately (so Login button always works)
  if(loginBtn){ loginBtn.addEventListener('click', function(){ authModal.classList.add('active'); }); }
  var closeBtn = document.getElementById('authClose');
  if(closeBtn){ closeBtn.addEventListener('click', function(){ authModal.classList.remove('active'); }); }
  var loginAction = document.getElementById('authLogin');
  if(loginAction){ loginAction.addEventListener('click', function(){
    var email = (document.getElementById('authEmail').value || '').trim();
    var pass  = (document.getElementById('authPass').value  || '').trim();
    safeSignIn(email,pass).then(function(res){
      if(res.error){ alert('Login failed: ' + res.error.message); return; }
      authModal.classList.remove('active'); refreshAuthUI();
    }).catch(function(){ alert('Login not available right now. Try later.'); });
  });}
  var signupAction = document.getElementById('authSignup');
  if(signupAction){ signupAction.addEventListener('click', function(){
    var email = (document.getElementById('authEmail').value || '').trim();
    var pass  = (document.getElementById('authPass').value  || '').trim();
    safeSignUp(email,pass).then(function(res){
      if(res.error){ alert('Signup failed: ' + res.error.message); return; }
      alert('Signup ok. Check email if confirmation is enabled.');
      authModal.classList.remove('active'); refreshAuthUI();
    }).catch(function(){ alert('Signup not available now. Try later.'); });
  });}
  if(logoutBtn){ logoutBtn.addEventListener('click', function(){ safeSignOut().then(refreshAuthUI); }); }
  if(userMenu && userDropdown){
    userMenu.addEventListener('click', function(){ userDropdown.style.display = (userDropdown.style.display==='block'?'none':'block'); });
    document.addEventListener('click', function(e){ if(userMenu && !userMenu.contains(e.target)){ userDropdown.style.display='none'; } });
  }
  if(myListBtn){
    myListBtn.addEventListener('click', function(){
      var t = document.querySelector('[aria-controls="my-list"]');
      if(t) t.click();
    });
  }

  // Language
  var i18n = {
    EN:{tabs:{"new-releases":"New Releases",popular:"Popular","top-rated":"Top Rated","most-viewed":"Most Viewed",comedies:"Comedies",dramas:"Dramas","my-list":"My List","search-results":"Search"},search:"Search movies...",views:"views",previous:"Previous",next:"Next",watchNow:"Watch Now",moreInfo:"More Info"},
    AM:{tabs:{"new-releases":"አዲስ መተዎች",popular:"ተወዳጅ","top-rated":"ከፍተኛ ደረጃ","most-viewed":"በጣም የታዩ",comedies:"ኮሜዲዎች",dramas:"ድራማዎች","my-list":"የኔ ዝርዝር","search-results":"ፍለጋ"},search:"ፊልሞችን ፈልግ...",views:"ዕይታዎች",previous:"ቀዳሚ",next:"ቀጣይ",watchNow:"አሁን ይመልከቱ",moreInfo:"ተጨማሪ መረጃ"}
  };
  var currentLang = localStorage.getItem('gojo_lang') || 'EN';
  function applyLanguage(lang){
    var d = i18n[lang] || i18n.EN;
    var si = document.getElementById('searchInput'); if(si) si.placeholder = d.search;
    var tabs = document.querySelectorAll('.tabs-container .tab-button');
    for(var i=0;i<tabs.length;i++){ var c = tabs[i].getAttribute('aria-controls'); tabs[i].textContent = d.tabs[c] || c; }
    var hp = document.getElementById('heroPlayBtn'); if(hp) hp.textContent = d.watchNow;
    var hi = document.getElementById('heroInfoBtn'); if(hi) hi.textContent = d.moreInfo;
    var pgs = document.querySelectorAll('.pagination-controls');
    for(var j=0;j<pgs.length;j++){
      var prev = pgs[j].querySelector('.prev-page'); if(prev) prev.textContent = d.previous;
      var next = pgs[j].querySelector('.next-page'); if(next) next.textContent = d.next;
    }
  }
  applyLanguage(currentLang);
  if(langToggleBtn){ langToggleBtn.addEventListener('click', function(){ currentLang = (currentLang==='EN'?'AM':'EN'); localStorage.setItem('gojo_lang', currentLang); applyLanguage(currentLang); langToggleBtn.textContent = currentLang; }); }

  // Tabs
  var tabsEls = Array.prototype.slice.call(document.querySelectorAll('.tab-button'));
  var sectionsEls = Array.prototype.slice.call(document.querySelectorAll('.video-section'));
  for(var si=0;si<sectionsEls.length;si++){ sectionsEls[si].hidden = !sectionsEls[si].classList.contains('active'); }
  for(var ti=0;ti<tabsEls.length;ti++){
    (function(tab){
      tab.addEventListener('click', function(){
        var targetId = tab.getAttribute('aria-controls');
        for(var k=0;k<tabsEls.length;k++){ var sel = tabsEls[k] === tab; tabsEls[k].classList.toggle('active', sel); tabsEls[k].setAttribute('aria-selected', sel ? 'true' : 'false'); }
        for(var m=0;m<sectionsEls.length;m++){ var on = sectionsEls[m].id === targetId; sectionsEls[m].classList.toggle('active', on); sectionsEls[m].hidden = !on; }
      });
    })(tabsEls[ti]);
  }

  // Search
  var searchIcon = document.getElementById('searchIcon');
  var searchInput = document.getElementById('searchInput');
  var searchTab = document.getElementById('searchTab');
  var searchGrid = document.getElementById('search-results-grid');
  var searchCount = document.getElementById('searchCount');
  var lastTabId = 'new-releases';
  function switchToTab(id){
    var tabBtn = document.querySelector('[aria-controls="'+id+'"]');
    for(var k=0;k<tabsEls.length;k++){ var sel = tabsEls[k] === tabBtn; tabsEls[k].classList.toggle('active', sel); tabsEls[k].setAttribute('aria-selected', sel ? 'true' : 'false'); }
    for(var m=0;m<sectionsEls.length;m++){ var on = sectionsEls[m].id === id; sectionsEls[m].classList.toggle('active', on); sectionsEls[m].hidden = !on; }
  }
  function openSearch(){ if(!searchInput||!searchTab) return; searchInput.classList.add('active'); searchTab.hidden=false; var act=document.querySelector('.tab-button.active'); lastTabId = act?act.getAttribute('aria-controls'):'new-releases'; switchToTab('search-results'); searchInput.focus(); }
  function closeSearch(){ if(!searchInput) return; searchInput.value=''; searchInput.classList.remove('active'); if(searchTab) searchTab.hidden=true; switchToTab(lastTabId); if(searchGrid) searchGrid.innerHTML=''; if(searchCount) searchCount.textContent=''; }
  if(searchIcon){ searchIcon.addEventListener('click', openSearch); }
  document.addEventListener('keydown', function(e){ if(e.key==='Escape') closeSearch(); });
  for(var t2=0;t2<tabsEls.length;t2++){ tabsEls[t2].addEventListener('click', function(){ var id = this.getAttribute('aria-controls'); if(id!=='search-results') lastTabId = id; }); }
  var searchTimer = null;
  if(searchInput){ searchInput.addEventListener('input', function(){
    var q = (searchInput.value||'').trim().toLowerCase();
    if(!q){ closeSearch(); return; }
    if(searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(function(){
      var res = movieVideos.filter(function(v){ var t = cleanMovieTitle(v.title||'').toLowerCase(); return t.indexOf(q) !== -1; });
      renderSearchResults(res);
    }, 180);
  }); }
  function renderSearchResults(results){
    switchToTab('search-results');
    if(!searchGrid) return;
    searchGrid.innerHTML = '';
    var viewText = (i18n[currentLang]&&i18n[currentLang].views) || 'views';
    for(var i=0;i<Math.min(results.length,150);i++){
      var v = results[i];
      var cleanTitle = cleanMovieTitle(v.title);
      var avgRating = getAverageRating(v.videoId, v.viewCount);
      var card = document.createElement('div'); card.className = 'video-card';
      card.innerHTML =
        '<div class="thumbnail">'+
          '<img src="https://img.youtube.com/vi/'+v.videoId+'/mqdefault.jpg" alt="'+cleanTitle.replace(/"/g,'&quot;')+'" loading="lazy"/>'+
          '<div class="play-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg></div>'+
        '</div>'+
        '<div class="info">'+
          '<h3 title="'+cleanTitle.replace(/"/g,'&quot;')+'">'+cleanTitle.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</h3>'+
          '<div class="meta">'+
            '<div class="views">'+formatViewCount(v.viewCount)+' '+viewText+'</div>'+
            '<div class="rating"><svg viewBox="0 0 24 24" fill="#FFC107"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg><span>'+avgRating.toFixed(1)+'</span></div>'+
          '</div>'+
        '</div>';
      (function(vid, title){
        card.addEventListener('click', function(){ location.href = 'player.html?v='+encodeURIComponent(vid)+'&t='+encodeURIComponent(title)+'&lang='+encodeURIComponent(currentLang); });
      })(v.videoId, cleanTitle);
      searchGrid.appendChild(card);
    }
    if(searchCount) searchCount.textContent = results.length + ' result(s)';
  }

  // Utils
  function categorizeByTitle(title){
    var t = (title||'').toLowerCase(); var cats = [];
    if(t.indexOf('comedy')>-1 || t.indexOf('ኮሜዲ')>-1 || t.indexOf('ቀልድ')>-1) cats.push('comedies');
    if(t.indexOf('drama')>-1 || t.indexOf('ድራማ')>-1 || t.indexOf('ፍቅር')>-1) cats.push('dramas');
    return cats;
  }
  function cleanMovieTitle(title){
    if(!title) return '';
    return title.replace(/\s*\|.*$/,'')
      .replace(/\s*-\s*(Full|Ethiopian|Amharic|New).*$/i,'')
      .replace(/#\w+/g,'')
      .replace(/KATEX_INLINE_OPEN(?:19|20)\d{2}KATEX_INLINE_CLOSE/g,' ($&)')
      .replace(/full (ethiopian|amharic)?\s*movie/ig,'')
      .replace(/\s{2,}/g,' ')
      .trim();
  }
  function formatViewCount(n){
    if(!n && n!==0) return 'N/A';
    if(n>=1000000) return (n/1000000).toFixed(1)+'M';
    if(n>=1000) return (n/1000).toFixed(1)+'K';
    return String(n);
  }

  var ratings = JSON.parse(localStorage.getItem(RATINGS_KEY)||'{}');
  function calculateRatingFromViews(viewCount){
    if(!viewCount) return 3.5;
    if(viewCount>=1000000) return 4.8; if(viewCount>=500000) return 4.6; if(viewCount>=200000) return 4.4;
    if(viewCount>=100000) return 4.2; if(viewCount>=50000) return 4.0; if(viewCount>=20000) return 3.8;
    if(viewCount>=10000) return 3.6; if(viewCount>=5000) return 3.4; return 3.2;
  }
  function getAverageRating(videoId, viewCount){
    if(ratings[videoId] && ratings[videoId].length){ var s=0; for(var i=0;i<ratings[videoId].length;i++) s+=ratings[videoId][i]; return s/ratings[videoId].length; }
    return calculateRatingFromViews(viewCount);
  }
  function saveRating(videoId, rating){
    if(!ratings[videoId]) ratings[videoId]=[];
    ratings[videoId].push(rating);
    localStorage.setItem(RATINGS_KEY, JSON.stringify(ratings));
    var els = document.querySelectorAll('[data-video-id="'+videoId+'"] .rating span');
    for(var i=0;i<els.length;i++){ els[i].textContent = getAverageRating(videoId).toFixed(1); }
  }

  // Rating modal wires
  var ratingModal = document.getElementById('ratingModal');
  var modalStars = document.querySelectorAll('#modalStars .star');
  var modalMovieTitle = document.getElementById('modalMovieTitle');
  var submitRatingBtn = document.getElementById('submitRatingBtn');
  var cancelRatingBtn = document.getElementById('cancelRatingBtn');
  var currentRating = 0, currentRatingVideoId = '';
  function openRatingModal(videoId, title){
    currentRatingVideoId = videoId; currentRating = 0; if(modalMovieTitle) modalMovieTitle.textContent = title;
    for(var i=0;i<modalStars.length;i++){ modalStars[i].querySelector('svg').setAttribute('fill','#888'); }
    ratingModal.classList.add('active');
  }
  function closeRatingModal(){ ratingModal.classList.remove('active'); currentRating=0; currentRatingVideoId=''; }
  function updateModalStars(v){ for(var i=0;i<modalStars.length;i++){ var val = parseInt(modalStars[i].getAttribute('data-value'),10); modalStars[i].querySelector('svg').setAttribute('fill', val<=v ? '#FFC107' : '#888'); } }
  for(var ms=0;ms<modalStars.length;ms++){
    (function(star){
      star.addEventListener('click', function(){ currentRating = parseInt(star.getAttribute('data-value'),10); updateModalStars(currentRating); });
      star.addEventListener('mouseover', function(){ updateModalStars(parseInt(star.getAttribute('data-value'),10)); });
      star.addEventListener('mouseout', function(){ updateModalStars(currentRating); });
    })(modalStars[ms]);
  }
  if(submitRatingBtn){ submitRatingBtn.addEventListener('click', function(){ if(currentRating && currentRatingVideoId) saveRating(currentRatingVideoId,currentRating); closeRatingModal(); }); }
  if(cancelRatingBtn){ cancelRatingBtn.addEventListener('click', closeRatingModal); }

  // Header scroll
  window.addEventListener('scroll', function(){
    var h = document.getElementById('header'); if(!h) return;
    if(window.scrollY>50) h.classList.add('scrolled'); else h.classList.remove('scrolled');
  });

  // Pagination
  var paginationState = {
    'new-releases': { currentPage: 1, totalPages: 1 },
    'popular': { currentPage: 1, totalPages: 1 },
    'top-rated': { currentPage: 1, totalPages: 1 },
    'most-viewed': { currentPage: 1, totalPages: 1 },
    'comedies': { currentPage: 1, totalPages: 1 },
    'dramas': { currentPage: 1, totalPages: 1 }
  };

  // Data + grids
  var movieVideos = []; var heroList=[]; var heroTimer=null; var heroIndex=0;

  function loadVideos(category, page){
    if(page==null) page=1;
    var grid = document.getElementById(category+'-grid'); if(!grid) return;
    grid.innerHTML='';
    var filtered = movieVideos.filter(function(v){
      if(category==='comedies' || category==='dramas') return v.categories && v.categories.indexOf(category)>-1;
      return v.category === category;
    });
    if(category==='top-rated'){ filtered.sort(function(a,b){ return getAverageRating(b.videoId,b.viewCount) - getAverageRating(a.videoId,a.viewCount); }); }
    else if(category==='most-viewed'){ filtered.sort(function(a,b){ return (b.viewCount||0) - (a.viewCount||0); }); }
    else if(category==='new-releases'){ filtered.sort(function(a,b){ return (b.publishedAt||0) - (a.publishedAt||0); }); }

    var totalVideos = filtered.length;
    var totalPages = Math.max(1, Math.ceil(totalVideos / VIDEOS_PER_PAGE));
    paginationState[category].totalPages = totalPages;
    paginationState[category].currentPage = Math.min(page, totalPages);
    var start = (paginationState[category].currentPage - 1) * VIDEOS_PER_PAGE;
    var pageItems = filtered.slice(start, start + VIDEOS_PER_PAGE);

    for(var i=0;i<pageItems.length;i++){
      var v = pageItems[i];
      var cleanTitle = cleanMovieTitle(v.title);
      var avgRating = getAverageRating(v.videoId, v.viewCount);
      var viewText = (i18n[currentLang] && i18n[currentLang].views) || 'views';
      var isLiked = window.__liked && window.__liked.has(v.videoId);
      var isSaved = window.__watchLater && window.__watchLater.has(v.videoId);

      var card = document.createElement('div'); card.className='video-card'; card.setAttribute('data-video-id', v.videoId);
      card.innerHTML =
        '<div class="thumbnail">'+
          '<img src="https://img.youtube.com/vi/'+v.videoId+'/mqdefault.jpg" alt="'+cleanTitle.replace(/"/g,'&quot;')+'" loading="lazy"/>'+
          '<div class="play-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg></div>'+
        '</div>'+
        '<div class="info">'+
          '<h3 title="'+cleanTitle.replace(/"/g,'&quot;')+'">'+cleanTitle.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</h3>'+
          '<div class="meta">'+
            '<div class="views">'+formatViewCount(v.viewCount)+' '+viewText+'</div>'+
            '<div class="rating"><svg viewBox="0 0 24 24" fill="#FFC107"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg><span>'+avgRating.toFixed(1)+'</span></div>'+
          '</div>'+
        '</div>';
      (function(video, title){
        var rate = card.querySelector('.rating');
        if(rate){ rate.addEventListener('click', function(e){ e.stopPropagation(); openRatingModal(video.videoId, title); }); }
        card.addEventListener('click', function(){ location.href = 'player.html?v='+encodeURIComponent(video.videoId)+'&t='+encodeURIComponent(title)+'&lang='+encodeURIComponent(currentLang); });
      })(v, cleanTitle);
      grid.appendChild(card);
    }

    var p = document.getElementById(category+'-pagination'); if(p){
      var cur = p.querySelector('.current-page'); if(cur) cur.textContent = paginationState[category].currentPage;
      var tot = p.querySelector('.total-pages'); if(tot) tot.textContent = paginationState[category].totalPages;
      var prev = p.querySelector('.prev-page'); var next = p.querySelector('.next-page');
      if(prev) prev.disabled = paginationState[category].currentPage <= 1;
      if(next) next.disabled = paginationState[category].currentPage >= paginationState[category].totalPages;
    }
  }

  function setupPaginationListeners(){
    var ctrls = document.querySelectorAll('.pagination-controls');
    for(var i=0;i<ctrls.length;i++){
      (function(control){
        var category = control.id.replace('-pagination','');
        var prev = control.querySelector('.prev-page');
        var next = control.querySelector('.next-page');
        if(prev){ prev.addEventListener('click', function(){ if(paginationState[category].currentPage>1){ paginationState[category].currentPage--; loadVideos(category, paginationState[category].currentPage); } }); }
        if(next){ next.addEventListener('click', function(){ if(paginationState[category].currentPage<paginationState[category].totalPages){ paginationState[category].currentPage++; loadVideos(category, paginationState[category].currentPage); } }); }
      })(ctrls[i]);
    }
  }

  // Hero rotation
  function updateHero(item){
    if(!item) return;
    var cleanTitle = cleanMovieTitle(item.title);
    var bg = document.getElementById('heroBackground'); var ht = document.getElementById('heroTitle');
    if(ht) ht.textContent = cleanTitle;
    if(bg){ bg.src = 'https://img.youtube.com/vi/'+item.videoId+'/maxresdefault.jpg'; bg.onerror = function(){ bg.src = 'https://img.youtube.com/vi/'+item.videoId+'/hqdefault.jpg'; }; }
    var hp = document.getElementById('heroPlayBtn'); if(hp) hp.onclick = function(){ location.href = 'player.html?v='+encodeURIComponent(item.videoId)+'&t='+encodeURIComponent(cleanTitle)+'&lang='+encodeURIComponent(currentLang); };
    var hi = document.getElementById('heroInfoBtn'); if(hi) hi.onclick = function(){ openRatingModal(item.videoId, cleanTitle); };
  }
  function startHeroRotation(list){
    if(heroTimer) clearInterval(heroTimer);
    heroList = list||[]; heroIndex=0;
    if(!heroList.length) return;
    updateHero(heroList[0]);
    if(heroList.length>1){
      heroTimer = setInterval(function(){ heroIndex = (heroIndex+1)%heroList.length; updateHero(heroList[heroIndex]); }, 7000);
    }
  }

  // Catalog cache
  function getCachedCatalog(){
    try{ var raw = localStorage.getItem(CATALOG_KEY); if(!raw) return null; var cat=JSON.parse(raw); if(!cat.fetchedAt) return null; if(Date.now()-cat.fetchedAt>API_TTL_MS) return null; return cat; }catch(e){ return null; }
  }
  function setCachedCatalog(cat){ try{ localStorage.setItem(CATALOG_KEY, JSON.stringify(cat)); }catch(e){} }
  function isCatalogEmpty(cat){
    var cs = (cat&&cat.categories) || {};
    var keys = ['new-releases','popular','trending','classics'];
    for(var i=0;i<keys.length;i++){ if(Array.isArray(cs[keys[i]]) && cs[keys[i]].length>0) return false; }
    return true;
  }

  // FALLBACK catalog (rich)
  var FALLBACK_CATALOG = {
    fetchedAt: Date.now(),
    items: [
      { title:"ጥላዬ (Telaye) - Full Amharic Movie 2022", videoId:"SxVyFHDyrRI", viewCount:252463, publishedAt:Date.now()-30*86400000, durationSec:7200 },
      { title:"ባለ ክራር (Bale Kirar) - Ethiopian Full Movie 2024", videoId:"WIJU3F5Vrmc", viewCount:183294, publishedAt:Date.now()-7*86400000, durationSec:6800 },
      { title:"ወዳጅ (Wedaj) - Full Ethiopian Movie 2023", videoId:"phmIAGUlKVg", viewCount:385742, publishedAt:Date.now()-90*86400000, durationSec:7500 },
      { title:"ወይኔ የአራዳ ልጅ 5 (Wayne Yarada Lij 5) - Full Movie 2020", videoId:"u4n1bBSWPHY", viewCount:695231, publishedAt:Date.now()-365*86400000, durationSec:8000 },
      { title:"ድራማ - የምር ፍቅር Ethiopian Drama", videoId:"pWYWcpbIKZ4", viewCount:125674, publishedAt:Date.now()-45*86400000, durationSec:5400, categories:["dramas"] },
      { title:"የኮሜዲ አዋጪ - Ethiopian Comedy Movie", videoId:"pJ7Gk6UdtJM", viewCount:238541, publishedAt:Date.now()-20*86400000, durationSec:6200, categories:["comedies"] },
      { title:"ፍቅር ቃል - Fikir Kal Ethiopian Movie", videoId:"QM-9NY8BFQU", viewCount:345218, publishedAt:Date.now()-75*86400000, durationSec:6500, categories:["dramas"] },
      { title:"ተውኔት - Tewinet Full Ethiopian Movie", videoId:"9Iq6EPu7tFU", viewCount:156390, publishedAt:Date.now()-120*86400000, durationSec:7200 },
      { title:"አሌክስ - Alex New Ethiopian Movie", videoId:"uLSqvvCS9OU", viewCount:526840, publishedAt:Date.now()-60*86400000, durationSec:6900 },
      { title:"ምርጫ - Mircha Ethiopian Movie", videoId:"oAiYvE9MYVU", viewCount:412367, publishedAt:Date.now()-40*86400000, durationSec:6800 },
      { title:"ቁስል - Kusil Ethiopian Movie", videoId:"Bd2MZ7e4p7s", viewCount:187569, publishedAt:Date.now()-95*86400000, durationSec:7300 },
      { title:"ሰማይ ነው - Semay New Ethiopian Movie", videoId:"1xhBnFAXZ2Q", viewCount:298745, publishedAt:Date.now()-15*86400000, durationSec:7000 },
      { title:"ሰይጣን ተጫወተብኝ - Ethiopian Comedy", videoId:"6dVjd-2SZ0Q", viewCount:354120, publishedAt:Date.now()-25*86400000, durationSec:5800, categories:["comedies"] },
      { title:"ሙሉ ፊልም - Mulu Film Ethiopian Full Movie 2024", videoId:"mCp3LNoL4Jk", viewCount:120560, publishedAt:Date.now()-5*86400000, durationSec:7500 },
      { title:"ትዕግስት - Tigist Ethiopian Full Movie", videoId:"kV_2lWDiGL4", viewCount:287436, publishedAt:Date.now()-55*86400000, durationSec:6700 }
    ],
    categories: {
      'new-releases': [
        { title:"ጥላዬ (Telaye) - Full Amharic Movie 2022", videoId:"SxVyFHDyrRI" },
        { title:"ባለ ክራር (Bale Kirar) - Ethiopian Full Movie 2024", videoId:"WIJU3F5Vrmc" },
        { title:"ሰማይ ነው - Semay New Ethiopian Movie", videoId:"1xhBnFAXZ2Q" },
        { title:"ሙሉ ፊልም - Mulu Film Ethiopian Full Movie 2024", videoId:"mCp3LNoL4Jk" }
      ],
      'popular': [
        { title:"ወዳጅ (Wedaj) - Full Ethiopian Movie 2023", videoId:"phmIAGUlKVg" },
        { title:"የኮሜዲ አዋጪ - Ethiopian Comedy Movie", videoId:"pJ7Gk6UdtJM" },
        { title:"አሌክስ - Alex New Ethiopian Movie", videoId:"uLSqvvCS9OU" },
        { title:"ሰይጣን ተጫወተብኝ - Ethiopian Comedy", videoId:"6dVjd-2SZ0Q" }
      ],
      'trending': [
        { title:"ወይኔ የአራዳ ልጅ 5 (Wayne Yarada Lij 5) - Full Movie 2020", videoId:"u4n1bBSWPHY" },
        { title:"ድራማ - የምር ፍቅር Ethiopian Drama", videoId:"pWYWcpbIKZ4" },
        { title:"ምርጫ - Mircha Ethiopian Movie", videoId:"oAiYvE9MYVU" },
        { title:"ትዕግስት - Tigist Ethiopian Full Movie", videoId:"kV_2lWDiGL4" }
      ],
      'classics': [
        { title:"ባለ ክራር (Bale Kirar) - Ethiopian Full Movie 2024", videoId:"WIJU3F5Vrmc" },
        { title:"ወይኔ የአራዳ ልጅ 5 (Wayne Yarada Lij 5) - Full Movie 2020", videoId:"u4n1bBSWPHY" },
        { title:"ተውኔት - Tewinet Full Ethiopian Movie", videoId:"9Iq6EPu7tFU" },
        { title:"ቁስል - Kusil Ethiopian Movie", videoId:"Bd2MZ7e4p7s" }
      ],
      'comedies': [
        { title:"የኮሜዲ አዋጪ - Ethiopian Comedy Movie", videoId:"pJ7Gk6UdtJM" },
        { title:"ሰይጣን ተጫወተብኝ - Ethiopian Comedy", videoId:"6dVjd-2SZ0Q" }
      ],
      'dramas': [
        { title:"ድራማ - የምር ፍቅር Ethiopian Drama", videoId:"pWYWcpbIKZ4" },
        { title:"ፍቅር ቃል - Fikir Kal Ethiopian Movie", videoId:"QM-9NY8BFQU" }
      ]
    }
  };

  function setFromCatalog(cat){
    movieVideos = [];
    var items = cat.items || [];
    var categoriesMap = cat.categories || {};
    var metadataMap = {};
    for(var i=0;i<items.length;i++){
      var it = items[i];
      if(it.videoId){
        metadataMap[it.videoId] = {
          viewCount: it.viewCount || Math.floor(Math.random()*100000),
          publishedAt: it.publishedAt || Date.now(),
          durationSec: it.durationSec,
          categories: it.categories || []
        };
      }
    }
    var cats = ['new-releases','popular','trending','classics','comedies','dramas'];
    var mapTo = { 'trending':'top-rated', 'classics':'most-viewed' };
    for(var c=0;c<cats.length;c++){
      var old = cats[c];
      var list = categoriesMap[old] || [];
      var mapped = mapTo[old] || old;
      for(var j=0;j<list.length;j++){
        var e = list[j]; if(!e.videoId) continue;
        var md = metadataMap[e.videoId] || { viewCount: Math.floor(Math.random()*100000), publishedAt: Date.now(), categories: [] };
        var cc = (md.categories && md.categories.length) ? md.categories : categorizeByTitle(e.title);
        movieVideos.push({ videoId:e.videoId, title:e.title, viewCount:md.viewCount, publishedAt:md.publishedAt, durationSec:md.durationSec, category:mapped, categories:cc });
      }
    }
    for(var z=0;z<movieVideos.length;z++){ if(!movieVideos[z].categories || !movieVideos[z].categories.length) movieVideos[z].categories = categorizeByTitle(movieVideos[z].title); }
    var keys = ['new-releases','popular','top-rated','most-viewed','comedies','dramas'];
    for(var k=0;k<keys.length;k++){ paginationState[keys[k]].currentPage = 1; loadVideos(keys[k],1); }
    var featured = movieVideos.filter(function(v){ return v.category==='new-releases'; }).sort(function(a,b){ return (b.viewCount||0)-(a.viewCount||0); });
    startHeroRotation(featured.slice(0,8));
  }

  function getCachedOrFallback(){ var cached = getCachedCatalog(); if(cached && !isCatalogEmpty(cached)) return cached; return FALLBACK_CATALOG; }

  // Fetch catalog (with fallback)
  function fetchCatalog(force){
    if(typeof force==='undefined') force=false;
    var cached = !force && getCachedCatalog();
    if(cached && !isCatalogEmpty(cached)){ setFromCatalog(cached); return Promise.resolve(cached); }
    var btn = document.getElementById('refreshBtn'); var original = btn ? btn.innerHTML : '';
    if(btn){ btn.disabled = true; btn.innerHTML = '<svg class="spinner" viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-dasharray="42"/></svg>'; }
    var q = new URLSearchParams(); if(force) q.set('force','1'); q.set('queries', ['Amharic full movie 2024','Ethiopian full movie 2024','አማርኛ ፊልም ሙሉ 2024','Amharic full movie 2023','Ethiopian full movie 2023','amharic movies','ye wendoch guday'].join(','));
    var url = CATALOG_ENDPOINT + '?' + q.toString();
    return fetch(url, { cache: force ? 'no-store' : 'default' })
      .then(function(res){ if(!res.ok) throw new Error('catalog fetch failed'); return res.json(); })
      .then(function(cat){ if(!cat || !cat.categories || isCatalogEmpty(cat)){ setFromCatalog(FALLBACK_CATALOG); return FALLBACK_CATALOG; } setCachedCatalog(cat); setFromCatalog(cat); return cat; })
      .catch(function(e){
        console.warn('catalog error', e);
        var raw = localStorage.getItem(CATALOG_KEY);
        if(raw){ try{ var old=JSON.parse(raw); if(!isCatalogEmpty(old)){ setFromCatalog(old); return old; } }catch(e2){} }
        setFromCatalog(FALLBACK_CATALOG); return FALLBACK_CATALOG;
      })
      .finally(function(){ if(btn){ btn.disabled=false; btn.innerHTML=original; } });
  }

  // Auth UI refresh
  function refreshAuthUI(){
    safeGetUser().then(function(res){
      var user = res && res.data ? res.data.user : null;
      if(user){
        if(loginBtn) loginBtn.style.display='none';
        if(userMenu) userMenu.style.display='inline-flex';
        var display = user.email ? user.email.split('@')[0] : 'User';
        if(hasSB){
          supabase.from('profiles').select('display_name,role').eq('id', user.id).maybeSingle()
            .then(function(pr){
              if(pr && pr.data && pr.data.display_name) display = pr.data.display_name;
              if(adminLink) adminLink.style.display = (pr && pr.data && pr.data.role==='admin') ? 'block' : 'none';
              if(userName) userName.textContent = display;
            })
            .catch(function(){ if(userName) userName.textContent = display; });
        }else{
          if(userName) userName.textContent = display;
        }
        preloadUserLibrary().then(function(){ reloadAllGrids(); renderMyList(); });
      }else{
        if(loginBtn) loginBtn.style.display='inline-flex';
        if(userMenu) userMenu.style.display='none';
        if(window.__liked) window.__liked.clear();
        if(window.__watchLater) window.__watchLater.clear();
        renderMyList();
      }
    });
  }

  // Library state helpers
  window.__liked = new Set(); window.__watchLater = new Set();
  function preloadUserLibrary(){
    return safeGetUser().then(function(r){
      var user = r && r.data ? r.data.user : null;
      window.__liked.clear(); window.__watchLater.clear();
      if(!user || !hasSB) return;
      return Promise.all([
        supabase.from('likes').select('video_id').limit(500),
        supabase.from('watch_later').select('video_id').limit(500)
      ]).then(function(arr){
        var likes = (arr[0] && arr[0].data) || []; var wl = (arr[1] && arr[1].data) || [];
        for(var i=0;i<likes.length;i++) window.__liked.add(likes[i].video_id);
        for(var j=0;j<wl.length;j++) window.__watchLater.add(wl[j].video_id);
      }).catch(function(e){ console.warn('preloadUserLibrary',e); });
    });
  }
  function reloadAllGrids(){
    var ids = ['new-releases','popular','top-rated','most-viewed','comedies','dramas'];
    for(var i=0;i<ids.length;i++){
      var grid = document.getElementById(ids[i]+'-grid');
      if(grid && grid.children.length){ loadVideos(ids[i], paginationState[ids[i]].currentPage); }
    }
  }
  function renderMyList(){
    var grid = document.getElementById('my-list-grid'); if(!grid) return;
    var ids = Array.from(new Set([].concat(Array.from(window.__liked||[]), Array.from(window.__watchLater||[]))));
    var data = movieVideos.filter(function(v){ return ids.indexOf(v.videoId)>-1; });
    var viewText = (i18n[currentLang]&&i18n[currentLang].views) || 'views';
    grid.innerHTML = '';
    for(var i=0;i<data.length;i++){
      var v = data[i]; var cleanTitle = cleanMovieTitle(v.title); var avgRating = getAverageRating(v.videoId, v.viewCount);
      var card = document.createElement('div'); card.className='video-card';
      card.innerHTML =
        '<div class="thumbnail">'+
          '<img src="https://img.youtube.com/vi/'+v.videoId+'/mqdefault.jpg" alt="'+cleanTitle.replace(/"/g,'&quot;')+'" loading="lazy"/>'+
          '<div class="play-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg></div>'+
        '</div>'+
        '<div class="info">'+
          '<h3>'+cleanTitle.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</h3>'+
          '<div class="meta">'+
            '<div class="views">'+formatViewCount(v.viewCount)+' '+viewText+'</div>'+
            '<div class="rating"><svg viewBox="0 0 24 24" fill="#FFC107"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg><span>'+avgRating.toFixed(1)+'</span></div>'+
          '</div>'+
        '</div>';
      (function(vid,title){ card.addEventListener('click', function(){ location.href = 'player.html?v='+encodeURIComponent(vid)+'&t='+encodeURIComponent(title)+'&lang='+encodeURIComponent(currentLang); }); })(v.videoId, cleanTitle);
      grid.appendChild(card);
    }
    var countEl = document.getElementById('myListCount'); if(countEl) countEl.textContent = data.length + ' saved';
  }

  // Pagination listeners
  function wirePagination(){ setupPaginationListeners(); }

  // Header scrolled class
  window.addEventListener('scroll', function(){
    var h = document.getElementById('header'); if(!h) return;
    if(window.scrollY>50) h.classList.add('scrolled'); else h.classList.remove('scrolled');
  });

  // Boot sequence
  mark('loading catalog...');
  fetchCatalog(false).then(function(){ wirePagination(); mark('ready'); }).catch(function(){ setFromCatalog(FALLBACK_CATALOG); wirePagination(); mark('ready'); });

  // Auth refresh last (UI already usable)
  refreshAuthUI();

})();
