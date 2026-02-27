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
