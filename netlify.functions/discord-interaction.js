// Netlify Function: discord-interaction
// Handles incoming Discord Interaction webhooks (button clicks).

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
  // Type 1 is a PING from Discord to verify the endpoint
  if (payload.type === 1) {
    return {
      statusCode: 200,
      body: JSON.stringify({ type: 1 })
    };
  }

  // 3. Handle Message Component Interactions (Button clicks)
  // Type 3 is a MESSAGE_COMPONENT interaction
  if (payload.type === 3) {
    const customId = payload.data.custom_id; // e.g., 'approve_highlight:8b0YPFNnZbE'
    const member = payload.member;
    const adminName = member.nick || member.user.username;

    if (customId.startsWith('approve_highlight:')) {
      const videoId = customId.split(':')[1];

      // Extract the title from the embed
      let videoTitle = 'Approved Highlight';
      if (payload.message && payload.message.embeds && payload.message.embeds.length > 0) {
        videoTitle = payload.message.embeds[0].title || videoTitle;
      }

      // --- GitHub API Integration ---
      const githubToken = process.env.GITHUB_TOKEN;
      // You must set GITHUB_REPO in Netlify env vars, format: "owner/repo"
      const githubRepo = process.env.GITHUB_REPO;

      if (!githubToken || !githubRepo) {
        console.error('GitHub config missing');
        // Acknowledge the interaction but report error in message
        return {
          statusCode: 200,
          body: JSON.stringify({
            type: 4,
            data: {
              content: "❌ Setup incomplete. `GITHUB_TOKEN` or `GITHUB_REPO` is missing in Netlify.",
              flags: 64 // Ephemeral (only visible to the user who clicked)
            }
          })
        };
      }

      try {
        const branch = 'master'; // Returned back to master since remote is also master
        const filePath = 'data/videos.json';
        const apiUrl = `https://api.github.com/repos/${githubRepo}/contents/${filePath}?ref=${branch}`;

        // Get current file
        const getRes = await fetch(apiUrl, {
          headers: {
            'Authorization': `token ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });

        if (!getRes.ok) {
          throw new Error(`Failed to fetch file: ${getRes.statusText}`);
        }

        const currentFileData = await getRes.json();
        const contentStr = Buffer.from(currentFileData.content, 'base64').toString('utf8');
        let videosData = JSON.parse(contentStr);

        // Define the new video object
        const newVideo = {
          id: videoId,
          title: videoTitle
        };

        // Prepend to the array
        if (videosData.videos) {
          videosData.videos.unshift(newVideo);
        } else if (Array.isArray(videosData)) {
          videosData.unshift(newVideo);
        }

        // Commit updated file
        const newContentB64 = Buffer.from(JSON.stringify(videosData, null, 2)).toString('base64');
        const updateUrl = `https://api.github.com/repos/${githubRepo}/contents/${filePath}`;

        const putRes = await fetch(updateUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `token ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: `Auto-approve highlight: ${videoTitle} (${videoId}) by ${adminName}`,
            content: newContentB64,
            sha: currentFileData.sha,
            branch: branch
          })
        });

        if (!putRes.ok) {
          throw new Error(`Failed to commit file: ${putRes.statusText}`);
        }

        // 4. Respond to Discord: Update the original message
        // Type 7: UPDATE_MESSAGE
        return {
          statusCode: 200,
          body: JSON.stringify({
            type: 7,
            data: {
              content: `✅ **Approved by ${adminName}**. The site is rebuilding with the new highlight.`,
              components: [] // Removes the buttons
            }
          })
        };

      } catch (error) {
        console.error('GitHub API Error:', error);
        return {
          statusCode: 200,
          body: JSON.stringify({
            type: 4,
            data: {
              content: `❌ Failed to update GitHub: ${error.message}`,
              flags: 64
            }
          })
        };
      }
    }
  }

  // Fallback for unknown interaction types
  return {
    statusCode: 200,
    body: JSON.stringify({ type: 4, data: { content: 'Unknown interaction command' } })
  };
};
