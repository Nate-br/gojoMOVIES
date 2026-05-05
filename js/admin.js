    // Basic nav
    document.getElementById('backBtn').addEventListener('click', () => location.href = 'index.html');
    document.getElementById('signOutBtn').addEventListener('click', async () => {
      try { await supabase.auth.signOut(); } catch {}
      location.href = 'index.html';
    });

    // Auth guard
    async function ensureAdmin() {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        alert('Please login first'); location.href = 'index.html'; return null;
      }
      const { data: profile, error: pErr } = await supabase
        .from('profiles').select('role, email, display_name').eq('id', user.id).maybeSingle();
      if (pErr || !profile || profile.role !== 'admin') {
        alert('Admins only'); location.href = 'index.html'; return null;
      }
      return { user, profile };
    }

    // Branding (logo)
    const logoPreview = document.getElementById('logoPreview');
    const logoFile = document.getElementById('logoFile');
    const uploadBtn = document.getElementById('uploadBtn');
    const removeLogoBtn = document.getElementById('removeLogoBtn');
    const uploadStatus = document.getElementById('uploadStatus');

    async function loadLogo() {
      uploadStatus.textContent = 'Loading logo...';
      try {
        const { data } = await supabase.from('configs').select('value').eq('key','site_logo_url').maybeSingle();
        const url = data?.value?.url || '';
        if (url) {
          logoPreview.src = url;
          uploadStatus.textContent = 'Current logo loaded.';
        } else {
          logoPreview.src = '';
          uploadStatus.textContent = 'No logo set (site will show default ጎ).';
        }
      } catch (e) {
        uploadStatus.textContent = 'Failed to load logo.';
        console.warn(e);
      }
    }

    uploadBtn.addEventListener('click', async () => {
      const file = logoFile.files?.[0];
      if (!file) return alert('Choose an image file first.');
      uploadBtn.disabled = true; removeLogoBtn.disabled = true;
      uploadStatus.textContent = 'Uploading...';
      try {
        const name = `logo_${Date.now()}_${file.name}`.replace(/\s+/g,'_');
        const { error: uErr } = await supabase.storage.from('branding').upload(name, file, { upsert: true, cacheControl: '3600' });
        if (uErr) throw uErr;
        const { data: publicUrl } = supabase.storage.from('branding').getPublicUrl(name);
        const url = publicUrl.publicUrl;
        const { error: cErr } = await supabase.from('configs').upsert({ key: 'site_logo_url', value: { url } });
        if (cErr) throw cErr;
        logoPreview.src = url;
        uploadStatus.textContent = 'Logo updated!';
      } catch (e) {
        console.error(e);
        alert('Upload failed: ' + (e?.message || e));
        uploadStatus.textContent = 'Upload failed.';
      } finally {
        uploadBtn.disabled = false; removeLogoBtn.disabled = false;
      }
    });

    removeLogoBtn.addEventListener('click', async () => {
      if (!confirm('Remove custom logo? Site will show default ጎ.')) return;
      try {
        await supabase.from('configs').delete().eq('key','site_logo_url');
        logoPreview.src = '';
        uploadStatus.textContent = 'Logo removed (default ጎ will show).';
      } catch (e) {
        console.warn(e);
        alert('Failed to remove logo.');
      }
    });

    // Stats
    const statUsers = document.getElementById('statUsers');
    const statLikes = document.getElementById('statLikes');
    const statWatchLater = document.getElementById('statWatchLater');
    const statViews = document.getElementById('statViews');

    async function loadStats() {
      statUsers.textContent = '...'; statLikes.textContent = '...';
      statWatchLater.textContent = '...'; statViews.textContent = '...';
      try {
        const [u, l, w, v] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('likes').select('id', { count: 'exact', head: true }),
          supabase.from('watch_later').select('id', { count: 'exact', head: true }),
          supabase.from('views').select('id', { count: 'exact', head: true })
        ]);
        statUsers.textContent = u.count ?? 0;
        statLikes.textContent = l.count ?? 0;
        statWatchLater.textContent = w.count ?? 0;
        statViews.textContent = v.count ?? 0;
      } catch (e) {
        console.warn(e);
        statUsers.textContent = statLikes.textContent = statWatchLater.textContent = statViews.textContent = '—';
      }
    }

    // Users list with pagination + search
    const usersBody = document.getElementById('usersBody');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const pageInfo = document.getElementById('pageInfo');
    const searchBox = document.getElementById('searchBox');
    const refreshUsersBtn = document.getElementById('refreshUsersBtn');

    let currentPage = 1;
    const pageSize = 50;
    let lastQuery = '';

    async function loadUsers(page = 1, q = '') {
      usersBody.innerHTML = `<tr><td colspan="7">Loading...</td></tr>`;
      let query = supabase.from('profiles').select('id,email,display_name,role,created_at').order('created_at', { ascending: false }).range((page-1)*pageSize, page*pageSize - 1);
      if (q) {
        // ilike OR filter
        query = query.or(`email.ilike.%${q}%,display_name.ilike.%${q}%`);
      }
      const { data: users, error } = await query;
      if (error) {
        console.warn(error);
        usersBody.innerHTML = `<tr><td colspan="7">Failed to load users</td></tr>`;
        return;
      }

      // Fetch counts per user (likes, wl, views)
      usersBody.innerHTML = '';
      const rows = [];
      for (const u of users) {
        const [likesCount, wlCount, viewsCount] = await Promise.all([
          supabase.from('likes').select('id', { count: 'exact', head: true }).eq('user_id', u.id),
          supabase.from('watch_later').select('id', { count: 'exact', head: true }).eq('user_id', u.id),
          supabase.from('views').select('id', { count: 'exact', head: true }).eq('user_id', u.id),
        ]);

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>
            <div><strong>${(u.display_name || '').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</strong></div>
            <div class="muted small mono">${(u.email || '').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
          </td>
          <td>${u.role}</td>
          <td>${likesCount.count ?? 0}</td>
          <td>${wlCount.count ?? 0}</td>
          <td>${viewsCount.count ?? 0}</td>
          <td>${new Date(u.created_at).toLocaleString()}</td>
          <td><button class="btn small-btn">View</button></td>
        `;
        // Detail row
        const detailTr = document.createElement('tr');
        const detailTd = document.createElement('td');
        detailTd.colSpan = 7;
        detailTd.innerHTML = `
          <details>
            <summary>Open library for ${ (u.display_name || u.email || 'user').replace(/</g,'&lt;').replace(/>/g,'&gt;') }</summary>
            <div class="lists">
              <div>
                <strong>Likes (latest 20)</strong>
                <ul id="like_${u.id}"><li class="muted">Loading...</li></ul>
              </div>
              <div>
                <strong>Watch later (latest 20)</strong>
                <ul id="wl_${u.id}"><li class="muted">Loading...</li></ul>
              </div>
              <div>
                <strong>Views (latest 20)</strong>
                <ul id="view_${u.id}"><li class="muted">Loading...</li></ul>
              </div>
            </div>
          </details>
        `;
        detailTr.appendChild(detailTd);

        // View button handler
        tr.querySelector('button').addEventListener('click', () => {
          const det = detailTd.querySelector('details');
          det.open = !det.open;
          if (det.open) loadUserLibrary(u.id);
        });

        rows.push(tr, detailTr);
      }
      if (!rows.length) {
        usersBody.innerHTML = `<tr><td colspan="7">No users${q ? ' matched your search' : ''}.</td></tr>`;
      } else {
        rows.forEach(r => usersBody.appendChild(r));
      }

      pageInfo.textContent = `Page ${page}`;
      prevPageBtn.disabled = page <= 1;
      // naive: if fewer than pageSize rows, no next page
      nextPageBtn.disabled = (users.length < pageSize);
    }

    async function loadUserLibrary(userId) {
      // Likes
      const likesUl = document.getElementById(`like_${userId}`);
      const wlUl = document.getElementById(`wl_${userId}`);
      const viewsUl = document.getElementById(`view_${userId}`);

      try {
        const [{ data: likes }, { data: wl }, { data: views }] = await Promise.all([
          supabase.from('likes').select('title,video_id,created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
          supabase.from('watch_later').select('title,video_id,created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
          supabase.from('views').select('title,video_id,watched_seconds,completed,updated_at').eq('user_id', userId).order('updated_at', { ascending: false }).limit(20),
        ]);

        likesUl.innerHTML = (likes || []).map(r => `<li><span class="mono">${r.video_id}</span> — ${escapeHtml(r.title)} <span class="muted small">(${new Date(r.created_at).toLocaleString()})</span></li>`).join('') || `<li class="muted">No likes</li>`;
        wlUl.innerHTML = (wl || []).map(r => `<li><span class="mono">${r.video_id}</span> — ${escapeHtml(r.title)} <span class="muted small">(${new Date(r.created_at).toLocaleString()})</span></li>`).join('') || `<li class="muted">No items</li>`;
        viewsUl.innerHTML = (views || []).map(r => `<li><span class="mono">${r.video_id}</span> — ${escapeHtml(r.title)} • <span class="small">${r.watched_seconds ?? 0}s ${r.completed ? '✓' : ''}</span> <span class="muted small">(${new Date(r.updated_at).toLocaleString()})</span></li>`).join('') || `<li class="muted">No views</li>`;
      } catch (e) {
        console.warn(e);
        likesUl.innerHTML = wlUl.innerHTML = viewsUl.innerHTML = `<li class="muted">Failed to load</li>`;
      }
    }

    function escapeHtml(s=''){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

    // Pagination and search handlers
    prevPageBtn.addEventListener('click', () => { if (currentPage > 1) { currentPage--; loadUsers(currentPage, lastQuery); } });
    nextPageBtn.addEventListener('click', () => { currentPage++; loadUsers(currentPage, lastQuery); });
    refreshUsersBtn.addEventListener('click', () => loadUsers(currentPage, lastQuery));

    let searchTimer;
    searchBox.addEventListener('input', () => {
      const q = searchBox.value.trim();
      lastQuery = q;
      currentPage = 1;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => loadUsers(currentPage, lastQuery), 250);
    });

    // Boot
    (async function init() {
      const admin = await ensureAdmin();
      if (!admin) return;
      await loadLogo();
      await loadStats();
      await loadUsers(1, '');
    })();
