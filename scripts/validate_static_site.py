#!/usr/bin/env python3
"""Validate the committed Luqevora static site before GitHub Pages deployment."""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlparse

SITE_HOSTS = {"luqevora.com", "www.luqevora.com"}
SKIP_SCHEMES = {"mailto", "tel", "javascript", "data"}
LEGACY_OPERATOR_PATTERNS = (
    "運営：LuQvia",
    "運営: LuQvia",
    "Operated by LuQvia",
)
XSERVER_SHOP_ENDED_A8_MARKERS = (
    "4B844Z+A7XXEI+CO4",
    "s00000001642010",
)
REQUIRED_FILES = (
    ".nojekyll",
    "404.html",
    "CNAME",
    "index.html",
    "robots.txt",
    "sitemap.xml",
    "search-index.json",
    "product-catalog.json",
    "ja/mobile-connectivity/fiber-internet-comparison-remote-work-small-business/index.html",
    "ja/mobile-connectivity/goen-mobile-review/index.html",
    "ja/mobile-connectivity/giga-wifi-review/index.html",
    "ja/mobile-connectivity/corporate-smartphone-com-review/index.html",
    "ja/website-builders/sakupeji-review/index.html",
    "ja/mobile-connectivity/esim-square-review/index.html",
    "ja/hosting-security/suika-vpn-review/index.html",
    "assets/images/articles/ja/hosting-security/suika-vpn-overseas-vod-flow.png",
    "assets/images/articles/ja/hosting-security/suika-vpn-plan-selector.png",
    "assets/images/articles/ja/hosting-security/suika-vpn-troubleshooting.png",
)


class ReferenceParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.refs: list[tuple[str, str]] = []
        self.ids: list[str] = []
        self.title_seen = False
        self.description_seen = False
        self.canonical_seen = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {k.lower(): v for k, v in attrs if v is not None}
        if "id" in values:
            self.ids.append(values["id"])
        if tag.lower() == "title":
            self.title_seen = True
        if tag.lower() == "meta" and values.get("name", "").lower() == "description":
            if values.get("content", "").strip():
                self.description_seen = True
        if tag.lower() == "link" and values.get("rel", "").lower() == "canonical":
            if values.get("href", "").strip():
                self.canonical_seen = True
        for attr in ("href", "src", "poster"):
            value = values.get(attr)
            if value:
                self.refs.append((attr, value.strip()))
        srcset = values.get("srcset")
        if srcset:
            for item in srcset.split(","):
                candidate = item.strip().split()[0] if item.strip() else ""
                if candidate:
                    self.refs.append(("srcset", candidate))


def resolve_target(public_root: Path, page_file: Path, reference: str) -> Path | None:
    reference = reference.strip()
    if not reference or reference.startswith("#"):
        return None

    parsed = urlparse(reference)
    if parsed.scheme.lower() in SKIP_SCHEMES:
        return None
    if parsed.scheme and parsed.scheme not in {"http", "https"}:
        return None
    if parsed.netloc and parsed.netloc.lower() not in SITE_HOSTS:
        return None

    if parsed.netloc:
        path = unquote(parsed.path)
    else:
        page_url = "/" + page_file.relative_to(public_root).as_posix()
        if page_url.endswith("index.html"):
            page_url = page_url[: -len("index.html")]
        path = unquote(urlparse(urljoin(page_url, reference)).path)

    if not path or path == "/":
        return public_root / "index.html"

    candidate = public_root / path.lstrip("/")
    if path.endswith("/"):
        return candidate / "index.html"
    if candidate.suffix:
        return candidate
    if candidate.is_dir():
        return candidate / "index.html"
    html_candidate = candidate.with_suffix(".html")
    if html_candidate.exists():
        return html_candidate
    return candidate


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("public_root", type=Path)
    parser.add_argument("--report", type=Path, default=Path("validation-report.json"))
    args = parser.parse_args()

    root = args.public_root.resolve()
    errors: list[str] = []
    warnings: list[str] = []
    stats: dict[str, int] = {}

    if not root.is_dir():
        errors.append(f"Public directory not found: {root}")
    else:
        for required in REQUIRED_FILES:
            if not (root / required).is_file():
                errors.append(f"Required file is missing: {required}")

        symlinks = [p.relative_to(root).as_posix() for p in root.rglob("*") if p.is_symlink()]
        if symlinks:
            errors.extend(f"Symbolic link is not allowed: {p}" for p in symlinks)

        files = [p for p in root.rglob("*") if p.is_file()]
        html_files = [p for p in files if p.suffix.lower() == ".html"]
        json_files = [p for p in files if p.suffix.lower() == ".json"]
        xml_files = [p for p in files if p.suffix.lower() == ".xml"]
        stats.update(files=len(files), html=len(html_files), json=len(json_files), xml=len(xml_files))

        if len(files) < 1000:
            errors.append(f"Public file count is unexpectedly low: {len(files)}")

        for path in json_files:
            try:
                json.loads(path.read_text(encoding="utf-8-sig"))
            except Exception as exc:
                errors.append(f"Invalid JSON: {path.relative_to(root).as_posix()}: {exc}")

        for path in xml_files:
            try:
                ET.parse(path)
            except Exception as exc:
                errors.append(f"Invalid XML: {path.relative_to(root).as_posix()}: {exc}")

        missing_refs: set[str] = set()
        duplicate_ids: set[str] = set()
        missing_metadata: set[str] = set()
        legacy_hits: set[str] = set()
        ended_affiliate_hits: set[str] = set()

        for path in html_files:
            rel = path.relative_to(root).as_posix()
            try:
                text = path.read_text(encoding="utf-8-sig")
            except UnicodeDecodeError as exc:
                errors.append(f"HTML is not valid UTF-8: {rel}: {exc}")
                continue

            for pattern in LEGACY_OPERATOR_PATTERNS:
                if pattern in text:
                    legacy_hits.add(f"{rel}: {pattern}")

            for marker in XSERVER_SHOP_ENDED_A8_MARKERS:
                if marker in text:
                    ended_affiliate_hits.add(f"{rel}: {marker}")

            html_parser = ReferenceParser()
            try:
                html_parser.feed(text)
            except Exception as exc:
                errors.append(f"HTML parser error: {rel}: {exc}")
                continue

            seen: set[str] = set()
            for element_id in html_parser.ids:
                if element_id in seen:
                    duplicate_ids.add(f"{rel}: {element_id}")
                seen.add(element_id)

            if not html_parser.title_seen:
                missing_metadata.add(f"{rel}: title")
            if not html_parser.description_seen:
                missing_metadata.add(f"{rel}: meta description")
            if not html_parser.canonical_seen:
                missing_metadata.add(f"{rel}: canonical")

            for _, ref in html_parser.refs:
                target = resolve_target(root, path, ref)
                if target is not None and not target.exists():
                    missing_refs.add(f"{rel} -> {ref}")

        errors.extend(f"Missing internal reference: {item}" for item in sorted(missing_refs))
        errors.extend(f"Duplicate HTML id: {item}" for item in sorted(duplicate_ids))
        errors.extend(f"Legacy operator wording remains: {item}" for item in sorted(legacy_hits))
        errors.extend(f"Ended XServer Shop affiliate marker remains: {item}" for item in sorted(ended_affiliate_hits))
        stats["xserver_shop_ended_affiliate_hits"] = len(ended_affiliate_hits)
        warnings.extend(f"Metadata not found: {item}" for item in sorted(missing_metadata))

        article = root / "ja/mobile-connectivity/fiber-internet-comparison-remote-work-small-business/index.html"
        if article.is_file():
            article_text = article.read_text(encoding="utf-8-sig")
            a8_links = len(re.findall(r"https://px\.a8\.net/", article_text))
            a8_pixels = len(re.findall(r"https://www\d+\.a8\.net/0\.gif", article_text))
            stats["affiliate_links"] = a8_links
            stats["affiliate_pixels"] = a8_pixels
            if a8_links < 5:
                errors.append(f"Affiliate article has fewer than 5 A8 links: {a8_links}")
            if a8_pixels < 5:
                errors.append(f"Affiliate article has fewer than 5 A8 tracking pixels: {a8_pixels}")

        additional_affiliates = {
            "goen-mobile-review": ("ja/mobile-connectivity/goen-mobile-review/index.html", "4B88SW+GAG0EY+424K+TS3OI"),
            "giga-wifi-review": ("ja/mobile-connectivity/giga-wifi-review/index.html", "4B8ACR+6F089M+4BRI+BWVTE"),
            "corporate-smartphone-com-review": ("ja/mobile-connectivity/corporate-smartphone-com-review/index.html", "4B88SW+G3AT5M+2BZM+1THW9E"),
            "sakupeji-review": ("ja/website-builders/sakupeji-review/index.html", "4B86H1+16V93U+2BZM+4GTE7M"),
            "esim-square-review": ("ja/mobile-connectivity/esim-square-review/index.html", "4B88SX+TRPSQ+5460+C164Y"),
            "suika-vpn-review": ("ja/hosting-security/suika-vpn-review/index.html", "4B88SX+D3KUY+4R3G+61C2Q"),
        }
        stats["additional_affiliate_articles"] = len(additional_affiliates)
        for affiliate_name, (rel_path, marker) in additional_affiliates.items():
            target = root / rel_path
            if not target.is_file():
                errors.append(f"Additional affiliate article missing: {rel_path}")
                continue
            article_text = target.read_text(encoding="utf-8-sig")
            if marker not in article_text:
                errors.append(f"Affiliate marker missing for {affiliate_name}: {marker}")
            if "rel=\"nofollow sponsored noopener noreferrer\"" not in article_text:
                errors.append(f"Sponsored rel attribute missing for {affiliate_name}")


        suika_article = root / "ja/hosting-security/suika-vpn-review/index.html"
        if suika_article.is_file():
            suika_html = suika_article.read_text(encoding="utf-8-sig")
            suika_visible = re.sub(r"<script[\s\S]*?</script>|<style[\s\S]*?</style>", "", suika_html, flags=re.I)
            suika_visible = re.sub(r"<[^>]+>", "", suika_visible)
            suika_visible = re.sub(r"\s+", "", suika_visible)
            suika_images = re.findall(r'src="/assets/images/articles/ja/hosting-security/suika-vpn[^"]+"', suika_html)
            stats["suika_article_text_chars"] = len(suika_visible)
            stats["suika_article_images"] = len(suika_images)
            if len(suika_visible) < 1200:
                errors.append(f"Suika VPN article has fewer than 1200 visible characters: {len(suika_visible)}")
            if len(suika_images) < 4:
                errors.append(f"Suika VPN article has fewer than 4 editorial images: {len(suika_images)}")
            if "2026年7月25日" not in suika_html:
                errors.append("Suika VPN article does not visibly preserve the publication date.")
            if "2026年8月7日" not in suika_html:
                errors.append("Suika VPN article does not show the latest verification date.")

        xserver_core_pages = (
            "ja/hosting-security/xserver-rental-server-review/index.html",
            "ja/hosting-security/xserver-rental-server-pricing/index.html",
            "ja/hosting-security/xserver-rental-server-pros-cons/index.html",
            "ja/hosting-security/xserver-wordpress-quick-start-guide/index.html",
            "ja/hosting-security/xserver-multiple-domain-site-guide/index.html",
            "ja/hosting-security/xserver-company-website-email-guide/index.html",
            "ja/hosting-security/xserver-vs-conoha-wing/index.html",
            "ja/hosting-security/xserver-vs-lolipop/index.html",
            "ja/hosting-security/shin-rental-server-vs-xserver/index.html",
        )
        xserver_funnel_pages = (
            "ja/hosting-security/best-japanese-web-hosting/index.html",
            "ja/hosting-security/best-wordpress-hosting-japan/index.html",
            "ja/hosting-security/hostinger-vs-xserver/index.html",
            "ja/hosting-security/hostinger-vs-xserver-small-business/index.html",
        )
        xserver_marker = "4B84X2+CO22XM+CO4+"
        xserver_review_path = "/ja/hosting-security/xserver-rental-server-review/"
        stats["xserver_core_pages_checked"] = len(xserver_core_pages)
        stats["xserver_funnel_pages_checked"] = len(xserver_funnel_pages)

        for rel_path in xserver_core_pages:
            target = root / rel_path
            if not target.is_file():
                errors.append(f"XServer core page missing: {rel_path}")
                continue
            page_text = target.read_text(encoding="utf-8-sig")
            if xserver_marker not in page_text:
                errors.append(f"XServer A8 marker missing: {rel_path}")
            if 'data-affiliate-name="xserver"' not in page_text:
                errors.append(f"XServer affiliate name missing: {rel_path}")
            if 'data-affiliate-status="active"' not in page_text:
                errors.append(f"XServer affiliate status missing: {rel_path}")
            if "2026年8月7日" not in page_text:
                errors.append(f"XServer page verification date missing: {rel_path}")

        for rel_path in xserver_funnel_pages:
            target = root / rel_path
            if not target.is_file():
                errors.append(f"XServer funnel page missing: {rel_path}")
                continue
            page_text = target.read_text(encoding="utf-8-sig")
            if xserver_review_path not in page_text:
                errors.append(f"XServer review funnel link missing: {rel_path}")
            if "2026年8月7日" not in page_text:
                errors.append(f"XServer funnel verification date missing: {rel_path}")

        for rel_path in (
            "ja/hosting-security/xserver-rental-server-review/index.html",
            "ja/hosting-security/xserver-rental-server-pricing/index.html",
        ):
            target = root / rel_path
            if target.is_file():
                page_text = target.read_text(encoding="utf-8-sig")
                if "2026年9月7日17:00" not in page_text:
                    errors.append(f"XServer campaign deadline missing: {rel_path}")
                if "campaign/campaign_260804.php" not in page_text:
                    errors.append(f"XServer campaign source missing: {rel_path}")

        analytics_file = root / "assets/js/analytics-v5.0.0.js"
        if not analytics_file.is_file():
            errors.append("Analytics v5.0.0 file missing.")
        else:
            analytics_text = analytics_file.read_text(encoding="utf-8-sig")
            for mapping in (
                "if (code.includes('+CO22XM+CO4+')) return 'xserver';",
                "if (code.includes('+8CNY1M+CO4+')) return 'xserver_for_wordpress';",
                "if (code.includes('+2FIRH6+5GDG+')) return 'shin_rental_server';",
            ):
                if mapping not in analytics_text:
                    errors.append(f"Affiliate analytics mapping missing: {mapping}")

        cname = root / "CNAME"
        if cname.is_file() and cname.read_text(encoding="utf-8-sig").strip() != "luqevora.com":
            warnings.append("CNAME does not contain exactly 'luqevora.com'.")

    result = {
        "ok": not errors,
        "public_root": str(root),
        "stats": stats,
        "errors": errors,
        "warnings": warnings,
    }
    args.report.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main())
