// Netlify Background Function: discord-interaction-background
// This process handles the heavy lifting (GitHub commit) which takes >3s.
// It receives a POST from our sync function and then patches the Discord message.

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (err) {
    return { statusCode: 400, body: 'Invalid JSON' };
  }
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

    // We need DISCORD_APP_ID to send the follow-up request
    const appId = process.env.DISCORD_APP_ID;
    const interactionToken = payload.token;

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

    // --- GitHub API Integration ---
    const githubToken = process.env.GITHUB_TOKEN;
    const githubRepo = process.env.GITHUB_REPO;

    if (!githubToken || !githubRepo) {
      console.error('GitHub config missing');
      // Acknowledge the interaction but report error in message
      return {
        statusCode: 200,
        body: JSON.stringify({
          type: 4,
          data: { content: "❌ Setup incomplete. `GITHUB_TOKEN` or `GITHUB_REPO` is missing in Netlify.", flags: 64 }
        })
      };
    }

    // Since Netlify Functions (sync) close immediately after returning the response, 
    // we must run the GitHub commit logic, and then return the response? No, wait.
    // Actually, standard AWS Lambda/Netlify background execution requires returning a promise or async payload.
    // Netlify Background Functions (xyz-background.js) allow immediate return, but sync functions don't.
    //
    // For a standard sync function: We can't return Type 5 immediately and then continue running code 
    // after the return statement! 
    // 
    // We will perform the GitHub operations, BUT to avoid the 3s timeout causing Discord to show "failed"
    // to the user, we have two options:
    // Option 1: Use a Netlify Background Function (rename file to discord-interaction-background.js)
    // Option 2: Optimize GitHub API calls to take < 3s. 
    //
    // Because we must respond to the HTTP request within 3s for Discord, BUT Netlify sync functions end
    // as soon as we respond, we actually MUST use the `fetch` API without awaiting it *if* we wanted to fire-and-forget,
    // but Node/Netlify might kill the fetch on return.
    // 
    // LET'S TRY: Execute the GitHub API calls as fast as possible. If it fails the 3s window, 
    // the true fix requires a Background Function or an external queue.

    console.log(`Starting GitHub commit for video: ${videoId}`);

    try {
      const branch = 'master';
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

      const newVideo = {
        id: videoId,
        title: videoTitle,
        date: new Date().toISOString()
      };

      if (videosData.videos) {
        videosData.videos.unshift(newVideo);
      } else if (Array.isArray(videosData)) {
        videosData.unshift(newVideo);
      }

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

      console.log(`Successfully committed to GitHub. Patching Discord message.`);

      // 4. Update the original Discord message
      const patchUrl = `https://discord.com/api/v10/webhooks/${appId}/${interactionToken}/messages/@original`;
      const patchRes = await fetch(patchUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `✅ **Approved by ${adminName}**. The site is rebuilding with the new highlight.`,
          components: [] // Removes the buttons
        })
      });

      if (!patchRes.ok) {
        const errText = await patchRes.text();
        console.error('Discord PATCH Error:', errText);
      } else {
        console.log('Successfully patched Discord message.');
      }

      return { statusCode: 202, body: 'Done' };

    } catch (error) {
      console.error('GitHub API Error:', error);

      // Report error back to original Discord message
      const patchUrl = `https://discord.com/api/v10/webhooks/${appId}/${interactionToken}/messages/@original`;
      const errPatchRes = await fetch(patchUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `❌ Failed to update GitHub: ${error.message}`
        })
      });

      if (!errPatchRes.ok) {
        const errText = await errPatchRes.text();
        console.error('Discord Error PATCH failed:', errText);
      }

      return { statusCode: 202, body: 'Failed but reported' };
    }
  }

  return { statusCode: 202, body: 'Ignored' };
};
