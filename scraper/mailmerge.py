import argparse
import csv
import getpass
import json
import os
import re
import smtplib
import ssl
from datetime import datetime, timezone
from email.message import EmailMessage
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen


SMTP_SERVER = "smtp.office365.com"
SMTP_PORT = 587
RESEND_API_URL = "https://api.resend.com/emails"

SENDER_EMAIL = "carly@getharvello.com"
TEST_EMAIL = "carlycallans@gmail.com"

BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent
CONTACTS_CSV = BASE_DIR / "contacts.csv"
SENT_CONTACTS_CSV = BASE_DIR / "sent_contacts.csv"
SEND_QUEUE_CSV = SENT_CONTACTS_CSV
TEMPLATE_HTML = BASE_DIR / "template.html"
SENT_STATUS = "Sent"
INVALID_EMAIL_STATUS = "InvalidEmail"
EMAIL_PATTERN = re.compile(r"^[^@\s<>]+@[^@\s<>]+\.[^@\s<>]+$")


def generate_subject(row):
    city = (row.get("City") or row.get("Organization") or "").strip()
    return f"AI chatbot for {city}" if city else "AI chatbot"


def build_message(sender, recipient, subject, html):
    msg = EmailMessage()
    msg["From"] = sender
    msg["To"] = recipient
    msg["Subject"] = subject
    msg.set_content("Please view this email in HTML.")
    msg.add_alternative(html, subtype="html")
    return msg


def load_env_file(path):
    if not path.exists():
        return

    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def send_with_resend(api_key, recipient, subject, html):
    payload = json.dumps(
        {
            "from": f"Harvello <{SENDER_EMAIL}>",
            "to": [recipient],
            "subject": subject,
            "html": html,
        }
    ).encode("utf-8")

    request = Request(
        RESEND_API_URL,
        data=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "HarvelloMailmerge/1.0",
        },
        method="POST",
    )

    try:
        with urlopen(request, timeout=30) as response:
            if response.status >= 300:
                raise RuntimeError(f"Resend returned HTTP {response.status}")
    except HTTPError as error:
        details = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Resend returned HTTP {error.code}: {details}") from error


def write_send_queue(rows):
    fieldnames = ["Email", "FirstName", "City", "Status", "SentAt"]
    with SEND_QUEUE_CSV.open("w", newline="", encoding="utf-8") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow({fieldname: row.get(fieldname, "") for fieldname in fieldnames})


def is_valid_email(email):
    return bool(EMAIL_PATTERN.match(email.strip()))


def cell_value(row, key):
    return (row.get(key) or "").strip()


def main():
    parser = argparse.ArgumentParser(
        description="Send the Harvello email template in test mode or live mode."
    )
    parser.add_argument(
        "--live",
        action="store_true",
        help="Send to every unsent email address in sent_contacts.csv. Without this, sends one test email to you.",
    )
    args = parser.parse_args()

    load_env_file(PROJECT_DIR / ".env.local")
    load_env_file(BASE_DIR / ".env")
    resend_api_key = os.environ.get("RESEND_API_KEY", "").strip()

    template = TEMPLATE_HTML.read_text(encoding="utf-8")
    context = ssl.create_default_context()

    with SEND_QUEUE_CSV.open(newline="", encoding="utf-8-sig") as csvfile:
        reader = csv.DictReader(csvfile)
        rows = list(reader)

    if not rows:
        raise SystemExit(f"No contacts found in {SEND_QUEUE_CSV}")

    unsent_rows = [
        row
        for row in rows
        if cell_value(row, "Status").lower() not in {SENT_STATUS.lower(), INVALID_EMAIL_STATUS.lower()}
    ]
    rows_to_send = unsent_rows if args.live else rows[:1]

    if args.live and not rows_to_send:
        print("No unsent contacts found. Nothing to send.")
        return

    password = None
    if resend_api_key:
        print("Using Resend API.")
    else:
        password = getpass.getpass("Email password: ")

    smtp = None
    if not resend_api_key:
        smtp = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        smtp.starttls(context=context)
        smtp.login(SENDER_EMAIL, password)

    try:
        for row in rows_to_send:
            first_name = cell_value(row, "FirstName")
            city = cell_value(row, "City") or cell_value(row, "Organization")
            contact_email = cell_value(row, "Email")
            recipient = contact_email if args.live else TEST_EMAIL
            subject = cell_value(row, "Subject") or generate_subject(row)

            if args.live and not is_valid_email(recipient):
                row["Status"] = INVALID_EMAIL_STATUS
                row["SentAt"] = ""
                write_send_queue(rows)
                print(
                    f"SKIP: invalid email for {first_name} in {city}: {recipient or '(blank)'}"
                )
                continue

            html = (
                template.replace("{{FirstName}}", first_name).replace(
                    "{{Organization}}", city
                ).replace("{{City}}", city)
            )

            if resend_api_key:
                send_with_resend(resend_api_key, recipient, subject, html)
            else:
                msg = build_message(SENDER_EMAIL, recipient, subject, html)
                smtp.send_message(msg)

            if args.live:
                row["Status"] = SENT_STATUS
                row["SentAt"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
                write_send_queue(rows)

            mode = "LIVE" if args.live else "TEST"
            print(f"{mode}: sent to {recipient} for {first_name} in {city}")
    finally:
        if smtp:
            smtp.quit()

    if args.live:
        skipped_count = len(rows) - len(rows_to_send)
        print(f"Marked {len(rows_to_send)} contacts as sent. Skipped {skipped_count} already sent contacts.")

    print("Done!")


if __name__ == "__main__":
    main()
