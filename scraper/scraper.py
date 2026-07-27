#!/usr/bin/env python3
"""
Public Website Contact Scraper

What it does:
- Reads a CSV of website URLs, town names, or organization names
- Crawls a small number of pages on each public website
- Can discover likely sites from town names, organization names, or search queries
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
from urllib.parse import parse_qs, unquote, urljoin, urlparse, urldefrag
from urllib.robotparser import RobotFileParser

import requests
from bs4 import BeautifulSoup


USER_AGENT = (
    "HarvelloPublicContactResearch/1.0 "
    "(public website contact research; contact: hello@getharvello.com)"
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
    r"\bwebmaster\b",
    r"\bweb(?:site)?\s+(?:manager|coordinator|specialist|administrator)\b",
    r"\bmedia relations\b",
    r"\bpublic relations\b",
    r"\b(?:manager|director|coordinator|specialist|superintendent|administrator)\b.{0,80}\b(marketing|communications?|public relations|public information|community relations|community engagement|media relations|social media|brand|web(?:site)?)\b",
    r"\b(marketing|communications?|public relations|public information|community relations|community engagement|media relations|social media|brand|web(?:site)?)\b.{0,80}\b(?:manager|director|coordinator|specialist|superintendent|administrator)\b",
]

LIKELY_PATHS = [
    "/staff",
    "/staff-directory",
    "/directory",
    "/contact",
    "/about",
    "/departments",
    "/administration",
    "/team",
    "/leadership",
    "/people",
    "/our-team",
    "/contact-us",
]

SEARCH_ENDPOINT = "https://html.duckduckgo.com/html/"
SEARCH_SKIP_DOMAINS = {
    "facebook.com",
    "instagram.com",
    "linkedin.com",
    "youtube.com",
    "x.com",
    "twitter.com",
    "mapquest.com",
    "maps.apple.com",
}

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
    "public-relations",
    "community-relations",
    "website",
    "webmaster",
    "departments",
    "team",
    "people",
    "our-team",
    "contact-us",
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
    r"(?:Marketing(?:\s+and\s+Communications?)?|Communications?|Public Information|Public Relations|"
    r"Community Engagement|Community Relations|Public Affairs|Digital Media|Social Media|"
    r"Brand Strategy|Branding|Creative Design|Media Relations|Website|Web|Webmaster)"
    r"(?:\s+(?:and|&)\s+(?:Marketing|Communications?|Public Information|Public Relations|"
    r"Community Engagement|Community Relations|Public Affairs|Digital Media|Social Media|"
    r"Brand Strategy|Branding|Creative Design|Media Relations|Website|Web|Webmaster))?"
    r"(?:\s+(?:Director|Manager|Coordinator|Specialist|Administrator|Superintendent|Officer|Lead|Head|"
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
    phone: str
    confidence: str


@dataclass
class Target:
    organization: str
    website: str
    search_query: str


def normalize_url(url: str) -> str:
    url = url.strip()
    if not url:
        return ""
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}{parsed.path or '/'}"


def likely_page_urls(website: str) -> list[str]:
    parsed = urlparse(website)
    base = f"{parsed.scheme}://{parsed.netloc}"
    urls = [website]
    urls.extend(urljoin(base, path) for path in LIKELY_PATHS)
    seen = set()
    ordered = []
    for url in urls:
        if url not in seen:
            seen.add(url)
            ordered.append(url)
    return ordered


def looks_like_url(value: str) -> bool:
    lowered = value.strip().lower()
    return lowered.startswith(("http://", "https://")) or "." in lowered


def build_search_queries(name: str, state: str) -> list[str]:
    base = [clean_text(name), clean_text(state)]
    prefixes = [
        "communications manager email",
        "marketing manager email",
        "public relations email",
        "staff directory communications",
        "contact communications",
    ]
    queries = []
    for suffix in prefixes:
        parts = [*base, suffix]
        query = " ".join(part for part in parts if part)
        if query not in queries:
            queries.append(query)
    return queries


def normalize_search_result_url(href: str) -> str:
    href = href.strip()
    if not href:
        return ""
    parsed = urlparse(href)
    if parsed.netloc.endswith("duckduckgo.com") and parsed.path.startswith("/l/"):
        params = parse_qs(parsed.query)
        uddg = params.get("uddg", [""])[0]
        if uddg:
            return unquote(uddg)
    return href


def score_search_result(url: str, title: str, snippet: str, query: str) -> int:
    haystack = f"{url} {title} {snippet}".lower()
    score = 0
    for term in (
        "communications",
        "marketing",
        "public relations",
        "public information",
        "media relations",
        "staff",
        "directory",
        "contact",
        "team",
        "leadership",
        "email",
    ):
        if term in haystack:
            score += 4
    if "official" in haystack:
        score += 2
    if any(host in urlparse(url).netloc.lower() for host in (".gov", ".org", ".edu")):
        score += 2
    if any(skip in urlparse(url).netloc.lower() for skip in SEARCH_SKIP_DOMAINS):
        score -= 100
    query_terms = [term for term in clean_text(query).lower().split() if len(term) > 2]
    for term in query_terms:
        if term in haystack:
            score += 1
    return score


def discover_website_from_search(
    session: requests.Session,
    query: str,
    delay: float,
) -> str:
    results = discover_websites_from_search(session, query, delay, limit=1)
    return results[0][0] if results else ""


def discover_websites_from_search(
    session: requests.Session,
    query: str,
    delay: float,
    limit: int,
) -> list[tuple[str, str]]:
    queries = [part.strip() for part in query.split("|") if part.strip()]
    discovered: list[tuple[int, str, str]] = []
    seen_domains: set[str] = set()

    for single_query in queries:
        params = {"q": single_query}
        time.sleep(delay)
        try:
            response = session.get(SEARCH_ENDPOINT, params=params, timeout=20)
            if response.status_code != 200 or "text/html" not in response.headers.get("content-type", "").lower():
                continue
        except requests.RequestException as exc:
            print(f"  search failed: {single_query} ({exc})", file=sys.stderr)
            continue

        soup = BeautifulSoup(response.text, "html.parser")
        for result in soup.select("a.result__a[href]"):
            url = normalize_search_result_url(result.get("href", ""))
            if not url:
                continue
            parsed = urlparse(url)
            if parsed.scheme not in ("http", "https"):
                continue
            if any(skip in parsed.netloc.lower() for skip in SEARCH_SKIP_DOMAINS):
                continue
            domain = parsed.netloc.lower().removeprefix("www.")
            if domain in seen_domains:
                continue
            title = clean_text(result.get_text(" ", strip=True))
            snippet = ""
            container = result.find_parent("div", class_=re.compile(r"result", re.I))
            if container:
                snippet_tag = container.select_one(".result__snippet")
                if snippet_tag:
                    snippet = clean_text(snippet_tag.get_text(" ", strip=True))
            score = score_search_result(url, title, snippet, single_query)
            if score <= -50:
                continue
            seen_domains.add(domain)
            discovered.append((score, normalize_url(url), title))

        if len(discovered) >= limit:
            break

    discovered.sort(key=lambda item: item[0], reverse=True)
    return [(url, title) for _, url, title in discovered[:limit]]


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


def organization_from_url(url: str, title: str = "") -> str:
    title_name = clean_text(re.split(r"[|-]", title or "")[0])
    if title_name and 3 <= len(title_name) <= 80:
        return title_name
    host = urlparse(normalize_url(url)).netloc.removeprefix("www.")
    return host.split(".", 1)[0].replace("-", " ").title()


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
    ignore_robots: bool,
) -> str | None:
    if not ignore_robots and not robot_parser.can_fetch(USER_AGENT, url):
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


def infer_name_title_from_context(context: str, email: str = "") -> tuple[str, str]:
    text = clean_text(context)
    if email:
        text = clean_text(text.split(email, 1)[0])
    text = PHONE_RE.sub(" ", text)
    text = CERTIFICATION_RE.sub(" ", text)
    text = clean_text(text)

    for match in title_matches_in_text(text):
        title = clean_text(match.group(1))[:120]
        if not title_matches(title):
            continue

        left = clean_text(text[:match.start()])
        right = clean_text(text[match.end():])

        left_candidates = NAME_RE.findall(left[-120:])
        right_candidates = NAME_RE.findall(right[:120])
        valid_left = [
            candidate
            for candidate in (clean_name_candidate(candidate) for candidate in left_candidates)
            if looks_like_name(candidate)
        ]
        if valid_left:
            return valid_left[-1], title

        valid_right = [
            candidate
            for candidate in (clean_name_candidate(candidate) for candidate in right_candidates)
            if looks_like_name(candidate)
        ]
        if valid_right:
            return valid_right[0], title

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


def infer_name_title_without_email(blocks: Iterable[str]) -> tuple[str, str, str]:
    for block in blocks:
        full_name, title = infer_name_title_from_context(block)
        if full_name and title:
            return full_name, title, "medium"
    return "", "", "low"


def infer_phone(blocks: Iterable[str]) -> str:
    for block in blocks:
        match = PHONE_RE.search(clean_text(block))
        if match:
            return clean_text(match.group(0))
    return ""


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
                phone = infer_phone(blocks)
                contacts.append(Contact(
                    organization=organization,
                    website=website,
                    source_url=page_url,
                    first_name=first,
                    last_name=last,
                    full_name=full_name,
                    title=title,
                    email=email,
                    phone=phone,
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
            phone = infer_phone(blocks)
            contacts.append(Contact(
                organization=organization,
                website=website,
                source_url=page_url,
                first_name=first,
                last_name=last,
                full_name=full_name,
                title=title,
                email=email,
                phone=phone,
                confidence=confidence,
            ))

    seen_signatures = {
        (contact.full_name.lower(), contact.title.lower(), contact.email.lower())
        for contact in contacts
    }

    for tag in soup.find_all(["tr", "li", "article", "section", "div", "p"]):
        block = clean_text(tag.get_text(" ", strip=True))
        if not block or len(block) > 500 or not title_matches(block):
            continue
        full_name, title, confidence = infer_name_title_without_email([block])
        if not full_name or not title or not is_target_contact("placeholder@example.com", full_name, title):
            continue
        signature = (full_name.lower(), title.lower(), "")
        if signature in seen_signatures:
            continue
        seen_signatures.add(signature)
        phone = infer_phone([block])
        first, last = split_name(full_name)
        contacts.append(Contact(
            organization=organization,
            website=website,
            source_url=page_url,
            first_name=first,
            last_name=last,
            full_name=full_name,
            title=title,
            email="",
            phone=phone,
            confidence=confidence,
        ))

    return contacts


def crawl_organization(
    organization: str,
    website: str,
    max_pages: int,
    delay: float,
    ignore_robots: bool,
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
    queue = deque(likely_page_urls(website))
    visited: set[str] = set()
    contacts: list[Contact] = []

    print(f"Scraping {organization}: {website}", file=sys.stderr)

    while queue and len(visited) < max_pages:
        url = queue.popleft()
        if url in visited:
            continue
        visited.add(url)

        html = fetch_html(session, url, robot_parser, delay, ignore_robots)
        if not html:
            continue

        page_contacts = extract_contacts_from_page(organization, website, url, html)
        contacts.extend(page_contacts)

        soup = BeautifulSoup(html, "html.parser")
        for link in extract_candidate_links(soup, url, website):
            if link not in visited and link not in queue:
                queue.append(link)

    return contacts


def read_targets(path: Path, default_state: str) -> list[Target]:
    rows: list[Target] = []
    raw_lines = [
        line.strip()
        for line in path.read_text(encoding="utf-8-sig").splitlines()
        if line.strip()
    ]
    if raw_lines and "," not in raw_lines[0] and raw_lines[0].lower() not in {"website", "town", "organization"}:
        for line in raw_lines:
            if looks_like_url(line):
                host = urlparse(normalize_url(line)).netloc.removeprefix("www.")
                organization = host.split(".", 1)[0].replace("-", " ").title()
                rows.append(Target(organization=organization, website=line, search_query=""))
            else:
                town = clean_text(line)
                organization = town
                rows.append(Target(
                    organization=organization,
                    website="",
                    search_query=" | ".join(build_search_queries(town, default_state)),
                ))
        return rows

    with path.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        headers = {h.lower() for h in (reader.fieldnames or [])}
        if not ({"website", "town", "organization"} & headers):
            raise ValueError("Input CSV must include website, town, or organization.")

        # Support capitalization differences.
        field_map = {h.lower(): h for h in reader.fieldnames or []}
        for row in reader:
            website = clean_text(row.get(field_map.get("website", ""), ""))
            organization = clean_text(row.get(field_map.get("organization", ""), ""))
            town = clean_text(row.get(field_map.get("town", ""), ""))
            state = clean_text(row.get(field_map.get("state", ""), "")) or default_state

            if website:
                if not organization:
                    host = urlparse(normalize_url(website)).netloc.removeprefix("www.")
                    organization = host.split(".", 1)[0].replace("-", " ").title()
                rows.append(Target(organization=organization, website=website, search_query=""))
                continue

            if town or organization:
                if not organization:
                    organization = town or "Organization"
                query_name = town or organization
                rows.append(Target(
                    organization=organization,
                    website="",
                    search_query=" | ".join(build_search_queries(query_name, state)),
                ))
    return rows


def deduplicate(contacts: list[Contact]) -> list[Contact]:
    # Prefer higher-confidence and more complete rows for duplicate emails or
    # repeated person rows within the same organization.
    rank = {"high": 3, "medium": 2, "low": 1}
    best: dict[str, Contact] = {}

    for contact in contacts:
        score = (
            rank.get(contact.confidence, 0),
            bool(contact.full_name),
            bool(contact.title),
            bool(contact.phone),
        )
        keys = []
        if contact.email:
            keys.append(f"email:{contact.email.lower()}")
        if contact.full_name:
            keys.append(f"name_org:{contact.full_name.lower()}::{contact.organization.lower()}")
        if not keys:
            continue

        existing = next((best[key] for key in keys if key in best), None)
        if existing is not None:
            existing_score = (
                rank.get(existing.confidence, 0),
                bool(existing.full_name),
                bool(existing.title),
                bool(existing.phone),
            )
            winner = contact if score > existing_score else existing
            for key in keys:
                best[key] = winner
            continue

        for key in keys:
            best[key] = contact

    unique = {id(contact): contact for contact in best.values()}.values()
    return sorted(
        unique,
        key=lambda c: (c.organization.lower(), c.last_name.lower(), c.email.lower())
    )


def write_contacts(path: Path, contacts: list[Contact]) -> None:
    fieldnames = list(asdict(Contact("", "", "", "", "", "", "", "", "", "")).keys())
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for contact in contacts:
            writer.writerow(asdict(contact))


def write_mailmerge_contacts(path: Path, contacts: list[Contact]) -> None:
    fieldnames = ["Email", "FirstName", "City", "Status", "SentAt"]
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for contact in contacts:
            if not contact.email:
                continue
            writer.writerow({
                "Email": contact.email,
                "FirstName": contact.first_name,
                "City": contact.organization,
                "Status": "",
                "SentAt": "",
            })


def read_existing_mailmerge_contacts(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []
    with path.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        return [dict(row) for row in reader]


def write_mailmerge_contacts_merged(path: Path, contacts: list[Contact], append: bool) -> int:
    if not append:
        write_mailmerge_contacts(path, contacts)
        return len([contact for contact in contacts if contact.email])

    fieldnames = ["Email", "FirstName", "City", "Status", "SentAt"]
    rows = read_existing_mailmerge_contacts(path)
    seen_emails = {
        clean_text(row.get("Email", "")).lower()
        for row in rows
        if clean_text(row.get("Email", ""))
    }

    appended_count = 0
    for contact in contacts:
        if not contact.email or contact.email.lower() in seen_emails:
            continue
        rows.append({
            "Email": contact.email,
            "FirstName": contact.first_name,
            "City": contact.organization,
            "Status": "",
            "SentAt": "",
        })
        seen_emails.add(contact.email.lower())
        appended_count += 1

    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow({
                "Email": row.get("Email", ""),
                "FirstName": row.get("FirstName", ""),
                "City": row.get("City", row.get("Organization", "")),
                "Status": row.get("Status", ""),
                "SentAt": row.get("SentAt", ""),
            })

    return appended_count


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Extract public communications, marketing, PR, web, and related contacts from public websites.",
        epilog=(
            "Example: python3 scraper/scraper.py --search-query "
            "\"communications manager town wisconsin email\" --search-limit 20 --append-contacts"
        ),
    )
    parser.add_argument(
        "input_csv",
        nargs="?",
        type=Path,
        help="CSV with columns: website, or town/state, or organization",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=Path("contacts_found.csv"),
        help="Detailed output CSV path (default: contacts_found.csv)",
    )
    parser.add_argument(
        "--search-query",
        action="append",
        default=[],
        help="Search query to discover websites to crawl. Can be repeated.",
    )
    parser.add_argument(
        "--search-limit",
        type=int,
        default=10,
        help="Maximum websites to discover per search query (default: 10)",
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
    parser.add_argument(
        "--ignore-robots",
        action="store_true",
        help="Fetch public pages even when robots.txt disallows crawling",
    )
    parser.add_argument(
        "--state",
        type=str,
        default="Iowa",
        help="Default state to use when searching from town names (default: Iowa)",
    )
    parser.add_argument(
        "--contacts-csv",
        type=Path,
        default=Path("scraper/sent_contacts.csv"),
        help="Mailmerge send queue CSV path (default: scraper/sent_contacts.csv)",
    )
    parser.add_argument(
        "--append-contacts",
        action="store_true",
        help="Append new unique emails to --contacts-csv instead of replacing it.",
    )
    parser.add_argument(
        "--include-no-email",
        action="store_true",
        help="Include name/title leads without emails in the detailed output CSV.",
    )
    if len(sys.argv) == 1:
        parser.print_help(sys.stderr)
        print(
            "\nMissing input CSV or --search-query. Create a CSV with website, town/state, "
            "or organization, or pass --search-query.",
            file=sys.stderr,
        )
        return 2

    args = parser.parse_args()

    targets: list[Target] = []
    if args.input_csv:
        try:
            targets.extend(read_targets(args.input_csv, args.state))
        except Exception as exc:
            print(f"Could not read input CSV: {exc}", file=sys.stderr)
            return 1

    all_contacts: list[Contact] = []
    discovery_session = requests.Session()
    discovery_session.headers.update({
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml",
    })

    for query in args.search_query:
        print(f"Searching: {query}", file=sys.stderr)
        results = discover_websites_from_search(
            discovery_session,
            query,
            delay=max(0.5, args.delay),
            limit=max(1, args.search_limit),
        )
        for website, title in results:
            organization = organization_from_url(website, title)
            print(f"Discovered {organization}: {website}", file=sys.stderr)
            targets.append(Target(organization=organization, website=website, search_query=""))

    if not targets:
        print("No targets found. Provide an input CSV or a --search-query with results.", file=sys.stderr)
        return 1

    for target in targets:
        try:
            website = target.website
            if not website and target.search_query:
                website = discover_website_from_search(discovery_session, target.search_query, max(0.5, args.delay))
                if website:
                    print(f"Discovered {target.organization}: {website}", file=sys.stderr)
                else:
                    print(f"  no site found for {target.organization} ({target.search_query})", file=sys.stderr)
            if not website:
                continue
            all_contacts.extend(
                crawl_organization(
                    organization=target.organization,
                    website=website,
                    max_pages=max(1, args.max_pages),
                    delay=max(0.5, args.delay),
                    ignore_robots=args.ignore_robots,
                )
            )
        except Exception as exc:
            print(f"  failed for {target.organization}: {exc}", file=sys.stderr)

    contacts = deduplicate(all_contacts)
    contacts_with_email = [contact for contact in contacts if contact.email]
    contacts_to_write = contacts if args.include_no_email else contacts_with_email
    write_contacts(args.output, contacts_to_write)
    appended_count = write_mailmerge_contacts_merged(args.contacts_csv, contacts_with_email, append=args.append_contacts)
    print(f"Found {len(contacts)} possible contacts; {len(contacts_with_email)} had emails.")
    print(f"Wrote {len(contacts_to_write)} contacts to {args.output}")
    if args.append_contacts:
        print(f"Appended {appended_count} new unique contacts to {args.contacts_csv}")
    else:
        print(f"Wrote {len(contacts_with_email)} contacts to {args.contacts_csv}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
