# -*- coding: utf-8 -*-
"""
Amazon Product Review Sentiment Analysis and Analytics Dashboard
Created for: Amazon Product Review Sentiment Analysis
Author: Senior Machine Learning and Full-Stack Developer
License: Apache-2.0
"""

import os
import datetime
import pandas as pd
import streamlit as strl

# Load environment variables securely from .env file using python-dotenv
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    # If python-dotenv is not installed in the local environment, fall back gracefully
    pass

# Install requirement hint: pip install streamlit google-generativeai pandas python-dotenv
try:
    import google.generativeai as genai
except ImportError:
    strl.error("Missing dependency: 'google-generativeai'. Please run `pip install google-generativeai` in your local terminal.")

# Set up Streamlit Page Settings
strl.set_page_config(
    page_title="Amazon Product Review Sentiment Analysis",
    page_icon="📦",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Amber/Slate CSS styling to look like a high-fidelity enterprise Amazon product
strl.markdown("""
<style>
    /* Styling headers & buttons */
    .stButton>button {
        background-color: #FF9900 !important;
        color: #111111 !important;
        font-weight: bold !important;
        border-radius: 8px !important;
        border: none !important;
        box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.05) !important;
    }
    .stButton>button:hover {
        background-color: #e68a00 !important;
        color: #000000 !important;
    }
    .metric-card {
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 15px;
        box-shadow: 0px 2px 4px rgba(0,0,0,0.02);
    }
    .badge-positive {
        background-color: #d1fae5;
        color: #065f46;
        padding: 4px 8px;
        border-radius: 12px;
        font-weight: bold;
        font-size: 11px;
    }
    .badge-negative {
        background-color: #fee2e2;
        color: #991b1b;
        padding: 4px 8px;
        border-radius: 12px;
        font-weight: bold;
        font-size: 11px;
    }
    .badge-neutral {
        background-color: #fef3c7;
        color: #92400e;
        padding: 4px 8px;
        border-radius: 12px;
        font-weight: bold;
        font-size: 11px;
    }
</style>
""", unsafe_allow_html=True)

# -----------------------------------------------------------------------------
# 1. SEED DEFAULT DATASET (Streamlit Session State as In-Memory Database)
# -----------------------------------------------------------------------------
DEFAULT_REVIEWS = [
    {
        "id": "seed-1",
        "text": "The audio clarity on this Echo Dot is phenomenal! Extremely easy setup and integrates with my home appliances instantly. Definitely worth the buy.",
        "sentiment": "Positive",
        "category": "Electronics",
        "confidence": 98.0,
        "summary": "Outstanding audio quality and smart appliances home integration.",
        "keywords": "audio quality, easy setup, smart home",
        "timestamp": "2026-06-09 10:24"
    },
    {
        "id": "seed-2",
        "text": "Worst charger ever. It heated up excessively within 10 minutes of plugging in, emitting a bad plasticky odor. Returning it for a refund immediately.",
        "sentiment": "Negative",
        "category": "Electronics",
        "confidence": 96.0,
        "summary": "Dangerous overheating power brick reporting plastic burns.",
        "keywords": "overheating, odor, return, charger defect",
        "timestamp": "2026-06-09 11:02"
    },
    {
        "id": "seed-3",
        "text": "This tri-ply stainless steel pan cooks incredibly evenly and washes off like a breeze. Perfect heft and sturdy handle connection.",
        "sentiment": "Positive",
        "category": "Home & Kitchen",
        "confidence": 97.0,
        "summary": "Commends even heat distribution and effortlessly clean surfaces.",
        "keywords": "evenly cooks, easy wash, sturdy heft",
        "timestamp": "2026-06-09 09:15"
    },
    {
        "id": "seed-4",
        "text": "The pacing on this thriller was sluggish. Characters were cardboard cliches and the ending was completely predictable. Highly disappointed.",
        "sentiment": "Negative",
        "category": "Books",
        "confidence": 94.0,
        "summary": "Disappointed novel review detailing predictable ending.",
        "keywords": "sluggish pace, narrative cliches, disappointed",
        "timestamp": "2026-06-08 14:40"
    },
    {
        "id": "seed-5",
        "text": "The stitching fits correctly but the color looks a bit more faded in person than the item photos on Amazon. Decent for rough casual wear.",
        "sentiment": "Neutral",
        "category": "Fashion",
        "confidence": 88.0,
        "summary": "Accurate sizing coupled with slight color faded mismatch.",
        "keywords": "faded color, correct sizing, casual fit",
        "timestamp": "2026-06-08 16:11"
    },
    {
        "id": "seed-6",
        "text": "Dangerous! The machine motor began sparking and smoking on the first high speed blend session. Had to unplug immediately.",
        "sentiment": "Negative",
        "category": "Home & Kitchen",
        "confidence": 99.0,
        "summary": "Critical mechanical motor breakdown sparking smoke.",
        "keywords": "sparking smoke, motor defect, hazardous",
        "timestamp": "2026-06-08 08:31"
    },
    {
        "id": "seed-7",
        "text": "Beautifully engineered building toys! The birchwood blocks are sanded smooth, lock safely, and kept my 4 year old busy for hours.",
        "sentiment": "Positive",
        "category": "Toys & Games",
        "confidence": 98.0,
        "summary": "Sanded smooth blocks offering safe, focused learning retention.",
        "keywords": "birchwood blocks, lock safely, child busy",
        "timestamp": "2026-06-07 15:10"
    },
    {
        "id": "seed-8",
        "text": "These running shoes are cloud-like! The mesh breathes beautifully, and the responsive arch support alleviated my shin splints completely.",
        "sentiment": "Positive",
        "category": "Sports & Outdoors",
        "confidence": 99.0,
        "summary": "Ergonomic supportive insole and high-performance mesh ventilation.",
        "keywords": "breathable, arch support, foot comfort",
        "timestamp": "2026-06-07 10:18"
    },
    {
        "id": "seed-9",
        "text": "Organic whole-bean coffee has a fantastic deep roast profile. Rich chocolate and hazelnut notes. I will subscribe to this monthly.",
        "sentiment": "Positive",
        "category": "Food & Grocery",
        "confidence": 95.0,
        "summary": "Deep robust flavor noting chocolate hazelnut hints.",
        "keywords": "rich flavor, chocolate, subscription",
        "timestamp": "2026-06-06 12:45"
    },
    {
        "id": "seed-10",
        "text": "The mesh pocket zipper snapped shut and jammed on my very first jog. Rest of the hydration pack holds fluid comfortably though.",
        "sentiment": "Neutral",
        "category": "Sports & Outdoors",
        "confidence": 89.0,
        "summary": "Sturdy fluid bladder compromised by fragile zipper clasp.",
        "keywords": "jammed zipper, hydration backpack, comfortable",
        "timestamp": "2026-06-06 14:12"
    }
]

if "review_db" not in strl.session_state:
    strl.session_state["review_db"] = pd.DataFrame(DEFAULT_REVIEWS)

# -----------------------------------------------------------------------------
# 2. GEMINI API CLIENT LAZY INITIALIZATION
# -----------------------------------------------------------------------------
def get_gemini_client():
    """Initializes and returns the Gemini API connection securely."""
    # Obtain from session config or OS Environment variables
    api_key = strl.session_state.get("gemini_key_input", "")
    if not api_key:
        api_key = os.getenv("GEMINI_API_KEY")
        
    if not api_key or api_key == "MY_GEMINI_API_KEY" or api_key.strip() == "":
        return None
        
    try:
        genai.configure(api_key=api_key)
        # Using the standard reliable Gemini 2.5 Flash / 1.5 model aliases inside Python SDK
        return genai.GenerativeModel('gemini-1.5-flash')
    except Exception as e:
        strl.sidebar.error(f"Error booting Gemini client: {e}")
        return None

# -----------------------------------------------------------------------------
# 3. HEURISTIC FALLBACK ANALYSIS FUNCTION
# -----------------------------------------------------------------------------
def heuristic_classify_review(text: str, category_suggestion: str):
    """Processes reviews offline using lexical patterns if API Key isn't configured."""
    lower = text.lower()
    
    pos_words = ["great", "excellent", "love", "fantastic", "awesome", "amazing", "good", "perfect", "satisfied", "recommend", "best", "smooth", "sturdy", "nice"]
    neg_words = ["bad", "terrible", "worst", "broken", "useless", "return", "returned", "disappointed", "waste", "cheap", "refund", "horrible", "fail", "failed", "hate", "poor", "difficult", "annoying"]
    
    pos_count = sum(lower.count(w) for w in pos_words)
    neg_count = sum(lower.count(w) for w in neg_words)
    
    if pos_count > neg_count:
        sentiment = "Positive"
        confidence = min(60.0 + (pos_count - neg_count) * 8.0, 98.0)
    elif neg_count > pos_count:
        sentiment = "Negative"
        confidence = min(60.0 + (neg_count - pos_count) * 8.0, 98.0)
    else:
        sentiment = "Neutral"
        confidence = 50.0
        
    # Categories mapping
    category = category_suggestion
    if category_suggestion == "Other":
        if any(w in lower for w in ["phone", "cable", "charger", "battery", "sound", "audio", "screen", "laptop", "computer", "headphones", "usb"]):
            category = "Electronics"
        elif any(w in lower for w in ["book", "author", "read", "novel", "paperback", "pages", "story"]):
            category = "Books"
        elif any(w in lower for w in ["cook", "kitchen", "pan", "knife", "kettle", "plate", "coffee"]):
            category = "Home & Kitchen"
            
    # Extract simple tags
    keywords = [w for w in lower.replace(".", "").split() if len(w) > 4 and w not in ["about", "their", "there", "would", "could", "these", "after", "first", "highly", "really"]]
    selected_tags = ", ".join(keywords[:3]) if keywords else "product feedback"
    
    summary = f"Decisive {sentiment.lower()} customer assessment of the item."
    
    return {
        "sentiment": sentiment,
        "category": category,
        "confidence": confidence,
        "summary": summary,
        "keywords": selected_tags,
        "is_mock": True
    }

# -----------------------------------------------------------------------------
# 4. LLM COGNITIVE ANALYSIS PIPELINE
# -----------------------------------------------------------------------------
def analyze_review_with_gemini(text: str, category_suggestion: str):
    """Integrates Gemini generative models to parse customer feedback with deep NLP."""
    model = get_gemini_client()
    if model is None:
        return heuristic_classify_review(text, category_suggestion)
        
    prompt = f"""
    You are an AI brand analytics classifier for Amazon Product Review Sentiment Analysis.
    Evaluate the customer product review text below and formulate your analysis precisely.
    
    Original Review:
    "{text}"
    
    Output strictly in the following JSON format without markers, preambles, or formatting blocks:
    {{
      "sentiment": "Positive" or "Negative" or "Neutral",
      "category": "Electronics" or "Books" or "Home & Kitchen" or "Fashion" or "Toys & Games" or "Food & Grocery" or "Sports & Outdoors" or "Other",
      "confidence": float indicating percentage decision certainty from 0.0 to 100.0,
      "summary": "Concise 1-sentence executive summary of the feedback",
      "keywords": "3 to 4 comma-separated descriptive word tags"
    }}
    
    Ensure category leans on suggestion "{category_suggestion}" if fitting, otherwise calibrate it correctly based on review text.
    """
    
    try:
        response = model.generate_content(prompt)
        text_out = response.text.strip()
        # Fallback sanitize JSON blocks if markdown wrapping occurs
        if text_out.startswith("```json"):
            text_out = text_out.replace("```json", "").replace("```", "").strip()
        elif text_out.startswith("```"):
            text_out = text_out.replace("```", "").strip()
            
        import json
        insights = json.loads(text_out)
        return {
            "sentiment": insights.get("sentiment", "Neutral"),
            "category": insights.get("category", category_suggestion),
            "confidence": float(insights.get("confidence", 85.0)),
            "summary": insights.get("summary", "Decently evaluated text analysis."),
            "keywords": insights.get("keywords", "feedback"),
            "is_mock": False
        }
    except Exception as e:
        # Graceful error catchment, ensuring dashboard continues with Heuristics backup
        backup = heuristic_classify_review(text, category_suggestion)
        backup["summary"] = f"Backup heuristic score. (LLM Engine errored: {str(e)[:50]}...)"
        return backup

# -----------------------------------------------------------------------------
# 5. HEADER BRAND BAR
# -----------------------------------------------------------------------------
col_logo, col_titles = strl.columns([1, 12])
with col_logo:
    strl.markdown("<h2 style='background-color:#FF9900;color:black;text-align:center;border-radius:8px;padding:3px;margin:0;'>a</h2>", unsafe_allow_html=True)
with col_titles:
    strl.title("Amazon Product Review Sentiment Analysis")
    strl.caption("Production-ready Natural Language Processing & Customer Intelligence Center powered by Google Gemini AI")

# Check status
ai_connected = get_gemini_client() is not None

# -----------------------------------------------------------------------------
# 6. SIDEBAR CONTROLS (Streamlit Input widgets)
# -----------------------------------------------------------------------------
strl.sidebar.header("Configuration Panel")

# Secret Credentials panel
strl.sidebar.subheader("API Keys Credentials")
key_input = strl.sidebar.text_input(
    "Google Gemini API Key", 
    type="password", 
    placeholder="AI Studio API key (optional)",
    help="Leave blank to run on local Heuristic rules fallback."
)
if key_input:
    strl.session_state["gemini_key_input"] = key_input

if ai_connected:
    strl.sidebar.success("● AI Engine: Active (Gemini LLM)")
else:
    strl.sidebar.warning("○ AI Engine: Heuristic Fallback Sandbox")

strl.sidebar.markdown("---")

# Review add form
strl.sidebar.subheader("Analyze Brand Review")
with strl.sidebar.form("review_form", clear_on_submit=True):
    new_text = strl.text_area("Review Content", placeholder="Type user review details...")
    suggested_cat = strl.selectbox(
        "Suggested Category",
        ["Electronics", "Books", "Home & Kitchen", "Fashion", "Toys & Games", "Food & Grocery", "Sports & Outdoors", "Other"]
    )
    submit_btn = strl.form_submit_button("Run Classification Engine")
    
    if submit_btn:
        if new_text.strip() == "":
            strl.sidebar.warning("Please provide review text.")
        else:
            with strl.spinner("Analyzing NLP structures..."):
                outcome = analyze_review_with_gemini(new_text, suggested_cat)
                
                # Append to memory state
                new_row = {
                    "id": f"added-{datetime.datetime.now().timestamp()}",
                    "text": new_text,
                    "sentiment": outcome["sentiment"],
                    "category": outcome["category"],
                    "confidence": outcome["confidence"],
                    "summary": outcome["summary"],
                    "keywords": outcome["keywords"],
                    "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
                }
                
                # Append to DataFrame
                df = strl.session_state["review_db"]
                strl.session_state["review_db"] = pd.concat([pd.DataFrame([new_row]), df], ignore_index=True)
                strl.success("Review Analysed & Preserved in Session State!")

strl.sidebar.markdown("---")

# Quick commands
strl.sidebar.subheader("Quick Mock Operations")
col_b1, col_b2 = strl.sidebar.columns(2)
with col_b1:
    if strl.button("Inject Metrics"):
        # Add 3 random samples
        extra_reviews = [
            {
                "id": f"ext-{datetime.datetime.now().timestamp()}-1",
                "text": "The battery life on this newly purchased thermal blender lasted for ages during our weekend camp trip. Lightweight and very safe.",
                "sentiment": "Positive",
                "category": "Sports & Outdoors",
                "confidence": 94.0,
                "summary": "Great camping blender with long-lasting battery capacity.",
                "keywords": "battery life, camping, lightweight",
                "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
            },
            {
                "id": f"ext-{datetime.datetime.now().timestamp()}-2",
                "text": "These winter boots are terribly stiff. Sizing is completely incorrect, rubbing active blisters into my ankles.",
                "sentiment": "Negative",
                "category": "Fashion",
                "confidence": 98.0,
                "summary": "Uncomfortable stiff winter boots casing dynamic friction blisters.",
                "keywords": "stiff leather, sizing error, pain blisters",
                "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
            }
        ]
        strl.session_state["review_db"] = pd.concat([pd.DataFrame(extra_reviews), strl.session_state["review_db"]], ignore_index=True)
        strl.rerun()

with col_b2:
    if strl.button("Reset Stated Database"):
        strl.session_state["review_db"] = pd.DataFrame(DEFAULT_REVIEWS)
        strl.rerun()

# -----------------------------------------------------------------------------
# 7. MAIN ANALYTICS SUMMARY
# -----------------------------------------------------------------------------
df_active = strl.session_state["review_db"]

if df_active.empty:
    strl.warning("Current Active Stored Database is empty. Use left controls to inject values or reload defaults.")
else:
    # KPI metrics row calculations
    tot_count = len(df_active)
    pos_count = len(df_active[df_active["sentiment"] == "Positive"])
    neutral_count = len(df_active[df_active["sentiment"] == "Neutral"])
    neg_count = len(df_active[df_active["sentiment"] == "Negative"])
    
    pos_ratio = int((pos_count / tot_count) * 100) if tot_count > 0 else 0
    avg_conf = int(df_active["confidence"].mean()) if tot_count > 0 else 0
    
    top_cat = df_active["category"].mode()[0] if tot_count > 0 and not df_active["category"].mode().empty else "None"

    # Display clean metric cards
    k1, k2, k3, k4 = strl.columns(4)
    with k1:
        strl.markdown(f"""
        <div class="metric-card">
            <span style="color:#64748b; font-size:11px; text-transform:uppercase; font-family:monospace;">Active Corpus Rows</span>
            <h2 style="margin: 5px 0 0 0; color:#1e293b; font-weight:800; font-size:32px;">{tot_count}</h2>
            <span style="color:#94a3b8; font-size:10px;">In-Memory Session Registers</span>
        </div>
        """, unsafe_allow_html=True)
    with k2:
        strl.markdown(f"""
        <div class="metric-card">
            <span style="color:#64748b; font-size:11px; text-transform:uppercase; font-family:monospace;">Satisfaction Rating</span>
            <h2 style="margin: 5px 0 0 0; color:#10b981; font-weight:800; font-size:32px;">{pos_ratio}%</h2>
            <span style="color:#94a3b8; font-size:10px;">Positive review cohort share</span>
        </div>
        """, unsafe_allow_html=True)
    with k3:
        strl.markdown(f"""
        <div class="metric-card">
            <span style="color:#64748b; font-size:11px; text-transform:uppercase; font-family:monospace;">Predictive Confidence</span>
            <h2 style="margin: 5px 0 0 0; color:#3b82f6; font-weight:800; font-size:32px;">{avg_conf}%</h2>
            <span style="color:#94a3b8; font-size:10px;">Average decision likelihood</span>
        </div>
        """, unsafe_allow_html=True)
    with k4:
        strl.markdown(f"""
        <div class="metric-card">
            <span style="color:#64748b; font-size:11px; text-transform:uppercase; font-family:monospace;">Maximum Distribution</span>
            <h2 style="margin: 5px 0 0 0; color:#f97316; font-weight:700; font-size:20px; padding-top:10px;">{top_cat}</h2>
            <span style="color:#94a3b8; font-size:10px;">Highest volume department</span>
        </div>
        """, unsafe_allow_html=True)

    strl.markdown("####")

    # Interactive charts multi-column workspace
    c_left, c_right = strl.columns([5, 7])
    
    with c_left:
        strl.subheader("Sentiment Proportions")
        # Structure proportions data
        s_data = pd.DataFrame({
            "Sentiment Class": ["Positive", "Neutral", "Negative"],
            "Review Volume": [pos_count, neutral_count, neg_count]
        }).set_index("Sentiment Class")
        
        # Native interactive Streamlit horizontal bar chart
        strl.bar_chart(s_data)
        strl.caption("Visual distribution of Sentiment categories over cohort dataset.")
        
    with c_right:
        strl.subheader("Department Categories Breakdown")
        cat_counts = df_active["category"].value_counts().reset_index()
        cat_counts.columns = ["Department Category", "Processed Count"]
        
        # Render a simple interactive vertical distribution chart
        strl.bar_chart(cat_counts.set_index("Department Category"))
        strl.caption("Categorized retail volume distribution indicators.")

    strl.markdown("---")

    # -----------------------------------------------------------------------------
    # 8. PROCESS COHORT COGNITIVE AI SUMMARY DIGEST
    # -----------------------------------------------------------------------------
    strl.subheader("🧠 Deep Learning Executive Feedback Digest")
    
    if strl.button("Synthesize Executive Trends Insights (Gemini)"):
        if not ai_connected:
            strl.info("Offline heuristic simulation summarizing brand statistics.")
            strl.markdown(f"""
            ### Executive Brand Performance Overview (Sandbox Matrix)
            
            Our automated metrics engine completed high-speed NLP processing for **{tot_count} reviews** displaying an overall customer happiness index of **{pos_ratio}%**.
            
            - **Primary Customer Core Driver**: Buyers express profound approval concerning aspects regarding *quality craftsmanship*, *easy operation*, and *ergonomics*.
            - **Secondary Negative Friction Factors**: Critical reports display focus concerns discussing details relating to *stitching quality*, *motor safety*, or *heating issues*.
            - **Corrective Portfolio Action Guide**: Schedule additional quality checks inside structural retail components for Electronics and Home appliances to reduce refund requests.
            """)
        else:
            with strl.spinner("Engaging Gemini AI semantic analysis of cohort..."):
                # Compile corpus snippets
                snippets = []
                for idx, row in df_active.head(15).iterrows():
                    snippets.append(f"[{row['category']}] ({row['sentiment']}): '{row['text'][:150]}...'")
                
                cohort_text = "\n".join(snippets)
                
                summary_prompt = f"""
                You are a senior executive brand consultant at Amazon.
                Synthesize the following list of customer reviews and formulate a concise executive markdown report highlighting:
                1. High-level customer sentiment core takeaways.
                2. Primary product attributes customers love.
                3. Critical defects or operational leaks to resolve.
                
                Corpus review list:
                {cohort_text}
                """
                
                try:
                    summary_model = get_gemini_client()
                    result_summary = summary_model.generate_content(summary_prompt)
                    strl.markdown(result_summary.text)
                except Exception as ex:
                    strl.error(f"Failed to compile dynamic insights summary: {ex}")

    strl.markdown("---")

    # -----------------------------------------------------------------------------
    # 9. INTERACTIVE DATAGRID TABLE
    # -----------------------------------------------------------------------------
    strl.subheader("📦 Processed Review Cohort Database Grid")
    
    # Filter controllers
    col_f1, col_f2 = strl.columns(2)
    with col_f1:
        search_query = strl.text_input("🔍 Search original review text or summary key phrases", placeholder="Type keywords...")
    with col_f2:
        cat_filter = strl.selectbox("📂 Department Filter", ["All", "Electronics", "Books", "Home & Kitchen", "Fashion", "Toys & Games", "Food & Grocery", "Sports & Outdoors", "Other"])

    # Apply local dataframe filters
    df_filtered = df_active.copy()
    if search_query:
        df_filtered = df_filtered[df_filtered["text"].str.contains(search_query, case=False, na=False) | df_filtered["summary"].str.contains(search_query, case=False, na=False)]
    if cat_filter != "All":
        df_filtered = df_filtered[df_filtered["category"] == cat_filter]

    # Display filtered datatable
    if df_filtered.empty:
        strl.info("No records matched your specific filter metrics.")
    else:
        # Build nice standard visual layout for each row
        cols_headings = strl.columns([2, 5, 2, 2, 2])
        with cols_headings[0]:
            strl.markdown("**Department**")
        with cols_headings[1]:
            strl.markdown("**Original Customer Review & Multi-Sentence Summary**")
        with cols_headings[2]:
            strl.markdown("**Estimated Sentiment**")
        with cols_headings[3]:
            strl.markdown("**Certainty Score**")
        with cols_headings[4]:
            strl.markdown("**Keywords**")
            
        strl.markdown("<hr style='margin:0 0 10px 0; border:1px solid #e2e8f0;'>", unsafe_allow_html=True)
            
        for index, row in df_filtered.iterrows():
            c1, c2, c3, c4, c5 = strl.columns([2, 5, 2, 2, 2])
            
            with c1:
                strl.code(row["category"])
                
            with c2:
                strl.markdown(f"*{row['text']}*")
                strl.markdown(f"<span style='color:#64748b; font-size:11px;'><b style='color:#FF9900;'>💡 Summarized:</b> {row['summary']}</span>", unsafe_allow_html=True)
                
            with c3:
                badge_class = "badge-positive" if row["sentiment"] == "Positive" else "badge-negative" if row["sentiment"] == "Negative" else "badge-neutral"
                strl.markdown(f"<span class='{badge_class}'>{row['sentiment']}</span>", unsafe_allow_html=True)
                
            with c4:
                strl.write(f"{row['confidence']}%")
                
            with c5:
                # Format tag displays
                tags = row["keywords"].split(",") if isinstance(row["keywords"], str) else row["keywords"]
                for t in tags[:3]:
                    strl.markdown(f"<span style='background-color:#f1f5f9; color:#475569; padding:2px 6px; font-size:10px; border-radius:4px; margin-right:3px; display:inline-block;'>{t.strip().lower()}</span>", unsafe_allow_html=True)
            
            strl.markdown("<hr style='margin:8px 0; border-top:1px solid #f1f5f9;'>", unsafe_allow_html=True)

# Footer Info
strl.markdown("####")
strl.markdown("<div style='text-align:center; color:#94a3b8; font-size:11px;'>© 2026 Amazon Product Review Sentiment Analysis. Single-file Python codebase for local execution.</div>", unsafe_allow_html=True)
