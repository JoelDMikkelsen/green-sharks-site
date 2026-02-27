// Netlify Function: discord-interaction
// Handles incoming Discord Interaction webhooks (button clicks).
// This is the SYNCHRONOUS front-end that instantly replies to Discord to prevent the 3s timeout.

const nacl = require('tweetnacl');

// Helper to verify Discord signature
function verifySignature(event, publicKey) {
  const signature = event.headers['x-signature-ed25519'];
  const timestamp = event.headers['x-signature-timestamp'];
  const body = event.body;

  if (!signature || !timestamp || !body) return false;

  try {
    return nacl.sign.detached.verify(
      Buffer.from(timestamp + body),
      Buffer.from(signature, 'hex'),
      Buffer.from(publicKey, 'hex')
    );
  } catch (err) {
    return false;
  }
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const publicKey = process.env.DISCORD_PUBLIC_KEY;
  if (!publicKey) {
    console.error('DISCORD_PUBLIC_KEY is not configured');
    return { statusCode: 500, body: 'Internal Server Error' };
  }

  // 1. Verify Request Signature
  if (!verifySignature(event, publicKey)) {
    return { statusCode: 401, body: 'Invalid request signature' };
  }

  const payload = JSON.parse(event.body);

  // 2. Handle Discord PING validation
  if (payload.type === 1) {
    return {
      statusCode: 200,
      body: JSON.stringify({ type: 1 })
    };
  }

  // 3. Handle Message Component Interactions (Button clicks)
  if (payload.type === 3) {
    const customId = payload.data.custom_id;

    if (customId.startsWith('approve_highlight:')) {
      const appId = process.env.DISCORD_APP_ID;

      if (!appId) {
        console.error('DISCORD_APP_ID is not configured');
        return {
          statusCode: 200,
          body: JSON.stringify({
            type: 4,
            data: { content: '❌ Setup incomplete. `DISCORD_APP_ID` is missing in Netlify.', flags: 64 }
          })
        };
      }

      // We must immediately return a Type 5 (DEFERRED_UPDATE_MESSAGE) to Discord
      // so it doesn't time out while we do the GitHub commit.
      // Netlify will run our secondary background function concurrently using its URL.
      // Easiest cross-function trigger: HTTP POST to our own background function endpoint.

      // Depending on local dev vs production. Netlify's host header can sometimes be weird.
      // If deployed, we should preferably use the clean green-sharks.com URL or the raw host.
      const host = event.headers.host;
      const protocol = host.includes('localhost') ? 'http' : 'https';
      // Fallback to the production domain if host is missing for some reason
      const siteUrl = host ? `${protocol}://${host}` : 'https://green-sharks.com';
      const backgroundUrl = `${siteUrl}/.netlify/functions/discord-interaction-background`;

      // Dispatch the heavy lifting to the background function.
      // We must AWAIT this fetch just long enough for the network request to leave the Netlify container,
      // but NOT long enough to wait for the background function to finish.
      // Actually, Netlify background functions return a 202 Accepted immediately. So we CAN await it!
      try {
        await fetch(backgroundUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        console.log("Successfully triggered background function at:", backgroundUrl);
      } catch (err) {
        console.error("Error triggering background function:", err);
      }

      // 4. Respond to Discord IMMEDIATELY: Type 7 (UPDATE_MESSAGE)
      // This edits the message instantly to a "loading" state, fully satisfying the 3-second rule.
      return {
        statusCode: 200,
        body: JSON.stringify({
          type: 7,
          data: {
            content: `⏳ **Processing...** Please wait while ${adminName}'s approval is committed to GitHub.`,
            components: [] // Removes the button immediately so no one else can click it
          }
        })
      };
    }
  }

  // Fallback for unknown interaction types
  return {
    statusCode: 200,
    body: JSON.stringify({ type: 4, data: { content: 'Unknown interaction command' } })
  };
};
