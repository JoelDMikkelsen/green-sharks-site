// Netlify Function: submit-highlight
// Receives highlight submissions from the Media page and forwards them to Discord via webhook.

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Allow': 'POST' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Webhook not configured' })
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON body' })
    };
  }

  const videoUrl = (payload.videoUrl || '').trim();
  const videoId = (payload.videoId || '').trim();
  const title = (payload.title || '').trim();
  const submittedBy = (payload.submittedBy || '').trim();
  const discordName = (payload.discordName || '').trim();

  if (!videoUrl || !videoId || !title || !submittedBy) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required fields' })
    };
  }

  const submitterLine = discordName
    ? `Submitted by: ${submittedBy} (${discordName})`
    : `Submitted by: ${submittedBy}`;

  const content = `New highlight submission received. React or handle in this channel to approve.`;

  const discordPayload = {
    content,
    embeds: [
      {
        title: title,
        description: `${submitterLine}\nYouTube: ${videoUrl}`,
        fields: [
          { name: 'Video ID', value: videoId, inline: true }
        ]
      }
    ]
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discordPayload)
    });

    if (!res.ok) {
      return {
        statusCode: 502,
        body: JSON.stringify({ error: 'Failed to notify Discord' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Unexpected error' })
    };
  }
}

