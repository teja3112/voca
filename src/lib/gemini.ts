import type { AnalysisResult } from "./types"

export async function analyzeTranscript(
  transcript: string,
  topic: string,
  difficulty: string,
  targetSpeakingTime: number,
  actualSpeakingTime: number
): Promise<AnalysisResult> {
  let response: Response;
  try {
    response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript, topicTitle: topic, difficulty, targetSpeakingTime, actualSpeakingTime }),
    });
  } catch {
    throw new Error(
      "Couldn't reach the server — check your internet connection and try again."
    );
  }

  if (!response.ok) {
    let err = "";
    try {
      const errData = await response.json();
      err = errData.error;
    } catch {
      err = await response.text().catch(() => "");
    }
    throw new Error(err || `Server error (${response.status})`);
  }

  let parsed: any;
  try {
    parsed = await response.json();
  } catch {
    throw new Error("Server returned an invalid response. Please try again.");
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error("Analysis failed: Invalid JSON structure from AI.");
  }
  
  if (typeof parsed.overallScore !== 'number' || parsed.overallScore < 0 || parsed.overallScore > 100) {
    throw new Error("Analysis failed: Missing or invalid overall score.");
  }
  
  const requiredScores = ['fluency', 'grammar', 'vocabulary', 'clarity', 'relevance', 'structure', 'development'];
  if (!parsed.scores || typeof parsed.scores !== 'object') {
    throw new Error("Analysis failed: Missing scores block.");
  }
  
  for (const key of requiredScores) {
    const val = parsed.scores[key];
    if (typeof val !== 'number' || val < 0 || val > 100) {
      throw new Error(`Analysis failed: Invalid score for ${key}.`);
    }
  }

  if (!Array.isArray(parsed.strengths) || !Array.isArray(parsed.improvements) || !Array.isArray(parsed.grammarCorrections) || !Array.isArray(parsed.vocabularyUpgrades)) {
    throw new Error("Analysis failed: Invalid feedback format.");
  }

  return parsed as AnalysisResult;
}
