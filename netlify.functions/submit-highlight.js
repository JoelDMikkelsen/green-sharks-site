// Netlify Function: submit-highlight
// Receives highlight submissions from the Media page and forwards them to Discord via Bot API.

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const botToken = process.env.DISCORD_BOT_TOKEN;
  const channelId = process.env.DISCORD_CHANNEL_ID;

  if (!botToken || !channelId) {
    // Graceful fallback to legacy webhook if variables missing.
    // In actual ops, these must be configured.
    console.error('Missing DISCORD_BOT_TOKEN or DISCORD_CHANNEL_ID');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Bot not configured. Please add DISCORD_BOT_TOKEN & DISCORD_CHANNEL_ID.' })
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const videoUrl = (payload.videoUrl || '').trim();
  const videoId = (payload.videoId || '').trim();
  const title = (payload.title || '').trim();
  const submittedBy = (payload.submittedBy || '').trim();
  const discordName = (payload.discordName || '').trim();

  if (!videoUrl || !videoId || !title || !submittedBy) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
  }

  const submitterLine = discordName
    ? `Submitted by: ${submittedBy} (${discordName})`
    : `Submitted by: ${submittedBy}`;

  // Discord Bot API payload
  const discordPayload = {
    content: `New highlight submission received. Click **Approve** below to automatically add it to the site!`,
    embeds: [
      {
        title: title,
        url: videoUrl,
        description: `${submitterLine}\nYouTube: ${videoUrl}`,
        color: 0x00ff00, // Green
        fields: [
          { name: 'Video ID', value: videoId, inline: true }
        ]
      }
    ],
    components: [
      {
        type: 1, // Action Row
        components: [
          {
            type: 2, // Button
            style: 3, // Success (Green)
            label: "Approve Highlight",
            custom_id: `approve_highlight:${videoId}` // We will parse this ID in the interaction hook
          }
        ]
      }
    ]
  };

  const discordApiUrl = `https://discord.com/api/v10/channels/${channelId}/messages`;

  try {
    const res = await fetch(discordApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bot ${botToken}`
      },
      body: JSON.stringify(discordPayload)
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Discord API Error:', errorText);
      return { statusCode: 502, body: JSON.stringify({ error: 'Failed to notify Discord' }) };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error('Network Error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Unexpected error' }) };
  }
}

