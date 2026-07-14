# Public Contact Scraper

This script reads a CSV of public agency websites, crawls a limited number of public pages, and exports likely communications, marketing, public information, and leadership contacts.

## Input CSV

Create a CSV with exactly these columns:

```csv
organization,website
Wilmette Park District,https://wilmettepark.org/
Oak Brook Park District,https://www.obparks.org/
```

You can start from:

```bash
scraper/prospects.sample.csv
```

## Run

From the project root:

```bash
/usr/local/bin/python3 scraper/scraper.py scraper/prospects.sample.csv -o municipal_contacts.csv
```

With more pages per website:

```bash
/usr/local/bin/python3 scraper/scraper.py scraper/prospects.sample.csv -o municipal_contacts.csv --max-pages 25 --delay 1
```

## Output

The output CSV includes:

```text
organization, website, source_url, first_name, last_name, full_name, title, email, confidence
```

The scraper only uses public website pages, respects `robots.txt`, rate-limits requests, and does not bypass login pages or access controls.
