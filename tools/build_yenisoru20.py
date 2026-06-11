import json
import re
from collections import Counter, defaultdict
from difflib import SequenceMatcher
from pathlib import Path

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
DB_DIR = ROOT / "db"
OUT_DIR = ROOT / "reports"
OUT_DIR.mkdir(exist_ok=True)

CURRENT_DB = DB_DIR / "soru20.db"
PROTECTED_DB = DB_DIR / "soru20koru.db"
NEW_DB = DB_DIR / "yenisoru20.db"
REPORT = OUT_DIR / "yenisoru20_audit_report.json"
KAZANIM_TEXT = OUT_DIR / "kazanımlar_d2_text.json"


KEEP_QUESTION_FIELDS = [
    "id",
    "subject",
    "order",
    "question",
    "options",
    "answer",
    "explanation",
    "spot",
    "sourceNote",
    "hasImage",
    "images",
    "suspicious",
    "relatedQuestionIds",
    "image",
    "imageUrl",
    "metadata",
]

KEEP_META_FIELDS = [
    "examGroup",
    "year",
    "teacher",
    "topic",
    "target",
    "target_code",
    "target_title",
    "target_content",
    "course",
    "sourceGroup",
    "source",
    "sourceNo",
    "globalNo",
    "status",
    "confidence",
    "validation",
    "aiEdited",
    "aiInterventionNote",
    "answerValidation",
    "hasImage",
    "images",
    "suspicious",
    "suspicionReason",
    "suspicionReasons",
    "relatedQuestionIds",
    "exampleQuestionIds",
    "kurulSimilarQuestionIds",
    "relatedQuestionCount",
    "mergedFromFiles",
    "image",
    "imageUrl",
]


def load_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def normalize(value):
    s = str(value or "").lower()
    tr = str.maketrans("çğıöşüâîû", "cgiosuaiu")
    s = s.translate(tr)
    s = re.sub(r"[^a-z0-9]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def answer_label(q):
    ans = q.get("answer") or {}
    letter = str(ans.get("letter") or "").strip().upper()
    text = str(ans.get("text") or ans.get("raw") or "").strip()
    idx = ans.get("index")
    return {"letter": letter, "text": text, "index": idx}


def question_signature(q):
    option_text = " ".join(str(o.get("text", "")) for o in q.get("options") or [] if isinstance(o, dict))
    return normalize(" ".join([q.get("subject", ""), q.get("question", ""), option_text]))


def similarity(a, b):
    if not a or not b:
        return 0.0
    return SequenceMatcher(None, a, b).ratio()


def find_kazanim_dir():
    downloads = Path.home() / "Downloads"
    for item in downloads.iterdir():
        if item.is_dir() and "kazan" in normalize(item.name) and "d2" in normalize(item.name):
            return item
    return None


def extract_kazanim_texts():
    base = find_kazanim_dir()
    files = []
    combined = ""
    if not base:
        return {"base": None, "files": [], "combined": ""}
    for path in sorted(base.glob("*.PDF")):
        reader = PdfReader(str(path))
        text = "\n".join((page.extract_text() or "") for page in reader.pages)
        files.append({"name": path.name, "pages": len(reader.pages), "chars": len(text), "text": text})
        combined += "\n\n" + text
    KAZANIM_TEXT.write_text(json.dumps({"base": str(base), "files": files}, ensure_ascii=False, indent=2), encoding="utf-8")
    return {"base": str(base), "files": files, "combined": combined}


def infer_course_from_kazanim(target_text):
    target_norm = normalize(target_text)
    if not target_norm:
        return None
    course_patterns = [
        ("TIP211", "Kurul 1"),
        ("TIP212", "Kurul 2"),
        ("TIP213", "Kurul 3"),
        ("TIP214", "Kurul 4"),
        ("TIP215", "Kurul 5"),
    ]
    return course_patterns


def kazanım_match(q, kazanım_blob):
    md = q.get("metadata") or {}
    target = " ".join(str(md.get(k, "")) for k in ["target_code", "target", "target_title", "target_content", "topic"])
    target_norm = normalize(target)
    blob_norm = normalize(kazanım_blob)
    if not target_norm or not blob_norm:
        return {"status": "not_checked", "score": 0, "note": "Kazanım veya hedef metni boş."}

    chunks = [t for t in target_norm.split() if len(t) > 4][:12]
    hits = sum(1 for t in chunks if t in blob_norm)
    score = hits / max(1, len(chunks))
    if score >= 0.55:
        status = "matched"
    elif score >= 0.25:
        status = "weak_match"
    else:
        status = "needs_review"
    return {
        "status": status,
        "score": round(score, 3),
        "note": "Kazanım PDF metinleri üzerinden otomatik anahtar kelime eşleştirmesi.",
    }


def protected_maps(protected_questions):
    by_id = {}
    by_sig = {}
    for q in protected_questions:
        if q.get("id"):
            by_id[str(q["id"])] = q
        sig = question_signature(q)
        if sig:
            by_sig[sig] = q
    return by_id, by_sig


def find_protected_match(q, by_id, by_sig):
    if q.get("id") and str(q["id"]) in by_id:
        return by_id[str(q["id"])], "id", 1.0
    sig = question_signature(q)
    if sig in by_sig:
        return by_sig[sig], "signature", 1.0
    return None, "none", 0.0


def clean_question(q):
    out = {k: q[k] for k in KEEP_QUESTION_FIELDS if k in q}
    images = out.get("images")
    if not isinstance(images, list):
        images = []
    if out.get("image") and out.get("image") not in images:
        images.append(out.get("image"))
    if out.get("imageUrl") and out.get("imageUrl") not in images:
        images.append(out.get("imageUrl"))
    out["images"] = images
    out["hasImage"] = bool(images or out.get("hasImage"))
    out.pop("image", None)
    out.pop("imageUrl", None)
    md = dict(out.get("metadata") or {})
    cleaned_md = {k: md[k] for k in KEEP_META_FIELDS if k in md and md[k] not in ("", None, [], {})}
    out["metadata"] = cleaned_md
    if not out.get("spot"):
        out.pop("spot", None)
    if not out.get("sourceNote"):
        out.pop("sourceNote", None)
    if not out.get("explanation"):
        out.pop("explanation", None)
    return out


def main():
    current = load_json(CURRENT_DB)
    protected = load_json(PROTECTED_DB)
    current_qs = current.get("questions") or []
    protected_qs = protected.get("questions") or []
    protected_by_id, protected_by_sig = protected_maps(protected_qs)
    kazanım = extract_kazanim_texts()

    new_questions = []
    stats = Counter()
    differences = []
    interventions = []
    missing_in_protected = []

    for idx, q in enumerate(current_qs):
        stats["current_questions"] += 1
        pq, match_type, match_score = find_protected_match(q, protected_by_id, protected_by_sig)
        q2 = json.loads(json.dumps(q, ensure_ascii=False))
        md = q2.setdefault("metadata", {})

        if not pq:
            stats["missing_in_protected"] += 1
            missing_in_protected.append({"id": q.get("id"), "subject": q.get("subject"), "question": q.get("question", "")[:180]})
        else:
            cur_ans = answer_label(q)
            prot_ans = answer_label(pq)
            if cur_ans != prot_ans:
                stats["answer_differences"] += 1
                differences.append({
                    "id": q.get("id"),
                    "subject": q.get("subject"),
                    "question": q.get("question", "")[:220],
                    "current_answer": cur_ans,
                    "protected_answer": prot_ans,
                    "match_type": match_type,
                })
                # Protected database is treated as guard source for answer correction.
                q2["answer"] = pq.get("answer", q2.get("answer"))
                md["aiEdited"] = True
                md["aiInterventionNote"] = "soru20.db ile soru20koru.db cevap anahtarı uyuşmadı; koruma veritabanındaki cevap temel alınarak düzeltildi. Kaynak/kazanım incelemesi önerilir."
                interventions.append(q.get("id"))

        km = kazanım_match(q2, kazanım["combined"])
        md["validation"] = {
            "protectedDbMatch": match_type,
            "protectedDbSimilarity": match_score,
            "kazanımMatch": km,
            "sourceMatch": {
                "status": "pending_drive_source_text",
                "note": "Drive kaynak dosyaları envantere alındı; PDF ham metin çıkarımı ayrıca tamamlanmalıdır.",
            },
        }
        if km["status"] == "matched":
            stats["kazanım_matched"] += 1
        elif km["status"] == "weak_match":
            stats["kazanım_weak_match"] += 1
        else:
            stats["kazanım_needs_review"] += 1

        new_questions.append(clean_question(q2))

    new_db = {
        "schemaVersion": current.get("schemaVersion", "5.0"),
        "generatedAt": "2026-06-06",
        "questions": new_questions,
        "buildNotes": {
            "base": str(CURRENT_DB),
            "protectedReference": str(PROTECTED_DB),
            "kazanımPdfFolder": kazanım["base"],
            "policy": "Gereksiz ham/tekrarlı metadata kaldırıldı; cevap farkında koruma veritabanı temel alındı; düşük kanıtlı kazanım/kaynak eşleşmeleri validation alanında işaretlendi.",
        },
    }
    NEW_DB.write_text(json.dumps(new_db, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    report = {
        "stats": dict(stats),
        "input": {
            "current": {"path": str(CURRENT_DB), "questions": len(current_qs), "bytes": CURRENT_DB.stat().st_size},
            "protected": {"path": str(PROTECTED_DB), "questions": len(protected_qs), "bytes": PROTECTED_DB.stat().st_size},
            "new": {"path": str(NEW_DB), "questions": len(new_questions), "bytes": NEW_DB.stat().st_size},
            "kazanımFiles": [{"name": f["name"], "pages": f["pages"], "chars": f["chars"]} for f in kazanım["files"]],
        },
        "answerDifferences": differences,
        "aiInterventions": interventions,
        "missingInProtected": missing_in_protected,
    }
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report["input"], ensure_ascii=False, indent=2))
    print(json.dumps(report["stats"], ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
