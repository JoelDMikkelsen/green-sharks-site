# Overkill Technical Features Pipeline

This document serves as a backlog for highly complex, technically impressive "overkill" features that can be implemented on the Green Sharks static site to showcase backend and AI capabilities while preserving the frontend performance.

Since we are running a completely static frontend on Netlify, all of these features rely on **Netlify Functions** acting as serverless middle-men, often connecting to the OpenAI API or other external services.

---

## 1. The "AI Drill Instructor" (Semantic FAQ & Rules Search)
**The Concept:**
Instead of reading a static rules or FAQ page, users can type natural language questions into a terminal-styled interface: *"Hey, can I drop a 500lb bomb on the FOB?"* or *"What happens if I take a jet without asking?"*

**The Architecture:**
*   A Netlify function receives the user's query.
*   **RAG (Retrieval-Augmented Generation)**: The function's system prompt is injected with the exact text of the `rules` and `operations` sections to provide factual grounding.
*   OpenAI responds based *strictly* on our rules, but formatted in the persona of a grumpy Arma 3 Drill Instructor or a stressed-out RTO.
*   *Implementation challenges:* Prompt engineering to prevent hallucinations, managing OpenAI latency in serverless environments, and building an immersive, responsive terminal UI on the frontend.

## 2. Auto-Generated "Declassified After-Action Reports (AARs)"
**The Concept:**
A dedicated page where Zeus mission makers or players can dump raw, messy, bullet-pointed lists of what happened during an op (e.g., *"Helo crashed in LZ, we got surrounded by VC, JohnWick called in danger close CAS, we survived but lost 3 guys"*). The site returns a beautifully formatted, highly immersive military "Declassified Intel Report."

**The Architecture:**
*   User submits raw text via a form.
*   A Netlify function sends the text to OpenAI with a strict prompt to transform it into formal military intelligence documentation.
*   The AI generates a Markdown payload integrating redacted keywords, fabricated grid coordinates, and proper formatting.
*   The frontend renders this styled like a dilapidated CIA dossier.
*   *Extension:* Add a hook to automatically post the stylized AAR payload directly into the Discord `#after-action-reports` channel.

## 3. Automated Highlight Video Summarization
**The Concept:**
Enhance the existing video highlight submission flow. When a user submits a YouTube link, the system autonomously understands the video context before an admin even reviews it.

**The Architecture:**
*   Upon submission, the Netlify function pings a YouTube transcript API (or an npm package that scrapes auto-generated captions).
*   The transcript data is fed to OpenAI to generate a concise "Tactical Summary" (e.g., *"This video features a 4-minute firefight, heavy use of CAS, and frantic medical coordination."*).
*   The automated Discord approval message is augmented with this AI-generated summary, saving admins time during the review process.
*   *Implementation challenges:* Bypassing or handling YouTube API restrictions/scraping correctly in a serverless function, and dealing with token limits on long video transcripts by chunking.

## 4. Interactive "Live Intel" Map with AI Audio Responses
**The Concept:**
An interactive web map of popular Arma terrains (e.g., Cam Lao Nam or Altis). Clicking on a map sector generates a real-time, dynamic status report.

**The Architecture:**
*   Frontend utilizes a web map library (like Leaflet.js) to render custom high-res images of Arma maps.
*   Clicking a coordinate pings a Netlify function, asking OpenAI to generate a short, 2-sentence SITREP (Situation Report) based on the visual terrain type at that coordinate (e.g., *"Deep jungle canopy. Suspected enemy movement. Proceed with extreme caution."*).
*   The function takes the generated text and pipes it into the **OpenAI TTS (Text-to-Speech) API** using a fitting voice model.
*   It returns the binary audio buffer, which the browser automatically plays with a client-side Web Audio API "radio crackle / squelch" sound effect filter applied.
