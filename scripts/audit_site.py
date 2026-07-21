"""Lightweight structural and internal-link audit for the static portfolio."""

from __future__ import annotations

from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parents[1]
IGNORED_SCHEMES = {"data", "http", "https", "mailto", "tel", "javascript"}


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.tags: Counter[str] = Counter()
        self.ids: list[str] = []
        self.references: list[tuple[str, str]] = []
        self.images: list[dict[str, str | None]] = []
        self.blank_links: list[dict[str, str | None]] = []
        self.meta: list[dict[str, str | None]] = []
        self.links: list[dict[str, str | None]] = []
        self.scripts: list[dict[str, str | None]] = []
        self.title_parts: list[str] = []
        self.in_title = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self._record(tag, attrs)
        if tag == "title":
            self.in_title = True

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self._record(tag, attrs)

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self.in_title = False

    def handle_data(self, data: str) -> None:
        if self.in_title:
            self.title_parts.append(data)

    def _record(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        self.tags[tag] += 1
        if values.get("id"):
            self.ids.append(values["id"] or "")
        if tag in {"a", "link"} and values.get("href") is not None:
            self.references.append(("href", values.get("href") or ""))
        if tag in {"img", "script", "source"} and values.get("src") is not None:
            self.references.append(("src", values.get("src") or ""))
        if tag == "img":
            self.images.append(values)
        if tag == "a" and values.get("target") == "_blank":
            self.blank_links.append(values)
        if tag == "meta":
            self.meta.append(values)
        if tag == "link":
            self.links.append(values)
        if tag == "script":
            self.scripts.append(values)


def local_target(page: Path, raw_url: str) -> Path | None:
    if not raw_url or raw_url.startswith("#"):
        return None
    parsed = urlsplit(raw_url)
    if parsed.scheme.lower() in IGNORED_SCHEMES or parsed.netloc:
        return None
    clean_path = unquote(parsed.path)
    if not clean_path:
        return None
    target = ROOT / clean_path.lstrip("/") if clean_path.startswith("/") else page.parent / clean_path
    target = target.resolve()
    if target.is_dir() or clean_path.endswith("/"):
        target /= "index.html"
    return target


def audit() -> list[str]:
    errors: list[str] = []
    html_files = sorted(ROOT.rglob("*.html"))
    seen_titles: dict[str, str] = {}
    seen_descriptions: dict[str, str] = {}

    for page in html_files:
        parser = PageParser()
        parser.feed(page.read_text(encoding="utf-8"))
        label = page.relative_to(ROOT).as_posix()

        for tag in ("html", "head", "body", "main"):
            if parser.tags[tag] != 1:
                errors.append(f"{label}: expected one <{tag}>, found {parser.tags[tag]}")
        if parser.tags["title"] != 1:
            errors.append(f"{label}: expected one <title>, found {parser.tags['title']}")
        if parser.tags["h1"] != 1:
            errors.append(f"{label}: expected one <h1>, found {parser.tags['h1']}")
        if parser.tags["iframe"]:
            errors.append(f"{label}: iframe found")

        important = (
            page.parent == ROOT and page.name in {
                "index.html", "about.html", "projects.html", "experience.html",
                "certificates.html", "resume.html", "contact.html",
            }
        ) or page.parent == ROOT / "blogs"
        if important:
            named_meta = {item.get("name"): item.get("content") for item in parser.meta}
            property_meta = {item.get("property"): item.get("content") for item in parser.meta}
            link_rels = {item.get("rel") for item in parser.links}
            for name in ("description", "author", "theme-color", "twitter:card"):
                if not named_meta.get(name):
                    errors.append(f"{label}: missing meta {name}")
            for name in ("og:title", "og:description", "og:image"):
                if not property_meta.get(name):
                    errors.append(f"{label}: missing meta property {name}")
            for rel in ("canonical", "icon"):
                if rel not in link_rels:
                    errors.append(f"{label}: missing {rel} link")

            title = "".join(parser.title_parts).strip()
            description = named_meta.get("description") or ""
            if title in seen_titles:
                errors.append(f"{label}: duplicate title also used by {seen_titles[title]}")
            seen_titles[title] = label
            if description in seen_descriptions:
                errors.append(f"{label}: duplicate description also used by {seen_descriptions[description]}")
            seen_descriptions[description] = label

            if page.parent == ROOT / "blogs" and page.name != "blog-index.html":
                if not any(item.get("type") == "application/ld+json" for item in parser.scripts):
                    errors.append(f"{label}: missing Article structured data")

        duplicates = sorted(key for key, count in Counter(parser.ids).items() if count > 1)
        if duplicates:
            errors.append(f"{label}: duplicate ids: {', '.join(duplicates)}")

        for image in parser.images:
            src = image.get("src") or "(missing src)"
            if image.get("alt") is None:
                errors.append(f"{label}: image missing alt: {src}")
            if not image.get("width") or not image.get("height"):
                errors.append(f"{label}: image missing dimensions: {src}")

        for link in parser.blank_links:
            rel = set((link.get("rel") or "").split())
            if not ({"noopener", "noreferrer"} & rel):
                errors.append(f"{label}: target=_blank link missing safe rel: {link.get('href')}")

        for attr, raw_url in parser.references:
            if raw_url == "#!":
                errors.append(f"{label}: placeholder link #! found")
                continue
            target = local_target(page, raw_url)
            if target is not None and not target.exists():
                errors.append(f"{label}: broken {attr} {raw_url}")

    if not (ROOT / "robots.txt").exists():
        errors.append("robots.txt is missing")
    if not (ROOT / "sitemap.xml").exists():
        errors.append("sitemap.xml is missing")
    if not (ROOT / "assets" / "lance-adhikari-resume.pdf").exists():
        errors.append("downloadable resume PDF is missing")
    return errors


if __name__ == "__main__":
    findings = audit()
    if findings:
        print(f"FAIL: {len(findings)} issue(s)")
        for finding in findings:
            print(f"- {finding}")
        raise SystemExit(1)
    page_count = len(list(ROOT.rglob("*.html")))
    print(f"PASS: {page_count} HTML pages; structure, images, links, and safety attributes verified.")
