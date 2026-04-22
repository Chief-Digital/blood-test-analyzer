import os
import sqlite3
from datetime import datetime

DB_PATH = os.environ.get("DB_PATH", "blood_tests.db")


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_conn()
    c = conn.cursor()

    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            google_id TEXT UNIQUE NOT NULL,
            email TEXT NOT NULL,
            name TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS folders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            name TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    c.execute("""
        CREATE TABLE IF NOT EXISTS analyses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            name TEXT NOT NULL,
            folder_id INTEGER,
            file_name TEXT,
            western_analysis TEXT,
            chinese_analysis TEXT,
            summary TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
        )
    """)

    # Migrate existing tables — add user_id if missing
    for table in ("folders", "analyses"):
        try:
            c.execute(f"ALTER TABLE {table} ADD COLUMN user_id INTEGER")
        except Exception:
            pass  # Column already exists

    conn.commit()
    conn.close()


# --- Users ---

def get_or_create_user(google_id: str, email: str, name: str) -> dict:
    conn = get_conn()
    c = conn.cursor()
    now = datetime.now().isoformat()
    c.execute(
        "INSERT OR IGNORE INTO users (google_id, email, name, created_at) VALUES (?, ?, ?, ?)",
        (google_id, email, name, now)
    )
    conn.commit()
    c.execute("SELECT * FROM users WHERE google_id = ?", (google_id,))
    row = c.fetchone()
    conn.close()
    return dict(row)


# --- Folders ---

def create_folder(user_id: int, name: str) -> dict:
    conn = get_conn()
    c = conn.cursor()
    now = datetime.now().isoformat()
    c.execute(
        "INSERT INTO folders (user_id, name, created_at) VALUES (?, ?, ?)",
        (user_id, name, now)
    )
    folder_id = c.lastrowid
    conn.commit()
    conn.close()
    return {"id": folder_id, "name": name, "created_at": now}


def get_folders(user_id: int) -> list:
    conn = get_conn()
    c = conn.cursor()
    c.execute("SELECT * FROM folders WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
    rows = c.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def rename_folder(user_id: int, folder_id: int, new_name: str) -> bool:
    conn = get_conn()
    c = conn.cursor()
    c.execute(
        "UPDATE folders SET name = ? WHERE id = ? AND user_id = ?",
        (new_name, folder_id, user_id)
    )
    ok = c.rowcount > 0
    conn.commit()
    conn.close()
    return ok


def delete_folder(user_id: int, folder_id: int) -> bool:
    conn = get_conn()
    c = conn.cursor()
    c.execute(
        "UPDATE analyses SET folder_id = NULL WHERE folder_id = ? AND user_id = ?",
        (folder_id, user_id)
    )
    c.execute("DELETE FROM folders WHERE id = ? AND user_id = ?", (folder_id, user_id))
    ok = c.rowcount > 0
    conn.commit()
    conn.close()
    return ok


# --- Analyses ---

def save_analysis(user_id: int, name: str, file_name: str, western: str, chinese: str, summary: str, folder_id=None) -> dict:
    conn = get_conn()
    c = conn.cursor()
    now = datetime.now().isoformat()
    c.execute(
        "INSERT INTO analyses (user_id, name, folder_id, file_name, western_analysis, chinese_analysis, summary, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (user_id, name, folder_id, file_name, western, chinese, summary, now)
    )
    analysis_id = c.lastrowid
    conn.commit()
    conn.close()
    return get_analysis(user_id, analysis_id)


def get_analysis(user_id: int, analysis_id: int) -> dict:
    conn = get_conn()
    c = conn.cursor()
    c.execute("SELECT * FROM analyses WHERE id = ? AND user_id = ?", (analysis_id, user_id))
    row = c.fetchone()
    conn.close()
    return dict(row) if row else None


def get_all_analyses(user_id: int, folder_id=None) -> list:
    conn = get_conn()
    c = conn.cursor()
    if folder_id == "none":
        c.execute(
            "SELECT * FROM analyses WHERE user_id = ? AND folder_id IS NULL ORDER BY created_at DESC",
            (user_id,)
        )
    elif folder_id is not None:
        c.execute(
            "SELECT * FROM analyses WHERE user_id = ? AND folder_id = ? ORDER BY created_at DESC",
            (user_id, folder_id)
        )
    else:
        c.execute(
            "SELECT * FROM analyses WHERE user_id = ? ORDER BY created_at DESC",
            (user_id,)
        )
    rows = c.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def rename_analysis(user_id: int, analysis_id: int, new_name: str) -> bool:
    conn = get_conn()
    c = conn.cursor()
    c.execute(
        "UPDATE analyses SET name = ? WHERE id = ? AND user_id = ?",
        (new_name, analysis_id, user_id)
    )
    ok = c.rowcount > 0
    conn.commit()
    conn.close()
    return ok


def move_analysis(user_id: int, analysis_id: int, folder_id) -> bool:
    conn = get_conn()
    c = conn.cursor()
    c.execute(
        "UPDATE analyses SET folder_id = ? WHERE id = ? AND user_id = ?",
        (folder_id, analysis_id, user_id)
    )
    ok = c.rowcount > 0
    conn.commit()
    conn.close()
    return ok


def delete_analysis(user_id: int, analysis_id: int) -> bool:
    conn = get_conn()
    c = conn.cursor()
    c.execute("DELETE FROM analyses WHERE id = ? AND user_id = ?", (analysis_id, user_id))
    ok = c.rowcount > 0
    conn.commit()
    conn.close()
    return ok
