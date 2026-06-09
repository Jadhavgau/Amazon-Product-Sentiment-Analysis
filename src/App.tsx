import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  BarChart3, 
  ThumbsUp, 
  ThumbsDown, 
  Percent, 
  Layers, 
  PlusCircle, 
  Trash2, 
  RefreshCw, 
  Database,
  Brain,
  Download,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  FileText,
  Bookmark,
  Activity,
  ArrowRight
} from "lucide-react";

// Standard review schema
interface Review {
  id: string;
  text: string;
  sentiment: "Positive" | "Negative" | "Neutral";
  category: string;
  confidenceScore: number;
  summary: string;
  keywords: string[];
  timestamp: string;
  isMock?: boolean;
}

// Pre-seeded high quality reviews for Amazon Product Review Sentiment Analysis presentation
const DEFAULT_REVIEWS: Review[] = [
  {
    id: "seed-1",
    text: "The audio clarity on this Echo Dot is phenomenal! Extremely easy setup and integrates with my home appliances instantly. Definitely worth the buy.",
    sentiment: "Positive",
    category: "Electronics",
    confidenceScore: 98,
    summary: "Customer evaluates the Echo Dot audio and integration as highly successful.",
    keywords: ["audio clarity", "easy setup", "appliances", "valuable"],
    timestamp: "2026-06-09 10:24",
    isMock: false
  },
  {
    id: "seed-2",
    text: "Worst charger ever. It heated up excessively within 10 minutes of plugging in, emitting a bad plasticky odor. Returning it for a refund immediately.",
    sentiment: "Negative",
    category: "Electronics",
    confidenceScore: 96,
    summary: "Critical hardware safety issues with an overheating power brick.",
    keywords: ["excessive heat", "bad odor", "refund", "charger defect"],
    timestamp: "2026-06-09 11:02",
    isMock: false
  },
  {
    id: "seed-3",
    text: "This tri-ply stainless steel pan cooks incredibly evenly and washes off like a breeze. Perfect heft and sturdy handle connection.",
    sentiment: "Positive",
    category: "Home & Kitchen",
    confidenceScore: 97,
    summary: "Highly satisfied review commending material strength and non-stick cleaning features.",
    keywords: ["cooks evenly", "washes off", "sturdy weight", "handle comfort"],
    timestamp: "2026-06-09 09:15",
    isMock: false
  },
  {
    id: "seed-4",
    text: "The pacing on this thriller was sluggish. Characters were cardboard cliches and the ending was completely predictable. Highly disappointed.",
    sentiment: "Negative",
    category: "Books",
    confidenceScore: 94,
    summary: "Disappointed reader cites poor narrative pace and clichéd subplots.",
    keywords: ["sluggish pace", "cliches", "predictable ending", "disappointed"],
    timestamp: "2026-06-08 14:40",
    isMock: false
  },
  {
    id: "seed-5",
    text: "The stitching fits correctly but the color looks a bit more faded in person than the item photos on Amazon. Decent for rough casual wear.",
    sentiment: "Neutral",
    category: "Fashion",
    confidenceScore: 88,
    summary: "Acceptable sizing matched with visual disappointment regarding color fidelity.",
    keywords: ["faded color", "correct fit", "casual wear", "rough clothing"],
    timestamp: "2026-06-08 16:11",
    isMock: false
  },
  {
    id: "seed-6",
    text: "Dangerous! The machine motor began sparking and smoking on the first high speed blend session. Had to unplug immediately.",
    sentiment: "Negative",
    category: "Home & Kitchen",
    confidenceScore: 99,
    summary: "Severe manufacturer hardware hazard reported during first startup.",
    keywords: ["motor defect", "sparking smoke", "unplug", "dangerous"],
    timestamp: "2026-06-08 08:31",
    isMock: false
  },
  {
    id: "seed-7",
    text: "Beautifully engineered building toys! The birchwood blocks are sanded smooth, lock safely, and kept my 4 year old busy for hours.",
    sentiment: "Positive",
    category: "Toys & Games",
    confidenceScore: 98,
    summary: "Parent praises wood smoothness, parts interlocking safety, and educational retention.",
    keywords: ["smooth wood", "interlocking lock", "child safe", "highly engaged"],
    timestamp: "2026-06-07 15:10",
    isMock: false
  },
  {
    id: "seed-8",
    text: "These running shoes are cloud-like! The mesh breathes beautifully, and the responsive arch support alleviated my shin splint pains completely.",
    sentiment: "Positive",
    category: "Sports & Outdoors",
    confidenceScore: 99,
    summary: "Professional recommendation noting ergonomic insoles and mesh thermal performance.",
    keywords: ["breathable mesh", "arch support", "ergonomic comfort", "shock absorb"],
    timestamp: "2026-06-07 10:18",
    isMock: false
  },
  {
    id: "seed-9",
    text: "Organic whole-bean coffee has a fantastic deep roast profile. Rich chocolate and hazelnut notes. I will subscribe to this monthly.",
    sentiment: "Positive",
    category: "Food & Grocery",
    confidenceScore: 95,
    summary: "Reviewer highly approves of deep roast accents and chocolate hints, committing to subscription.",
    keywords: ["fantastic roast", "chocolate hints", "fresh bean", "subscription"],
    timestamp: "2026-06-06 12:45",
    isMock: false
  },
  {
    id: "seed-10",
    text: "The mesh pocket zipper snapped shut and jammed on my very first jog. Rest of the hydration pack holds fluid comfortably though.",
    sentiment: "Neutral",
    category: "Sports & Outdoors",
    confidenceScore: 89,
    summary: "Solid fluid reservoir compromised by poor zipper hardware quality.",
    keywords: ["zipper jammed", "mesh pocket", "hydration backpack", "fine pack"],
    timestamp: "2026-06-06 14:12",
    isMock: false
  }
];

export default function App() {
  // --- Streamlit Session State Simulators ---
  const [reviews, setReviews] = useState<Review[]>(() => {
    const saved = localStorage.getItem("amazon_reviews_cohort");
    return saved ? JSON.parse(saved) : DEFAULT_REVIEWS;
  });

  const [apiStatus, setApiStatus] = useState<{
    geminiConfigured: boolean;
    model: string;
    mode: string;
  }>({
    geminiConfigured: false,
    model: "gemini-3.5-flash",
    mode: "Establishing connection..."
  });

  // Main UI form state
  const [newReviewText, setNewReviewText] = useState("");
  const [suggestedCategory, setSuggestedCategory] = useState("Electronics");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Dashboard overall smart synthesis state
  const [aiDigest, setAiDigest] = useState<{
    summary: string;
    pros: string[];
    cons: string[];
    healthScore: number;
  }>({
    summary: "",
    pros: [],
    cons: [],
    healthScore: 80
  });
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // Filters and search controls
  const [searchTerm, setSearchTerm] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  
  // UI views / notifications
  const [successMessage, setSuccessMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"dashboard" | "explorer" | "sample-generator">("dashboard");
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem("amazon_reviews_cohort", JSON.stringify(reviews));
  }, [reviews]);

  // Fetch API status on mount
  const checkApiStatus = async () => {
    try {
      const res = await fetch("/api/status");
      if (res.ok) {
        const data = await res.json();
        setApiStatus(data);
      }
    } catch (err) {
      console.warn("API status route unreachable:", err);
      setApiStatus({
        geminiConfigured: false,
        model: "gemini-3.5-flash",
        mode: "Heuristic Fallback Engine"
      });
    }
  };

  useEffect(() => {
    checkApiStatus();
  }, []);

  // Fetch AI Dynamic feedback summary upon mount or cohort size change
  const fetchAiSummaryDigest = async (overrideReviews?: Review[]) => {
    setIsSynthesizing(true);
    const reviewsToAnalyze = overrideReviews !== undefined ? overrideReviews : reviews;
    try {
      const simplified = reviewsToAnalyze.map(r => ({
        text: r.text,
        sentiment: r.sentiment,
        category: r.category,
        keywords: r.keywords
      }));

      const res = await fetch("/api/summarize-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviews: simplified })
      });

      if (res.ok) {
        const data = await res.json();
        setAiDigest(data);
      }
    } catch (err) {
      console.error("Failed to fetch abstract summarization:", err);
    } finally {
      setIsSynthesizing(false);
    }
  };

  useEffect(() => {
    fetchAiSummaryDigest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviews.length]);

  // Handle addition & classification of a single review
  const handleAnalyzeReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewText.trim()) return;

    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewText: newReviewText,
          suggestedCategory: suggestedCategory
        })
      });

      if (!res.ok) {
        throw new Error("Analysis failed. Operational issues on server.");
      }

      const report = await res.json();
      
      const newlyCreated: Review = {
        id: `rev-${Date.now()}`,
        text: newReviewText,
        sentiment: report.sentiment || "Neutral",
        category: report.category || suggestedCategory,
        confidenceScore: report.confidenceScore || 85,
        summary: report.summary || "Summary generation failure.",
        keywords: report.keywords || ["product feedback"],
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        isMock: report.isMock
      };

      setReviews(prev => [newlyCreated, ...prev]);
      setNewReviewText("");
      setSuccessMessage("Review analyzed & logged successfully!");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err: any) {
      alert("Error analyzing review: " + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Seeding realistic metrics batches
  const seedNewMockReviews = () => {
    const extraReviews: Review[] = [
      {
        id: `seed-ext-1-${Date.now()}`,
        text: "Incredible reading experience on my new Kindle. The matte display does not show glare, and the warm backlight reduces bedtime eye straining. Best purchase of 2026.",
        sentiment: "Positive",
        category: "Electronics",
        confidenceScore: 99,
        summary: "Excellent electronic display review highlighting screen comfort and backlights.",
        keywords: ["matte screen", "no glare", "warm backlight", "kindle experience"],
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
      },
      {
        id: `seed-ext-2-${Date.now()}`,
        text: "The pages literally fell out of the book cover binding on my third day. Horribly glued together by the publisher copy production. Unusable condition.",
        sentiment: "Negative",
        category: "Books",
        confidenceScore: 97,
        summary: "Structural publishing production defects reporting fragile glued binding.",
        keywords: ["pages fell out", "poor book binding", "glued packaging", "unusable"],
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
      },
      {
        id: `seed-ext-3-${Date.now()}`,
        text: "Very cute teddy plushie. Extra soft fleece fabric, but the size was slightly smaller than depicted in product mockups. My niece loves it anyway.",
        sentiment: "Positive",
        category: "Toys & Games",
        confidenceScore: 92,
        summary: "Affectionate kids plush toy review citing minor size variance compared to expectations.",
        keywords: ["soft fleece", "smaller dimension", "nieces toy", "plushie design"],
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
      },
      {
        id: `seed-ext-4-${Date.now()}`,
        text: "The Bluetooth on these swimming earbuds refuses to connect when submerged in water. It works ok poolside but completely drop out during standard laps.",
        sentiment: "Neutral",
        category: "Sports & Outdoors",
        confidenceScore: 90,
        summary: "Expected waterproof capability underperforms and drops signal under hydrostatic pressure.",
        keywords: ["earbud bluetooth", "hydro disconnect", "swimming drops", "decent poolside"],
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
      }
    ];

    setReviews(prev => [...extraReviews, ...prev]);
    setSuccessMessage("Successfully added 4 live customer review scenarios!");
    setTimeout(() => setSuccessMessage(""), 4500);
  };

  // Clear system cohorts databases
  const clearDatabaseCohort = () => {
    if (window.confirm("Are you sure you want to clear all active stored reviews from local Session State?")) {
      setReviews([]);
      setSuccessMessage("Session State wiped clean. Ready for new analytics.");
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  // Restore defaults
  const resetToFactoryDefaultData = () => {
    setReviews(DEFAULT_REVIEWS);
    setSuccessMessage("Restored professional seed cohort data.");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  // KPI Calculations
  const calculatedMetrics = useMemo(() => {
    const total = reviews.length;
    if (total === 0) {
      return { total: 0, positiveRatio: 0, avgConfidence: 0, topCategory: "N/A" };
    }

    const positives = reviews.filter(r => r.sentiment === "Positive").length;
    const positiveRatio = Math.round((positives / total) * 100);

    const sumConfidence = reviews.reduce((sum, r) => sum + r.confidenceScore, 0);
    const avgConfidence = Math.round(sumConfidence / total);

    // Compute top category
    const catCounts: { [key: string]: number } = {};
    reviews.forEach(r => {
      catCounts[r.category] = (catCounts[r.category] || 0) + 1;
    });
    
    let topCat = "Other";
    let max = -1;
    Object.entries(catCounts).forEach(([cat, count]) => {
      if (count > max) {
        max = count;
        topCat = cat;
      }
    });

    return {
      total,
      positiveRatio,
      avgConfidence,
      topCategory: topCat
    };
  }, [reviews]);

  // Chart aggregation: Sentiments counts
  const sentimentChartData = useMemo(() => {
    const pos = reviews.filter(r => r.sentiment === "Positive").length;
    const neg = reviews.filter(r => r.sentiment === "Negative").length;
    const neu = reviews.filter(r => r.sentiment === "Neutral").length;
    const total = reviews.length || 1;
    return [
      { name: "Positive", count: pos, pct: Math.round((pos / total) * 100), color: "bg-amazon-positive", border: "border-amazon-positive" },
      { name: "Neutral", count: neu, pct: Math.round((neu / total) * 100), color: "bg-amber-400", border: "border-amber-400" },
      { name: "Negative", count: neg, pct: Math.round((neg / total) * 100), color: "bg-amazon-negative", border: "border-amazon-negative" }
    ];
  }, [reviews]);

  // Chart aggregation: Category counts
  const categoryChartData = useMemo(() => {
    const categoriesList = ["Electronics", "Books", "Home & Kitchen", "Fashion", "Toys & Games", "Food & Grocery", "Sports & Outdoors", "Other"];
    const counts = categoriesList.map(cat => {
      const cnt = reviews.filter(r => r.category === cat).length;
      return { name: cat, count: cnt };
    });
    // Order categories by volume descendant
    return counts.sort((a,b) => b.count - a.count);
  }, [reviews]);

  // Filter reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter(r => {
      const matchSearch = r.text.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchSentiment = sentimentFilter === "All" || r.sentiment === sentimentFilter;
      const matchCategory = categoryFilter === "All" || r.category === categoryFilter;
      
      return matchSearch && matchSentiment && matchCategory;
    });
  }, [reviews, searchTerm, sentimentFilter, categoryFilter]);

  // Download DB as JSON
  const downloadDatabaseJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reviews, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "amazon_ml_cohort_data_2026.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="min-h-screen bg-amazon-bg text-slate-800 flex flex-col font-sans">
      {/* Dynamic Success Toast banner */}
      <AnimatePresence>
        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-500"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium text-sm">{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary Brand Navbar */}
      <header className="bg-amazon-navy text-white py-4 px-6 border-b border-amazon-orange/25 sticky top-0 z-30 shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-md bg-opacity-95">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-amazon-orange to-amber-500 p-2 rounded-xl text-amazon-navy font-black tracking-tighter text-xl flex items-center justify-center shadow-md w-10 h-10 select-none">
              a
            </div>
            <div>
              <div className="flex items-center gap-2 leading-none">
                <span className="font-extrabold tracking-tight text-lg text-white">Amazon Product Review Sentiment Analysis</span>
                <span className="bg-amazon-orange/10 text-amazon-orange border border-amazon-orange/20 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase font-mono">
                  Advanced Suite
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-1 font-medium">Customer Intelligence Engine & Strategic Brand Synthesis</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Status dot representing real server link */}
            <div className="bg-black/40 text-slate-300 rounded-xl px-3 py-1.5 text-xs border border-white/5 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${apiStatus.geminiConfigured ? "bg-amazon-positive shadow-[0_0_8px_#2ECC71]" : "bg-amazon-orange shadow-[0_0_8px_#FF9900] animate-pulse"}`}></span>
              <span className="font-mono text-[10px] uppercase tracking-wider font-semibold text-slate-400 mt-0.5">
                {apiStatus.geminiConfigured ? "Gemini 3.5 Active" : "Local Sandbox Heuristics"}
              </span>
            </div>

            <button 
              onClick={downloadDatabaseJson}
              className="bg-amazon-orange hover:bg-amazon-orange/90 active:scale-95 text-amazon-navy px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-amazon-orange/5 cursor-pointer"
              title="Download analysis database"
            >
              <Download className="w-3.5 h-3.5 text-amazon-navy" />
              <span>Export Cohort</span>
            </button>
          </div>
        </div>
      </header>
      {/* Main Grid: Sidebar + Workspace (Emulating Streamlit Design layout) */}
      <div className="flex-grow flex flex-col lg:flex-row max-w-7xl w-full mx-auto p-4 md:p-6 gap-6">
        
        {/* Streamlit-inspired Left sidebar control deck */}
        <aside className="w-full lg:w-80 bg-amazon-navy text-slate-200 rounded-3xl p-5 border border-white/5 shadow-xl self-start flex-none shrink-0 space-y-6 text-slate-300">
          
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="p-1.5 rounded-lg bg-black/40 text-amazon-orange border border-white/5"><Database className="w-4 h-4" /></span>
              <h2 className="font-bold text-xs uppercase text-slate-400 tracking-wider font-mono">Session State Manager</h2>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Steamlit acts as our dynamic client-side caching engine. Storing user sentiment logs directly using state hooks.
            </p>

            <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-2.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Workspace host:</span>
                <span className="font-mono text-slate-300 font-semibold text-[11px]">Cloud Container</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Active DB Status:</span>
                <span className="text-amazon-orange font-bold font-mono">{reviews.length} processed logs</span>
              </div>
              <div className="flex justify-between text-xs items-center">
                <span className="text-slate-500">Cognitive LLM:</span>
                <span className="bg-amazon-orange/10 text-amazon-orange font-mono text-[9px] px-1.5 py-0.5 rounded border border-amazon-orange/20 font-bold">
                  gemini-3.5-flash
                </span>
              </div>
            </div>
          </div>

          <hr className="border-white/5" />

          {/* Quick interactive input controls form */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="p-1.5 rounded-lg bg-black/40 text-amazon-orange border border-white/5"><PlusCircle className="w-4 h-4" /></span>
              <h2 className="font-bold text-xs uppercase text-slate-400 tracking-wider font-mono">Evaluate Single Review</h2>
            </div>

            <form onSubmit={handleAnalyzeReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] text-slate-400 font-bold tracking-wider uppercase font-mono mb-1.5">Raw Customer Text</label>
                <textarea 
                  value={newReviewText}
                  onChange={(e) => setNewReviewText(e.target.value)}
                  placeholder="e.g., 'The Kindle's battery life is outstandingly long, but the page flips got slightly sluggish occasionally after weeks of heavy reads.'"
                  className="w-full h-28 bg-black/40 text-slate-100 rounded-2xl p-3 border border-white/10 text-xs focus:ring-1 focus:ring-amazon-orange focus:outline-none placeholder:text-slate-600 resize-none transition-all leading-relaxed"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 font-bold tracking-wider uppercase font-mono mb-1.5">Suggested Department Category</label>
                <select
                  value={suggestedCategory}
                  onChange={(e) => setSuggestedCategory(e.target.value)}
                  className="w-full bg-black/40 text-slate-205 border border-white/10 rounded-2xl p-3 text-xs focus:ring-1 focus:ring-amazon-orange focus:outline-none transition-all"
                >
                  <option value="Electronics" className="bg-amazon-navy">Electronics (Gadgets & Gear)</option>
                  <option value="Books" className="bg-amazon-navy">Books & E-Readers</option>
                  <option value="Home & Kitchen" className="bg-amazon-navy">Home & Kitchen</option>
                  <option value="Fashion" className="bg-amazon-navy">Fashion & Apparel</option>
                  <option value="Toys & Games" className="bg-amazon-navy">Toys & Games</option>
                  <option value="Food & Grocery" className="bg-amazon-navy">Food & Grocery</option>
                  <option value="Sports & Outdoors" className="bg-amazon-navy">Sports & Outdoors</option>
                  <option value="Other" className="bg-amazon-navy">Other Retail Goods</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isAnalyzing}
                className="w-full bg-amazon-orange hover:bg-amazon-orange/90 active:scale-95 text-amazon-navy py-3 rounded-2xl text-xs font-extrabold transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 border-0"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing Sentiment...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amazon-navy fill-amazon-navy" />
                    <span>Run Gemini Classifier</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <hr className="border-white/5" />

          {/* Quick commands and presets */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="p-1.5 rounded-lg bg-black/40 text-amazon-orange border border-white/5"><Activity className="w-4 h-4" /></span>
              <h2 className="font-bold text-xs uppercase text-slate-400 tracking-wider font-mono">Dataset Operations</h2>
            </div>
            
            <div className="space-y-2">
              <button
                onClick={seedNewMockReviews}
                className="w-full text-left bg-black/30 hover:bg-black/50 border border-white/5 rounded-2xl p-3 flex items-center justify-between group transition-all cursor-pointer"
              >
                <div className="flex flex-col">
                  <span className="font-bold text-xs text-slate-200">Inject 4 Sample Reviews</span>
                  <span className="text-[10px] text-slate-500">Kindle, Book defects, Toy teddy</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amazon-orange transform group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={resetToFactoryDefaultData}
                type="button"
                className="w-full text-left bg-white/5 hover:bg-white/10 text-xs text-slate-350 p-2.5 rounded-xl border border-dotted border-white/10 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3 h-3 text-amazon-orange" />
                <span>Reload Seed Reviews (10)</span>
              </button>

              <button
                onClick={clearDatabaseCohort}
                type="button"
                className="w-full text-left bg-rose-950/20 hover:bg-rose-950/40 text-xs text-rose-300 p-2.5 rounded-xl border border-rose-900/30 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3 h-3 text-rose-400" />
                <span>Clear Database Logs</span>
              </button>
            </div>
          </div>

          {/* Portfolio Signature Footnote */}
          <div className="bg-black/30 p-3 rounded-xl border border-white/5 text-center">
            <span className="text-[10px] text-slate-500 uppercase font-mono font-bold tracking-widest block">Product Review Sentiment Analysis</span>
            <span className="text-[11px] text-slate-300 font-medium block mt-1">AI-Powered Brand Dashboard</span>
            <span className="text-[9px] text-slate-500 block">Candidate: gj2104638@gmail.com</span>
          </div>

        </aside>

        {/* Right workspace: Main Analytics dashboard & interactive table display */}
        <main className="flex-grow space-y-6">

          {/* Heuristic warning banner if api key is missing */}
          {!apiStatus.geminiConfigured && (
            <div className="bg-amber-50/60 backdrop-blur-md border border-amber-200/50 rounded-3xl p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center text-amber-900 shadow-[0_4px_20px_rgba(245,158,11,0.02)]">
              <div className="bg-amber-400 text-slate-950 p-2.5 rounded-2xl flex-none shadow-sm">
                <AlertCircle className="w-5 h-5 text-slate-950" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-sm text-slate-900">Cognitive Classification Sandbox Active</h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-4xl">
                  No active <span className="bg-amber-100 border border-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-mono text-[10px] font-bold">GEMINI_API_KEY</span> detected in environment variables. The application is automatically utilizing a deterministic NLP scoring matrix. Add your key via the <strong>Settings &gt; Secrets</strong> panel to active fully automated LLM cognitive insights.
                </p>
              </div>
            </div>
          )}

          {/* Secondary Header Tab bar */}
          <div className="bg-white rounded-2xl p-2.5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-xl border border-slate-100">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`px-4.5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === "dashboard" ? "bg-white text-slate-900 shadow-sm border border-slate-100" : "text-slate-500 hover:text-slate-800"}`}
              >
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-amber-500" />
                  <span>Interactive Dashboard</span>
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab("explorer")}
                className={`relative px-4.5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeTab === "explorer" ? "bg-white text-slate-900 shadow-sm border border-slate-100" : "text-slate-500 hover:text-slate-800"}`}
              >
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-500" />
                  <span>Datagrid Explorer</span>
                </div>
                {reviews.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 text-[9px] w-4.5 h-4.5 flex items-center justify-center rounded-full font-bold shadow-sm">
                    {reviews.length}
                  </span>
                )}
              </button>
            </div>

            <div className="text-xs text-slate-400 font-mono pr-2 font-medium">
              <span className="font-bold text-slate-700">Data State:</span> Local Storage Persistent
            </div>
          </div>

          {/* Visual Workspace content depending on active Tab Selection */}
          <AnimatePresence mode="wait">
            {activeTab === "dashboard" ? (
              <motion.div
                key="dashboard-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                {/* Metrics Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Metric 1 */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.015)] flex items-center gap-4 hover:border-amber-450/10 transition-all">
                    <div className="bg-slate-50 p-3.5 rounded-2xl text-slate-800 border border-slate-100">
                      <Bookmark className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] font-bold tracking-wider uppercase font-mono">Total Handled</span>
                      <h4 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5 font-sans">
                        {calculatedMetrics.total}
                      </h4>
                      <span className="text-[10px] text-slate-450 font-medium font-mono">
                        active logs
                      </span>
                    </div>
                  </div>

                  {/* Metric 2 */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.015)] flex items-center gap-4 hover:border-amazon-positive/10 transition-all">
                    <div className="bg-amazon-positive/10 text-amazon-positive p-3.5 rounded-2xl border border-amazon-positive/20">
                      <ThumbsUp className="w-5 h-5 text-amazon-positive" />
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] font-bold tracking-wider uppercase font-mono">Positive Ratio</span>
                      <h4 className="text-2xl font-extrabold text-amazon-positive tracking-tight mt-0.5">
                        {calculatedMetrics.positiveRatio}%
                      </h4>
                      <div className="text-[10px] text-slate-450 flex items-center gap-1 font-mono">
                        <TrendingUp className="w-3 h-3 text-amazon-positive" />
                        <span>Customer health</span>
                      </div>
                    </div>
                  </div>

                  {/* Metric 3 */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.015)] flex items-center gap-4 hover:border-amber-450/10 transition-all">
                    <div className="bg-blue-50 text-blue-650 p-3.5 rounded-2xl border border-blue-100/50">
                      <Percent className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] font-bold tracking-wider uppercase font-mono">AI Confidence</span>
                      <h4 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                        {calculatedMetrics.avgConfidence}%
                      </h4>
                      <span className="text-[10px] text-slate-450 font-mono">
                        avg decision margin
                      </span>
                    </div>
                  </div>

                  {/* Metric 4 */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.015)] flex items-center gap-4 hover:border-amber-450/10 transition-all">
                    <div className="bg-amber-50 text-amber-650 p-3.5 rounded-2xl border border-amber-100/50">
                      <Layers className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] font-bold tracking-wider uppercase font-mono">Top Category</span>
                      <h4 className="text-base font-extrabold text-slate-900 tracking-tight truncate max-w-[130px] mt-1 font-sans">
                        {calculatedMetrics.topCategory}
                      </h4>
                      <span className="text-[10px] text-slate-455 font-mono block truncate">
                        max review volume
                      </span>
                    </div>
                  </div>
                </div>

                {/* Analytical charts row */}
                {reviews.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.015)]">
                    <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 border border-slate-100">
                      <BarChart3 className="w-6 h-6 text-amazon-orange" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-base">Analytical Repository is Empty</h3>
                    <p className="text-slate-500 text-xs max-w-sm mx-auto mt-1 mb-4">
                      Please reload standard seed reviews in the left sidebar or enter your custom evaluation text to see state-of-the-art visual telemetry.
                    </p>
                    <button 
                      onClick={resetToFactoryDefaultData}
                      className="bg-amazon-orange text-amazon-navy font-extrabold text-xs px-5 py-2.5 rounded-xl hover:bg-amazon-orange/90 active:scale-95 transition-all shadow-md shadow-amazon-orange/10 cursor-pointer border-0"
                    >
                      Retrieve Standard Datasets
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      
                      {/* Left graph: Sentiment share circles/nesting */}
                      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.015)] md:col-span-4 flex flex-col justify-between hover:border-amazon-orange/10 transition-all">
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 border-b border-slate-150 pb-3">
                            <BarChart3 className="w-4 h-4 text-amazon-orange" />
                            <span>Customer Sentiment Ratio</span>
                          </h3>
                          <p className="text-slate-500 text-xs leading-relaxed mt-2.5">
                            Visual share of general sentiments calculated over processed databases.
                          </p>
                        </div>

                        {/* Custom visual progress bars representing sentiment distribution */}
                        <div className="py-6 space-y-4">
                          {sentimentChartData.map((item, index) => (
                            <div key={item.name} className="space-y-1.5">
                              <div className="flex justify-between text-xs font-semibold text-slate-700">
                                <span className="flex items-center gap-1.5">
                                  <span className={`w-3 h-3 rounded-full ${item.color}`}></span>
                                  <span>{item.name} Reviews</span>
                                </span>
                                <span>{item.count} items ({item.pct}%)</span>
                              </div>
                              <div className="w-full bg-slate-50 h-3 rounded-full overflow-hidden border border-slate-100">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${item.pct}%` }}
                                  transition={{ duration: 0.8, delay: index * 0.1 }}
                                  className={`h-full rounded-full ${item.color}`}
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                          <span className="text-[11px] text-slate-600 font-mono font-medium">
                            Sentiment Quality Index: <strong className="text-amazon-positive font-bold">{calculatedMetrics.positiveRatio}%</strong> (Positive Rating)
                          </span>
                        </div>
                      </div>

                      {/* Right graph: Department categorization bar lines chart */}
                      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_4px_25px_rgba(0,0,0,0.015)] md:col-span-8 flex flex-col justify-between hover:border-amazon-orange/10 transition-all">
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 border-b border-slate-150 pb-3">
                            <Layers className="w-4 h-4 text-amazon-orange" />
                            <span>Department Category Distributions</span>
                          </h3>
                          <p className="text-slate-500 text-xs leading-relaxed mt-2.5">
                            Volume classification counts across major Amazon retail sectors.
                          </p>
                        </div>

                        {/* Interactive dynamic bar charts built natively with standard styling */}
                        <div className="py-6 grid grid-cols-4 sm:grid-cols-8 gap-3 items-end h-44 border-b border-slate-100 mb-2">
                          {categoryChartData.map((item, idx) => {
                            const maxVal = Math.max(...categoryChartData.map(c => c.count)) || 1;
                            const heightPercentage = Math.round((item.count / maxVal) * 100);
                            return (
                              <div key={item.name} className="flex flex-col items-center group h-full justify-end">
                                <div className="text-[11px] font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white rounded px-1.5 py-0.5 min-w-[20px] text-center mb-1">
                                  {item.count}
                                </div>
                                <div className="w-full bg-slate-50 hover:bg-slate-100 rounded-t-xl h-32 flex flex-col justify-end overflow-hidden cursor-pointer border border-slate-100">
                                  <motion.div 
                                    initial={{ height: 0 }}
                                    animate={{ height: `${heightPercentage}%` }}
                                    transition={{ duration: 0.8, delay: idx * 0.05 }}
                                    className={`w-full ${item.count > 0 ? "bg-amazon-orange group-hover:bg-amazon-orange/80" : "bg-slate-200"} rounded-t`}
                                  />
                                </div>
                                <span 
                                  className="text-[9px] font-mono font-semibold text-slate-500 mt-2 rotate-45 sm:rotate-0 origin-left text-ellipsis overflow-hidden whitespace-nowrap max-w-[48px]"
                                  title={item.name}
                                >
                                  {item.name}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        
                        <div className="text-slate-400 text-[10px] text-right mt-2 font-mono">
                          Counts represent volume density classification thresholds.
                        </div>
                      </div>

                    </div>

                    {/* AI Insights Dynamic Synthesis panel */}
                    <div className="bg-amazon-navy text-slate-100 rounded-3xl p-5 border border-white/5 shadow-lg relative overflow-hidden">
                      {/* Background branding design */}
                      <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none transform translate-y-1/4 translate-x-1/10">
                        <Brain className="w-72 h-72 text-amazon-orange" />
                      </div>

                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4 mb-4">
                        <div className="flex items-center gap-2.5">
                          <div className="bg-gradient-to-tr from-amazon-orange to-amber-500 p-2.5 rounded-xl text-amazon-navy shadow-md">
                            <Brain className="w-5 h-5 text-amazon-navy" />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-white">Dynamic AI Brand Intelligence Synthesis</h3>
                            <p className="text-[11px] text-slate-400 mt-0.5">Gemini 3.5 Flash powered strategic cohort digest</p>
                          </div>
                        </div>

                        <button
                          onClick={() => fetchAiSummaryDigest()}
                          disabled={isSynthesizing || reviews.length === 0}
                          className="bg-black/30 hover:bg-black/50 font-sans border border-white/10 text-slate-200 active:scale-95 disabled:opacity-50 text-xs px-3.5 py-1.5 rounded-xl cursor-pointer transition-all font-semibold flex items-center gap-1.5"
                        >
                          <RefreshCw className={`w-3 h-3 text-amazon-orange ${isSynthesizing ? "animate-spin" : ""}`} />
                          <span>Re-synthesize</span>
                        </button>
                      </div>

                      {isSynthesizing ? (
                        <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                          <div className="relative">
                            <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
                            <Sparkles className="w-4 h-4 text-orange-400 animate-pulse absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                          </div>
                          <span className="text-xs text-slate-400 font-mono">Querying brand intelligence matrix...</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                          {/* Markdown analysis presentation */}
                          <div className="md:col-span-8 space-y-2 text-xs text-slate-300 leading-relaxed max-w-prose">
                            {/* Standard output presentation */}
                            <div className="markdown-body font-sans space-y-2 whitespace-pre-wrap">
                              {aiDigest.summary || `### Customer Sentiment Strategic Index Report\nNo summary compiled yet. Insert or click dataset seeds to see automatic LLM synthesis.`}
                            </div>
                          </div>

                          <div className="md:col-span-4 bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-4">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-orange-400 tracking-wider font-mono">Cohort Health Rating</span>
                              <div className="flex items-baseline gap-1 mt-1">
                                <h4 className="text-4xl font-extrabold text-white tracking-tight">{aiDigest.healthScore}</h4>
                                <span className="text-slate-500 text-xs">/ 100</span>
                              </div>
                            </div>

                            <div className="space-y-3 pt-2">
                              <div>
                                <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-mono">Appreciated Attributes</span>
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {aiDigest.pros && aiDigest.pros.length > 0 ? (
                                    aiDigest.pros.map(pr => (
                                      <span key={pr} className="text-[9px] bg-emerald-900/40 text-emerald-300 font-medium px-2 py-0.5 rounded border border-emerald-800/20 truncate max-w-[130px]">
                                        {pr}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-[10px] text-slate-500">None detected</span>
                                  )}
                                </div>
                              </div>

                              <div>
                                <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-mono">Critical Concerns</span>
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {aiDigest.cons && aiDigest.cons.length > 0 ? (
                                    aiDigest.cons.map(cn => (
                                      <span key={cn} className="text-[9px] bg-rose-900/40 text-rose-300 font-medium px-2 py-0.5 rounded border border-rose-800/20 truncate max-w-[130px]">
                                        {cn}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-[10px] text-slate-500">None detected</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                    </div>
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="explorer-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                {/* Search & Filtering grid section */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  
                  {/* Search bar */}
                  <div className="relative md:col-span-5">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                    <input 
                      type="text"
                      placeholder="Search text, keywords, or summary..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl pl-10 pr-4 py-2 text-xs focus:bg-white focus:ring-1 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>

                  {/* Sentiment Filter */}
                  <div className="relative md:col-span-3 flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={sentimentFilter}
                      onChange={(e) => setSentimentFilter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs focus:bg-white focus:outline-none"
                    >
                      <option value="All">All Sentiments</option>
                      <option value="Positive">Positive Only</option>
                      <option value="Neutral">Neutral Only</option>
                      <option value="Negative">Negative Only</option>
                    </select>
                  </div>

                  {/* Category Filter */}
                  <div className="relative md:col-span-3">
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs focus:bg-white focus:outline-none"
                    >
                      <option value="All">All Categories</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Books">Books</option>
                      <option value="Home & Kitchen">Home & Kitchen</option>
                      <option value="Fashion">Fashion</option>
                      <option value="Toys & Games">Toys & Games</option>
                      <option value="Food & Grocery">Food & Grocery</option>
                      <option value="Sports & Outdoors">Sports & Outdoors</option>
                      <option value="Other">Other Category</option>
                    </select>
                  </div>

                  {/* Refresh Button */}
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setSentimentFilter("All");
                      setCategoryFilter("All");
                    }}
                    className="md:col-span-1 border border-slate-200 text-slate-500 hover:text-slate-800 p-2 rounded-xl text-xs hover:bg-slate-50 flex items-center justify-center transition-colors cursor-pointer"
                    title="Reset filters"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>

                </div>

                {/* Main Datagrid presentation */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-mono uppercase text-[10px] tracking-wider font-bold">
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4 max-w-xs">Customer Review</th>
                          <th className="py-3 px-4">Sentiment Evaluation</th>
                          <th className="py-3 px-4 text-center">Confidence</th>
                          <th className="py-3 px-4">Keywords Extracted</th>
                          <th className="py-3 px-4 text-right">Operations</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-150">
                        {filteredReviews.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-slate-400">
                              <AlertCircle className="w-6 h-6 mx-auto text-slate-300 mb-1.5" />
                              <span>No matched review rows found in current state filter.</span>
                            </td>
                          </tr>
                        ) : (
                          filteredReviews.map(r => (
                            <tr key={r.id} className="hover:bg-slate-50/70 transition-colors group">
                              {/* Category Badge */}
                              <td className="py-3.5 px-4 font-medium text-slate-900 whitespace-nowrap">
                                <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-mono text-[11px] border border-slate-200/50">
                                  {r.category}
                                </span>
                              </td>
                              
                              {/* Review & Summary */}
                              <td className="py-3.5 px-4 max-w-sm">
                                <p className="text-slate-800 font-medium truncate max-w-[340px]" title={r.text}>
                                  {r.text}
                                </p>
                                <span className="text-[11px] text-slate-400 font-semibold block mt-1 line-clamp-1">
                                  💡 {r.summary}
                                </span>
                              </td>

                              {/* Sentiment bubble */}
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                  r.sentiment === "Positive" 
                                    ? "bg-amazon-positive/10 text-amazon-positive border border-amazon-positive/20" 
                                    : r.sentiment === "Negative" 
                                    ? "bg-amazon-negative/10 text-amazon-negative border border-amazon-negative/20" 
                                    : "bg-amber-100 text-amber-850 border border-amber-250"
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    r.sentiment === "Positive" 
                                      ? "bg-amazon-positive" 
                                      : r.sentiment === "Negative" 
                                      ? "bg-amazon-negative" 
                                      : "bg-amber-400"
                                  }`}></span>
                                  <span>{r.sentiment}</span>
                                </span>
                              </td>

                              {/* Confidence Score percentage */}
                              <td className="py-3.5 px-4 text-center font-mono font-medium text-slate-600 whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1">
                                  <span>{r.confidenceScore}%</span>
                                  <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
                                    <div 
                                      className={`h-full rounded-full ${
                                        r.confidenceScore > 90 ? "bg-amazon-positive" : "bg-amazon-orange"
                                      }`}
                                      style={{ width: `${r.confidenceScore}%` }}
                                    />
                                  </div>
                                </div>
                              </td>

                              {/* Keywords */}
                              <td className="py-3.5 px-4">
                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                  {r.keywords.slice(0, 3).map(kw => (
                                    <span key={kw} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                                      {kw}
                                    </span>
                                  ))}
                                  {r.keywords.length > 3 && (
                                    <span className="text-[9px] text-slate-400 font-bold px-1 mt-0.5">+{r.keywords.length - 3}</span>
                                  )}
                                </div>
                              </td>

                              {/* Quick delete / view actions */}
                              <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-2.5">
                                  <button
                                    onClick={() => setSelectedReview(r)}
                                    className="text-slate-500 hover:text-slate-900 text-[11px] font-bold border border-slate-200 hover:border-slate-300 rounded px-2 py-1 bg-white cursor-pointer"
                                  >
                                    View Full
                                  </button>
                                  <button
                                    onClick={() => {
                                      setReviews(prev => prev.filter(item => item.id !== r.id));
                                    }}
                                    className="text-rose-500 hover:text-rose-700 p-1 hover:bg-rose-50 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                    title="Delete record"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>

                    </table>
                  </div>

                  <div className="bg-slate-50 p-3.5 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
                    <div>
                      Cohort showing <strong>{filteredReviews.length}</strong> of <strong>{reviews.length}</strong> loaded customer reviews.
                    </div>
                    <div className="font-mono text-[10px] text-slate-400">
                      Export results as JSON on page header.
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </main>
      </div>
      <AnimatePresence>
        {selectedReview && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-xl w-full border border-slate-100 overflow-hidden shadow-2xl"
            >
              <div className="bg-amazon-navy p-4.5 font-mono text-white flex justify-between items-center border-b border-amazon-orange">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-amazon-orange" />
                  <span className="text-xs font-bold uppercase tracking-wider">Review Classification Audit</span>
                </div>
                <button 
                  onClick={() => setSelectedReview(null)}
                  className="p-1 rounded bg-white/10 hover:bg-white/20 text-slate-200 cursor-pointer text-xs font-black w-6 h-6 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <span className="text-[10px] text-slate-400 font-mono uppercase block tracking-wider">Original Review Text</span>
                  <p className="text-slate-800 text-sm font-medium italic mt-1.5 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                    "{selectedReview.text}"
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-mono uppercase block">Estimated Sentiment</span>
                    <span className={`font-black block mt-1 ${
                      selectedReview.sentiment === "Positive" 
                        ? "text-amazon-positive" 
                        : selectedReview.sentiment === "Negative" 
                        ? "text-amazon-negative" 
                        : "text-amber-500"
                    }`}>{selectedReview.sentiment}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-mono uppercase block">Confidence Margin</span>
                    <span className="font-bold text-slate-900 block mt-1">{selectedReview.confidenceScore}%</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-mono uppercase block">Product Category</span>
                    <span className="font-bold text-slate-900 block mt-1">{selectedReview.category}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-mono uppercase block">Record Timestamp</span>
                    <span className="font-bold text-mono text-slate-600 block mt-1">{selectedReview.timestamp}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-mono uppercase block">Automated Mini Summary</span>
                  <p className="text-xs text-slate-700 font-semibold mt-1">
                    💡 {selectedReview.summary}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-mono uppercase block">Extracted Keywords</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {selectedReview.keywords.map(kw => (
                      <span key={kw} className="text-[11px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded border border-slate-150">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 border-t border-slate-155 flex justify-end">
                <button
                  onClick={() => setSelectedReview(null)}
                  className="bg-amazon-orange hover:bg-amazon-orange/90 active:scale-95 text-amazon-navy font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow cursor-pointer shadow-amazon-orange/10 border-0"
                >
                  Acknowledge Report
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer credits panel */}
      <footer className="bg-amazon-navy text-slate-400 py-6 px-6 text-center text-xs mt-auto border-t border-white/5">
        <div className="max-w-7xl mx-auto space-y-1">
          <p>© 2026 Amazon Product Review Sentiment Analysis. Candidate project portfolio system.</p>
          <p className="text-slate-500 font-mono text-[11px]">Designed in full React, Tailwind, and Node.js with built-in heuristic/cognitive Gemini model hybrid routing.</p>
        </div>
      </footer>
    </div>
  );
}
