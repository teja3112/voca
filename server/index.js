import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/api/analyze' && req.method === 'POST') {
    if (!GEMINI_API_KEY) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: "No API key configured on server." }));
      return;
    }

    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { transcript, topicTitle, difficulty, targetSpeakingTime, actualSpeakingTime } = JSON.parse(body);
        
        if (!transcript || transcript.trim() === '') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: "Transcript is required" }));
          return;
        }

        const prompt = `You are VOCA, an expert English speaking coach.
Evaluate the user's actual spoken response strictly against the selected topic.

SELECTED TOPIC: "${topicTitle}"
DIFFICULTY LEVEL: "${difficulty}"
TARGET SPEAKING TIME: ${targetSpeakingTime} seconds
ACTUAL SPEAKING TIME: ${actualSpeakingTime} seconds

=========================================
DURATION AWARENESS RULE
=========================================
You must evaluate whether the response was sufficiently developed for the target duration.
- Very close to target duration + well-developed response -> no meaningful penalty.
- Moderately shorter than target -> moderate reduction in Development and Overall Score.
- Significantly shorter than target -> noticeable reduction in Development and Overall Score.
- Extremely short response -> significant reduction in Development and Overall Score.

IMPORTANT: Do NOT lower Language scores (Grammar, Vocabulary, Fluency, Clarity) just because the user stopped early. Duration ONLY affects Content Development and Overall Score. Do NOT reward meaningless filler. Quality and relevance still matter.

USER TRANSCRIPT:
"""
${transcript}
"""

=========================================
STRICT TOPIC ADHERENCE RULE
=========================================
You must determine: "Did the user actually answer the selected topic?"
The evaluation must distinguish between:
A. ON TOPIC: The response directly discusses the selected topic and develops relevant ideas.
B. PARTIALLY ON TOPIC: The response starts with the topic but spends significant time discussing unrelated ideas.
C. OFF TOPIC: The response does not meaningfully answer the selected topic.

Topic relevance MUST affect the Relevance and Development scores significantly.
DO NOT REWARD OFF-TOPIC FLUENT SPEECH.
If the English is grammatically excellent but off-topic, give HIGH Language scores (Grammar, Vocabulary, Fluency, Clarity) but LOW Content scores (Relevance, Development), resulting in a reduced Overall Score. Do not artificially lower Language scores just because the content is off-topic.

=========================================
TOPIC-SPECIFIC CONTENT EVALUATION
=========================================
Feedback MUST reference the actual topic and transcript. Do not give generic feedback.
- Relevance: Does the response answer THIS exact topic?
- Structure: Is the response organized around THIS topic?
- Development: Does the user develop ideas related to THIS topic?

=========================================
DIFFICULTY AWARENESS
=========================================
- Beginner: Judge whether the user can communicate relevant ideas about the topic using understandable basic English. Do not expect advanced argumentation.
- Intermediate: Expect clearer opinions, explanations, examples, and better development of the selected topic.
- Advanced: Expect nuanced ideas, stronger reasoning, precision, examples, counterpoints where appropriate, and deeper development of the exact topic.

=========================================
STRICT NO-INVENTION RULE
=========================================
ONLY evaluate what is actually present in the transcript.
NEVER invent:
- arguments the user did not make
- examples the user did not give
- grammar mistakes that do not exist
- vocabulary problems that do not exist
- topic points the user did not discuss
If there is insufficient evidence (e.g. very short response), say so. Do not pretend there is enough evidence to evaluate development deeply.

=========================================
RESULTS DATA SCHEMA
=========================================
Return the analysis STRICTLY as a valid JSON object matching this schema exactly:
{
  "overallScore": number (0-100),
  "scores": {
    "fluency": number (0-100),
    "grammar": number (0-100),
    "vocabulary": number (0-100),
    "clarity": number (0-100),
    "relevance": number (0-100),
    "structure": number (0-100),
    "development": number (0-100)
  },
  "summary": "A concise, specific summary based on the actual response and its relevance to the topic.",
  "strengths": [ "Specific strength from the response." ],
  "improvements": [
    {
      "category": "relevance",
      "title": "Short title",
      "description": "Specific explanation based on the response."
    }
  ],
  "grammarCorrections": [
    {
      "original": "Actual sentence from transcript",
      "corrected": "Corrected sentence",
      "explanation": "Short explanation"
    }
  ],
  "vocabularyUpgrades": [
    {
      "original": "Actual phrase",
      "better": "Improved phrase",
      "reason": "Why the alternative is stronger"
    }
  ]
}

Ensure the output is ONLY valid JSON, with no markdown formatting. Do not include nextChallenge.`;

        console.log("Calling Gemini API...");
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              response_mime_type: "application/json"
            }
          })
        });

        if (!response.ok) {
          const errData = await response.text();
          res.writeHead(response.status, { 'Content-Type': 'application/json' });
          console.log("Error from Gemini:", errData);
          res.end(JSON.stringify({ error: `Gemini API error: ${response.statusText} - ${errData}` }));
          return;
        }

        const data = await response.json();
        
        let rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) {
          throw new Error("Invalid response format from Gemini");
        }

        let result;
        try {
          result = JSON.parse(rawText);
        } catch {
          throw new Error("Failed to parse JSON from Gemini");
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Serve static frontend for production
  const distPath = path.join(__dirname, '../dist');
  const filePath = req.url === '/' ? '/index.html' : req.url;
  const fullPath = path.join(distPath, filePath);
  
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    let contentType = 'text/plain';
    if (fullPath.endsWith('.html')) contentType = 'text/html';
    else if (fullPath.endsWith('.js')) contentType = 'application/javascript';
    else if (fullPath.endsWith('.css')) contentType = 'text/css';
    else if (fullPath.endsWith('.svg')) contentType = 'image/svg+xml';
    
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(fullPath).pipe(res);
  } else {
    // SPA fallback
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      fs.createReadStream(indexPath).pipe(res);
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on port ${PORT}`);
});
