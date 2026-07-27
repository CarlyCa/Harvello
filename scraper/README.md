# Public Contact Scraper

This script reads public websites, organization/town names, or search queries, crawls a limited number of public pages, and exports likely website, communications, marketing, public information, PR/media, web, and community relations contacts.

For each website it probes these likely pages first:

```text
/staff
/staff-directory
/directory
/contact
/about
/departments
/administration
```

## Input CSV

Preferred CSV formats:

```csv
organization,website
Wilmette Park District,https://wilmettepark.org/
Oak Brook Park District,https://www.obparks.org/
```

```csv
town,state
Ames,Iowa
Ankeny,Iowa
```

You can also provide only a `website` column, or a plain text file with one website or organization name per line. When website is missing, the scraper searches for likely communications, marketing, PR, and staff-directory pages using `Iowa` as the default state unless you pass `--state`.

You can start from:

```bash
scraper/prospects.sample.csv
```

## Run

From the project root:

```bash
python3 -m pip install -r scraper/requirements.txt
```

```bash
/usr/local/bin/python3 scraper/scraper.py scraper/prospects.sample.csv -o contacts_found.csv
```

From town names:

```bash
/usr/local/bin/python3 scraper/scraper.py towns.csv -o contacts_found.csv --state Iowa
```

With more pages per website:

```bash
/usr/local/bin/python3 scraper/scraper.py scraper/prospects.sample.csv -o contacts_found.csv --max-pages 25 --delay 1
```

## Output

The output CSV includes:

```text
organization, website, source_url, first_name, last_name, full_name, title, email, phone, confidence
```

It also writes a mailmerge-friendly file to `scraper/contacts.csv` by default.

The scraper only uses public website pages, respects `robots.txt`, rate-limits requests, and does not bypass login pages or access controls.

If a lot of sites are being skipped by `robots.txt`, run with:

```bash
python3 scraper/scraper.py scraper/iowa_towns.csv -o contacts_found.csv --state Iowa --ignore-robots
```

## Search Query Workflow

Use this when you would otherwise search Google/DuckDuckGo manually and click into each page:

```bash
python3 scraper/scraper.py \
  --search-query "communications manager town wisconsin email" \
  --search-limit 20 \
  --max-pages 10 \
  --append-contacts
```

That will:

```text
1. Search the web for the query.
2. Pick up to 20 likely websites.
3. Crawl staff, team, contact, directory, marketing, communications, and leadership pages.
4. Write contacts with emails to contacts_found.csv.
5. Append new unique emails to scraper/sent_contacts.csv with a blank `Status`.

`scraper/sent_contacts.csv` is the mailmerge send queue:

```text
Email,FirstName,City,Status,SentAt
```

`mailmerge.py --live` sends rows where `Status` is blank, then marks them `Sent`.

If you also want name/title leads where the page did not expose an email, add:

```bash
--include-no-email
```
```

You can repeat `--search-query`:

```bash
python3 scraper/scraper.py \
  --search-query "communications manager town wisconsin email" \
  --search-query "marketing director small business wisconsin email" \
  --search-limit 15 \
  --append-contacts
```
