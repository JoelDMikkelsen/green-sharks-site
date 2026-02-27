/**
 * Media page: YouTube feed and submit link (parse URL → embed, preview in-page, copy for Discord).
 * No LLM required: we extract video ID with regex. Optional: call backend/LLM later for messy pastes.
 */

(function () {
  var feedEl = document.getElementById('video-feed');
  var previewEl = document.getElementById('preview-area');
  var ytInput = document.getElementById('yt-url');
  var titleInput = document.getElementById('yt-title');
  var btnPreview = document.getElementById('btn-preview');
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

  if (btnPreview && ytInput && previewEl) {
    btnPreview.addEventListener('click', function () {
      var url = ytInput.value.trim();
      var title = titleInput ? titleInput.value.trim() : '';
      var id = getYouTubeVideoId(url);
      if (!id) {
        showMessage('Please enter a valid YouTube URL (e.g. youtube.com/watch?v=... or youtu.be/...).', true);
        return;
      }
      showMessage('');
      previewEl.innerHTML = '<h3 style="color:var(--green-light); margin-bottom:0.75rem; font-size:0.95rem;">Preview</h3>' + renderCard(id, title || 'Your submission');
      previewEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  if (btnSubmit && ytInput) {
    btnSubmit.addEventListener('click', function () {
      var url = ytInput.value.trim();
      if (!url) {
        showMessage('Paste a YouTube link first.', true);
        return;
      }
      var id = getYouTubeVideoId(url);
      var toCopy = id ? ('https://www.youtube.com/watch?v=' + id) : url;
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(toCopy).then(function () {
          showMessage('Link copied. Paste it in the Discord media channel to submit.');
        }).catch(function () {
          fallbackCopy(toCopy);
        });
      } else {
        fallbackCopy(toCopy);
      }
    });
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showMessage('Link copied. Paste it in the Discord media channel to submit.');
    } catch (e) {
      showMessage('Copy failed. Share this link in Discord: ' + text, true);
    }
    document.body.removeChild(ta);
  }

  /** Load feed from data/videos.json or use inline default. */
  function loadFeed() {
    if (!feedEl) return;
    var defaultItems = [];
    function renderFeed(items) {
      if (!items || !items.length) {
        feedEl.innerHTML = '<p class="form-message">No videos in the feed yet. Submit links via Discord to have them added.</p>';
        return;
      }
      var first = items[0];
      var rest = items.slice(1);
      var firstId = typeof first === 'string' ? first : (first.id || first);
      var firstTitle = typeof first === 'object' && first.title ? first.title : 'Featured highlight';
      var html = '<div class="media-featured">' +
        '<h3 class="media-featured-title">Featured Operation</h3>' +
        renderCard(firstId, firstTitle) +
        '</div>';
      if (rest.length) {
        html += '<div class="media-secondary-grid">' + rest.map(function (v) {
          var id = typeof v === 'string' ? v : (v.id || v);
          var title = typeof v === 'object' && v.title ? v.title : 'Highlight';
          return renderCard(id, title);
        }).join('') + '</div>';
      }
      feedEl.innerHTML = html;
    }
    if (typeof fetch !== 'undefined') {
      fetch('data/videos.json')
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) {
          var list = (data && data.videos) ? data.videos : (Array.isArray(data) ? data : null);
          renderFeed(list && list.length ? list : defaultItems);
        })
        .catch(function () { renderFeed(defaultItems); });
    } else {
      renderFeed(defaultItems);
    }
  }

  loadFeed();
})();
