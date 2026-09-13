import fs from 'fs';

const API_KEY = process.env.GEMINI_API_KEY;

async function generate(difficulty, count) {
  const prompt = `Generate exactly ${count} English speaking practice topics for ${difficulty} level ESL students.
Return a valid JSON array of objects.
Each object MUST have:
- "id": a unique slug (e.g. "${difficulty}-topic-number-etc")
- "title": A short catchy title
- "difficulty": "${difficulty}"
- "thinkAbout": array of 3-4 specific guiding questions to help brainstorm.
- "include": array of 2-3 specific things to try to include in their answer.
- "challenge": a single specific speaking challenge appropriate for ${difficulty}.

Output ONLY the JSON array.`;

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, response_mime_type: "application/json" }
    })
  });
  
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  
  const text = data.candidates[0].content.parts[0].text;
  return JSON.parse(text);
}

async function main() {
  const all = [];
  for (const diff of ["beginner", "intermediate", "advanced"]) {
    console.log(`Generating ${diff}...`);
    for (let i = 0; i < 5; i++) {
       console.log(` Batch ${i+1}/5`);
       const batch = await generate(diff, 20);
       all.push(...batch);
    }
  }
  
  const tsContent = `import type { Topic, Difficulty } from "./types"

export const TOPICS: Topic[] = ${JSON.stringify(all, null, 2)}

export function pickTopic(
  difficulty: Difficulty,
  recentIds: string[] = [],
  forceId?: string
): Topic {
  if (forceId) {
    const found = TOPICS.find((t) => t.id === forceId)
    if (found) return found
  }

  const pool = TOPICS.filter((t) => t.difficulty === difficulty)

  let available = pool.filter((t) => !recentIds.includes(t.id))
  if (available.length === 0) {
    available = pool
  }

  const selected = available[Math.floor(Math.random() * available.length)]
  return selected
}
`;
  
  fs.writeFileSync('src/lib/topics.ts', tsContent);
  console.log("Done! Generated 300 topics.");
}

main().catch(console.error);
