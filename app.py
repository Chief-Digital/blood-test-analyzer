import os
from functools import wraps
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory, session, redirect, url_for
from flask_cors import CORS
from authlib.integrations.flask_client import OAuth
import anthropic
import database as db

# Load .env file if present
_env_path = Path(__file__).parent / ".env"
if _env_path.exists():
    for _line in _env_path.read_text().splitlines():
        _line = _line.strip()
        if _line and not _line.startswith("#") and "=" in _line:
            _k, _v = _line.split("=", 1)
            os.environ.setdefault(_k.strip(), _v.strip())

app = Flask(__name__, static_folder="static", template_folder="templates")
app.secret_key = os.environ.get("SECRET_KEY", "dev-secret-change-in-prod")
CORS(app)

db.init_db()

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

# ─── Google OAuth ───────────────────────────────────────────────────────────────

oauth = OAuth(app)
google = oauth.register(
    name="google",
    client_id=os.environ.get("GOOGLE_CLIENT_ID"),
    client_secret=os.environ.get("GOOGLE_CLIENT_SECRET"),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)


def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated


# ─── Prompts ────────────────────────────────────────────────────────────────────

LANG_INSTRUCTION = {
    "he": "חשוב מאוד: כתוב את כל התשובה שלך בעברית בלבד, ללא קשר לשפת המסמך. אל תשתמש באנגלית בשום מקרה. השתמש במינוח מקצועי רפואי בעברית.",
    "en": "Important: Write your entire response in English only, regardless of the document's language."
}

WESTERN_PROMPT = {
    "he": """אתה מומחה בניתוח בדיקות מעבדה ורופא קליני.
נתח את תוצאות בדיקות הדם במסמך PDF זה.

ספק ניתוח מקיף לפי רפואה מערבית הכולל:

1. **סיכום ממצאים עיקריים** — רשום את כל הערכים החריגים (גבוהים/נמוכים) עם משמעותם הקלינית
2. **ניתוח לפי מערכות גוף** — ארגן את הממצאים לפי מערכות (מטבולית, כבד, כליות, המטולוגיה, בלוטת התריס, שומני דם, וכו')
3. **פרשנות קלינית** — מה הממצאים מצביעים על בריאות המטופל
4. **ערכים בטווח תקין** — ציין בקצרה אילו תחומים תקינים
5. **המלצות** — בדיקות המשך מוצעות, שינויי אורח חיים, תחומים למעקב

השתמש בשפה מקצועית וברורה המתאימה למטפל בריאות.
פרמט עם כותרות markdown ונקודות לקריאות.
היה מקיף אך מאורגן.""",

    "en": """You are a clinical laboratory expert and physician.
Analyze the blood test results in this PDF document.

Provide a thorough Western medicine interpretation including:

1. **Summary of Key Findings** — list all abnormal values (high/low) with their clinical significance
2. **System-by-System Analysis** — organize findings by body system (e.g., metabolic, hepatic, renal, hematologic, thyroid, lipids, etc.)
3. **Clinical Interpretation** — what these patterns suggest about the patient's health
4. **Values Within Normal Range** — briefly note which areas look healthy
5. **Recommendations** — suggested follow-up tests, lifestyle considerations, or areas to monitor

Use clear, professional language suitable for a healthcare practitioner.
Format with markdown headers and bullet points for readability.
Be thorough but organized."""
}

CHINESE_PROMPT = {
    "he": """אתה מומחה ברפואה סינית מסורתית (RSM) עם ידע עמוק על הקשר בין ערכי בדיקות דם לדפוסי אבחון RSM.

נתח את תוצאות בדיקות הדם במסמך PDF זה מנקודת מבט של רפואה סינית.

ספק ניתוח מקיף הכולל:

1. **זיהוי דפוסי RSM** — זהה את דפוסי/תסמונות RSM העיקריים (למשל: חסר Qi, חסר דם, חסר Yin, לחות-חום, חסר Yin/Yang של הכליה, עצירת Qi של הכבד, וכו')
2. **ניתוח חמשת היסודות** — אילו מערכות איברים (Zang-Fu) מושפעות וכיצד הן קשורות
3. **פרשנות ממצאים ספציפיים** — הסבר כל ממצא משמעותי דרך עדשת RSM:
   - ספירת דם → איכות הדם, תפקוד הטחול/הלב
   - אנזימי כבד → Qi הכבד, לחות-חום
   - תפקודי כליה → Jing הכליה, המהות
   - סוכר בדם → תפקוד הטחול/לבלב, לחות
   - שומני דם → ליחה, לחות
   - בלוטת התריס → Yang הכליה, מטבוליזם
4. **מתאמי לשון ודופק** — על פי הדפוס, אילו סימני לשון ודופק היית מצפה
5. **עקרונות טיפול RSM** — אסטרטגיות טיפול עיקריות (חיזוק Qi, תזון דם, פינוי חום, וכו')
6. **שיקולי מרשם צמחים** — הצע קטגוריות נוסחאות קלאסיות רלוונטיות
7. **נקודות דיקור** — נקודות ומרידיאנים מרכזיים לטיפול
8. **המלצות תזונה ואורח חיים** — מנקודת מבט RSM

השתמש במינוח RSM עם הסברים קצרים, המתאים למטפל RSM.
פרמט עם כותרות markdown ונקודות.""",

    "en": """You are an expert in Traditional Chinese Medicine (TCM) with deep knowledge of how blood test markers correlate to TCM patterns and diagnoses.

Analyze the blood test results in this PDF document from a TCM perspective.

Provide a thorough TCM interpretation including:

1. **TCM Pattern Identification** — identify the main TCM patterns/syndromes present (e.g., Qi deficiency, Blood deficiency, Yin deficiency, Damp-Heat, Kidney Yin/Yang deficiency, Liver Qi stagnation, etc.)
2. **Five Elements Analysis** — which organ systems (Zang-Fu) are affected and how they relate
3. **Specific Marker Interpretations** — explain each significant finding through a TCM lens:
   - CBC findings → Blood quality, Spleen/Heart function
   - Liver enzymes → Liver Qi, Damp-Heat
   - Kidney markers → Kidney Jing, Essence
   - Blood sugar → Spleen/Pancreas function, Dampness
   - Lipids → Phlegm, Dampness
   - Thyroid → Kidney Yang, Metabolism
4. **Tongue and Pulse Correlations** — based on the pattern, what tongue and pulse signs would you expect
5. **TCM Treatment Principles** — main treatment strategies (Bu Qi, Nourish Blood, Clear Heat, etc.)
6. **Herbal Formula Considerations** — suggest relevant classical formula categories
7. **Acupuncture Points** — key points and meridians to address
8. **Dietary and Lifestyle Recommendations** — from a TCM perspective

Use TCM terminology with brief explanations, appropriate for a TCM practitioner.
Format with markdown headers and bullet points."""
}

SUMMARY_PROMPT = {
    "he": """על בסיס תוצאות בדיקות הדם ב-PDF זה, ספק סיכום קצר של 2-3 משפטים המתאים ככותרת/תצוגה מקדימה לניתוח זה.
כלול: הבעיות הבריאותיות העיקריות שזוהו, הממצאים המשמעותיים ביותר.
היה תמציתי וקליני. אל תכלול שמות מטופלים. כתוב בעברית.""",
    "en": """Based on the blood test results in this PDF, provide a brief 2-3 sentence summary suitable as a title/preview for this analysis.
Include: patient's main health concerns identified, most significant findings.
Be concise and clinical. Do not use patient names."""
}

CHAT_SYSTEM = {
    "he": """אתה מומחה רפואי המסייע למטפל להבין תוצאות בדיקות דם של מטופל.
ענה בעברית בלבד, בצורה מקצועית וברורה.
אם שואלים על נושא שאינו קשור לבדיקות הדם או לבריאות, הפנה בנעימות את המשתמש לנושא הבדיקות.

להלן ניתוח הבדיקות של המטופל:

## ניתוח רפואה מערבית
{western}

## ניתוח רפואה סינית
{chinese}

## סיכום
{summary}""",
    "en": """You are a medical expert helping a therapist understand a patient's blood test results.
Answer in English only, clearly and professionally.
If asked about something unrelated to the blood tests or health, gently redirect to the test results.

Below is the patient's analysis:

## Western Medicine Analysis
{western}

## Chinese Medicine Analysis
{chinese}

## Summary
{summary}"""
}


def analyze_pdf_with_claude(pdf_bytes: bytes, filename: str, lang: str = "he") -> dict:
    """Upload PDF to Files API and analyze with Claude."""

    if lang not in ("he", "en"):
        lang = "he"

    file_tuple = (filename, pdf_bytes, "application/pdf")
    uploaded = client.beta.files.upload(file=file_tuple)
    file_id = uploaded.id

    lang_instruction = LANG_INSTRUCTION[lang]

    try:
        def analyze(prompt_text):
            response = client.beta.messages.create(
                model="claude-opus-4-6",
                max_tokens=4096,
                thinking={"type": "adaptive"},
                system=lang_instruction,
                messages=[{
                    "role": "user",
                    "content": [
                        {
                            "type": "document",
                            "source": {"type": "file", "file_id": file_id}
                        },
                        {
                            "type": "text",
                            "text": prompt_text
                        }
                    ]
                }],
                betas=["files-api-2025-04-14"]
            )
            return "\n".join(
                b.text for b in response.content if b.type == "text"
            )

        western = analyze(WESTERN_PROMPT[lang])
        chinese = analyze(CHINESE_PROMPT[lang])
        summary = analyze(SUMMARY_PROMPT[lang])

    finally:
        try:
            client.beta.files.delete(file_id)
        except Exception:
            pass

    return {
        "western": western,
        "chinese": chinese,
        "summary": summary
    }


# ─── Auth Routes ────────────────────────────────────────────────────────────────

@app.route("/login")
def login_page():
    if "user_id" in session:
        return redirect("/")
    return send_from_directory("templates", "login.html")


@app.route("/auth/login")
def auth_login():
    redirect_uri = url_for("auth_callback", _external=True)
    return google.authorize_redirect(redirect_uri)


@app.route("/auth/callback")
def auth_callback():
    token = google.authorize_access_token()
    info = token["userinfo"]
    user = db.get_or_create_user(
        google_id=info["sub"],
        email=info["email"],
        name=info.get("name", info["email"])
    )
    session["user_id"] = user["id"]
    session["user_name"] = user["name"]
    session["user_email"] = user["email"]
    return redirect("/")


@app.route("/auth/logout")
def auth_logout():
    session.clear()
    return redirect("/login")


@app.route("/api/me")
@require_auth
def me():
    return jsonify({
        "name": session["user_name"],
        "email": session["user_email"]
    })


# ─── App Route ──────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    if "user_id" not in session:
        return redirect("/login")
    return send_from_directory("templates", "index.html")


# ─── Analysis Routes ────────────────────────────────────────────────────────────

@app.route("/api/analyze", methods=["POST"])
@require_auth
def analyze():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    f = request.files["file"]
    if not f.filename.lower().endswith(".pdf"):
        return jsonify({"error": "Only PDF files are supported"}), 400

    name = request.form.get("name", "").strip()
    folder_id = request.form.get("folder_id")
    lang = request.form.get("lang", "he")
    if folder_id == "" or folder_id == "null":
        folder_id = None
    elif folder_id:
        folder_id = int(folder_id)

    pdf_bytes = f.read()
    filename = f.filename
    user_id = session["user_id"]

    try:
        result = analyze_pdf_with_claude(pdf_bytes, filename, lang=lang)
    except Exception as e:
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500

    if not name:
        first_line = result["summary"].split("\n")[0][:60]
        name = first_line if first_line else filename.replace(".pdf", "")

    analysis = db.save_analysis(
        user_id=user_id,
        name=name,
        file_name=filename,
        western=result["western"],
        chinese=result["chinese"],
        summary=result["summary"],
        folder_id=folder_id
    )

    return jsonify(analysis), 201


@app.route("/api/analyses", methods=["GET"])
@require_auth
def list_analyses():
    folder_id = request.args.get("folder_id")
    analyses = db.get_all_analyses(session["user_id"], folder_id)
    return jsonify(analyses)


@app.route("/api/analyses/<int:analysis_id>", methods=["GET"])
@require_auth
def get_analysis(analysis_id):
    analysis = db.get_analysis(session["user_id"], analysis_id)
    if not analysis:
        return jsonify({"error": "Not found"}), 404
    return jsonify(analysis)


@app.route("/api/analyses/<int:analysis_id>/rename", methods=["POST"])
@require_auth
def rename_analysis(analysis_id):
    data = request.json
    new_name = data.get("name", "").strip()
    if not new_name:
        return jsonify({"error": "Name required"}), 400
    ok = db.rename_analysis(session["user_id"], analysis_id, new_name)
    if not ok:
        return jsonify({"error": "Not found"}), 404
    return jsonify({"success": True})


@app.route("/api/analyses/<int:analysis_id>/move", methods=["POST"])
@require_auth
def move_analysis(analysis_id):
    data = request.json
    folder_id = data.get("folder_id")
    if folder_id == "" or folder_id is None:
        folder_id = None
    else:
        folder_id = int(folder_id)
    ok = db.move_analysis(session["user_id"], analysis_id, folder_id)
    if not ok:
        return jsonify({"error": "Not found"}), 404
    return jsonify({"success": True})


@app.route("/api/analyses/<int:analysis_id>", methods=["DELETE"])
@require_auth
def delete_analysis(analysis_id):
    ok = db.delete_analysis(session["user_id"], analysis_id)
    if not ok:
        return jsonify({"error": "Not found"}), 404
    return jsonify({"success": True})


@app.route("/api/analyses/<int:analysis_id>/chat", methods=["POST"])
@require_auth
def chat_analysis(analysis_id):
    analysis = db.get_analysis(session["user_id"], analysis_id)
    if not analysis:
        return jsonify({"error": "Not found"}), 404

    data = request.json
    user_message = data.get("message", "").strip()
    history = data.get("history", [])
    lang = data.get("lang", "he")
    if lang not in ("he", "en"):
        lang = "he"

    if not user_message:
        return jsonify({"error": "Message required"}), 400

    system_prompt = CHAT_SYSTEM[lang].format(
        western=analysis["western_analysis"] or "",
        chinese=analysis["chinese_analysis"] or "",
        summary=analysis["summary"] or ""
    )
    messages = history + [{"role": "user", "content": user_message}]

    try:
        response = client.messages.create(
            model="claude-opus-4-6",
            max_tokens=2048,
            thinking={"type": "adaptive"},
            system=system_prompt,
            messages=messages
        )
        reply = "\n".join(b.text for b in response.content if b.type == "text")
        return jsonify({"reply": reply})
    except Exception as e:
        return jsonify({"error": f"Chat failed: {str(e)}"}), 500


# ─── Folder Routes ──────────────────────────────────────────────────────────────

@app.route("/api/folders", methods=["GET"])
@require_auth
def list_folders():
    folders = db.get_folders(session["user_id"])
    return jsonify(folders)


@app.route("/api/folders", methods=["POST"])
@require_auth
def create_folder():
    data = request.json
    name = data.get("name", "").strip()
    if not name:
        return jsonify({"error": "Folder name required"}), 400
    folder = db.create_folder(session["user_id"], name)
    return jsonify(folder), 201


@app.route("/api/folders/<int:folder_id>/rename", methods=["POST"])
@require_auth
def rename_folder(folder_id):
    data = request.json
    new_name = data.get("name", "").strip()
    if not new_name:
        return jsonify({"error": "Name required"}), 400
    ok = db.rename_folder(session["user_id"], folder_id, new_name)
    if not ok:
        return jsonify({"error": "Not found"}), 404
    return jsonify({"success": True})


@app.route("/api/folders/<int:folder_id>", methods=["DELETE"])
@require_auth
def delete_folder(folder_id):
    ok = db.delete_folder(session["user_id"], folder_id)
    if not ok:
        return jsonify({"error": "Not found"}), 404
    return jsonify({"success": True})


if __name__ == "__main__":
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("WARNING: ANTHROPIC_API_KEY not set.")
    print("Starting Blood Test Analyzer on http://localhost:5050")
    app.run(debug=False, port=5050)
