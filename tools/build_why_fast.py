#!/usr/bin/env python3
"""Builds the "Why fast" blog from content/why-fast/*.md.

    python3 tools/build_why_fast.py            # build (run from the repo root)

Each article is a Markdown file with a small header:

    ---
    title: Finding a fasting window that fits your week
    dek: One-line summary shown under the title and on the card.
    category: Routine            # Basics · Routine · Science · Stories
    date: 2026-10-23
    author: The Faaast team
    status: published            # published · sample · coming-soon
    source_title: Title of the article this one summarises     (optional, all four)
    source_publisher: Harvard Health Publishing
    source_date: July 2022
    source_url: https://...
    ---
    Body in Markdown: ## headings, paragraphs, - lists, 1. lists, > quotes,
    **bold**, *italic*, [links](url), citations[^1], and these blocks:
      :::note        a highlighted note, closed with :::
      ![alt](img/path.jpg "caption")
      [^1]: Source title, Publisher, Year. https://url   (listed under Sources)

`coming-soon` articles appear as a card on the blog page without a link.
With a source_* header, the article ends with an "Original article" box that
links out to the article it summarises.
`sample` articles get a banner saying they only show the layout.
"""
import datetime, hashlib, html, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'content', 'why-fast')
OUT = os.path.join(ROOT, 'why-fast')
SITE = 'https://faaastapp.com'
STORE = 'https://apps.apple.com/app/apple-store/id6818526484?pt=129550437&amp;ct=Website&amp;mt=8'  # the site-wide App Store campaign link
CATEGORIES = ['Basics', 'Routine', 'Science', 'Stories']

NAV = f'''<header class="nav" id="nav">
  <a href="/" class="nav-logo" aria-label="Faaast home">
    <img src="/img/icon.png" alt="" width="28" height="28"><span class="wm" aria-hidden="true">Faaa<span class="wm-x" style="--i:0">a</span><span class="wm-x" style="--i:1">a</span><span class="wm-x" style="--i:2">a</span><span class="wm-x" style="--i:3">a</span>st</span>
  </a>
  <nav class="nav-links" aria-label="Sections">
    <a href="/#how">How it works</a>
    <a href="/#features">Features</a>
    <a href="/why-fast/"{{why_current}}>Why fast</a>
    <a href="/#pro">Pro</a>
    <a href="/#faq">FAQs</a>
  </nav>
  <a href="{STORE}" class="btn btn-ink btn-sm" data-store data-loc="nav">Download</a>
</header>'''

FOOT = '''<footer class="foot">
  <div class="wrap foot-in">
    <span class="foot-logo"><img src="/img/icon.png" alt="" width="22" height="22">Faaast</span>
    <nav>
      <a href="/why-fast/">Why fast</a>
      <a href="/guides/">Guides</a>
      <a href="/support/">Support</a>
      <a href="/privacy/">Privacy</a>
      <a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/">Terms</a>
    </nav>
    <span class="muted">© 2026 Faaast</span>
  </div>
</footer>'''

MEDICAL = '<p class="wf-medical">General information, not medical advice. Don’t fast without talking to a doctor if you’re pregnant or breastfeeding, under 18, have had an eating disorder, have diabetes, or take insulin or other medicine that lowers blood sugar.</p>'


# ---------------------------------------------------------------- parsing
def parse(path):
    text = open(path, encoding='utf-8').read()
    m = re.match(r'---\n(.*?)\n---\n(.*)', text, re.S)
    if not m:
        sys.exit(f'{path}: missing the --- header')
    meta = {}
    for line in m.group(1).splitlines():
        if ':' in line:
            k, v = line.split(':', 1)
            meta[k.strip()] = v.split(' #')[0].strip() if k.strip() not in ('dek', 'source_url') else v.strip()
    for key in ('title', 'dek', 'category', 'date', 'status'):
        if not meta.get(key):
            sys.exit(f'{path}: header needs "{key}"')
    if meta['category'] not in CATEGORIES:
        sys.exit(f'{path}: category must be one of {", ".join(CATEGORIES)}')
    meta.setdefault('author', 'The Faaast team')
    meta['slug'] = os.path.splitext(os.path.basename(path))[0]
    meta['body_md'] = m.group(2).strip()
    return meta


def inline(t, notes):
    t = html.escape(t, quote=False)
    t = re.sub(r'\[\^(\w+)\]', lambda m: f'<sup class="cite"><a href="#src-{m.group(1)}" aria-label="Source {m.group(1)}">{notes.setdefault(m.group(1), len(notes) + 1)}</a></sup>', t)
    t = re.sub(r'\[([^\]]+)\]\(([^)\s]+)\)', r'<a href="\2">\1</a>', t)
    t = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', t)
    t = re.sub(r'(?<![*\w])\*(?!\s)(.+?)(?<!\s)\*(?![*\w])', r'<em>\1</em>', t)
    return t.replace('’', '’')


def markdown(md):
    """A small Markdown subset, enough for articles. Returns (html, sources, headings)."""
    notes, sources, heads, out = {}, {}, [], []
    lines = md.splitlines()
    for ln in list(lines):
        m = re.match(r'\[\^(\w+)\]:\s*(.+)', ln)
        if m:
            sources[m.group(1)] = m.group(2)
            lines.remove(ln)
    i, para = 0, []

    def flush():
        if para:
            out.append(f'<p>{inline(" ".join(para), notes)}</p>')
            para.clear()

    while i < len(lines):
        ln = lines[i].rstrip()
        if not ln.strip():
            flush(); i += 1; continue
        if ln.startswith('## '):
            flush()
            text = ln[3:].strip()
            hid = re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')
            heads.append((hid, text))
            out.append(f'<h2 id="{hid}">{inline(text, notes)}</h2>'); i += 1; continue
        if ln.startswith('### '):
            flush(); out.append(f'<h3>{inline(ln[4:], notes)}</h3>'); i += 1; continue
        if ln.startswith(':::note'):
            flush(); j = i + 1; buf = []
            while j < len(lines) and lines[j].strip() != ':::':
                buf.append(lines[j]); j += 1
            inner, _, _ = markdown('\n'.join(buf))
            out.append(f'<aside class="wf-note">{inner}</aside>'); i = j + 1; continue
        m = re.match(r'!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)', ln)
        if m:
            flush()
            cap = f'<figcaption>{inline(m.group(3), notes)}</figcaption>' if m.group(3) else ''
            out.append(f'<figure class="wf-figure"><img src="{m.group(2)}" alt="{html.escape(m.group(1))}" loading="lazy">{cap}</figure>'); i += 1; continue
        if ln.startswith('> '):
            flush(); buf = []
            while i < len(lines) and lines[i].startswith('> '):
                buf.append(lines[i][2:]); i += 1
            out.append(f'<blockquote><p>{inline(" ".join(buf), notes)}</p></blockquote>'); continue
        if re.match(r'(- |\d+\. )', ln):
            flush(); ordered = bool(re.match(r'\d+\. ', ln)); items = []
            while i < len(lines) and re.match(r'(- |\d+\. )', lines[i]):
                items.append(re.sub(r'^(- |\d+\. )', '', lines[i])); i += 1
            tag = 'ol' if ordered else 'ul'
            out.append(f'<{tag}>' + ''.join(f'<li>{inline(x, notes)}</li>' for x in items) + f'</{tag}>'); continue
        para.append(ln.strip()); i += 1
    flush()
    ordered_sources = [(k, sources.get(k, '')) for k, _ in sorted(notes.items(), key=lambda kv: kv[1])]
    missing = [k for k, v in ordered_sources if not v]
    if missing:
        sys.exit(f'citation without a source line: {missing}')
    return '\n'.join(out), ordered_sources, heads


# ---------------------------------------------------------------- pieces
def read_minutes(md):
    return max(1, round(len(re.findall(r'\w+', md)) / 220))


def nice_date(d):
    return datetime.date.fromisoformat(d).strftime('%-d %B %Y')


def cover(slug, big=False):
    """A generated hour-block cover: unique per article, on-brand, no image files."""
    h = hashlib.sha256(slug.encode()).digest()
    filled = 9 + h[0] % 12            # 9–20 of 24 blocks
    partial = 20 + h[1] % 70          # the last block's fill, in %
    cells = []
    for n in range(24):
        f = 100 if n < filled else partial if n == filled else 0
        cells.append(f'<i style="--f:{f}%"></i>')
    return f'<div class="wf-cover{" wf-cover-lg" if big else ""}" aria-hidden="true">{"".join(cells)}</div>'


def head(title, description, url, kind, ld, noindex=False):
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(description)}">
<meta name="theme-color" content="#F5F5F5">{chr(10) + '<meta name="robots" content="noindex">' if noindex else ''}
<meta name="apple-itunes-app" content="app-id=6818526484">
<link rel="canonical" href="{url}">
<meta property="og:type" content="{kind}">
<meta property="og:site_name" content="Faaast">
<meta property="og:url" content="{url}">
<meta property="og:title" content="{html.escape(title)}">
<meta property="og:description" content="{html.escape(description)}">
<meta property="og:image" content="{SITE}/img/og.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="{SITE}/img/og.png">
{chr(10).join(f'<script type="application/ld+json">{chr(10)}{json.dumps(x, ensure_ascii=False, indent=2)}{chr(10)}</script>' for x in ld)}
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/styles.css">
</head>'''


def card(a, big=False):
    inner = f'''{cover(a["slug"], big)}
    <div class="wf-card-body">
      <p class="wf-kicker"><span>{a["category"]}</span>{"" if a["status"] == "coming-soon" else f" · {a['minutes']} min read"}</p>
      <h3>{html.escape(a["title"])}</h3>
      <p class="wf-dek">{html.escape(a["dek"])}</p>
      <p class="wf-when">{"Coming soon" if a["status"] == "coming-soon" else nice_date(a["date"])}</p>
    </div>'''
    cls = f'wf-card{" wf-card-lg" if big else ""}{" wf-soon" if a["status"] == "coming-soon" else ""}'
    if a['status'] == 'coming-soon':
        return f'<article class="{cls}" data-cat="{a["category"]}">{inner}</article>'
    return f'<a class="{cls}" href="/why-fast/{a["slug"]}/" data-cat="{a["category"]}">{inner}</a>'


# ---------------------------------------------------------------- pages
def article_page(a, others):
    body, sources, heads = markdown(a['body_md'])
    url = f'{SITE}/why-fast/{a["slug"]}/'
    ld = [{
        '@context': 'https://schema.org', '@type': 'BlogPosting', 'headline': a['title'], 'description': a['dek'],
        'url': url, 'datePublished': a['date'], 'dateModified': a.get('updated', a['date']), 'inLanguage': 'en',
        'author': {'@type': 'Organization', 'name': a['author'] if a['author'] != 'The Faaast team' else 'Faaast', 'url': SITE + '/'},
        'publisher': {'@type': 'Organization', 'name': 'Faaast', 'logo': {'@type': 'ImageObject', 'url': SITE + '/img/icon.png'}},
        'image': SITE + '/img/og.png', 'articleSection': a['category'],
        **({'isBasedOn': {'@type': 'CreativeWork', 'name': a['source_title'], 'url': a['source_url'], 'publisher': {'@type': 'Organization', 'name': a['source_publisher']}}} if a.get('source_url') else {}),
        **({'citation': [re.search(r'https?://\S+', s).group(0) for _, s in sources if re.search(r'https?://\S+', s)]} if sources else {}),
    }, {
        '@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'Faaast', 'item': SITE + '/'},
            {'@type': 'ListItem', 'position': 2, 'name': 'Why fast', 'item': SITE + '/why-fast/'},
            {'@type': 'ListItem', 'position': 3, 'name': a['title'], 'item': url}]}]
    toc = ''
    if len(heads) >= 3:
        toc = '<nav class="wf-toc" aria-label="In this article"><p>In this article</p><ol>' + ''.join(f'<li><a href="#{i}">{html.escape(t)}</a></li>' for i, t in heads) + '</ol></nav>'
    src_html = ''
    if sources:
        def fmt(s):
            m = re.search(r'https?://\S+', s)
            if not m:
                return html.escape(s)
            label = html.escape(s[:m.start()].strip().rstrip('.'))
            return f'<a href="{m.group(0)}" rel="noopener">{label}</a>'
        src_html = '<section class="wf-sources"><h2 id="sources">Sources</h2><ol>' + ''.join(f'<li id="src-{k}">{fmt(s)}</li>' for k, s in sources) + '</ol></section>'
    original = ''
    if a.get('source_url'):
        original = (f'<aside class="wf-original"><p class="wf-original-k">Original article</p>'
                    f'<p>This is a short summary of <a href="{html.escape(a["source_url"])}" target="_blank" rel="noopener">{html.escape(a["source_title"])}</a>'
                    f', {html.escape(a["source_publisher"])}{", " + html.escape(a["source_date"]) if a.get("source_date") else ""}. '
                    f'Read the original for the full details.</p></aside>')
    sample = '<p class="wf-sample">Sample article. It shows how a Why fast article looks, and isn’t published.</p>' if a['status'] == 'sample' else ''
    related = [o for o in others if o['slug'] != a['slug'] and o['status'] != 'coming-soon'][:3]
    related_html = ''
    if related:
        related_html = '<section class="wf-related"><div class="wrap"><h2>Keep reading</h2><div class="wf-grid">' + ''.join(card(o) for o in related) + '</div></div></section>'
    return f'''{head(a["title"] + " · Why fast · Faaast", a["dek"], url, "article", ld, a["status"] != "published")}
<body class="wf-page wf-article-page">
{NAV.replace("{why_current}", ' aria-current="page"')}
<div class="wf-progress" aria-hidden="true">{"<i></i>" * 16}</div>
<main>
<article class="wf-article">
  <header class="wf-head">
    <p class="wf-crumb"><a href="/why-fast/">Why fast</a> <span>·</span> {a["category"]}</p>
    <h1>{html.escape(a["title"])}</h1>
    <p class="wf-lede">{html.escape(a["dek"])}</p>
    <p class="wf-byline">{html.escape(a["author"])} · {nice_date(a["date"])} · {a["minutes"]} min read</p>
    {sample}
  </header>
  {cover(a["slug"], True)}
  <div class="wf-body">
    {toc}
    {body}
    {original}
    <aside class="g-cta wf-cta">
      <img src="/img/icon.png" alt="" width="56" height="56">
      <div><b>Find your fasting rhythm</b><p>Faaast is free on iPhone. No account, no ads.</p></div>
      <a href="{STORE}" class="btn btn-ink" data-store data-loc="blog">Download Faaast free</a>
    </aside>
    {src_html}
    {MEDICAL}
  </div>
</article>
{related_html}
</main>
{FOOT}
<script src="/why-fast/why-fast.js"></script>
<script src="/analytics.js"></script>
</body>
</html>
'''


def index_page(articles):
    live = [a for a in articles if a['status'] != 'coming-soon']
    feature = live[0] if live else articles[0]
    rest = [a for a in articles if a is not feature]
    used = [c for c in CATEGORIES if any(a['category'] == c for a in articles)]
    chips = '<button class="wf-chip on" data-filter="all" aria-pressed="true">All</button>' + ''.join(
        f'<button class="wf-chip" data-filter="{c}" aria-pressed="false">{c}</button>' for c in used)
    url = SITE + '/why-fast/'
    ld = [{'@context': 'https://schema.org', '@type': 'Blog', 'name': 'Why fast', 'url': url,
           'description': 'Articles about intermittent fasting, routines and the reasons people fast, from the makers of Faaast.',
           'publisher': {'@type': 'Organization', 'name': 'Faaast', 'url': SITE + '/'},
           'blogPost': [{'@type': 'BlogPosting', 'headline': a['title'], 'url': f'{url}{a["slug"]}/', 'datePublished': a['date']} for a in live if a['status'] == 'published']}]
    return f'''{head("Why fast · Articles on intermittent fasting · Faaast", "Articles about intermittent fasting, routines and the reasons people fast, from the makers of Faaast.", url, "website", ld)}
<body class="wf-page">
{NAV.replace("{why_current}", ' aria-current="page"')}
<main class="wf-index">
  <header class="wf-hero wrap">
    <p class="eyebrow">The Faaast blog</p>
    <h1>Why fast</h1>
    <p class="wf-intro">Plain, honest reading about intermittent fasting: how it works, how to make it fit your life, and why people do it.</p>
  </header>
  <section class="wrap">
    {card(feature, True)}
    <div class="wf-chips" role="group" aria-label="Filter by topic">{chips}</div>
    <div class="wf-grid" id="wfGrid">
      {"".join(card(a) for a in rest)}
    </div>
    <p class="wf-empty" hidden>Nothing in this topic yet.</p>
  </section>
  <section class="wrap wf-guides-link">
    <p>Looking for the basics? <a href="/guides/">Read the guides</a>: 16:8 explained, what happens when you fast, and fasting without an account.</p>
  </section>
</main>
{FOOT}
<script src="/why-fast/why-fast.js"></script>
<script src="/analytics.js"></script>
</body>
</html>
'''


def main():
    files = sorted(f for f in os.listdir(SRC) if f.endswith('.md'))
    articles = [parse(os.path.join(SRC, f)) for f in files]
    for a in articles:
        a['minutes'] = read_minutes(a['body_md'])
    order = {'published': 0, 'sample': 1, 'coming-soon': 2}
    articles.sort(key=lambda a: (order.get(a['status'], 3), a['date']), reverse=False)
    articles.sort(key=lambda a: a['date'], reverse=True)
    articles.sort(key=lambda a: order.get(a['status'], 3))
    os.makedirs(OUT, exist_ok=True)
    open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(index_page(articles))
    built = ['why-fast/index.html']
    for a in articles:
        if a['status'] == 'coming-soon':
            continue
        d = os.path.join(OUT, a['slug'])
        os.makedirs(d, exist_ok=True)
        open(os.path.join(d, 'index.html'), 'w', encoding='utf-8').write(article_page(a, articles))
        built.append(f'why-fast/{a["slug"]}/index.html')
    print('\n'.join(built))


if __name__ == '__main__':
    main()
