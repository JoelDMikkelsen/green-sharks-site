/**
 * Media page: YouTube feed and highlight submission.
 * - Renders a featured video + grid from data/videos.json
 * - Submits new highlight requests to a Netlify Function, which forwards to Discord.
 */

(function () {
  var feedEl = document.getElementById('video-feed');
  var ytInput = document.getElementById('yt-url');
  var titleInput = document.getElementById('yt-title');
  var submitterInput = document.getElementById('yt-submitter');
  var discordInput = document.getElementById('yt-discord');
  var btnSubmit = document.getElementById('btn-submit');
  var formMessage = document.getElementById('form-message');

  /** Extract YouTube video ID from common URL formats (no LLM). */
  function getYouTubeVideoId(url) {
    if (!url || typeof url !== 'string') return null;
    var u = url.trim();
    var patterns = [
      /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
      /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/
    ];
    for (var i = 0; i < patterns.length; i++) {
      var m = u.match(patterns[i]);
      if (m) return m[1];
    }
    return null;
  }

  function embedUrl(videoId) {
    return 'https://www.youtube.com/embed/' + videoId + '?rel=0';
  }

  function renderCard(videoId, title) {
    var titleText = title || 'YouTube video';
    return (
      '<div class="media-card">' +
      '<iframe src="' + embedUrl(videoId) + '" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>' +
      '<h3>' + escapeHtml(titleText) + '</h3>' +
      '<p>Watch in-browser</p>' +
      '</div>'
    );
  }

  function escapeHtml(s) {
    if (!s) return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function showMessage(text, isError) {
    if (!formMessage) return;
    formMessage.textContent = text;
    formMessage.className = 'form-message' + (isError ? ' error' : ' success');
  }

  if (btnSubmit && ytInput) {
    btnSubmit.addEventListener('click', function () {
      if (!ytInput || !titleInput || !submitterInput) return;
      var url = ytInput.value.trim();
      var title = titleInput.value.trim();
      var submittedBy = submitterInput.value.trim();
      var discordName = discordInput ? discordInput.value.trim() : '';

      if (!url || !title || !submittedBy) {
        showMessage('Please fill in URL, title, and submitted by.', true);
        return;
      }

      var id = getYouTubeVideoId(url);
      if (!id) {
        showMessage('Please enter a valid YouTube URL (e.g. youtube.com/watch?v=... or youtu.be/...).', true);
        return;
      }

      showMessage('Submitting highlight…', false);
      btnSubmit.disabled = true;

      var payload = {
        videoUrl: url,
        videoId: id,
        title: title,
        submittedBy: submittedBy,
        discordName: discordName
      };

      if (typeof fetch === 'undefined') {
        showMessage('Submission not supported in this browser.', true);
        btnSubmit.disabled = false;
        return;
      }

      fetch('/.netlify/functions/submit-highlight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (res) {
        if (!res.ok) throw new Error('Request failed');
        return res.json().catch(function () { return {}; });
      }).then(function () {
        showMessage('Submitted. Your clip will be reviewed in Discord before appearing here.', false);
        ytInput.value = '';
        titleInput.value = '';
        submitterInput.value = '';
        if (discordInput) discordInput.value = '';
      }).catch(function () {
        showMessage('Something went wrong submitting your highlight. Please try again later.', true);
      }).finally(function () {
        btnSubmit.disabled = false;
      });
    });
  }

  // --- FEED & PAGINATION LOGIC ---
  var allVideos = [];
  var paginationEl = document.getElementById('media-pagination');
  var searchInput = document.getElementById('media-search');
  var sortSelect = document.getElementById('media-sort');

  var state = {
    query: '',
    sort: 'newest', // 'newest', 'oldest', 'az', 'za'
    page: 1,
    limit: 6 // 6 videos per page looks good for a grid
  };

  function updateFeed() {
    if (!feedEl) return;

    // 1. Filter
    var filtered = allVideos.filter(function (v) {
      var q = state.query.toLowerCase();
      var t = (v.title || '').toLowerCase();
      return t.indexOf(q) !== -1;
    });

    // 2. Sort
    filtered.sort(function (a, b) {
      if (state.sort === 'az') {
        return (a.title || '').localeCompare(b.title || '');
      } else if (state.sort === 'za') {
        return (b.title || '').localeCompare(a.title || '');
      } else if (state.sort === 'newest' || state.sort === 'oldest') {
        var dateA = a.date ? new Date(a.date).getTime() : 0;
        var dateB = b.date ? new Date(b.date).getTime() : 0;
        if (state.sort === 'newest') return dateB - dateA;
        return dateA - dateB;
      }
      return 0; // fallback
    });

    // 3. Paginate
    var totalPages = Math.ceil(filtered.length / state.limit) || 1;
    if (state.page > totalPages) state.page = totalPages;
    if (state.page < 1) state.page = 1;

    var startIdx = (state.page - 1) * state.limit;
    var pageItems = filtered.slice(startIdx, startIdx + state.limit);

    // 4. Render Grid
    if (filtered.length === 0) {
      feedEl.innerHTML = '<p class="form-message">No videos found matching your search.</p>';
      renderPagination(0, 1);
      return;
    }

    // Only feature the first video if we are viewing the default unsorted page 1
    var isPristine = (state.query === '' && state.sort === 'newest' && state.page === 1);
    var html = '';

    if (isPristine && pageItems.length > 0) {
      var first = pageItems[0];
      var rest = pageItems.slice(1);
      html += '<div class="media-featured">' +
        '<h3 class="media-featured-title">Featured Operation</h3>' +
        renderCard(first.id, first.title || 'Featured highlight') +
        '</div>';

      if (rest.length) {
        html += '<div class="media-secondary-grid">' + rest.map(function (v) {
          return renderCard(v.id, v.title || 'Highlight');
        }).join('') + '</div>';
      }
    } else {
      html += '<div class="media-secondary-grid">' + pageItems.map(function (v) {
        return renderCard(v.id, v.title || 'Highlight');
      }).join('') + '</div>';
    }

    feedEl.innerHTML = html;
    renderPagination(state.page, totalPages);
  }

  function renderPagination(current, total) {
    if (!paginationEl) return;
    if (total <= 1) {
      paginationEl.style.display = 'none';
      return;
    }

    paginationEl.style.display = 'flex';
    var prevDisabled = current <= 1 ? 'disabled' : '';
    var nextDisabled = current >= total ? 'disabled' : '';

    paginationEl.innerHTML =
      '<button class="page-btn" id="btn-prev" ' + prevDisabled + '>Previous</button>' +
      '<span class="page-info">Page ' + current + ' of ' + total + '</span>' +
      '<button class="page-btn" id="btn-next" ' + nextDisabled + '>Next</button>';

    var btnPrev = document.getElementById('btn-prev');
    var btnNext = document.getElementById('btn-next');

    if (btnPrev) {
      btnPrev.addEventListener('click', function () {
        if (state.page > 1) {
          state.page--;
          updateFeed();
          scrollToFeedTop();
        }
      });
    }

    if (btnNext) {
      btnNext.addEventListener('click', function () {
        if (state.page < total) {
          state.page++;
          updateFeed();
          scrollToFeedTop();
        }
      });
    }
  }

  function scrollToFeedTop() {
    if (feedEl) {
      // scroll to just above the search controls
      var headerEl = document.querySelector('.media-controls-bar');
      var target = headerEl || feedEl;
      var y = target.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }

  // Hook up controls
  if (searchInput) {
    searchInput.addEventListener('input', function (e) {
      state.query = e.target.value;
      state.page = 1;
      updateFeed();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', function (e) {
      state.sort = e.target.value;
      state.page = 1;
      updateFeed();
    });
  }

  /** Load feed from data/videos.json */
  function loadFeedData() {
    if (typeof fetch !== 'undefined') {
      fetch('data/videos.json')
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) {
          var list = (data && data.videos) ? data.videos : (Array.isArray(data) ? data : []);

          // Normalize items if they are just strings (IDs) instead of objects
          allVideos = list.map(function (item, idx) {
            if (typeof item === 'string') {
              // inject a fake date decreasing from today so string arrays don't break sorting
              return { id: item, title: 'Highlight', date: new Date(Date.now() - idx * 86400000).toISOString() };
            }
            return item;
          });

          // Sort by newest initially just in case array in json isn't perfectly sorted
          allVideos.sort(function (a, b) {
            var dateA = a.date ? new Date(a.date).getTime() : 0;
            var dateB = b.date ? new Date(b.date).getTime() : 0;
            return dateB - dateA;
          });

          updateFeed();
        })
        .catch(function () {
          allVideos = [];
          updateFeed();
        });
    } else {
      allVideos = [];
      updateFeed();
    }
  }

  loadFeedData();
})();
