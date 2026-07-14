#!/usr/bin/env python3
"""
Municipal / Park District Contact Scraper

What it does:
- Reads a CSV of organization names + website URLs
- Crawls a small number of pages on each public website
- Prioritizes staff, directory, communications, marketing, and contact pages
- Extracts publicly listed email addresses
- Attempts to associate each email with a nearby name and job title
- Filters for named communications, marketing, public information, brand,
  social media, and community engagement roles
- Writes a deduplicated CSV

This script intentionally:
- Respects robots.txt
- Uses a clear User-Agent
- Rate-limits requests
- Does not bypass login pages, CAPTCHAs, or access controls
- Does not scrape LinkedIn or private databases
"""

from __future__ import annotations

import argparse
import csv
import re
import sys
import time
from collections import deque
from dataclasses import dataclass, asdict
from html import unescape
from pathlib import Path
from typing import Iterable
from urllib.parse import urljoin, urlparse, urldefrag
from urllib.robotparser import RobotFileParser

import requests
from bs4 import BeautifulSoup


USER_AGENT = (
    "HarvelloPublicContactResearch/1.0 "
    "(public municipal website research; contact: hello@getharvello.com)"
)

TARGET_TITLE_PATTERNS = [
    r"\bmarketing\b",
    r"\bcommunications?\b",
    r"\bpublic information\b",
    r"\bpio\b",
    r"\bcommunity engagement\b",
    r"\bcommunity relations\b",
    r"\bpublic affairs\b",
    r"\bdigital media\b",
    r"\bsocial media\b",
    r"\bbrand strategy\b",
    r"\bbrand(?:ing)?\b",
    r"\bcreative design\b",
    r"\bweb(?:site)?\s+(?:manager|coordinator|specialist|administrator)\b",
    r"\bmedia relations\b",
    r"\b(?:manager|director|coordinator|specialist|superintendent)\b.{0,80}\b(marketing|communications?|public information|community engagement|social media|brand)\b",
    r"\b(marketing|communications?|public information|community engagement|social media|brand)\b.{0,80}\b(?:manager|director|coordinator|specialist|superintendent)\b",
]

PRIORITY_LINK_TERMS = [
    "staff",
    "directory",
    "leadership",
    "administration",
    "about",
    "contact",
    "communications",
    "marketing",
    "public-information",
    "public_information",
    "media",
    "departments",
    "team",
]

GENERIC_EMAIL_PREFIXES = {
    "info", "contact", "admin", "office", "hello", "support", "webmaster",
    "communications", "marketing", "media", "news", "clerk", "sustainability",
    "volunteer", "volunteers", "hr", "humanresources", "jobs", "careers"
}

NAME_PREFIXES_TO_STRIP = (
    "Community Engagement",
    "Public Information",
    "Communications",
    "Marketing",
    "Administration",
)

PHONE_RE = re.compile(r"(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}")
CERTIFICATION_RE = re.compile(r"\b(CPRP|CPA|CPRE|MBA|MPA|SHRM(?:-CP|-SCP)?)\b", re.IGNORECASE)

EMAIL_RE = re.compile(
    r"(?<![\w.+-])([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})(?![\w.-])",
    re.IGNORECASE,
)

TARGET_TITLE_RE = re.compile(
    r"\b("
    r"(?:Director|Manager|Coordinator|Specialist|Superintendent|Officer|Lead|Head|"
    r"Assistant Director|Deputy Director)?"
    r"\s*(?:of\s+)?"
    r"(?:Marketing(?:\s+and\s+Communications?)?|Communications?|Public Information|"
    r"Community Engagement|Community Relations|Public Affairs|Digital Media|Social Media|"
    r"Brand Strategy|Branding|Creative Design|Media Relations|Website)"
    r"(?:\s+(?:and|&)\s+(?:Marketing|Communications?|Public Information|"
    r"Community Engagement|Community Relations|Public Affairs|Digital Media|Social Media|"
    r"Brand Strategy|Branding|Creative Design|Media Relations|Website))?"
    r"(?:\s+(?:Director|Manager|Coordinator|Specialist|Superintendent|Officer|Lead|Head|"
    r"Assistant Director|Deputy Director))?"
    r")\b",
    re.IGNORECASE,
)

NAME_RE = re.compile(
    r"\b([A-Z][a-zA-Z'’-]{1,30}(?:\s+[A-Z][a-zA-Z'’-]{1,30}){1,3})\b"
)


@dataclass
class Contact:
    organization: str
    website: str
    source_url: str
    first_name: str
    last_name: str
    full_name: str
    title: str
    email: str
    confidence: str


def normalize_url(url: str) -> str:
    url = url.strip()
    if not url:
        return ""
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}{parsed.path or '/'}"


def same_domain(url_a: str, url_b: str) -> bool:
    a = urlparse(url_a).netloc.lower().removeprefix("www.")
    b = urlparse(url_b).netloc.lower().removeprefix("www.")
    return a == b


def clean_text(text: str) -> str:
    text = unescape(text or "")
    text = re.sub(r"\s+", " ", text)
    return text.strip(" \t\r\n|•·-–—")


def title_matches(text: str) -> bool:
    lowered = clean_text(text).lower()
    return any(re.search(pattern, lowered, re.IGNORECASE) for pattern in TARGET_TITLE_PATTERNS)


def is_generic_email(email: str) -> bool:
    return email.split("@", 1)[0].lower() in GENERIC_EMAIL_PREFIXES


def split_name(full_name: str) -> tuple[str, str]:
    parts = full_name.split()
    if len(parts) < 2:
        return full_name, ""
    return parts[0], parts[-1]


def looks_like_name(text: str) -> bool:
    text = clean_text(text)
    if not text or len(text) > 80:
        return False
    bad_terms = {
        "park district", "city of", "town of", "village of", "contact us",
        "staff directory", "communications", "marketing", "department",
        "privacy policy", "terms of use", "government", "administrative offices",
        "public information", "community engagement", "social media", "brand strategy", "creative design",
        "information technology", "human resources", "risk management", "finance",
        "accounting", "recreation", "parks planning", "university", "college", "school"
    }
    if any(term in text.lower() for term in bad_terms):
        return False
    return bool(NAME_RE.fullmatch(text))


def clean_name_candidate(text: str) -> str:
    text = clean_text(text)
    for prefix in NAME_PREFIXES_TO_STRIP:
        if text.lower().startswith(prefix.lower() + " "):
            return clean_text(text[len(prefix):])
    return text


def get_robot_parser(session: requests.Session, base_url: str) -> RobotFileParser:
    parsed = urlparse(base_url)
    robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
    rp = RobotFileParser()
    rp.set_url(robots_url)
    try:
        response = session.get(robots_url, timeout=10)
        if response.ok:
            rp.parse(response.text.splitlines())
        else:
            rp.parse([])
    except requests.RequestException:
        rp.parse([])
    return rp


def fetch_html(
    session: requests.Session,
    url: str,
    robot_parser: RobotFileParser,
    delay: float,
) -> str | None:
    if not robot_parser.can_fetch(USER_AGENT, url):
        print(f"  skipped by robots.txt: {url}", file=sys.stderr)
        return None

    time.sleep(delay)
    try:
        response = session.get(url, timeout=20, allow_redirects=True)
        content_type = response.headers.get("content-type", "").lower()
        if response.status_code != 200 or "text/html" not in content_type:
            return None
        return response.text
    except requests.RequestException as exc:
        print(f"  request failed: {url} ({exc})", file=sys.stderr)
        return None


def score_link(url: str, anchor_text: str) -> int:
    haystack = f"{url} {anchor_text}".lower()
    score = 0
    for term in PRIORITY_LINK_TERMS:
        if term in haystack:
            score += 5
    if any(ext in url.lower() for ext in (".pdf", ".jpg", ".png", ".zip", ".doc", ".xls")):
        score -= 100
    return score


def extract_candidate_links(soup: BeautifulSoup, current_url: str, root_url: str) -> list[str]:
    candidates: list[tuple[int, str]] = []
    for tag in soup.find_all("a", href=True):
        raw = tag.get("href", "").strip()
        if not raw or raw.startswith(("mailto:", "tel:", "javascript:", "#")):
            continue
        absolute = urljoin(current_url, raw)
        absolute, _ = urldefrag(absolute)
        if not same_domain(absolute, root_url):
            continue
        parsed = urlparse(absolute)
        if parsed.scheme not in ("http", "https"):
            continue
        score = score_link(absolute, tag.get_text(" ", strip=True))
        if score > -50:
            candidates.append((score, absolute))

    candidates.sort(key=lambda item: item[0], reverse=True)
    seen = set()
    ordered = []
    for _, url in candidates:
        if url not in seen:
            seen.add(url)
            ordered.append(url)
    return ordered


def nearby_text_blocks(node, max_blocks: int = 8) -> list[str]:
    blocks: list[str] = []
    current = node

    # Begin with the closest structured container.
    for parent_name in ("tr", "li", "article", "section", "div", "p"):
        parent = node.find_parent(parent_name)
        if parent:
            text = clean_text(parent.get_text(" ", strip=True))
            if text:
                blocks.append(text)
                current = parent
                break
    else:
        if getattr(node, "get_text", None):
            text = clean_text(node.get_text(" ", strip=True))
            if text:
                blocks.append(text)

    # Add nearby siblings for pages that separate name/title/email into elements.
    for sibling in list(current.previous_siblings)[-3:] + list(current.next_siblings)[:3]:
        if getattr(sibling, "get_text", None):
            text = clean_text(sibling.get_text(" ", strip=True))
            if text:
                blocks.append(text)

    # Add ancestor text, but keep it bounded.
    parent = current.parent
    while parent and len(blocks) < max_blocks:
        text = clean_text(parent.get_text(" ", strip=True))
        if text and len(text) <= 500:
            blocks.append(text)
        parent = parent.parent

    deduped = []
    seen = set()
    for block in blocks:
        if block not in seen:
            seen.add(block)
            deduped.append(block)
    return deduped[:max_blocks]


def email_context(email: str, text: str) -> str:
    text = clean_text(text)
    match = re.search(re.escape(email), text, re.IGNORECASE)
    if not match:
        return ""

    previous_emails = list(EMAIL_RE.finditer(text[:match.start()]))
    start = previous_emails[-1].end() if previous_emails else max(0, match.start() - 220)
    next_email = EMAIL_RE.search(text, match.end())
    end = next_email.start() if next_email else min(len(text), match.end() + 80)
    return clean_text(text[start:end])


def title_matches_in_text(text: str) -> list[re.Match[str]]:
    return list(TARGET_TITLE_RE.finditer(text))


def infer_name_title_from_context(context: str, email: str) -> tuple[str, str]:
    before_email = clean_text(context.split(email, 1)[0])
    before_email = PHONE_RE.sub(" ", before_email)
    before_email = CERTIFICATION_RE.sub(" ", before_email)
    before_email = clean_text(before_email)

    for match in reversed(title_matches_in_text(before_email)):
        left = clean_text(before_email[:match.start()])
        title = clean_text(match.group(1))[:120]
        if not title_matches(title):
            continue

        candidates = NAME_RE.findall(left[-90:])
        valid = [
            candidate
            for candidate in (clean_name_candidate(candidate) for candidate in candidates)
            if looks_like_name(candidate)
        ]
        if valid:
            return valid[-1], title

    return "", ""


def infer_name_title(email: str, blocks: Iterable[str]) -> tuple[str, str, str]:
    contexts = [
        context
        for block in blocks
        if email.lower() in clean_text(block).lower()
        for context in [email_context(email, block)]
        if context
    ]
    title = ""
    full_name = ""

    for context in contexts:
        full_name, title = infer_name_title_from_context(context, email)
        if full_name:
            break

    confidence = "high" if full_name and title else "low"

    return full_name, title, confidence


def is_target_contact(email: str, full_name: str, title: str) -> bool:
    if is_generic_email(email):
        return False
    if not full_name or not title:
        return False
    if title.lower() in {"marketing", "communications", "branding", "website"}:
        return False
    return title_matches(title)


def extract_contacts_from_page(
    organization: str,
    website: str,
    page_url: str,
    html: str,
) -> list[Contact]:
    soup = BeautifulSoup(html, "html.parser")
    contacts: list[Contact] = []
    seen_emails: set[str] = set()

    # Mailto links preserve useful local context.
    for link in soup.select('a[href^="mailto:"]'):
        raw = link.get("href", "")[7:].split("?", 1)[0]
        for email in EMAIL_RE.findall(raw):
            email = email.lower()
            if email in seen_emails:
                continue
            seen_emails.add(email)
            blocks = nearby_text_blocks(link)
            full_name, title, confidence = infer_name_title(email, blocks)
            if is_target_contact(email, full_name, title):
                first, last = split_name(full_name)
                contacts.append(Contact(
                    organization=organization,
                    website=website,
                    source_url=page_url,
                    first_name=first,
                    last_name=last,
                    full_name=full_name,
                    title=title,
                    email=email,
                    confidence=confidence,
                ))

    # Also scan visible page text for plain-text emails.
    page_text = soup.get_text(" ", strip=True)
    for email in EMAIL_RE.findall(page_text):
        email = email.lower()
        if email in seen_emails:
            continue
        seen_emails.add(email)

        text_node = soup.find(string=re.compile(re.escape(email), re.IGNORECASE))
        blocks = nearby_text_blocks(text_node.parent if getattr(text_node, "parent", None) else soup)
        full_name, title, confidence = infer_name_title(email, blocks)

        if is_target_contact(email, full_name, title):
            first, last = split_name(full_name)
            contacts.append(Contact(
                organization=organization,
                website=website,
                source_url=page_url,
                first_name=first,
                last_name=last,
                full_name=full_name,
                title=title,
                email=email,
                confidence=confidence,
            ))

    return contacts


def crawl_organization(
    organization: str,
    website: str,
    max_pages: int,
    delay: float,
) -> list[Contact]:
    website = normalize_url(website)
    if not website:
        return []

    session = requests.Session()
    session.headers.update({
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml",
    })

    robot_parser = get_robot_parser(session, website)
    queue = deque([website])
    visited: set[str] = set()
    contacts: list[Contact] = []

    print(f"Scraping {organization}: {website}", file=sys.stderr)

    while queue and len(visited) < max_pages:
        url = queue.popleft()
        if url in visited:
            continue
        visited.add(url)

        html = fetch_html(session, url, robot_parser, delay)
        if not html:
            continue

        page_contacts = extract_contacts_from_page(organization, website, url, html)
        contacts.extend(page_contacts)

        soup = BeautifulSoup(html, "html.parser")
        for link in extract_candidate_links(soup, url, website):
            if link not in visited and link not in queue:
                queue.append(link)

    return contacts


def read_organizations(path: Path) -> list[tuple[str, str]]:
    rows: list[tuple[str, str]] = []
    with path.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        required = {"organization", "website"}
        if not required.issubset({h.lower() for h in (reader.fieldnames or [])}):
            raise ValueError("Input CSV must have columns named organization and website.")

        # Support capitalization differences.
        field_map = {h.lower(): h for h in reader.fieldnames or []}
        for row in reader:
            organization = clean_text(row.get(field_map["organization"], ""))
            website = clean_text(row.get(field_map["website"], ""))
            if organization and website:
                rows.append((organization, website))
    return rows


def deduplicate(contacts: list[Contact]) -> list[Contact]:
    # Prefer higher-confidence and more complete rows for duplicate emails.
    rank = {"high": 3, "medium": 2, "low": 1}
    best: dict[str, Contact] = {}

    for contact in contacts:
        key = contact.email.lower()
        score = (
            rank.get(contact.confidence, 0),
            bool(contact.full_name),
            bool(contact.title),
        )
        existing = best.get(key)
        if existing is None:
            best[key] = contact
            continue
        existing_score = (
            rank.get(existing.confidence, 0),
            bool(existing.full_name),
            bool(existing.title),
        )
        if score > existing_score:
            best[key] = contact

    return sorted(
        best.values(),
        key=lambda c: (c.organization.lower(), c.last_name.lower(), c.email.lower())
    )


def write_contacts(path: Path, contacts: list[Contact]) -> None:
    fieldnames = list(asdict(Contact("", "", "", "", "", "", "", "", "")).keys())
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for contact in contacts:
            writer.writerow(asdict(contact))


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Extract public municipal and park district communications contacts.",
        epilog=(
            "Example: python3 scraper/scraper.py scraper/prospects.sample.csv "
            "-o municipal_contacts.csv --max-pages 25"
        ),
    )
    parser.add_argument(
        "input_csv",
        type=Path,
        help="CSV with columns: organization,website",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=Path("municipal_contacts.csv"),
        help="Output CSV path (default: municipal_contacts.csv)",
    )
    parser.add_argument(
        "--max-pages",
        type=int,
        default=12,
        help="Maximum pages to crawl per website (default: 12)",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=1.25,
        help="Delay between requests in seconds (default: 1.25)",
    )
    if len(sys.argv) == 1:
        parser.print_help(sys.stderr)
        print(
            "\nMissing input CSV. Create a CSV with columns organization,website "
            "or use scraper/prospects.sample.csv as a template.",
            file=sys.stderr,
        )
        return 2

    args = parser.parse_args()

    try:
        organizations = read_organizations(args.input_csv)
    except Exception as exc:
        print(f"Could not read input CSV: {exc}", file=sys.stderr)
        return 1

    all_contacts: list[Contact] = []
    for organization, website in organizations:
        try:
            all_contacts.extend(
                crawl_organization(
                    organization=organization,
                    website=website,
                    max_pages=max(1, args.max_pages),
                    delay=max(0.5, args.delay),
                )
            )
        except Exception as exc:
            print(f"  failed for {organization}: {exc}", file=sys.stderr)

    contacts = deduplicate(all_contacts)
    write_contacts(args.output, contacts)
    print(f"Wrote {len(contacts)} contacts to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
