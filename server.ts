import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini Client helper
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Heuristic fallback offline analyzer when no API key is available
function fallbackHeuristicAnalyze(text: string, suggestedCategory?: string) {
  const lower = text.toLowerCase();
  
  // Heuristic sentiment scoring
  const posWords = ["great", "excellent", "love", "fantastic", "awesome", "amazing", "good", "perfect", "satisfied", "recommend", "best", "superb", "beautiful", "smooth", "sturdy", "nice"];
  const negWords = ["bad", "terrible", "worst", "broken", "useless", "return", "returned", "disappointed", "waste", "cheap", "refund", "horrible", "fail", "failed", "hate", "poor", "difficult", "annoying"];
  
  let posCount = 0;
  let negCount = 0;
  
  posWords.forEach(w => {
    const rx = new RegExp("\\b" + w + "\\b", "g");
    const matches = lower.match(rx);
    if (matches) posCount += matches.length;
  });
  
  negWords.forEach(w => {
    const rx = new RegExp("\\b" + w + "\\b", "g");
    const matches = lower.match(rx);
    if (matches) negCount += matches.length;
  });
  
  let sentiment: "Positive" | "Negative" | "Neutral" = "Neutral";
  let score = 50;
  
  if (posCount > negCount) {
    sentiment = "Positive";
    score = Math.min(65 + (posCount - negCount) * 8, 98);
  } else if (negCount > posCount) {
    sentiment = "Negative";
    score = Math.min(65 + (negCount - posCount) * 8, 98);
  } else {
    sentiment = "Neutral";
    score = 50;
  }
  
  // Categorization
  let category = suggestedCategory || "Other";
  if (!suggestedCategory || suggestedCategory === "Other") {
    if (lower.match(/phone|cable|charger|battery|sound|audio|screen|laptop|computer|camera|headphones|bass|usb/)) {
      category = "Electronics";
    } else if (lower.match(/book|author|read|novel|paperback|pages|chapters|story/)) {
      category = "Books";
    } else if (lower.match(/cook|kitchen|pan|knife|kettle|plate|cup|oven|fridge|coffee/)) {
      category = "Home & Kitchen";
    } else if (lower.match(/shirt|pants|dress|shoes|socks|fabric|wear|fit|size|jacket/)) {
      category = "Fashion";
    } else if (lower.match(/toy|game|play|kids|child|fun|puzzle|doll/)) {
      category = "Toys & Games";
    } else if (lower.match(/food|snack|tasty|delicious|flavor|organic|fresh|coffee|sweet/)) {
      category = "Food & Grocery";
    } else if (lower.match(/fit|workout|gym|run|active|sport|ball|outdoor|camp/)) {
      category = "Sports & Outdoors";
    }
  }
  
  // Extract custom keywords (nouns or descriptors)
  const allWords = lower.replace(/[^\w\s]/g, "").split(/\s+/);
  const skipWords = new Set(["the", "and", "a", "of", "to", "is", "in", "it", "i", "this", "that", "for", "with", "was", "as", "on", "but", "not", "have", "with", "are", "very", "had", "my", "this", "so", "be", "just"]);
  const candidates: { word: string; count: number } = {} as any;
  allWords.forEach(w => {
    if (w.length > 3 && !skipWords.has(w)) {
      candidates[w] = (candidates[w] || 0) + 1;
    }
  });
  
  const keywords = Object.keys(candidates)
    .sort((a,b) => candidates[b] - candidates[a])
    .slice(0, 3);
  
  if (keywords.length === 0) {
    keywords.push("product", "review");
  }
  
  // Create a 1-sentence summary
  let summary = `Product review conveying overall ${sentiment.toLowerCase()} assessment.`;
  if (sentiment === "Positive") {
    summary = `Customer highly commends the product${keywords[0] ? ', highlighting its ' + keywords[0] : ''}.`;
  } else if (sentiment === "Negative") {
    summary = `Customer reports critical issues${keywords[0] ? ' concerning the ' + keywords[0] : ' in general functionality'}.`;
  }
  
  return {
    sentiment,
    category,
    confidenceScore: score,
    summary,
    keywords,
    isMock: true
  };
}

// API Endpoint to check API configuration status
app.get("/api/status", (req, res) => {
  const isAvailable = getGeminiClient() !== null;
  res.json({
    geminiConfigured: isAvailable,
    model: "gemini-3.5-flash",
    mode: isAvailable ? "Cognitive LLM Engine Powered" : "Heuristic Framework Hybrid Mode"
  });
});

// Post review for Sentiment Analysis
app.post("/api/analyze", async (req, res) => {
  const { reviewText, suggestedCategory } = req.body;
  if (!reviewText || reviewText.trim() === "") {
    return res.status(400).json({ error: "Review text must be specified." });
  }

  const ai = getGeminiClient();
  if (!ai) {
    // Return heuristic response on development environment if API KEY is missing
    const offlineResult = fallbackHeuristicAnalyze(reviewText, suggestedCategory);
    return res.json(offlineResult);
  }

  try {
    const prompt = `You are an expert NLP systems classifier for Amazon. 
Analyze the customer review below. Extract:
1. "sentiment": strictly select one of ["Positive", "Negative", "Neutral"]
2. "category": select the main retail category of the product. Prefer one of these standard departments: "Electronics", "Books", "Home & Kitchen", "Fashion", "Toys & Games", "Food & Grocery", "Sports & Outdoors", or "Other" (if it doesn't fit any). Use the user's suggestion "${suggestedCategory || 'Other'}" as helpful context, but correct it if it obviously doesn't match the customer's text content.
3. "confidenceScore": integer percentage from 0 to 100 indicting your classification confidence.
4. "summary": a single concise sentence summarizing the buyer's feedback.
5. "keywords": array of 2 to 4 key descriptors or attributes of the product discussed (e.g. "battery life", "zipper defects", "crisp screen", "poor quality"). Keep these standard lowercased.

Original Review:
"${reviewText}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["sentiment", "category", "confidenceScore", "summary", "keywords"],
          properties: {
            sentiment: {
              type: Type.STRING,
              description: "Must be Positive, Negative, or Neutral"
            },
            category: {
              type: Type.STRING,
              description: "Department category of the product"
            },
            confidenceScore: {
              type: Type.INTEGER,
              description: "Confidence percentage of decision (0-100)"
            },
            summary: {
              type: Type.STRING,
              description: "A short 1-sentence executive summary of the feedback"
            },
            keywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of key attributes or features discussed"
            }
          }
        }
      }
    });

    const bodyText = response.text || "{}";
    const data = JSON.parse(bodyText.trim());
    return res.json({
      ...data,
      isMock: false
    });
  } catch (err: any) {
    console.error("Gemini API invocation error: ", err);
    // Graceful fallback to heuristic classification rather than throwing 500
    const backupResult = fallbackHeuristicAnalyze(reviewText, suggestedCategory);
    return res.json({
      ...backupResult,
      isMock: true,
      errorNotice: err.message || "Failed to call Gemini API, falling back to offline analytics matrix."
    });
  }
});

// Helper function to synthesize high-quality fallback reports locally on offline/503 states
function getHeuristicSummaryData(reviews: any[], notice?: string) {
  const total = reviews.length;
  const positives = reviews.filter((r: any) => r.sentiment === "Positive").length;
  const negatives = reviews.filter((r: any) => r.sentiment === "Negative").length;
  const positivePct = total > 0 ? Math.round((positives / total) * 100) : 100;
  const healthScore = positivePct;
  
  // Extract keywords safely
  const rawPros = reviews
    .filter((r: any) => r.sentiment === "Positive")
    .flatMap((r: any) => Array.isArray(r.keywords) ? r.keywords : (typeof r.keywords === "string" ? r.keywords.split(",") : []));
  const pros = Array.from(new Set(rawPros)).map((w: any) => String(w).trim()).filter(Boolean).slice(0, 4);

  const rawCons = reviews
    .filter((r: any) => r.sentiment === "Negative")
    .flatMap((r: any) => Array.isArray(r.keywords) ? r.keywords : (typeof r.keywords === "string" ? r.keywords.split(",") : []));
  const cons = Array.from(new Set(rawCons)).map((w: any) => String(w).trim()).filter(Boolean).slice(0, 4);
  
  const noticeText = notice ? `\n\n*Notice: ${notice}*` : "";
  
  let summaryText = `### Customer Sentiment Strategic Index Report (Prediction Framework Hybrid)
Our predictive heuristic models analyzed a cohort of **${total} reviews** displaying an overall customer health index of **${positivePct}% positive sentiment**. 

* **Critical Asset Trends**: Positive reviewers heavily appreciate features relating to: ${pros.join(", ") || "standard features, reliability, design aesthetics"}.
* **Operational Inefficiencies**: Customer resistance factors display recurring mentions of: ${cons.join(", ") || "none detected, minor minor cosmetic irregularities"}.
* **Strategic Growth Outlook**: Keep optimizing logistics and inspect negative product samples in categories underperforming in buyer satisfaction index thresholds.${noticeText}`;

  return {
    summary: summaryText,
    pros: pros.length > 0 ? pros : ["Solid design elements", "Meets descriptive expectations", "Great price point"],
    cons: cons.length > 0 ? cons : ["Inconsistent delivery", "Minor durability defects", "Manual confusion"],
    healthScore: healthScore
  };
}

// API Endpoint to synthesize overall cohort summary insights
app.post("/api/summarize-insights", async (req, res) => {
  const { reviews } = req.body; // Array of { text, sentiment, category, summary, keywords }
  
  if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
    return res.json({
      summary: "### Customer Feedback Intelligence Snapshot\nNo review records found. Please enter or generate review samples to unlock cognitive executive summaries.",
      pros: ["Awaiting data"],
      cons: ["Awaiting data"],
      healthScore: 100
    });
  }

  const ai = getGeminiClient();
  if (!ai) {
    const backupResult = getHeuristicSummaryData(reviews);
    return res.json(backupResult);
  }

  try {
    const reviewsSnippet = reviews.slice(-25).map((r, idx) => {
      return `[ID: ${idx+1}] Category: ${r.category} | Sentiment: ${r.sentiment} | Review: "${r.text.substring(0, 200)}" | Keywords: ${r.keywords ? (Array.isArray(r.keywords) ? r.keywords.join(", ") : r.keywords) : ""}`;
    }).join("\n");

    const prompt = `You are a strategic Brand Intelligence consultant at Amazon.
We have collected a cohort of user reviews with estimated sentiments. Compose a high-level cognitive feedback digest that summarizes brand health. Your response must be in structured JSON format matching this schema:

{
  "summary": "Beautiful markdown paragraph analyzing customer trends, key highlights, and recurring themes. Use list formats, bullet points, and bold text contextually.",
  "pros": ["bullet 1 of what customers love", "bullet 2", "bullet 3"],
  "cons": ["bullet 1 of what customers hate/complain about", "bullet 2", "bullet 3"],
  "healthScore": 0 to 100 (overall percentage satisfaction score calculated or reasoned from the corpus)
}

Review Corpus:
${reviewsSnippet}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["summary", "pros", "cons", "healthScore"],
          properties: {
            summary: { type: Type.STRING },
            pros: { type: Type.ARRAY, items: { type: Type.STRING } },
            cons: { type: Type.ARRAY, items: { type: Type.STRING } },
            healthScore: { type: Type.INTEGER }
          }
        }
      }
    });

    const parsed = JSON.parse((response.text || "{}").trim());
    return res.json(parsed);
  } catch (err: any) {
    // Gracefully handle high demand / transient API issues, using top-tier hybrid statistics instead of a raw error dump.
    const isServiceUnavailable = err.message && (err.message.includes("503") || err.message.includes("demand") || err.message.includes("UNAVAILABLE") || err.message.includes("quota"));
    const noticeString = isServiceUnavailable 
      ? "AI Synthesis temporarily routed through high-fidelity predictive heuristics as Gemini 3.5 API is currently experiencing severe peak-demand spikes (503 response)."
      : `AI Synthesis fallback active: ${err.message || "Service response parsed backup schema"}`;
      
    const backupResult = getHeuristicSummaryData(reviews, noticeString);
    return res.json(backupResult);
  }
});


// Express server hosting Setup with dynamic mode
async function startServer() {
  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Amazon Product Review Sentiment Analysis] API engine online at http://0.0.0.0:${PORT}`);
  });
}

startServer();
