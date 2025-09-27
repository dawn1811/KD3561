import os
import re
import json
import uuid
import threading
import time
import io
import pandas as pd
import bcrypt
from datetime import datetime, timedelta, timezone
from firebase_functions import scheduler_fn
from firebase_functions import https_fn, firestore_fn, options
from firebase_admin import firestore, auth, messaging

# --- Globals ---
db = None
gc = None
drive_service = None
sheets_service = None

# --- Config ---
SERVICE_ACCOUNT_KEY_CONTENT = os.environ.get("SERVICE_ACCOUNT_KEY_JSON")
KVK_FOLDER_MAPPINGS_JSON = os.environ.get("KVK_FOLDER_MAPPINGS_JSON")

COLUMN_NAME_MAP = {
    # --- Governor ID mappings ---
    'Governor id': 'Governor ID', 
    'Governor ID': 'Governor ID', 
    'governor_id': 'Governor ID', 
    'governor id': 'Governor ID', 
    'Governor Id': 'Governor ID',
    'Governorid': 'Governor ID', 
    'GovernorID': 'Governor ID', 
    'governorid': 'Governor ID', 
    'GovernorId': 'Governor ID',
    
    'Governor Name': 'Governor Name', 
    'Governor Name': 'Governor Name', 
    'governor_name': 'Governor Name', 
    'governor name': 'Governor Name', 
    'Governorname': 'Governor Name', 
    'GovernorName': 'Governor Name', 
    'governorname': 'Governor Name', 
    
    'power': 'Power',
    'power': 'Power',

    'total kp': 'Total KP',
    'total KP': 'Total KP',
    'Total Kp': 'Total KP',
    'Total kp': 'Total KP',
    'totalkp': 'Total KP',
    'totalKP': 'Total KP',
    'TotalKp': 'Total KP',
    'Totalkp': 'Total KP',
    'totalKp': 'Total KP',
    'KP Total': 'Total KP',
    'Total Kill Points': 'Total KP',
    'total kill points': 'Total KP',
    'Total kill points': 'Total KP',
    'Total killpoints': 'Total KP',
    'Total KillPoints': 'Total KP',
    'Total Killpoints': 'Total KP',
    'Total Kill points': 'Total KP',

    'total dkp': 'Total DKP',
    'Total Dkp': 'Total DKP',
    'TotalDKP': 'Total DKP',
    'TotalDkp': 'Total DKP',
    'totaldkp': 'Total DKP',
    'DKP Total': 'Total DKP',
    'Dkp Total': 'Total DKP',
    'dkp total': 'Total DKP',
    'DKPTotal': 'Total DKP',
    'DkpTotal': 'Total DKP',
    'dkptotal': 'Total DKP',
    
    't4 kills': 'T4 Kills',
    'T4 Kills': 'T4 Kills',
    'tier 4 kills': 'T4 Kills',
    'Tier 4 kills': 'T4 Kills',

    't5 kills': 'T5 Kills',
    'T5 Kills': 'T5 Kills',
    'tier 5 kills': 'T5 Kills',
    'Tier 5 kills': 'T5 Kills',

    'dead': 'Deads',
    'Dead': 'Deads',
    'deads': 'Deads',
    'Deads': 'Deads',
    'Dead Troops': 'Deads',
    'dead troops': 'Deads',
    'DeadTroops': 'Deads',
    'deadtroops': 'Deads',
    
    'alliance tag': 'Alliance',
    
    'Helps Given': 'Helps',
    'HelpsGiven': 'Helps',
    'helps given': 'Helps',
    'helpsgiven': 'Helps',
    
    'resourcesGathered': 'Resources Gathered',
    
    'Lost Kingdom Count': 'Lost Kingdom Count',
    'LostKingdomCount': 'Lost Kingdom Count',
    'lost kingdom count': 'Lost Kingdom Count',
    'lostkingdomcount': 'Lost Kingdom Count',
    
    'lkMostKilled': 'LK Most Killed',
    
    'lkMostLost': 'LK Most Lost',
    
    'lkMostHealed': 'LK Most Healed',
}

MAX_BATCH_SIZE = 499


# --- Init services ---
def init_services():
    """Initialize Firebase, gspread, Google Drive/Sheets APIs"""
    global db, gc, drive_service, sheets_service
    if db and gc and drive_service and sheets_service:
        return

    import firebase_admin
    from firebase_admin import credentials, firestore as fs
    import gspread
    from google.oauth2 import service_account
    from googleapiclient.discovery import build

    if not firebase_admin._apps:
        if SERVICE_ACCOUNT_KEY_CONTENT:
            sa_info = json.loads(SERVICE_ACCOUNT_KEY_CONTENT)
            cred = credentials.Certificate(sa_info)
            firebase_admin.initialize_app(cred)
        else:
            firebase_admin.initialize_app()

    db = fs.client()

    if SERVICE_ACCOUNT_KEY_CONTENT:
        sa_info = json.loads(SERVICE_ACCOUNT_KEY_CONTENT)
        gc = gspread.service_account_from_dict(sa_info)

        creds = service_account.Credentials.from_service_account_info(
            sa_info,
            scopes=[
                "https://www.googleapis.com/auth/drive.readonly",
                "https://www.googleapis.com/auth/spreadsheets.readonly",
            ],
        )
        drive_service = build("drive", "v3", credentials=creds)
        sheets_service = build("sheets", "v4", credentials=creds)


# --- KVK Sync Function ---
@https_fn.on_request(memory=options.MemoryOption.GB_1, timeout_sec=540)
def sync_kvk_folder(request: https_fn.Request) -> https_fn.Response:
    """
    Reads spreadsheets from Drive folder, normalizes, calculates DKP, saves to Firestore.
    """
    try:
        kvk_name = request.args.get("kvk")
        folder_id = request.args.get("folderId")
        if not kvk_name or not folder_id:
            return https_fn.Response("Missing kvk or folderId", status=400)

        init_services()
        global drive_service, sheets_service

        results = drive_service.files().list(
            q=f"'{folder_id}' in parents and mimeType='application/vnd.google-apps.spreadsheet'",
            fields="files(id, name)",
        ).execute()
        files = results.get("files", [])

        for f in files:
            sheet_id, sheet_name = f["id"], f["name"]
            print(f"📄 Processing {sheet_name}")

            sheet_metadata = sheets_service.spreadsheets().get(spreadsheetId=sheet_id).execute()
            sheet_tabs = [s["properties"]["title"] for s in sheet_metadata["sheets"]]

            for tab in sheet_tabs:
                values = sheets_service.spreadsheets().values().get(
                    spreadsheetId=sheet_id, range=tab
                ).execute().get("values", [])

                if not values:
                    continue

                headers, rows = values[0], values[1:]
                df = pd.DataFrame(rows, columns=headers)

                for col in ["GovernorID", "Power", "TotalKP", "T4Kills", "T5Kills", "Deads"]:
                    if col not in df.columns:
                        df[col] = 0

                for _, row in df.iterrows():
                    try:
                        gov_id = str(row["GovernorID"]).strip()
                        if not gov_id:
                            continue

                        power = int(row.get("Power", 0) or 0)
                        total_kp = int(row.get("TotalKP", 0) or 0)
                        t4 = int(row.get("T4Kills", 0) or 0)
                        t5 = int(row.get("T5Kills", 0) or 0)
                        deads = int(row.get("Deads", 0) or 0)

                        player_ref = db.collection("kvk_stats").document(kvk_name).collection("players").document(gov_id)
                        player_doc = player_ref.get()

                        if not player_doc.exists:
                            baseline = {"power": power, "totalKP": total_kp, "killsT4": t4, "killsT5": t5, "deads": deads}
                            player_ref.set({"baseline": baseline})
                        else:
                            baseline = player_doc.to_dict().get("baseline", {})

                        delta_t4 = t4 - int(baseline.get("killsT4", 0))
                        delta_t5 = t5 - int(baseline.get("killsT5", 0))
                        delta_deads = deads - int(baseline.get("deads", 0))
                        delta_power = power - int(baseline.get("power", 0))
                        delta_kp = total_kp - int(baseline.get("totalKP", 0))

                        dkp = (delta_t4 * 5) + (delta_t5 * 10) + (delta_deads * 20)

                        date_id = sheet_name.replace(" ", "_")
                        snapshot_ref = player_ref.collection("snapshots").document(date_id)
                        snapshot_ref.set(
                            {
                                "power": power,
                                "totalKP": total_kp,
                                "killsT4": t4,
                                "killsT5": t5,
                                "deads": deads,
                                "deltaPower": delta_power,
                                "deltaKP": delta_kp,
                                "deltaT4": delta_t4,
                                "deltaT5": delta_t5,
                                "deltaDeads": delta_deads,
                                "dkp": dkp,
                                "updatedAt": firestore.SERVER_TIMESTAMP,
                            },
                            merge=True,
                        )

                    except Exception as e:
                        print(f"❌ Error processing row: {e}")

        return https_fn.Response(f"✅ Finished syncing {kvk_name}", status=200)
    except Exception as e:
        return https_fn.Response(f"Error: {e}", status=500)


# --- Daily Scheduled Sync ---
@scheduler_fn.on_schedule(schedule="0 3 * * *") # Use scheduler_fn for scheduled tasks
def your_scheduled_function(event: scheduler_fn.ScheduledEvent) -> None:
    # Your function logic here
    print(f"Scheduled job ran at {event.schedule_time}")
    print(f"Job name: {event.job_name}")



# --- Auth: Register ---
INVITE_CODES = {"OFFICER_SECRET": "officer", "KING_SECRET": "king"}

@https_fn.on_request()
def register(request: https_fn.Request) -> https_fn.Response:
    try:
        if request.method != "POST":
            return https_fn.Response("Method Not Allowed", status=405)

        data = request.json
        gov_id = data.get("governorId")
        password = data.get("password")
        invite_code = data.get("inviteCode")

        if not gov_id or not password:
            return https_fn.Response("Missing governorId or password", status=400)

        user_doc = db.collection("players_auth").document(gov_id).get()
        if user_doc.exists:
            return https_fn.Response("Governor already registered", status=400)

        hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode()

        role = "governor"
        if invite_code in INVITE_CODES:
            role = INVITE_CODES[invite_code]

        db.collection("players_auth").document(gov_id).set(
            {"password_hash": hashed, "role": role, "createdAt": firestore.SERVER_TIMESTAMP}
        )

        custom_token = auth.create_custom_token(gov_id, {"role": role})
        return https_fn.Response(
            json.dumps({"token": custom_token.decode(), "role": role}),
            status=200,
            headers={"Content-Type": "application/json"},
        )
    except Exception as e:
        return https_fn.Response(f"Error: {e}", status=500)


# --- Auth: Login ---
@https_fn.on_request()
def login(request: https_fn.Request) -> https_fn.Response:
    try:
        if request.method != "POST":
            return https_fn.Response("Method Not Allowed", status=405)

        data = request.json
        gov_id = data.get("governorId")
        password = data.get("password")

        if not gov_id or not password:
            return https_fn.Response("Missing credentials", status=400)

        user_doc = db.collection("players_auth").document(gov_id).get()
        if not user_doc.exists:
            return https_fn.Response("User not found", status=404)

        stored_hash = user_doc.to_dict().get("password_hash")
        if not stored_hash or not bcrypt.checkpw(password.encode("utf-8"), stored_hash.encode("utf-8")):
            return https_fn.Response("Unauthorized", status=401)

        custom_token = auth.create_custom_token(gov_id, {"role": "governor"})
        return https_fn.Response(
            json.dumps({"token": custom_token.decode()}),
            status=200,
            headers={"Content-Type": "application/json"},
        )
    except Exception as e:
        return https_fn.Response(f"Error: {e}", status=500)
