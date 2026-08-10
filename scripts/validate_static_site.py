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
XSERVER_SHOP_RETIRED_AFFILIATE_METADATA = (
    'data-affiliate-key="xserver-shop"',
    '"affiliateKey":"xserver-shop"',
    '"affiliateKey": "xserver-shop"',
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


class TableWrapperParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.stack: list[tuple[str, bool]] = []
        self.table_total = 0
        self.unwrapped_tables = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr_map = {k.lower(): v or "" for k, v in attrs}
        classes = set(attr_map.get("class", "").split())
        in_table_scroll = any(flag for _, flag in self.stack) or (tag.lower() == "div" and "table-scroll" in classes)
        if tag.lower() == "table":
            self.table_total += 1
            if not in_table_scroll:
                self.unwrapped_tables += 1
        self.stack.append((tag.lower(), in_table_scroll))

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                del self.stack[i:]
                break


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

            for marker in XSERVER_SHOP_RETIRED_AFFILIATE_METADATA:
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
            "millenvpn-review": ("ja/hosting-security/millenvpn-review/index.html", "4B88SX+PLOKA+3JTE+HV7V6"),
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
            if "2026年8月8日" not in suika_html:
                errors.append("Suika VPN article does not show the latest verification date.")

        millen_article = root / "ja/hosting-security/millenvpn-review/index.html"
        if millen_article.is_file():
            millen_html = millen_article.read_text(encoding="utf-8-sig")
            millen_a8_links = len(re.findall(r"https://px\.a8\.net/svt/ejp\?a8mat=4B88SX\+PLOKA\+3JTE\+HV7V6", millen_html))
            millen_pixels = len(re.findall(r"https://www18\.a8\.net/0\.gif\?a8mat=4B88SX\+PLOKA\+3JTE\+HV7V6", millen_html))
            stats["millenvpn_a8_links"] = millen_a8_links
            stats["millenvpn_a8_pixels"] = millen_pixels
            if millen_a8_links < 3:
                errors.append(f"MillenVPN article has fewer than 3 A8 links: {millen_a8_links}")
            if millen_pixels < 3:
                errors.append(f"MillenVPN article has fewer than 3 A8 tracking pixels: {millen_pixels}")
            for required_text in (
                "2026年8月8日",
                "月額換算396円",
                "7日638円",
                "30日間返金保証",
                "https://support.millenvpn.jp/30",
                'data-affiliate-name="millenvpn"',
                "/ja/hosting-security/suika-vpn-review/",
            ):
                if required_text not in millen_html:
                    errors.append(f"MillenVPN revenue-route marker missing: {required_text}")

        vpn_topic = root / "ja/topics/vpn-security/index.html"
        if vpn_topic.is_file():
            vpn_topic_text = vpn_topic.read_text(encoding="utf-8-sig")
            if "最初に比較する2候補" not in vpn_topic_text or "/ja/hosting-security/millenvpn-review/" not in vpn_topic_text:
                errors.append("VPN topic page does not contain the MillenVPN decision route.")

        # v5.7.1 VPN search/revenue cluster safeguards
        vpn_track_specs = (
            ("ja/hosting-security/millenvpn-review/index.html", "mllnrev", "millenvpn", 3),
            ("ja/hosting-security/suika-vpn-review/index.html", "suikarev", "suikavpn", 3),
        )
        vpn_tracked_ctas = 0
        for rel_path, page_id, product_id, expected in vpn_track_specs:
            page = root / rel_path
            if not page.is_file():
                errors.append(f"VPN tracked page missing: {rel_path}")
                continue
            page_text = page.read_text(encoding="utf-8-sig")
            hits = len(re.findall(rf'id1={page_id}(?:&amp;|&)id2=(?:top|mid|btm)(?:&amp;|&)id3=review(?:&amp;|&)id4={product_id}(?:&amp;|&)id5=v571', page_text))
            vpn_tracked_ctas += hits
            if hits != expected:
                errors.append(f"VPN tracking parameter count mismatch for {rel_path}: {hits} != {expected}")
        stats["vpn_v571_tracked_ctas"] = vpn_tracked_ctas

        for lang in ("ja", "en"):
            product_page = root / f"{lang}/products/nordvpn/index.html"
            if product_page.is_file():
                product_text = product_page.read_text(encoding="utf-8-sig")
                target = f"https://luqevora.com/{lang}/hosting-security/nordvpn-review/"
                if 'content="noindex,follow,max-image-preview:large"' not in product_text or f'href="{target}" rel="canonical"' not in product_text:
                    errors.append(f"NordVPN product authority consolidation missing for {lang}")

        pages_sitemap = root / "sitemaps/pages.xml"
        if pages_sitemap.is_file():
            sitemap_text = pages_sitemap.read_text(encoding="utf-8-sig")
            for forbidden in ("https://luqevora.com/ja/products/nordvpn/", "https://luqevora.com/en/products/nordvpn/"):
                if forbidden in sitemap_text:
                    errors.append(f"Noncanonical NordVPN product remains in sitemap: {forbidden}")

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
            if "2026年8月8日" not in page_text:
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

        shin_core_pages = (
            "ja/hosting-security/shin-rental-server-review/index.html",
            "ja/hosting-security/shin-rental-server-pricing/index.html",
            "ja/hosting-security/shin-rental-server-pros-cons/index.html",
            "ja/hosting-security/shin-rental-server-wordpress/index.html",
            "ja/hosting-security/shin-rental-server-vs-xserver/index.html",
            "ja/hosting-security/shin-rental-server-vs-mixhost/index.html",
            "ja/hosting-security/shin-rental-server-vs-lolipop/index.html",
            "ja/hosting-security/shin-rental-server-vs-conoha-wing/index.html",
        )
        shin_marker = "+2FIRH6+5GDG+"
        stats["shin_core_pages_checked"] = len(shin_core_pages)
        shin_total_links = 0
        for rel_path in shin_core_pages:
            target = root / rel_path
            if not target.is_file():
                errors.append(f"Shin Rental Server core page missing: {rel_path}")
                continue
            page_text = target.read_text(encoding="utf-8-sig")
            shin_total_links += len(re.findall(r"https://px\.a8\.net/svt/ejp\?a8mat=[^\"]*\+2FIRH6\+5GDG\+", page_text))
            if shin_marker not in page_text:
                errors.append(f"Shin Rental Server A8 marker missing: {rel_path}")
            if 'data-affiliate-name="shin_rental_server"' not in page_text:
                errors.append(f"Shin Rental Server affiliate name missing: {rel_path}")
            if 'data-affiliate-status="active"' not in page_text:
                errors.append(f"Shin Rental Server affiliate status missing: {rel_path}")
            if "2026年8月7日" not in page_text:
                errors.append(f"Shin Rental Server verification date missing: {rel_path}")
            if rel_path != "ja/hosting-security/shin-rental-server-review/index.html" and "/ja/hosting-security/shin-rental-server-review/" not in page_text:
                errors.append(f"Shin Rental Server review funnel link missing: {rel_path}")
        stats["shin_a8_links_total_core"] = shin_total_links

        for rel_path in (
            "ja/hosting-security/shin-rental-server-review/index.html",
            "ja/hosting-security/shin-rental-server-pricing/index.html",
        ):
            target = root / rel_path
            if target.is_file():
                page_text = target.read_text(encoding="utf-8-sig")
                a8_count = len(re.findall(r"https://px\.a8\.net/svt/ejp\?a8mat=[^\"]*\+2FIRH6\+5GDG\+", page_text))
                if a8_count < 3:
                    errors.append(f"Shin Rental Server revenue page has fewer than 3 A8 links: {rel_path}: {a8_count}")
                if "2026年8月10日17:00" not in page_text:
                    errors.append(f"Shin Rental Server campaign deadline missing: {rel_path}")
                if "campaign/campaign_260707.php" not in page_text:
                    errors.append(f"Shin Rental Server campaign source missing: {rel_path}")
                if "862円" not in page_text or "1,401円" not in page_text or "2,802円" not in page_text:
                    errors.append(f"Shin Rental Server campaign prices missing: {rel_path}")

        jetboy_direct = (
            "ja/hosting-security/jetboy-review/index.html",
            "ja/hosting-security/jetboy-vs-hostinger/index.html",
            "ja/hosting-security/jetboy-vs-xserver-for-wordpress/index.html",
        )
        jetboy_funnel = (
            "ja/hosting-security/cpanel-hosting-comparison/index.html",
            "ja/hosting-security/litespeed-hosting-comparison/index.html",
        )
        jetboy_total_links = 0
        jetboy_total_pixels = 0
        for rel_path in jetboy_direct:
            target = root / rel_path
            if not target.is_file():
                errors.append(f"JETBOY revenue page missing: {rel_path}")
                continue
            page_text = target.read_text(encoding="utf-8-sig")
            a8_count = len(re.findall(r"https://px\.a8\.net/svt/ejp\?a8mat=[^\"]*\+1PBOUY\+MZI\+", page_text))
            pixel_count = len(re.findall(r"https://www\d+\.a8\.net/0\.gif\?a8mat=[^\"]*\+1PBOUY\+MZI\+", page_text))
            jetboy_total_links += a8_count
            jetboy_total_pixels += pixel_count
            if a8_count != 3:
                errors.append(f"JETBOY focused page should have exactly 3 A8 links: {rel_path}: {a8_count}")
            if pixel_count != 3:
                errors.append(f"JETBOY focused page should have exactly 3 tracking pixels: {rel_path}: {pixel_count}")
            for needle in ('data-affiliate-name="jetboy"', 'data-affiliate-status="active"', '2026年8月7日'):
                if needle not in page_text:
                    errors.append(f"JETBOY marker missing: {rel_path}: {needle}")
            if rel_path != "ja/hosting-security/jetboy-review/index.html" and 'data-revenue-route="jetboy"' not in page_text:
                errors.append(f"JETBOY review funnel missing from comparison: {rel_path}")
        for rel_path in jetboy_funnel:
            target = root / rel_path
            if not target.is_file():
                errors.append(f"JETBOY funnel page missing: {rel_path}")
                continue
            page_text = target.read_text(encoding="utf-8-sig")
            a8_count = len(re.findall(r"https://px\.a8\.net/svt/ejp\?a8mat=[^\"]*\+1PBOUY\+MZI\+", page_text))
            if a8_count != 0:
                errors.append(f"JETBOY generic comparison should not contain direct A8 link: {rel_path}: {a8_count}")
            if 'data-revenue-route="jetboy"' not in page_text or '/ja/hosting-security/jetboy-review/' not in page_text:
                errors.append(f"JETBOY internal funnel missing: {rel_path}")
            if "2026年8月7日" not in page_text:
                errors.append(f"JETBOY funnel verification date missing: {rel_path}")
        stats["jetboy_a8_links_total_core"] = jetboy_total_links
        stats["jetboy_a8_pixels_total_core"] = jetboy_total_pixels
        stats["jetboy_funnel_pages_checked"] = len(jetboy_funnel)
        if jetboy_total_links != 9 or jetboy_total_pixels != 9:
            errors.append(f"JETBOY total focused A8 target mismatch: links={jetboy_total_links}, pixels={jetboy_total_pixels}")
        jetboy_review_text = (root / "ja/hosting-security/jetboy-review/index.html").read_text(encoding="utf-8-sig")
        for marker_text in ("初期費用50%OFF", "14日", "550円", "10,978円", "翌日に自動", "毎日自動でリモートバックアップ"):
            if marker_text not in jetboy_review_text:
                errors.append(f"JETBOY review current-condition marker missing: {marker_text}")

        ikkatsu_core = (
            "ja/seo-marketing/ikkatsu-video-production-review/index.html",
            "ja/seo-marketing/ikkatsu-video-production-pricing-guide/index.html",
            "ja/seo-marketing/ikkatsu-video-vs-direct-inquiry/index.html",
            "ja/seo-marketing/video-production-vendor-selection-guide/index.html",
        )
        ikkatsu_total_links = 0
        for rel_path in ikkatsu_core:
            target = root / rel_path
            if not target.is_file():
                errors.append(f"Ikkatsu video revenue page missing: {rel_path}")
                continue
            page_text = target.read_text(encoding="utf-8-sig")
            a8_count = len(re.findall(r"https://px\.a8\.net/svt/ejp\?a8mat=[^\"]*\+19UF4Q\+", page_text))
            ikkatsu_total_links += a8_count
            if a8_count < 3:
                errors.append(f"Ikkatsu video revenue page has fewer than 3 A8 links: {rel_path}: {a8_count}")
            if 'data-affiliate-name="ikkatsu_video"' not in page_text:
                errors.append(f"Ikkatsu video affiliate name missing: {rel_path}")
            if "2026年8月7日" not in page_text:
                errors.append(f"Ikkatsu video verification date missing: {rel_path}")
            if rel_path != "ja/seo-marketing/ikkatsu-video-production-review/index.html" and "/ja/seo-marketing/ikkatsu-video-production-review/" not in page_text:
                errors.append(f"Ikkatsu video review funnel link missing: {rel_path}")
        stats["ikkatsu_a8_links_total_core"] = ikkatsu_total_links
        if ikkatsu_total_links < 12:
            errors.append(f"Ikkatsu video total A8 links below target: {ikkatsu_total_links}")

        xserver_wp_review = root / "ja/hosting-security/xserver-for-wordpress-review/index.html"
        xserver_wp_related = (
            "ja/hosting-security/xserver-for-wordpress-vs-xserver-business/index.html",
            "ja/hosting-security/business-wordpress-hosting-comparison/index.html",
            "ja/hosting-security/xserver-for-wordpress-vs-cpi/index.html",
            "ja/hosting-security/iclusta-vs-xserver-for-wordpress/index.html",
            "ja/hosting-security/jetboy-vs-xserver-for-wordpress/index.html",
        )
        if not xserver_wp_review.is_file():
            errors.append("XServer for WordPress review missing.")
        else:
            xwp_text = xserver_wp_review.read_text(encoding="utf-8-sig")
            xwp_links = len(re.findall(r"https://px\.a8\.net/svt/ejp\?a8mat=4B844Z\+8CNY1M\+CO4\+3YW8WI", xwp_text))
            xwp_pixels = len(re.findall(r"https://www16\.a8\.net/0\.gif\?a8mat=4B844Z\+8CNY1M\+CO4\+3YW8WI", xwp_text))
            stats["xserver_for_wordpress_a8_links"] = xwp_links
            stats["xserver_for_wordpress_a8_pixels"] = xwp_pixels
            if xwp_links != 3:
                errors.append(f"XServer for WordPress review should have exactly 3 focused A8 links: {xwp_links}")
            if xwp_pixels != 3:
                errors.append(f"XServer for WordPress review should have exactly 3 tracking pixels: {xwp_pixels}")
            for marker in (
                'data-affiliate-name="xserver_for_wordpress"',
                "2026年8月7日",
                "2026年9月15日17:00",
                "2,059円",
                "4,118円",
                "9,504円",
                "38,016円",
                "14日間",
            ):
                if marker not in xwp_text:
                    errors.append(f"XServer for WordPress revenue-route marker missing: {marker}")

        xwp_funnel_count = 0
        for rel_path in xserver_wp_related:
            target = root / rel_path
            if not target.is_file():
                errors.append(f"XServer for WordPress related page missing: {rel_path}")
                continue
            page_text = target.read_text(encoding="utf-8-sig")
            if 'data-revenue-route="xserver-for-wordpress"' not in page_text:
                errors.append(f"XServer for WordPress review funnel link missing: {rel_path}")
            else:
                xwp_funnel_count += 1
            if 'content="2026-08-07" property="article:modified_time"' not in page_text and 'property="article:modified_time" content="2026-08-07"' not in page_text:
                errors.append(f"XServer for WordPress related modified date missing: {rel_path}")
        stats["xserver_for_wordpress_funnel_pages_checked"] = xwp_funnel_count

        analytics_file = root / "assets/js/analytics-v5.0.0.js"
        if not analytics_file.is_file():
            errors.append("Analytics v5.0.0 file missing.")
        else:
            analytics_text = analytics_file.read_text(encoding="utf-8-sig")
            for mapping in (
                "if (code.includes('+CO22XM+CO4+')) return 'xserver';",
                "if (code.includes('+8CNY1M+CO4+')) return 'xserver_for_wordpress';",
                "if (code.includes('+2FIRH6+5GDG+')) return 'shin_rental_server';",
                "if (code.includes('+PLOKA+3JTE+HV7V6')) return 'millenvpn';",
                "if (code.includes('+F8XPAY+4TIO+')) return 'ahamo';",
                "if (code.includes('+19UF4Q+')) return 'ikkatsu_video';",
                "if (code.includes('+BWPNE+')) return 'ablenet_storage';",
                "if (code.includes('+7YYZ4Q+OFG+')) return 'cpi';",
                "if (code.includes('+DPKE1M+')) return 'homepage_dot_com';",
                "if (code.includes('+EC6V16+5RGM+')) return 'funfo';",
            ):
                if mapping not in analytics_text:
                    errors.append(f"Affiliate analytics mapping missing: {mapping}")

        # v5.4.1 ABLENET Storage revenue-route checks
        ablenet_pages = [
            "ja/business-software/ablenet-storage-review/index.html",
            "ja/business-software/ablenet-storage-pricing-guide/index.html",
            "ja/business-software/ablenet-storage-implementation-guide/index.html",
            "ja/business-software/ablenet-storage-vs-google-drive/index.html",
            "ja/business-software/ablenet-storage-vs-nas/index.html",
        ]
        ablenet_total_links = 0
        for rel_path in ablenet_pages:
            target = root / rel_path
            if not target.is_file():
                errors.append(f"ABLENET Storage revenue page missing: {rel_path}")
                continue
            page_text = target.read_text(encoding="utf-8-sig")
            a8_count = len(re.findall(r"https://px\.a8\.net/svt/ejp\?a8mat=[^\"']*\+BWPNE\+", page_text))
            pixel_count = len(re.findall(r"https://www\d+\.a8\.net/0\.gif\?a8mat=[^\"']*\+BWPNE\+", page_text))
            ablenet_total_links += a8_count
            if a8_count != 3:
                errors.append(f"ABLENET Storage page should have exactly 3 A8 links: {rel_path}: {a8_count}")
            if pixel_count != 3:
                errors.append(f"ABLENET Storage page should have exactly 3 tracking pixels: {rel_path}: {pixel_count}")
            if 'data-affiliate-name="ablenet_storage"' not in page_text:
                errors.append(f"ABLENET Storage affiliate name missing: {rel_path}")
            if '2026年8月7日' not in page_text:
                errors.append(f"ABLENET Storage verification date missing: {rel_path}")
            if rel_path != "ja/business-software/ablenet-storage-review/index.html" and '/ja/business-software/ablenet-storage-review/' not in page_text:
                errors.append(f"ABLENET Storage review funnel link missing: {rel_path}")
        stats["ablenet_storage_a8_links_total"] = ablenet_total_links
        stats["ablenet_storage_revenue_pages_checked"] = len(ablenet_pages)
        if ablenet_total_links != 15:
            errors.append(f"ABLENET Storage total A8 links should be 15: {ablenet_total_links}")

        # v5.4.2 CPI revenue-route checks
        cpi_review = root / "ja/hosting-security/cpi-rental-server-review/index.html"
        cpi_related = (
            "ja/hosting-security/business-web-hosting-comparison/index.html",
            "ja/hosting-security/business-hosting-sla-comparison/index.html",
            "ja/hosting-security/cpi-vs-xserver-business/index.html",
            "ja/hosting-security/xserver-for-wordpress-vs-cpi/index.html",
            "ja/hosting-security/iclusta-vs-cpi/index.html",
        )
        if not cpi_review.is_file():
            errors.append("CPI review missing.")
        else:
            cpi_text = cpi_review.read_text(encoding="utf-8-sig")
            cpi_links = len(re.findall(r"https://px\.a8\.net/svt/ejp\?a8mat=4B844Z\+7YYZ4Q\+OFG\+5ZMCI", cpi_text))
            cpi_pixels = len(re.findall(r"https://www13\.a8\.net/0\.gif\?a8mat=4B844Z\+7YYZ4Q\+OFG\+5ZMCI", cpi_text))
            stats["cpi_a8_links"] = cpi_links
            stats["cpi_a8_pixels"] = cpi_pixels
            if cpi_links != 3:
                errors.append(f"CPI review should have exactly 3 focused A8 links: {cpi_links}")
            if cpi_pixels != 3:
                errors.append(f"CPI review should have exactly 3 tracking pixels: {cpi_pixels}")
            for marker in (
                'data-affiliate-name="cpi"',
                "2026年8月7日",
                "4,840円",
                "58,080円",
                "10日間",
                "20日以内",
                "200GB",
                "10GB",
                "30世代",
                "SLA",
            ):
                if marker not in cpi_text:
                    errors.append(f"CPI revenue-route marker missing: {marker}")

        cpi_funnel_count = 0
        for rel_path in cpi_related:
            target = root / rel_path
            if not target.is_file():
                errors.append(f"CPI related page missing: {rel_path}")
                continue
            page_text = target.read_text(encoding="utf-8-sig")
            if 'data-revenue-route="cpi"' not in page_text:
                errors.append(f"CPI review funnel link missing: {rel_path}")
            else:
                cpi_funnel_count += 1
            if 'content="2026-08-07" property="article:modified_time"' not in page_text and 'property="article:modified_time" content="2026-08-07"' not in page_text:
                errors.append(f"CPI related modified date missing: {rel_path}")
        stats["cpi_funnel_pages_checked"] = cpi_funnel_count


        # v5.4.3 HOMEPAGE.com revenue-route checks
        homepage_pages = (
            "ja/website-builders/homepage-com-review/index.html",
            "ja/website-builders/homepage-com-pricing-guide/index.html",
            "ja/website-builders/homepage-com-implementation-guide/index.html",
            "ja/website-builders/homepage-com-vs-self-build/index.html",
            "ja/website-builders/homepage-com-cost-checklist/index.html",
        )
        homepage_total_links = 0
        for rel_path in homepage_pages:
            target = root / rel_path
            if not target.is_file():
                errors.append(f"HOMEPAGE.com revenue page missing: {rel_path}")
                continue
            page_text = target.read_text(encoding="utf-8-sig")
            a8_count = len(re.findall(r"https://px\.a8\.net/svt/ejp\?a8mat=4B86H0\+DPKE1M\+1MWA\+4ASX02", page_text))
            pixel_count = len(re.findall(r"https://www11\.a8\.net/0\.gif\?a8mat=4B86H0\+DPKE1M\+1MWA\+4ASX02", page_text))
            homepage_total_links += a8_count
            if a8_count != 3:
                errors.append(f"HOMEPAGE.com page should have exactly 3 A8 links: {rel_path}: {a8_count}")
            if pixel_count != 3:
                errors.append(f"HOMEPAGE.com page should have exactly 3 tracking pixels: {rel_path}: {pixel_count}")
            for marker in ('data-affiliate-name="homepage_dot_com"', "2026年8月7日", "4,500円", "9,800円", "初期制作費0円"):
                if marker not in page_text:
                    errors.append(f"HOMEPAGE.com revenue marker missing in {rel_path}: {marker}")
            if rel_path != "ja/website-builders/homepage-com-review/index.html" and "/ja/website-builders/homepage-com-review/" not in page_text:
                errors.append(f"HOMEPAGE.com review funnel link missing: {rel_path}")
            for obsolete in ("55,000円", "12,700円", "21,200円", "165,000円"):
                if obsolete in page_text:
                    errors.append(f"Obsolete HOMEPAGE.com pricing remains in {rel_path}: {obsolete}")
        stats["homepage_com_a8_links_total"] = homepage_total_links
        if homepage_total_links != 15:
            errors.append(f"HOMEPAGE.com total A8 links should be 15: {homepage_total_links}")

        homepage_funnel_pages = (
            "ja/website-builders/website-renewal-cost-checklist/index.html",
            "ja/website-builders/small-business-website-builders/index.html",
            "ja/website-builders/best-website-builders-for-beginners/index.html",
            "ja/website-builders/beauty-salon-website-builder-comparison/index.html",
            "ja/website-builders/store-website-builder-comparison/index.html",
        )
        homepage_funnel_count = 0
        for rel_path in homepage_funnel_pages:
            target = root / rel_path
            if not target.is_file():
                errors.append(f"HOMEPAGE.com funnel page missing: {rel_path}")
                continue
            page_text = target.read_text(encoding="utf-8-sig")
            if 'data-revenue-route="homepage-com"' not in page_text:
                errors.append(f"HOMEPAGE.com contextual funnel missing: {rel_path}")
            else:
                homepage_funnel_count += 1
        stats["homepage_com_funnel_pages_checked"] = homepage_funnel_count

        catalog_text = (root / "product-catalog.json").read_text(encoding="utf-8-sig") if (root / "product-catalog.json").is_file() else ""
        for marker in ('"id": "homepage-com"', "月額4,500円", "月額9,800円", '"lastVerified": "2026-08-07"'):
            if marker not in catalog_text:
                errors.append(f"HOMEPAGE.com product catalog marker missing: {marker}")

        # v5.4.4 EMEAO! System Development revenue-route checks
        emeao_pages = (
            "ja/business-software/emeao-system-development-review/index.html",
            "ja/business-software/emeao-system-development-pricing-guide/index.html",
            "ja/business-software/emeao-system-development-guide/index.html",
            "ja/business-software/emeao-vs-self-search-system-company/index.html",
        )
        emeao_total_links = 0
        for rel_path in emeao_pages:
            target = root / rel_path
            if not target.is_file():
                errors.append(f"EMEAO revenue page missing: {rel_path}")
                continue
            page_text = target.read_text(encoding="utf-8-sig")
            a8_count = len(re.findall(r"https://px\.a8\.net/svt/ejp\?a8mat=4B86H1\+17GOPM\+2LHA\+2BD44I", page_text))
            pixel_count = len(re.findall(r"https://www19\.a8\.net/0\.gif\?a8mat=4B86H1\+17GOPM\+2LHA\+2BD44I", page_text))
            emeao_total_links += a8_count
            if a8_count != 3:
                errors.append(f"EMEAO page should have exactly 3 A8 links: {rel_path}: {a8_count}")
            if pixel_count != 3:
                errors.append(f"EMEAO page should have exactly 3 tracking pixels: {rel_path}: {pixel_count}")
            for required in ('data-affiliate-name="emeao_system"', "2026年8月7日", "完全無料", "最大8社"):
                if required not in page_text:
                    errors.append(f"EMEAO revenue marker missing in {rel_path}: {required}")
            if rel_path != "ja/business-software/emeao-system-development-review/index.html" and 'data-revenue-route="emeao-system"' not in page_text:
                errors.append(f"EMEAO review funnel marker missing: {rel_path}")
            if rel_path != "ja/business-software/emeao-system-development-review/index.html" and "/ja/business-software/emeao-system-development-review/" not in page_text:
                errors.append(f"EMEAO review funnel link missing: {rel_path}")
        stats["emeao_system_a8_links_total"] = emeao_total_links
        if emeao_total_links != 12:
            errors.append(f"EMEAO total A8 links should be 12: {emeao_total_links}")

        emeao_topic = root / "ja/topics/system-development/index.html"
        if not emeao_topic.is_file():
            errors.append("EMEAO system-development topic page missing")
        else:
            topic_text = emeao_topic.read_text(encoding="utf-8-sig")
            if 'data-revenue-route="emeao-system"' not in topic_text:
                errors.append("EMEAO topic revenue route missing")
            if "/ja/business-software/emeao-system-development-review/" not in topic_text:
                errors.append("EMEAO topic review link missing")

        catalog_text = (root / "product-catalog.json").read_text(encoding="utf-8-sig") if (root / "product-catalog.json").is_file() else ""
        for required in ('"id": "emeao-system"', '"lastVerified": "2026-08-07"', "完全無料", "最大8社"):
            if required not in catalog_text:
                errors.append(f"EMEAO product catalog marker missing: {required}")


        # v5.4.5 funfo revenue-route checks
        funfo_pages = (
            "ja/store-dx/funfo-review/index.html",
            "ja/store-dx/funfo-vs-kantan-chumon/index.html",
            "ja/store-dx/restaurant-pos-three-way-comparison/index.html",
            "ja/store-dx/restaurant-pos-selection-guide/index.html",
            "ja/store-dx/small-restaurant-dx-guide/index.html",
        )
        funfo_total_links = 0
        for rel_path in funfo_pages:
            target = root / rel_path
            if not target.is_file():
                errors.append(f"funfo revenue page missing: {rel_path}")
                continue
            page_text = target.read_text(encoding="utf-8-sig")
            a8_count = len(re.findall(r"https://px\.a8\.net/svt/ejp\?a8mat=[^\"']*\+EC6V16\+5RGM\+", page_text))
            pixel_count = len(re.findall(r"https://www\d+\.a8\.net/0\.gif\?a8mat=[^\"']*\+EC6V16\+5RGM\+", page_text))
            funfo_total_links += a8_count
            if a8_count != 3:
                errors.append(f"funfo page should have exactly 3 A8 links: {rel_path}: {a8_count}")
            if pixel_count != 3:
                errors.append(f"funfo page should have exactly 3 tracking pixels: {rel_path}: {pixel_count}")
            if 'data-affiliate-name="funfo"' not in page_text:
                errors.append(f"funfo affiliate name missing: {rel_path}")
            if "2026年8月7日" not in page_text:
                errors.append(f"funfo verification date missing: {rel_path}")
            if rel_path != "ja/store-dx/funfo-review/index.html":
                if 'data-revenue-route="funfo"' not in page_text:
                    errors.append(f"funfo contextual review route missing: {rel_path}")
                if "/ja/store-dx/funfo-review/" not in page_text:
                    errors.append(f"funfo review link missing: {rel_path}")
        stats["funfo_a8_links_total"] = funfo_total_links
        if funfo_total_links != 15:
            errors.append(f"funfo total A8 links should be 15: {funfo_total_links}")

        funfo_review = root / "ja/store-dx/funfo-review/index.html"
        if funfo_review.is_file():
            review_text = funfo_review.read_text(encoding="utf-8-sig")
            for required in ("Lite AI", "Business AI", "One AI", "6,930円", "11,880円", "17,820円", "7,700円", "13,200円", "19,800円"):
                if required not in review_text:
                    errors.append(f"funfo current pricing marker missing: {required}")
            for obsolete in ("4,950円", "5,550円", "9,900円", "11,000円", "14,850円", "16,500円", "Business Plus"):
                if obsolete in review_text:
                    errors.append(f"Obsolete funfo pricing remains in review: {obsolete}")

        catalog_text = (root / "product-catalog.json").read_text(encoding="utf-8-sig") if (root / "product-catalog.json").is_file() else ""
        for required in ('"id": "funfo"', '"lastVerified": "2026-08-07"', "Lite AI 6,930円", "Business AI 11,880円", "One AI 17,820円"):
            if required not in catalog_text:
                errors.append(f"funfo product catalog marker missing: {required}")


        # v5.4.6 Wiz Digital Signage revenue-route checks
        wiz_signage_pages = (
            "ja/store-dx/wiz-digital-signage-review/index.html",
            "ja/store-dx/wiz-digital-signage-pricing-guide/index.html",
            "ja/store-dx/wiz-digital-signage-implementation-guide/index.html",
            "ja/store-dx/digital-signage-guide/index.html",
            "ja/store-dx/digital-signage-cost-breakdown/index.html",
        )
        wiz_signage_link = "https://px.a8.net/svt/ejp?a8mat=4B86H1+MMIJE+3SPO+8FOCTE"
        wiz_signage_pixel = "https://www17.a8.net/0.gif?a8mat=4B86H1+MMIJE+3SPO+8FOCTE"
        wiz_signage_total_links = 0
        for rel_path in wiz_signage_pages:
            target = root / rel_path
            if not target.is_file():
                errors.append(f"Wiz Digital Signage revenue page missing: {rel_path}")
                continue
            page_text = target.read_text(encoding="utf-8-sig")
            a8_count = page_text.count(wiz_signage_link)
            pixel_count = page_text.count(wiz_signage_pixel)
            wiz_signage_total_links += a8_count
            if a8_count != 3:
                errors.append(f"Wiz Digital Signage page should have exactly 3 focused A8 links: {rel_path}: {a8_count}")
            if pixel_count != 3:
                errors.append(f"Wiz Digital Signage page should have exactly 3 tracking pixels: {rel_path}: {pixel_count}")
            for required in (
                'data-affiliate-name="wiz_digital_signage"',
                'data-product-name="Wizサイネージ"',
                'data-affiliate-position="article-top"',
                'data-affiliate-position="article-mid"',
                'data-affiliate-position="article-bottom"',
                "2026年8月7日",
                "https://012cloud.jp/service/wiz_signage_n",
                "https://012cloud.jp/article/signage-cost",
            ):
                if required not in page_text:
                    errors.append(f"Wiz Digital Signage revenue marker missing in {rel_path}: {required}")
        stats["wiz_digital_signage_a8_links_total"] = wiz_signage_total_links
        if wiz_signage_total_links != 15:
            errors.append(f"Wiz Digital Signage total A8 links should be 15: {wiz_signage_total_links}")

        wiz_signage_review = root / "ja/store-dx/wiz-digital-signage-review/index.html"
        if wiz_signage_review.is_file():
            review_text = wiz_signage_review.read_text(encoding="utf-8-sig")
            for required in ("USB型", "クラウド型", "直射日光", "タッチパネル", "個別見積"):
                if required not in review_text:
                    errors.append(f"Wiz Digital Signage review marker missing: {required}")
            if "通常プランと補助金プラン" in review_text:
                errors.append("Obsolete Wiz Digital Signage plan wording remains in review")

        wiz_signage_pricing = root / "ja/store-dx/wiz-digital-signage-pricing-guide/index.html"
        if wiz_signage_pricing.is_file():
            pricing_text = wiz_signage_pricing.read_text(encoding="utf-8-sig")
            for required in ("10万〜200万円", "月4,000〜1万円", "50万〜200万円以上", "Wizサイネージの個別料金ではありません"):
                if required not in pricing_text:
                    errors.append(f"Wiz Digital Signage pricing marker missing: {required}")

        wiz_signage_funnels = (
            "ja/store-dx/digital-signage-vs-paper-poster/index.html",
            "ja/store-dx/digital-signage-restaurant-salon-guide/index.html",
            "ja/store-dx/3d-signage-vs-digital-signage/index.html",
            "ja/store-dx/3d-phantom-vs-digital-signage/index.html",
        )
        wiz_signage_funnel_count = 0
        for rel_path in wiz_signage_funnels:
            target = root / rel_path
            if not target.is_file():
                errors.append(f"Wiz Digital Signage funnel page missing: {rel_path}")
                continue
            page_text = target.read_text(encoding="utf-8-sig")
            if 'data-revenue-route="wiz-digital-signage"' not in page_text:
                errors.append(f"Wiz Digital Signage contextual route missing: {rel_path}")
            else:
                wiz_signage_funnel_count += 1
            if "/ja/store-dx/wiz-digital-signage-review/" not in page_text:
                errors.append(f"Wiz Digital Signage review link missing: {rel_path}")
            if 'content="2026-08-07" property="article:modified_time"' not in page_text and 'property="article:modified_time" content="2026-08-07"' not in page_text:
                errors.append(f"Wiz Digital Signage funnel modified date missing: {rel_path}")
        stats["wiz_digital_signage_funnel_pages_checked"] = wiz_signage_funnel_count

        # The two comparison pages should retain the 3D Phantom affiliate, while the two plain signage funnels should route internally first.
        for rel_path in (
            "ja/store-dx/3d-signage-vs-digital-signage/index.html",
            "ja/store-dx/3d-phantom-vs-digital-signage/index.html",
        ):
            target = root / rel_path
            if target.is_file() and "+VK0M2+" not in target.read_text(encoding="utf-8-sig"):
                errors.append(f"3D Phantom affiliate link was lost while adding Wiz Signage funnel: {rel_path}")
        for rel_path in (
            "ja/store-dx/digital-signage-vs-paper-poster/index.html",
            "ja/store-dx/digital-signage-restaurant-salon-guide/index.html",
        ):
            target = root / rel_path
            if target.is_file() and "+MMIJE+" in target.read_text(encoding="utf-8-sig"):
                errors.append(f"Direct Wiz Signage A8 link should route through review first: {rel_path}")

        analytics_path = root / "assets/js/analytics-v5.0.0.js"
        if analytics_path.is_file():
            analytics_text = analytics_path.read_text(encoding="utf-8-sig")
            if "+MMIJE+" not in analytics_text or "wiz_digital_signage" not in analytics_text:
                errors.append("Wiz Digital Signage affiliate provider inference missing in analytics-v5.0.0.js")

        catalog_text = (root / "product-catalog.json").read_text(encoding="utf-8-sig") if (root / "product-catalog.json").is_file() else ""
        for required in (
            '"id": "digital-signage"',
            '"pricingModel": "quote"',
            '"lastVerified": "2026-08-07"',
            "https://012cloud.jp/service/wiz_signage_n",
            "https://012cloud.jp/article/signage-cost",
            "クラウド型は月額利用料が発生",
        ):
            if required not in catalog_text:
                errors.append(f"Wiz Digital Signage product catalog marker missing: {required}")


        # v5.4.7 Color Me Shop revenue-route checks
        color_me_pages = (
            "ja/website-builders/color-me-shop-review/index.html",
            "ja/website-builders/color-me-shop-seo-guide/index.html",
            "ja/website-builders/color-me-shop-vs-shopify/index.html",
            "ja/website-builders/color-me-shop-vs-xserver-shop/index.html",
            "ja/website-builders/japanese-ecommerce-platform-seo-comparison/index.html",
        )
        color_me_total_links = 0
        color_me_funnel_count = 0
        color_me_a8_pattern = r"https://px\.a8\.net/svt/ejp\?a8mat=4B8451\+2VLGT6\+348\+[A-Z0-9]+"
        color_me_pixel_pattern = r"https://www\d+\.a8\.net/0\.gif\?a8mat=4B8451\+2VLGT6\+348\+[A-Z0-9]+"
        for rel_path in color_me_pages:
            target = root / rel_path
            if not target.is_file():
                errors.append(f"Color Me Shop revenue page missing: {rel_path}")
                continue
            page_text = target.read_text(encoding="utf-8-sig")
            a8_count = len(re.findall(color_me_a8_pattern, page_text))
            pixel_count = len(re.findall(color_me_pixel_pattern, page_text))
            color_me_total_links += a8_count
            if a8_count != 3:
                errors.append(f"Color Me Shop page should have exactly 3 A8 links: {rel_path}: {a8_count}")
            if pixel_count != 3:
                errors.append(f"Color Me Shop page should have exactly 3 tracking pixels: {rel_path}: {pixel_count}")
            for required in (
                'data-affiliate-name="color_me_shop"',
                'data-product-name="カラーミーショップ"',
                'data-affiliate-position="article-top"',
                'data-affiliate-position="article-mid"',
                'data-affiliate-position="article-bottom"',
                "2026年8月7日",
                "https://shop-pro.jp/plans/",
                "https://shop-pro.jp/plans/free",
                "4,950円",
                "9,595円",
                "39,600円",
            ):
                if required not in page_text:
                    errors.append(f"Color Me Shop revenue marker missing in {rel_path}: {required}")
            if rel_path != "ja/website-builders/color-me-shop-review/index.html":
                if 'data-revenue-route="color-me-shop"' not in page_text:
                    errors.append(f"Color Me Shop review funnel marker missing: {rel_path}")
                else:
                    color_me_funnel_count += 1
                if "/ja/website-builders/color-me-shop-review/" not in page_text:
                    errors.append(f"Color Me Shop review funnel link missing: {rel_path}")
        stats["color_me_shop_a8_links_total"] = color_me_total_links
        stats["color_me_shop_revenue_pages_checked"] = len(color_me_pages)
        stats["color_me_shop_funnel_pages_checked"] = color_me_funnel_count
        if color_me_total_links != 15:
            errors.append(f"Color Me Shop total A8 links should be 15: {color_me_total_links}")

        color_me_review = root / "ja/website-builders/color-me-shop-review/index.html"
        if color_me_review.is_file():
            review_text = color_me_review.read_text(encoding="utf-8-sig")
            for required in (
                "フリープラン",
                "6.6% + 30円",
                "35,640円",
                "販売手数料は0円",
                "3・6・12か月",
                "有料プランからフリープラン",
                "最大213,840円",
                "https://shop-pro.jp/news/202608premium-moving/",
            ):
                if required not in review_text:
                    errors.append(f"Color Me Shop current review marker missing: {required}")

        analytics_path = root / "assets/js/analytics-v5.0.0.js"
        if analytics_path.is_file():
            analytics_text = analytics_path.read_text(encoding="utf-8-sig")
            if "+2VLGT6+348+" not in analytics_text or "color_me_shop" not in analytics_text:
                errors.append("Color Me Shop affiliate provider inference missing in analytics-v5.0.0.js")

        catalog_text = (root / "product-catalog.json").read_text(encoding="utf-8-sig") if (root / "product-catalog.json").is_file() else ""
        for required in (
            '"id": "color-me-shop"',
            '"lastVerified": "2026-08-07"',
            '"freeOption": true',
            "フリーは初期・月額0円",
            "6.6% + 30円",
            "販売手数料0円",
        ):
            if required not in catalog_text:
                errors.append(f"Color Me Shop product catalog marker missing: {required}")

        color_me_product = root / "ja/products/color-me-shop/index.html"
        if color_me_product.is_file():
            product_text = color_me_product.read_text(encoding="utf-8-sig")
            for required in ("2026-08-07", "フリーは初期・月額0円", 'data-revenue-route="color-me-shop"', "/ja/website-builders/color-me-shop-review/"):
                if required not in product_text:
                    errors.append(f"Color Me Shop product hub marker missing: {required}")

        color_me_compare = root / "ja/compare/ecommerce/index.html"
        if color_me_compare.is_file():
            compare_text = color_me_compare.read_text(encoding="utf-8-sig")
            for required in ('id="color-me-shop"', "無料枠あり", "2026-08-07", "/ja/website-builders/color-me-shop-review/"):
                if required not in compare_text:
                    errors.append(f"Color Me Shop ecommerce compare marker missing: {required}")


        # v5.4.8 Jimdo revenue-route checks
        jimdo_pages = (
            "ja/website-builders/jimdo-review/index.html",
            "ja/website-builders/jimdo-pricing/index.html",
            "ja/website-builders/jimdo-ai-builder-vs-creator/index.html",
            "ja/website-builders/jimdo-small-business-guide/index.html",
            "ja/website-builders/jimdo-vs-wix/index.html",
        )
        jimdo_total_links = 0
        jimdo_funnel_count = 0
        jimdo_a8_pattern = r"https://px\.a8\.net/svt/ejp\?a8mat=4B8452\+3HMI6Y\+OFG\+[A-Z0-9]+"
        jimdo_pixel_pattern = r"https://www\d+\.a8\.net/0\.gif\?a8mat=4B8452\+3HMI6Y\+OFG\+[A-Z0-9]+"
        for rel_path in jimdo_pages:
            target = root / rel_path
            if not target.is_file():
                errors.append(f"Jimdo revenue page missing: {rel_path}")
                continue
            page_text = target.read_text(encoding="utf-8-sig")
            a8_count = len(re.findall(jimdo_a8_pattern, page_text))
            pixel_count = len(re.findall(jimdo_pixel_pattern, page_text))
            jimdo_total_links += a8_count
            if a8_count != 3:
                errors.append(f"Jimdo page should have exactly 3 A8 links: {rel_path}: {a8_count}")
            if pixel_count != 3:
                errors.append(f"Jimdo page should have exactly 3 tracking pixels: {rel_path}: {pixel_count}")
            for required in (
                'data-affiliate-name="jimdo"',
                'data-product-name="ジンドゥー"',
                'data-affiliate-position="article-top"',
                'data-affiliate-position="article-mid"',
                'data-affiliate-position="article-bottom"',
                "2026年8月7日",
                "https://www.jimdo.com/jp/pricing/",
                "https://www.jimdo.com/jp/info/",
                "360020543431",
            ):
                if required not in page_text:
                    errors.append(f"Jimdo revenue marker missing in {rel_path}: {required}")
            if rel_path != "ja/website-builders/jimdo-review/index.html":
                if 'data-revenue-route="jimdo"' not in page_text:
                    errors.append(f"Jimdo review funnel marker missing: {rel_path}")
                else:
                    jimdo_funnel_count += 1
                if "/ja/website-builders/jimdo-review/" not in page_text:
                    errors.append(f"Jimdo review funnel link missing: {rel_path}")
        stats["jimdo_a8_links_total"] = jimdo_total_links
        stats["jimdo_revenue_pages_checked"] = len(jimdo_pages)
        stats["jimdo_funnel_pages_checked"] = jimdo_funnel_count
        if jimdo_total_links != 15:
            errors.append(f"Jimdo total A8 links should be 15: {jimdo_total_links}")

        for rel_path in (
            "ja/website-builders/jimdo-review/index.html",
            "ja/website-builders/jimdo-pricing/index.html",
        ):
            target = root / rel_path
            if target.is_file():
                page_text = target.read_text(encoding="utf-8-sig")
                for required in (
                    "15,480円", "18,720円", "66,360円", "123,360円",
                    "83,160円", "154,320円", "2,150円", "2,110円", "4,220円",
                    "価格差の扱い：",
                ):
                    if required not in page_text:
                        errors.append(f"Jimdo current pricing marker missing in {rel_path}: {required}")

        analytics_path = root / "assets/js/analytics-v5.0.0.js"
        if analytics_path.is_file():
            analytics_text = analytics_path.read_text(encoding="utf-8-sig")
            if "+3HMI6Y+OFG+" not in analytics_text or "return 'jimdo'" not in analytics_text:
                errors.append("Jimdo affiliate provider inference missing in analytics-v5.0.0.js")

        catalog_text = (root / "product-catalog.json").read_text(encoding="utf-8-sig") if (root / "product-catalog.json").is_file() else ""
        for required in (
            '"id": "jimdo"',
            '"lastVerified": "2026-08-07"',
            "1か月1,720円",
            "1年15,480円",
            "年2,150円",
            "1年2,110円",
            "2年4,220円",
            "360020543431",
            "/ja/website-builders/jimdo-review/",
            "/ja/website-builders/jimdo-pricing/",
        ):
            if required not in catalog_text:
                errors.append(f"Jimdo product catalog marker missing: {required}")

        jimdo_diagnosis = root / "ja/diagnosis/index.html"
        if jimdo_diagnosis.is_file():
            diagnosis_text = jimdo_diagnosis.read_text(encoding="utf-8-sig")
            jimdo_pos = diagnosis_text.find('"id":"jimdo"')
            if jimdo_pos < 0:
                errors.append("Jimdo diagnosis product record missing")
            else:
                jimdo_chunk = diagnosis_text[jimdo_pos:jimdo_pos+12000]
                for required in ('"lastVerified":"2026-08-07"', "1か月1,720円", "360020543431", "/ja/website-builders/jimdo-review/"):
                    if required not in jimdo_chunk:
                        errors.append(f"Jimdo diagnosis marker missing: {required}")

        jimdo_product = root / "ja/products/jimdo/index.html"
        if jimdo_product.is_file():
            product_text = jimdo_product.read_text(encoding="utf-8-sig")
            for required in ("2026-08-07", 'data-revenue-route="jimdo"', "/ja/website-builders/jimdo-review/", "10</strong><span>公式出典"):
                if required not in product_text:
                    errors.append(f"Jimdo product hub marker missing: {required}")

        for rel_path in ("ja/website-builders/index.html", "ja/topics/website-builders/index.html"):
            target = root / rel_path
            if target.is_file():
                page_text = target.read_text(encoding="utf-8-sig")
                for slug in ("jimdo-review", "jimdo-pricing", "jimdo-ai-builder-vs-creator", "jimdo-small-business-guide", "jimdo-vs-wix"):
                    anchor = f'href="/ja/website-builders/{slug}/"'
                    pos = page_text.find(anchor)
                    if pos < 0 or "最終確認: 2026-08-07" not in page_text[pos:pos+1800]:
                        errors.append(f"Jimdo current card date missing: {rel_path}: {slug}")

        # v5.4.9 Sakupeji revenue-route checks
        sakupeji_review = root / "ja/website-builders/sakupeji-review/index.html"
        sakupeji_a8_pattern = r"https://px\.a8\.net/svt/ejp\?a8mat=4B86H1\+16V93U\+2BZM\+4GTE7M"
        sakupeji_pixel_pattern = r"https://www14\.a8\.net/0\.gif\?a8mat=4B86H1\+16V93U\+2BZM\+4GTE7M"
        if sakupeji_review.is_file():
            review_text = sakupeji_review.read_text(encoding="utf-8-sig")
            sakupeji_links = len(re.findall(sakupeji_a8_pattern, review_text))
            sakupeji_pixels = len(re.findall(sakupeji_pixel_pattern, review_text))
            stats["sakupeji_a8_links_total"] = sakupeji_links
            stats["sakupeji_a8_pixels_total"] = sakupeji_pixels
            if sakupeji_links != 3:
                errors.append(f"Sakupeji review should have exactly 3 A8 links: {sakupeji_links}")
            if sakupeji_pixels != 3:
                errors.append(f"Sakupeji review should have exactly 3 tracking pixels: {sakupeji_pixels}")
            for required in (
                'data-affiliate-name="sakupeji"',
                'data-product-name="サクペジ"',
                'data-affiliate-position="article-top"',
                'data-affiliate-position="article-mid"',
                'data-affiliate-position="article-bottom"',
                "2026年8月7日",
                "120,000円",
                "240,000円",
                "480,000円",
                "11,000円",
                "5,500円",
                "https://sakupeji.lnkinc.net/",
            ):
                if required not in review_text:
                    errors.append(f"Sakupeji current marker missing: {required}")
        else:
            errors.append("Sakupeji review missing")

        sakupeji_funnel_pages = (
            "ja/website-builders/aruku-vs-self-service-website/index.html",
            "ja/website-builders/website-renewal-cost-checklist/index.html",
            "ja/website-builders/small-business-website-builders/index.html",
            "ja/website-builders/homepagedx-vs-self-build/index.html",
        )
        sakupeji_funnel_count = 0
        for rel_path in sakupeji_funnel_pages:
            target = root / rel_path
            if not target.is_file():
                errors.append(f"Sakupeji funnel page missing: {rel_path}")
                continue
            page_text = target.read_text(encoding="utf-8-sig")
            if 'data-revenue-route="sakupeji"' not in page_text:
                errors.append(f"Sakupeji funnel marker missing: {rel_path}")
            else:
                sakupeji_funnel_count += 1
            if "/ja/website-builders/sakupeji-review/" not in page_text:
                errors.append(f"Sakupeji review funnel link missing: {rel_path}")
            if "4B86H1+16V93U+2BZM+4GTE7M" in page_text:
                errors.append(f"Sakupeji direct A8 link should stay off funnel page: {rel_path}")
        stats["sakupeji_funnel_pages_checked"] = sakupeji_funnel_count

        analytics_path = root / "assets/js/analytics-v5.0.0.js"
        if analytics_path.is_file():
            analytics_text = analytics_path.read_text(encoding="utf-8-sig")
            if "+16V93U+2BZM+" not in analytics_text or "return 'sakupeji'" not in analytics_text:
                errors.append("Sakupeji affiliate provider inference missing in analytics-v5.0.0.js")

        sakupeji_category = root / "ja/website-builders/index.html"
        if sakupeji_category.is_file():
            category_text = sakupeji_category.read_text(encoding="utf-8-sig")
            anchor = 'href="/ja/website-builders/sakupeji-review/"'
            pos = category_text.find(anchor)
            if pos < 0 or "最終確認: 2026-08-07" not in category_text[pos:pos+1800]:
                errors.append("Sakupeji current card date missing in website-builders index")

        sitemap_path = root / "sitemaps/articles-ja.xml"
        if sitemap_path.is_file():
            sitemap_text = sitemap_path.read_text(encoding="utf-8-sig")
            sitemap_marker = "https://luqevora.com/ja/website-builders/sakupeji-review/</loc>\n    <lastmod>2026-08-07</lastmod>"
            if sitemap_marker not in sitemap_text:
                errors.append("Sakupeji sitemap lastmod is not current")

        # v5.5.0 aruku revenue-route checks
        aruku_pages = (
            "ja/website-builders/aruku-web-production-review/index.html",
            "ja/website-builders/aruku-web-production-pricing-guide/index.html",
            "ja/website-builders/aruku-vs-self-service-website/index.html",
            "ja/website-builders/aruku-web-production-guide/index.html",
        )
        aruku_a8_pattern = r"https://px\.a8\.net/svt/ejp\?a8mat=4B86H0\+CZDBFE\+2C9M\+HV7V6"
        aruku_pixel_pattern = r"https://www11\.a8\.net/0\.gif\?a8mat=4B86H0\+CZDBFE\+2C9M\+HV7V6"
        aruku_links_total = 0
        aruku_pixels_total = 0
        aruku_funnel_count = 0
        for rel_path in aruku_pages:
            target = root / rel_path
            if not target.is_file():
                errors.append(f"aruku revenue page missing: {rel_path}")
                continue
            page_text = target.read_text(encoding="utf-8-sig")
            link_count = len(re.findall(aruku_a8_pattern, page_text))
            pixel_count = len(re.findall(aruku_pixel_pattern, page_text))
            aruku_links_total += link_count
            aruku_pixels_total += pixel_count
            if link_count != 3:
                errors.append(f"aruku page should have exactly 3 A8 links: {rel_path}: {link_count}")
            if pixel_count != 3:
                errors.append(f"aruku page should have exactly 3 tracking pixels: {rel_path}: {pixel_count}")
            for required in (
                'data-affiliate-name="aruku_web"',
                'data-product-name="株式会社aruku"',
                'data-affiliate-position="article-top"',
                'data-affiliate-position="article-mid"',
                'data-affiliate-position="article-bottom"',
                "2026年8月7日",
                "50万円",
                "70万円",
                "100万円",
                "https://a-ru-ku.co.jp/",
                "https://a-ru-ku.co.jp/flow/",
                "https://a-ru-ku.co.jp/about/",
            ):
                if required not in page_text:
                    errors.append(f"aruku current marker missing in {rel_path}: {required}")
            if rel_path != "ja/website-builders/aruku-web-production-review/index.html":
                if 'data-revenue-route="aruku-web"' not in page_text:
                    errors.append(f"aruku review funnel marker missing: {rel_path}")
                else:
                    aruku_funnel_count += 1
                if "/ja/website-builders/aruku-web-production-review/" not in page_text:
                    errors.append(f"aruku review funnel link missing: {rel_path}")
        stats["aruku_a8_links_total"] = aruku_links_total
        stats["aruku_a8_pixels_total"] = aruku_pixels_total
        stats["aruku_revenue_pages_checked"] = len(aruku_pages)
        stats["aruku_funnel_pages_checked"] = aruku_funnel_count
        if aruku_links_total != 12:
            errors.append(f"aruku total A8 links should be 12: {aruku_links_total}")
        if aruku_pixels_total != 12:
            errors.append(f"aruku total tracking pixels should be 12: {aruku_pixels_total}")

        if analytics_path.is_file():
            analytics_text = analytics_path.read_text(encoding="utf-8-sig")
            if "+CZDBFE+" not in analytics_text or "return 'aruku_web'" not in analytics_text:
                errors.append("aruku affiliate provider inference missing in analytics-v5.0.0.js")

        product_catalog_path = root / "product-catalog.json"
        if product_catalog_path.is_file():
            product_catalog_text = product_catalog_path.read_text(encoding="utf-8-sig")
            aruku_pos = product_catalog_text.find('"id": "aruku-web"')
            if aruku_pos < 0:
                errors.append("aruku product catalog record missing")
            else:
                aruku_chunk = product_catalog_text[aruku_pos:aruku_pos+12000]
                for required in ('"lastVerified": "2026-08-07"', '"ecommerce": true', '"mobile": true', "https://a-ru-ku.co.jp/about/"):
                    if required not in aruku_chunk:
                        errors.append(f"aruku product catalog marker missing: {required}")

        aruku_category = root / "ja/website-builders/index.html"
        if aruku_category.is_file():
            category_text = aruku_category.read_text(encoding="utf-8-sig")
            for slug in ("aruku-web-production-review", "aruku-web-production-pricing-guide", "aruku-vs-self-service-website", "aruku-web-production-guide"):
                anchor = f'href="/ja/website-builders/{slug}/"'
                pos = category_text.find(anchor)
                if pos < 0 or "最終確認: 2026-08-07" not in category_text[pos:pos+1800]:
                    errors.append(f"aruku current card date missing in website-builders index: {slug}")

        if sitemap_path.is_file():
            sitemap_text = sitemap_path.read_text(encoding="utf-8-sig")
            for slug in ("aruku-web-production-review", "aruku-web-production-pricing-guide", "aruku-vs-self-service-website", "aruku-web-production-guide"):
                marker = f"https://luqevora.com/ja/website-builders/{slug}/</loc>\n    <lastmod>2026-08-07</lastmod>"
                if marker not in sitemap_text:
                    errors.append(f"aruku sitemap lastmod is not current: {slug}")

        # v5.5.1 kantan-chumon revenue-route checks
        kantan_pages = (
            "ja/store-dx/kantan-chumon-review/index.html",
            "ja/store-dx/funfo-vs-kantan-chumon/index.html",
            "ja/store-dx/restaurant-pos-vs-mobile-order/index.html",
            "ja/store-dx/restaurant-pos-three-way-comparison/index.html",
        )
        kantan_support_pages = (
            "ja/cashless-payments/pos-register-vs-cashless-payment/index.html",
            "ja/store-dx/restaurant-pos-selection-guide/index.html",
            "ja/store-dx/mobile-order-system-guide/index.html",
            "ja/store-dx/small-restaurant-dx-guide/index.html",
            "ja/store-dx/restaurant-inbound-order-guide/index.html",
        )
        kantan_a8_pattern = r"https://px\.a8\.net/svt/ejp\?a8mat=4B84X2\+E2NXCQ\+3SPO\+7XSHSY"
        kantan_pixel_pattern = r"https://www14\.a8\.net/0\.gif\?a8mat=4B84X2\+E2NXCQ\+3SPO\+7XSHSY"
        kantan_links_total = 0
        kantan_pixels_total = 0
        for rel_path in kantan_pages:
            target = root / rel_path
            if not target.is_file():
                errors.append(f"kantan revenue page missing: {rel_path}")
                continue
            page_text = target.read_text(encoding="utf-8-sig")
            link_count = len(re.findall(kantan_a8_pattern, page_text))
            pixel_count = len(re.findall(kantan_pixel_pattern, page_text))
            kantan_links_total += link_count
            kantan_pixels_total += pixel_count
            if link_count != 3:
                errors.append(f"kantan page should have exactly 3 A8 links: {rel_path}: {link_count}")
            if pixel_count != 3:
                errors.append(f"kantan page should have exactly 3 tracking pixels: {rel_path}: {pixel_count}")
            for required in (
                'data-affiliate-name="kantan_chumon"',
                'data-product-name="かんたん注文"',
                'data-affiliate-position="article-top"',
                'data-affiliate-position="article-mid"',
                'data-affiliate-position="article-bottom"',
                "2026年8月7日",
                "2026年9月30日",
                "https://www.kantan-order.com/pricing_details/",
                "https://www.kantan-order.com/pos_reji/",
            ):
                if required not in page_text:
                    errors.append(f"kantan current marker missing in {rel_path}: {required}")
            if "f.012grp.co.jp/wiz_kantanchumon_hojyokin" in page_text:
                errors.append(f"legacy kantan Wiz subsidy source remains: {rel_path}")
        stats["kantan_a8_links_total"] = kantan_links_total
        stats["kantan_a8_pixels_total"] = kantan_pixels_total
        stats["kantan_revenue_pages_checked"] = len(kantan_pages)
        if kantan_links_total != 12:
            errors.append(f"kantan total A8 links should be 12: {kantan_links_total}")
        if kantan_pixels_total != 12:
            errors.append(f"kantan total tracking pixels should be 12: {kantan_pixels_total}")

        kantan_funnels = 0
        for rel_path in kantan_support_pages:
            target = root / rel_path
            if not target.is_file():
                errors.append(f"kantan support page missing: {rel_path}")
                continue
            page_text = target.read_text(encoding="utf-8-sig")
            if re.search(kantan_a8_pattern, page_text):
                errors.append(f"kantan support page should funnel internally, not direct A8: {rel_path}")
            if 'data-revenue-route="kantan-chumon"' not in page_text or "/ja/store-dx/kantan-chumon-review/" not in page_text:
                errors.append(f"kantan review funnel missing: {rel_path}")
            else:
                kantan_funnels += 1
        stats["kantan_funnel_pages_checked"] = kantan_funnels

        if analytics_path.is_file():
            analytics_text = analytics_path.read_text(encoding="utf-8-sig")
            if "+E2NXCQ+" not in analytics_text or "return 'kantan_chumon'" not in analytics_text:
                errors.append("kantan affiliate provider inference missing in analytics-v5.0.0.js")

        product_catalog_path = root / "product-catalog.json"
        if product_catalog_path.is_file():
            product_catalog_text = product_catalog_path.read_text(encoding="utf-8-sig")
            pos = product_catalog_text.find('"id": "kantan-chumon"')
            if pos < 0:
                errors.append("kantan product catalog record missing")
            else:
                chunk = product_catalog_text[pos:pos+16000]
                for required in ('"lastVerified": "2026-08-07"', "税込3,278円", "税込17,578円", "2026年9月30日", "https://home.kantan-order.com/"):
                    if required not in chunk:
                        errors.append(f"kantan product catalog marker missing: {required}")
                if "f.012grp.co.jp/wiz_kantanchumon_hojyokin" in chunk:
                    errors.append("legacy kantan Wiz subsidy source remains in product catalog")

        kantan_product = root / "ja/products/kantan-chumon/index.html"
        if kantan_product.is_file():
            product_text = kantan_product.read_text(encoding="utf-8-sig")
            for required in ("税込3,278円", "税込17,578円", "2026年9月30日", "1.98〜3.24%", "2026-08-07"):
                if required not in product_text:
                    errors.append(f"kantan product page marker missing: {required}")

        if sitemap_path.is_file():
            sitemap_text = sitemap_path.read_text(encoding="utf-8-sig")
            for rel_path in kantan_pages + kantan_support_pages:
                url = "https://luqevora.com/" + rel_path[:-10]
                marker = f"{url}</loc>\n    <lastmod>2026-08-07</lastmod>"
                if marker not in sitemap_text:
                    errors.append(f"kantan sitemap lastmod is not current: {rel_path}")

        # v5.5.2 3D Phantom revenue-route checks
        phantom_pages = (
            "ja/store-dx/3d-phantom-review/index.html",
            "ja/store-dx/3d-phantom-pricing-guide/index.html",
            "ja/store-dx/3d-phantom-implementation-guide/index.html",
            "ja/store-dx/3d-phantom-installation-checklist/index.html",
            "ja/store-dx/3d-phantom-vs-digital-signage/index.html",
        )
        phantom_generic_page = "ja/store-dx/3d-signage-vs-digital-signage/index.html"
        phantom_a8_pattern = r"https://px\.a8\.net/svt/ejp\?a8mat=4B86H1\+VK0M2\+3SPO\+99F676"
        phantom_pixel_pattern = r"https://www12\.a8\.net/0\.gif\?a8mat=4B86H1\+VK0M2\+3SPO\+99F676"
        phantom_links_total = 0
        phantom_pixels_total = 0
        for rel_path in phantom_pages:
            page = root / rel_path
            if not page.is_file():
                errors.append(f"3D Phantom revenue page missing: {rel_path}")
                continue
            page_text = page.read_text(encoding="utf-8-sig")
            link_count = len(re.findall(phantom_a8_pattern, page_text))
            pixel_count = len(re.findall(phantom_pixel_pattern, page_text))
            phantom_links_total += link_count
            phantom_pixels_total += pixel_count
            if link_count != 3:
                errors.append(f"3D Phantom page should have exactly 3 A8 links: {rel_path}: {link_count}")
            if pixel_count != 3:
                errors.append(f"3D Phantom page should have exactly 3 tracking pixels: {rel_path}: {pixel_count}")
            for required in (
                'data-affiliate-name="wiz_3d_phantom"',
                "2026年8月7日",
                "https://phantom-3d.net/",
                "https://phantom-3d.net/public-lp/",
                "https://lifeis.style/services/3d-phantom/",
            ):
                if required not in page_text:
                    errors.append(f"3D Phantom current marker missing in {rel_path}: {required}")
            if "wiz_3dphantom_hojokin" in page_text:
                errors.append(f"legacy 3D Phantom Wiz subsidy source remains: {rel_path}")

        generic_path = root / phantom_generic_page
        if generic_path.is_file():
            generic_text = generic_path.read_text(encoding="utf-8-sig")
            generic_links = len(re.findall(phantom_a8_pattern, generic_text))
            generic_pixels = len(re.findall(phantom_pixel_pattern, generic_text))
            phantom_links_total += generic_links
            phantom_pixels_total += generic_pixels
            if generic_links != 1 or generic_pixels != 1:
                errors.append(f"3D generic comparison should keep exactly 1 A8 link/pixel: {generic_links}/{generic_pixels}")
            if 'data-revenue-route="3d-phantom"' not in generic_text or "/ja/store-dx/3d-phantom-review/" not in generic_text:
                errors.append("3D generic comparison review funnel missing")
        else:
            errors.append(f"3D generic comparison page missing: {phantom_generic_page}")

        stats["phantom_a8_links_total"] = phantom_links_total
        stats["phantom_a8_pixels_total"] = phantom_pixels_total
        stats["phantom_revenue_pages_checked"] = len(phantom_pages)
        stats["phantom_funnel_pages_checked"] = 1
        if phantom_links_total != 16:
            errors.append(f"3D Phantom total A8 links should be 16: {phantom_links_total}")
        if phantom_pixels_total != 16:
            errors.append(f"3D Phantom total tracking pixels should be 16: {phantom_pixels_total}")

        if analytics_path.is_file():
            analytics_text = analytics_path.read_text(encoding="utf-8-sig")
            if "+VK0M2+" not in analytics_text or "return 'wiz_3d_phantom'" not in analytics_text:
                errors.append("3D Phantom affiliate provider inference missing in analytics-v5.0.0.js")

        if product_catalog_path.is_file():
            product_catalog_text = product_catalog_path.read_text(encoding="utf-8-sig")
            pos = product_catalog_text.find('"id": "3d-phantom"')
            if pos < 0:
                errors.append("3D Phantom product catalog record missing")
            else:
                chunk = product_catalog_text[pos:pos+12000]
                for required in ('"lastVerified": "2026-08-07"', "オープン価格", "最短1日", "Phantom Cloud", "https://lifeis.style/services/3d-phantom/"):
                    if required not in chunk:
                        errors.append(f"3D Phantom product catalog marker missing: {required}")
                if "wiz_3dphantom_hojokin" in chunk:
                    errors.append("legacy 3D Phantom Wiz subsidy source remains in product catalog")

        if sitemap_path.is_file():
            sitemap_text = sitemap_path.read_text(encoding="utf-8-sig")
            for rel_path in phantom_pages + (phantom_generic_page,):
                url = "https://luqevora.com/" + rel_path[:-10]
                marker = f"{url}</loc>\n    <lastmod>2026-08-07</lastmod>"
                if marker not in sitemap_text:
                    errors.append(f"3D Phantom sitemap lastmod is not current: {rel_path}")


        # v5.5.3 SUIKA Team IP revenue-route checks
        suika_team_page = "ja/hosting-security/fixed-ip-vpn-for-teams/index.html"
        suika_team_support_pages = (
            "ja/hosting-security/suika-vpn-review/index.html",
            "ja/hosting-security/millenvpn-review/index.html",
        )
        suika_team_a8_pattern = r"https://px\.a8\.net/svt/ejp\?a8mat=4B88SX\+5YDLM\+4R3G\+BWVTE"
        suika_team_pixel_pattern = r"https://www10\.a8\.net/0\.gif\?a8mat=4B88SX\+5YDLM\+4R3G\+BWVTE"
        suika_team_path = root / suika_team_page
        suika_team_links = 0
        suika_team_pixels = 0
        if suika_team_path.is_file():
            team_text = suika_team_path.read_text(encoding="utf-8-sig")
            suika_team_links = len(re.findall(suika_team_a8_pattern, team_text))
            suika_team_pixels = len(re.findall(suika_team_pixel_pattern, team_text))
            if suika_team_links != 3:
                errors.append(f"SUIKA Team IP page should have exactly 3 A8 links: {suika_team_links}")
            if suika_team_pixels != 3:
                errors.append(f"SUIKA Team IP page should have exactly 3 tracking pixels: {suika_team_pixels}")
            for required in (
                'data-affiliate-name="suika_team_ip"',
                'data-affiliate-position="article-top"',
                'data-affiliate-position="article-mid"',
                'data-affiliate-position="article-bottom"',
                "2026年8月7日",
                "23,500円（税込25,850円）",
                "19,600円（税込21,560円）",
                "30,500円（税込33,550円）",
                "最大200アカウント",
                "https://suika-tip.com/",
                "https://www.suika-v4.com/tip/",
            ):
                if required not in team_text:
                    errors.append(f"SUIKA Team IP current marker missing: {required}")
            if "https://www.suika-ad.com/" in team_text:
                errors.append("legacy SUIKA Team IP source remains: suika-ad.com")
        else:
            errors.append(f"SUIKA Team IP revenue page missing: {suika_team_page}")
        stats["suika_team_ip_a8_links"] = suika_team_links
        stats["suika_team_ip_a8_pixels"] = suika_team_pixels

        suika_team_funnels = 0
        for rel_path in suika_team_support_pages:
            page = root / rel_path
            if not page.is_file():
                errors.append(f"SUIKA Team IP support page missing: {rel_path}")
                continue
            support_text = page.read_text(encoding="utf-8-sig")
            if re.search(suika_team_a8_pattern, support_text):
                errors.append(f"SUIKA Team IP support page should use internal funnel, not direct A8: {rel_path}")
            if 'data-revenue-route="suika-team-ip"' not in support_text or "/ja/hosting-security/fixed-ip-vpn-for-teams/" not in support_text:
                errors.append(f"SUIKA Team IP internal funnel missing: {rel_path}")
            else:
                suika_team_funnels += 1
        stats["suika_team_ip_funnel_pages_checked"] = suika_team_funnels

        if analytics_path.is_file():
            analytics_text = analytics_path.read_text(encoding="utf-8-sig")
            if "+5YDLM+" not in analytics_text or "return 'suika_team_ip'" not in analytics_text:
                errors.append("SUIKA Team IP affiliate provider inference missing in analytics-v5.0.0.js")

        search_index_path = root / "search-index.json"
        if search_index_path.is_file():
            search_text = search_index_path.read_text(encoding="utf-8-sig")
            if "SUIKA VPN Team IP Serviceレビュー｜固定IP・料金・20〜200アカウントを確認" not in search_text:
                errors.append("SUIKA Team IP search-index title not updated")

        if sitemap_path.is_file():
            sitemap_text = sitemap_path.read_text(encoding="utf-8-sig")
            for rel_path in (suika_team_page,) + suika_team_support_pages:
                url = "https://luqevora.com/" + rel_path[:-10]
                marker = f"{url}</loc>\n    <lastmod>2026-08-07</lastmod>"
                if marker not in sitemap_text:
                    errors.append(f"SUIKA Team IP sitemap lastmod is not current: {rel_path}")

        # v5.5.4 corporate-smartphone.com revenue-route checks
        corporate_page = "ja/mobile-connectivity/corporate-smartphone-com-review/index.html"
        corporate_path = root / corporate_page
        corporate_a8_pattern = r"https://px\.a8\.net/svt/ejp\?a8mat=4B88SW\+G3AT5M\+2BZM\+1THW9E"
        corporate_pixel_pattern = r"https://www17\.a8\.net/0\.gif\?a8mat=4B88SW\+G3AT5M\+2BZM\+1THW9E"
        corporate_links = 0
        corporate_pixels = 0
        if corporate_path.is_file():
            corporate_text = corporate_path.read_text(encoding="utf-8-sig")
            corporate_links = len(re.findall(corporate_a8_pattern, corporate_text))
            corporate_pixels = len(re.findall(corporate_pixel_pattern, corporate_text))
            if corporate_links != 3:
                errors.append(f"Corporate Smartphone page should have exactly 3 A8 links: {corporate_links}")
            if corporate_pixels != 3:
                errors.append(f"Corporate Smartphone page should have exactly 3 tracking pixels: {corporate_pixels}")
            for required in (
                'data-affiliate-name="corporate_smartphone_com"',
                'data-affiliate-position="article-top"',
                'data-affiliate-position="article-mid"',
                'data-affiliate-position="article-bottom"',
                "2026年8月7日",
                "SoftBank取扱店",
                "2,750円",
                "14か月目以降",
                "3,278円",
                "基本料金6か月無料",
                "最短1日",
                "https://houjinsumaho.com/",
                "開通18,000円",
            ):
                if required not in corporate_text:
                    errors.append(f"Corporate Smartphone current marker missing: {required}")
        else:
            errors.append(f"Corporate Smartphone revenue page missing: {corporate_page}")
        stats["corporate_smartphone_a8_links"] = corporate_links
        stats["corporate_smartphone_a8_pixels"] = corporate_pixels

        if analytics_path.is_file():
            analytics_text = analytics_path.read_text(encoding="utf-8-sig")
            if "+G3AT5M+2BZM+" not in analytics_text or "return 'corporate_smartphone_com'" not in analytics_text:
                errors.append("Corporate Smartphone affiliate provider inference missing in analytics-v5.0.0.js")

        if search_index_path.is_file():
            search_text = search_index_path.read_text(encoding="utf-8-sig")
            if "法人スマホ.comレビュー｜SoftBank法人携帯の料金・初期費用・見積前チェック" not in search_text:
                errors.append("Corporate Smartphone search-index title not updated")

        if sitemap_path.is_file():
            sitemap_text = sitemap_path.read_text(encoding="utf-8-sig")
            url = "https://luqevora.com/ja/mobile-connectivity/corporate-smartphone-com-review/"
            if not re.search(re.escape(url + "</loc>") + r"\s*<lastmod>2026-08-07</lastmod>", sitemap_text):
                errors.append("Corporate Smartphone sitemap lastmod is not current")

        # v5.5.5 EMEAO POS revenue-route checks
        emeao_pos_page = "ja/store-dx/emeao-pos-review/index.html"
        emeao_pos_support_pages = (
            "ja/store-dx/restaurant-pos-three-way-comparison/index.html",
            "ja/store-dx/restaurant-pos-selection-guide/index.html",
            "ja/store-dx/pos-subsidy-2026-guide/index.html",
            "ja/cashless-payments/pos-register-vs-cashless-payment/index.html",
            "ja/store-dx/restaurant-pos-vs-mobile-order/index.html",
            "ja/store-dx/funfo-vs-kantan-chumon/index.html",
            "ja/cashless-payments/air-regi-vs-square-pos/index.html",
        )
        emeao_pos_a8_pattern = r"https://px\.a8\.net/svt/ejp\?a8mat=4B84X2\+EFRGNU\+2LHA\+HVFKY"
        emeao_pos_pixel_pattern = r"https://www14\.a8\.net/0\.gif\?a8mat=4B84X2\+EFRGNU\+2LHA\+HVFKY"
        emeao_pos_path = root / emeao_pos_page
        emeao_pos_links = 0
        emeao_pos_pixels = 0
        if emeao_pos_path.is_file():
            page_text = emeao_pos_path.read_text(encoding="utf-8-sig")
            emeao_pos_links = len(re.findall(emeao_pos_a8_pattern, page_text))
            emeao_pos_pixels = len(re.findall(emeao_pos_pixel_pattern, page_text))
            if emeao_pos_links != 3:
                errors.append(f"EMEAO POS review should have exactly 3 A8 links: {emeao_pos_links}")
            if emeao_pos_pixels != 3:
                errors.append(f"EMEAO POS review should have exactly 3 tracking pixels: {emeao_pos_pixels}")
            for required in (
                'data-affiliate-name="emeao_pos"',
                'data-affiliate-position="article-top"',
                'data-affiliate-position="article-mid"',
                'data-affiliate-position="article-bottom"',
                "2026年8月7日",
                "完全無料",
                "最大8社",
                "契約を見送",
                "平均3営業日以内",
                "https://emeao.jp/pos-lp3/",
                "https://emeao.jp/pos-lp2/",
            ):
                if required not in page_text:
                    errors.append(f"EMEAO POS current marker missing: {required}")
            if "+HVNAQ" in page_text:
                errors.append("EMEAO POS legacy secondary A8 creative remains")
        else:
            errors.append(f"EMEAO POS review missing: {emeao_pos_page}")
        stats["emeao_pos_a8_links"] = emeao_pos_links
        stats["emeao_pos_a8_pixels"] = emeao_pos_pixels

        emeao_pos_funnels = 0
        for rel_path in emeao_pos_support_pages:
            page = root / rel_path
            if not page.is_file():
                errors.append(f"EMEAO POS support page missing: {rel_path}")
                continue
            page_text = page.read_text(encoding="utf-8-sig")
            if re.search(emeao_pos_a8_pattern, page_text) or "+EFRGNU+2LHA+" in page_text:
                errors.append(f"EMEAO POS support page should funnel internally, not direct A8: {rel_path}")
            if 'data-revenue-route="emeao-pos"' not in page_text or "/ja/store-dx/emeao-pos-review/" not in page_text:
                errors.append(f"EMEAO POS internal funnel missing: {rel_path}")
            else:
                emeao_pos_funnels += 1
        stats["emeao_pos_funnel_pages_checked"] = emeao_pos_funnels

        emeao_pos_topic = root / "ja/topics/restaurant-pos-orders/index.html"
        if not emeao_pos_topic.is_file():
            errors.append("EMEAO POS topic page missing")
        else:
            topic_text = emeao_pos_topic.read_text(encoding="utf-8-sig")
            if 'data-revenue-route="emeao-pos"' not in topic_text or "/ja/store-dx/emeao-pos-review/" not in topic_text:
                errors.append("EMEAO POS topic revenue route missing")

        if analytics_path.is_file():
            analytics_text = analytics_path.read_text(encoding="utf-8-sig")
            if "+EFRGNU+2LHA+" not in analytics_text or "return 'emeao_pos'" not in analytics_text:
                errors.append("EMEAO POS affiliate provider inference missing in analytics-v5.0.0.js")

        if product_catalog_path.is_file():
            product_catalog_text = product_catalog_path.read_text(encoding="utf-8-sig")
            pos = product_catalog_text.find('"id": "emeao-pos"')
            if pos < 0:
                errors.append("EMEAO POS product catalog record missing")
            else:
                chunk = product_catalog_text[pos:pos+16000]
                for required in ('"lastVerified": "2026-08-07"', "完全無料", "最大8社", "契約見送り", "平均3営業日以内", "https://emeao.jp/pos-lp3/"):
                    if required not in chunk:
                        errors.append(f"EMEAO POS product catalog marker missing: {required}")

        emeao_pos_product = root / "ja/products/emeao-pos/index.html"
        if emeao_pos_product.is_file():
            product_text = emeao_pos_product.read_text(encoding="utf-8-sig")
            for required in ("完全無料", "最大8社", "契約を見送", "2026-08-07", "https://emeao.jp/pos-lp3/"):
                if required not in product_text:
                    errors.append(f"EMEAO POS product page marker missing: {required}")

        articles_ja_path = root / "sitemaps/articles-ja.xml"
        if articles_ja_path.is_file():
            sitemap_text = articles_ja_path.read_text(encoding="utf-8-sig")
            for rel_path in (emeao_pos_page,) + emeao_pos_support_pages:
                url = "https://luqevora.com/" + rel_path[:-10]
                if not re.search(re.escape(url + "</loc>") + r"\s*<lastmod>2026-08-07</lastmod>", sitemap_text):
                    errors.append(f"EMEAO POS article sitemap lastmod is not current: {rel_path}")

        topics_ja_path = root / "sitemaps/topics-ja.xml"
        if topics_ja_path.is_file():
            topics_text = topics_ja_path.read_text(encoding="utf-8-sig")
            topic_url = "https://luqevora.com/ja/topics/restaurant-pos-orders/"
            if not re.search(re.escape(topic_url + "</loc>") + r"\s*<lastmod>2026-08-07</lastmod>", topics_text):
                errors.append("EMEAO POS topic sitemap lastmod is not current")

        # v5.5.6 BIGLOBE Hikari revenue-route checks
        biglobe_page = "ja/mobile-connectivity/biglobe-hikari-review/index.html"
        biglobe_compare = "ja/mobile-connectivity/fiber-internet-comparison-remote-work-small-business/index.html"
        biglobe_internal = "ja/mobile-connectivity/home-router-vs-mobile-plan/index.html"
        biglobe_a8_pattern = r"https://px\.a8\.net/svt/ejp\?a8mat=4B88SW\+G5OJKQ\+3HKU\+1BMW42"
        biglobe_pixel_pattern = r"https://www17\.a8\.net/0\.gif\?a8mat=4B88SW\+G5OJKQ\+3HKU\+1BMW42"
        biglobe_links = 0
        biglobe_pixels = 0
        biglobe_path = root / biglobe_page
        if biglobe_path.is_file():
            page_text = biglobe_path.read_text(encoding="utf-8-sig")
            biglobe_links = len(re.findall(biglobe_a8_pattern, page_text))
            biglobe_pixels = len(re.findall(biglobe_pixel_pattern, page_text))
            if biglobe_links != 3:
                errors.append(f"BIGLOBE review should have exactly 3 A8 links: {biglobe_links}")
            if biglobe_pixels != 3:
                errors.append(f"BIGLOBE review should have exactly 3 A8 pixels: {biglobe_pixels}")
            for required in (
                'data-affiliate-name="biglobe_hikari_aun"',
                'data-affiliate-position="article-top"',
                'data-affiliate-position="article-mid"',
                'data-affiliate-position="article-bottom"',
                "2026年8月7日", "30,000円", "50,000円", "35,000円", "55,000円",
                "8カ月", "12カ月目", "最大28,600円", "4,620円",
                "https://aun-biglobe.com/campaign/three_year_plan_campaign.php",
                "https://join.biglobe.ne.jp/ftth/hikari/campaign/",
            ):
                if required not in page_text:
                    errors.append(f"BIGLOBE current marker missing: {required}")
        else:
            errors.append(f"BIGLOBE review missing: {biglobe_page}")
        stats["biglobe_review_a8_links"] = biglobe_links
        stats["biglobe_review_a8_pixels"] = biglobe_pixels

        compare_path = root / biglobe_compare
        if compare_path.is_file():
            compare_text = compare_path.read_text(encoding="utf-8-sig")
            if len(re.findall(biglobe_a8_pattern, compare_text)) != 1:
                errors.append("BIGLOBE fiber comparison should have exactly 1 direct A8 link")
            if len(re.findall(biglobe_pixel_pattern, compare_text)) != 1:
                errors.append("BIGLOBE fiber comparison should have exactly 1 A8 pixel")
            if 'data-revenue-route="biglobe-hikari"' not in compare_text or "/ja/mobile-connectivity/biglobe-hikari-review/" not in compare_text:
                errors.append("BIGLOBE fiber comparison revenue route missing")
        else:
            errors.append(f"BIGLOBE comparison missing: {biglobe_compare}")

        internal_path = root / biglobe_internal
        if internal_path.is_file():
            internal_text = internal_path.read_text(encoding="utf-8-sig")
            if re.search(biglobe_a8_pattern, internal_text):
                errors.append("BIGLOBE home-router comparison should funnel internally, not direct A8")
            if 'data-revenue-route="biglobe-hikari"' not in internal_text or "/ja/mobile-connectivity/biglobe-hikari-review/" not in internal_text:
                errors.append("BIGLOBE home-router internal funnel missing")

        if analytics_path.is_file():
            analytics_text = analytics_path.read_text(encoding="utf-8-sig")
            if "+G5OJKQ+3HKU+" not in analytics_text or "return 'biglobe_hikari_aun'" not in analytics_text:
                errors.append("BIGLOBE affiliate provider inference missing in analytics-v5.0.0.js")

        if search_index_path.is_file():
            search_text = search_index_path.read_text(encoding="utf-8-sig")
            if "BIGLOBE光レビュー｜料金・工事費・キャッシュバック条件を比較" not in search_text:
                errors.append("BIGLOBE search-index title not updated")

        articles_ja_path = root / "sitemaps/articles-ja.xml"
        if articles_ja_path.is_file():
            sitemap_text = articles_ja_path.read_text(encoding="utf-8-sig")
            for rel_path in (biglobe_page, biglobe_compare, biglobe_internal):
                url = "https://luqevora.com/" + rel_path[:-10]
                if not re.search(re.escape(url + "</loc>") + r"\s*<lastmod>2026-08-07</lastmod>", sitemap_text):
                    errors.append(f"BIGLOBE article sitemap lastmod is not current: {rel_path}")

        # v5.5.7 Wiz inbound-package revenue-route checks
        inbound_pages = (
            "ja/store-dx/inbound-package-review/index.html",
            "ja/store-dx/inbound-package-pricing-guide/index.html",
            "ja/store-dx/inbound-package-vs-separate-tools/index.html",
            "ja/store-dx/inbound-package-implementation-guide/index.html",
        )
        inbound_support_pages = (
            "ja/store-dx/multilingual-restaurant-website-checklist/index.html",
            "ja/store-dx/restaurant-inbound-dx-checklist/index.html",
        )
        inbound_a8_pattern = r"https://px\.a8\.net/svt/ejp\?a8mat=4B86H1\+A4EU2\+3SPO\+AWYAZ6"
        inbound_pixel_pattern = r"https://www18\.a8\.net/0\.gif\?a8mat=4B86H1\+A4EU2\+3SPO\+AWYAZ6"
        inbound_links_total = 0
        inbound_pixels_total = 0
        for rel_path in inbound_pages:
            page_path = root / rel_path
            if not page_path.is_file():
                errors.append(f"Inbound revenue page missing: {rel_path}")
                continue
            page_text = page_path.read_text(encoding="utf-8-sig")
            link_count = len(re.findall(inbound_a8_pattern, page_text))
            pixel_count = len(re.findall(inbound_pixel_pattern, page_text))
            inbound_links_total += link_count
            inbound_pixels_total += pixel_count
            if link_count != 3:
                errors.append(f"Inbound revenue page should have exactly 3 A8 links: {rel_path} ({link_count})")
            if pixel_count != 3:
                errors.append(f"Inbound revenue page should have exactly 3 A8 pixels: {rel_path} ({pixel_count})")
            for required in (
                'data-affiliate-name="wiz_inbound_package"',
                'data-affiliate-position="article-top"',
                'data-affiliate-position="article-mid"',
                'data-affiliate-position="article-bottom"',
                'data-revenue-route="inbound-package"',
                "2026年8月7日",
                "交付決定前",
                "https://f.012grp.co.jp/wiz_snsInbound_hojyokin",
                "https://www.tcvb.or.jp/jp/project/infra/welcome-foreigner/",
            ):
                if required not in page_text:
                    errors.append(f"Inbound current marker missing in {rel_path}: {required}")
            if "前年度売上500万円" in page_text or "売上など対象条件" in page_text:
                errors.append(f"Inbound stale subsidy/affiliate condition remains: {rel_path}")

        stats["inbound_package_a8_links_total"] = inbound_links_total
        stats["inbound_package_a8_pixels_total"] = inbound_pixels_total
        stats["inbound_package_revenue_pages_checked"] = len(inbound_pages)
        if inbound_links_total != 12:
            errors.append(f"Inbound package total A8 links should be 12: {inbound_links_total}")
        if inbound_pixels_total != 12:
            errors.append(f"Inbound package total A8 pixels should be 12: {inbound_pixels_total}")

        inbound_funnels = 0
        for rel_path in inbound_support_pages:
            page_path = root / rel_path
            if not page_path.is_file():
                errors.append(f"Inbound funnel page missing: {rel_path}")
                continue
            page_text = page_path.read_text(encoding="utf-8-sig")
            if re.search(inbound_a8_pattern, page_text) or "+A4EU2+3SPO+" in page_text:
                errors.append(f"Inbound generic support page should funnel internally, not direct A8: {rel_path}")
            if 'data-revenue-route="inbound-package"' not in page_text or "/ja/store-dx/inbound-package-review/" not in page_text:
                errors.append(f"Inbound internal funnel missing: {rel_path}")
            else:
                inbound_funnels += 1
        stats["inbound_package_funnel_pages_checked"] = inbound_funnels

        if analytics_path.is_file():
            analytics_text = analytics_path.read_text(encoding="utf-8-sig")
            if "+A4EU2+" not in analytics_text or "return 'wiz_inbound_package'" not in analytics_text:
                errors.append("Inbound package affiliate provider inference missing in analytics-v5.0.0.js")

        if product_catalog_path.is_file():
            product_catalog_text = product_catalog_path.read_text(encoding="utf-8-sig")
            pos = product_catalog_text.find('"id": "inbound-package"')
            if pos < 0:
                errors.append("Inbound package product-catalog entry missing")
            else:
                chunk = product_catalog_text[pos:pos + 9000]
                for required in (
                    '"lastVerified": "2026-08-07"',
                    "原則1/2以内",
                    "多言語対応は2/3以内",
                    "1店舗上限300万円",
                    "2027年3月31日",
                    "https://www.tcvb.or.jp/jp/project/infra/welcome-foreigner/",
                ):
                    if required not in chunk:
                        errors.append(f"Inbound product-catalog current marker missing: {required}")
                if "前年度売上500万円" in chunk:
                    errors.append("Inbound product-catalog stale A8 condition remains")

        if search_index_path.is_file():
            search_text = search_index_path.read_text(encoding="utf-8-sig")
            if "2026年度東京都補助金の条件" not in search_text or "交付決定前発注の注意点" not in search_text:
                errors.append("Inbound search-index descriptions not updated")

        articles_ja_path = root / "sitemaps/articles-ja.xml"
        if articles_ja_path.is_file():
            sitemap_text = articles_ja_path.read_text(encoding="utf-8-sig")
            for rel_path in inbound_pages + inbound_support_pages:
                url = "https://luqevora.com/" + rel_path[:-10]
                if not re.search(re.escape(url + "</loc>") + r"\s*<lastmod>2026-08-07</lastmod>", sitemap_text):
                    errors.append(f"Inbound article sitemap lastmod is not current: {rel_path}")

        topics_ja_path = root / "sitemaps/topics-ja.xml"
        if topics_ja_path.is_file():
            topics_text = topics_ja_path.read_text(encoding="utf-8-sig")
            topic_url = "https://luqevora.com/ja/topics/restaurant-dx-operations/"
            if not re.search(re.escape(topic_url + "</loc>") + r"\s*<lastmod>2026-08-07</lastmod>", topics_text):
                errors.append("Inbound restaurant-DX topic sitemap lastmod is not current")


        # v5.5.8 Goope revenue-route checks
        goope_pages = (
            "ja/website-builders/goope-review/index.html",
            "ja/website-builders/goope-vs-wix/index.html",
            "ja/website-builders/store-website-builder-comparison/index.html",
            "ja/website-builders/reservation-website-builder-comparison/index.html",
            "ja/website-builders/beauty-salon-website-builder-comparison/index.html",
        )
        goope_a8_pattern = r"https://px\.a8\.net/svt/ejp\?a8mat=4B844Z\+AM8BX6\+348\+[A-Z0-9]+"
        goope_pixel_pattern = r"https://www\d+\.a8\.net/0\.gif\?a8mat=4B844Z\+AM8BX6\+348\+[A-Z0-9]+"
        goope_links_total = 0
        goope_pixels_total = 0
        goope_funnels = 0
        for rel_path in goope_pages:
            target = root / rel_path
            if not target.is_file():
                errors.append(f"Goope revenue page missing: {rel_path}")
                continue
            page_text = target.read_text(encoding="utf-8-sig")
            a8_count = len(re.findall(goope_a8_pattern, page_text))
            pixel_count = len(re.findall(goope_pixel_pattern, page_text))
            goope_links_total += a8_count
            goope_pixels_total += pixel_count
            if a8_count != 3:
                errors.append(f"Goope page should have exactly 3 A8 links: {rel_path}: {a8_count}")
            if pixel_count != 3:
                errors.append(f"Goope page should have exactly 3 A8 pixels: {rel_path}: {pixel_count}")
            for required in (
                'data-affiliate-name="goope"',
                'data-product-name="グーペ"',
                'data-affiliate-position="article-top"',
                'data-affiliate-position="article-mid"',
                'data-affiliate-position="article-bottom"',
                "2026年8月7日",
                "https://goope.jp/service/price/",
                "https://goope.jp/info/information/?date=2026-03",
                "https://goope.jp/info/information/?date=2026-04",
            ):
                if required not in page_text:
                    errors.append(f"Goope revenue marker missing in {rel_path}: {required}")
            if rel_path != "ja/website-builders/goope-review/index.html":
                if 'data-revenue-route="goope"' not in page_text or "/ja/website-builders/goope-review/" not in page_text:
                    errors.append(f"Goope review funnel missing: {rel_path}")
                else:
                    goope_funnels += 1
        stats["goope_a8_links_total"] = goope_links_total
        stats["goope_a8_pixels_total"] = goope_pixels_total
        stats["goope_revenue_pages_checked"] = len(goope_pages)
        stats["goope_funnel_pages_checked"] = goope_funnels
        if goope_links_total != 15 or goope_pixels_total != 15:
            errors.append(f"Goope total A8 links/pixels should be 15/15: {goope_links_total}/{goope_pixels_total}")

        goope_review = root / "ja/website-builders/goope-review/index.html"
        if goope_review.is_file():
            review_text = goope_review.read_text(encoding="utf-8-sig")
            for required in ("1,331円（税込）", "3,993円（税込）", "1,996円（税込）", "4,658円（税込）", "3,630円（税込）", "15日間", "メールマガジン機能は2026年6月30日"):
                if required not in review_text:
                    errors.append(f"Goope current review marker missing: {required}")

        goope_support = root / "ja/website-builders/ochanoko-saisai-vs-goope/index.html"
        if goope_support.is_file():
            support_text = goope_support.read_text(encoding="utf-8-sig")
            if re.search(goope_a8_pattern, support_text):
                errors.append("Ochanoko vs Goope should funnel internally to Goope review, not direct Goope A8")
            if 'data-revenue-route="goope"' not in support_text or "/ja/website-builders/goope-review/" not in support_text:
                errors.append("Ochanoko vs Goope internal Goope funnel missing")

        analytics_path = root / "assets/js/analytics-v5.0.0.js"
        if analytics_path.is_file():
            analytics_text = analytics_path.read_text(encoding="utf-8-sig")
            if "+AM8BX6+348+" not in analytics_text or "return 'goope'" not in analytics_text:
                errors.append("Goope affiliate provider inference missing in analytics-v5.0.0.js")

        product_catalog_path = root / "product-catalog.json"
        if product_catalog_path.is_file():
            product_catalog_text = product_catalog_path.read_text(encoding="utf-8-sig")
            pos = product_catalog_text.find('"id": "goope"')
            if pos < 0:
                errors.append("Goope product-catalog entry missing")
            else:
                chunk = product_catalog_text[pos:pos + 12000]
                for required in ('"lastVerified": "2026-08-07"', "2026年4月改定後", "1,331円", "3,993円", "メールマガジン機能は2026年6月30日", "2026-03", "2026-04"):
                    if required not in chunk:
                        errors.append(f"Goope product-catalog current marker missing: {required}")

        diagnosis_path = root / "ja/diagnosis/index.html"
        if diagnosis_path.is_file():
            diagnosis_text = diagnosis_path.read_text(encoding="utf-8-sig")
            pos = diagnosis_text.find('{"id":"goope"')
            if pos < 0:
                errors.append("Goope diagnosis product record missing")
            else:
                chunk = diagnosis_text[pos:pos + 12000]
                for required in ('"lastVerified":"2026-08-07"', "2026年4月改定後", "1,331円", "3,993円", "メールマガジン機能は2026年6月30日"):
                    if required not in chunk:
                        errors.append(f"Goope diagnosis marker missing: {required}")

        goope_product = root / "ja/products/goope/index.html"
        if goope_product.is_file():
            product_text = goope_product.read_text(encoding="utf-8-sig")
            for required in ("2026-08-07", 'data-revenue-route="goope"', "/ja/website-builders/goope-review/", "7</strong><span>公式出典", "メールマガジン機能は2026年6月30日"):
                if required not in product_text:
                    errors.append(f"Goope product hub marker missing: {required}")

        search_index_path = root / "search-index.json"
        if search_index_path.is_file():
            search_text = search_index_path.read_text(encoding="utf-8-sig")
            if "グーペを2026年4月1日改定後の料金" not in search_text:
                errors.append("Goope search-index current description missing")

        for rel_path in ("ja/website-builders/index.html", "ja/topics/website-builders/index.html", "ja/articles/index.html"):
            target = root / rel_path
            if target.is_file():
                page_text = target.read_text(encoding="utf-8-sig")
                for slug in ("goope-review", "goope-vs-wix", "store-website-builder-comparison", "reservation-website-builder-comparison", "beauty-salon-website-builder-comparison", "ochanoko-saisai-vs-goope"):
                    anchor = f'href="/ja/website-builders/{slug}/"'
                    pos = page_text.find(anchor)
                    if pos < 0 or "最終確認: 2026-08-07" not in page_text[pos:pos+1800]:
                        errors.append(f"Goope current card date missing: {rel_path}: {slug}")

        articles_ja_path = root / "sitemaps/articles-ja.xml"
        if articles_ja_path.is_file():
            sitemap_text = articles_ja_path.read_text(encoding="utf-8-sig")
            for slug in ("goope-review", "goope-vs-wix", "store-website-builder-comparison", "reservation-website-builder-comparison", "beauty-salon-website-builder-comparison", "ochanoko-saisai-vs-goope"):
                url = f"https://luqevora.com/ja/website-builders/{slug}/"
                if not re.search(re.escape(url + "</loc>") + r"\s*<lastmod>2026-08-07</lastmod>", sitemap_text):
                    errors.append(f"Goope article sitemap lastmod is not current: {slug}")

        pages_path = root / "sitemaps/pages.xml"
        if pages_path.is_file():
            pages_text = pages_path.read_text(encoding="utf-8-sig")
            url = "https://luqevora.com/ja/products/goope/"
            if not re.search(re.escape(url + "</loc>") + r"\s*<lastmod>2026-08-07</lastmod>", pages_text):
                errors.append("Goope product sitemap lastmod is not current")


        # v5.5.9 iCLUSTA revenue-route checks
        iclusta_pages = (
            "ja/hosting-security/iclusta-review/index.html",
            "ja/hosting-security/iclusta-vs-cpi/index.html",
            "ja/hosting-security/iclusta-vs-xserver-for-wordpress/index.html",
            "ja/hosting-security/iclusta-movable-type-hosting/index.html",
        )
        iclusta_a8_pattern = r"https://px\.a8\.net/svt/ejp\?a8mat=4B8450\+EDZ5UI\+2KX0\+[A-Z0-9]+"
        iclusta_pixel_pattern = r"https://www\d+\.a8\.net/0\.gif\?a8mat=4B8450\+EDZ5UI\+2KX0\+[A-Z0-9]+"
        iclusta_links_total = 0
        iclusta_pixels_total = 0
        iclusta_funnels = 0
        for rel_path in iclusta_pages:
            target = root / rel_path
            if not target.is_file():
                errors.append(f"iCLUSTA revenue page missing: {rel_path}")
                continue
            page_text = target.read_text(encoding="utf-8-sig")
            a8_count = len(re.findall(iclusta_a8_pattern, page_text))
            pixel_count = len(re.findall(iclusta_pixel_pattern, page_text))
            iclusta_links_total += a8_count
            iclusta_pixels_total += pixel_count
            if a8_count != 3:
                errors.append(f"iCLUSTA page should have exactly 3 A8 links: {rel_path}: {a8_count}")
            if pixel_count != 3:
                errors.append(f"iCLUSTA page should have exactly 3 A8 pixels: {rel_path}: {pixel_count}")
            for required in (
                'data-affiliate-name="iclusta_gmocloud"',
                'data-product-name="iCLUSTA+ byGMO"',
                'data-affiliate-position="article-top"',
                'data-affiliate-position="article-mid"',
                'data-affiliate-position="article-bottom"',
                "2026年8月7日",
                "https://shared.gmocloud.com/iclusta/price/",
                "https://shared.gmocloud.com/iclusta/sla/",
                "https://shared.gmocloud.com/30day.html",
                "https://shared.gmocloud.com/iclusta/price/surcharge/",
            ):
                if required not in page_text:
                    errors.append(f"iCLUSTA revenue marker missing in {rel_path}: {required}")
            if rel_path != "ja/hosting-security/iclusta-review/index.html":
                if 'data-revenue-route="iclusta"' not in page_text or "/ja/hosting-security/iclusta-review/" not in page_text:
                    errors.append(f"iCLUSTA review funnel missing: {rel_path}")
                else:
                    iclusta_funnels += 1
        stats["iclusta_a8_links_total"] = iclusta_links_total
        stats["iclusta_a8_pixels_total"] = iclusta_pixels_total
        stats["iclusta_revenue_pages_checked"] = len(iclusta_pages)
        stats["iclusta_funnel_pages_checked"] = iclusta_funnels
        if iclusta_links_total != 12 or iclusta_pixels_total != 12:
            errors.append(f"iCLUSTA total A8 links/pixels should be 12/12: {iclusta_links_total}/{iclusta_pixels_total}")

        iclusta_review = root / "ja/hosting-security/iclusta-review/index.html"
        if iclusta_review.is_file():
            review_text = iclusta_review.read_text(encoding="utf-8-sig")
            for required in ("1,027円", "1,155円", "1,947円", "1,446円", "2,179円", "3,646円", "5,500円", "サーチャージ", "22,000円/回", "30日間全額返金保証"):
                if required not in review_text:
                    errors.append(f"iCLUSTA current review marker missing: {required}")

        mt_article = root / "ja/hosting-security/iclusta-movable-type-hosting/index.html"
        if mt_article.is_file():
            mt_text = mt_article.read_text(encoding="utf-8-sig")
            for required in ("Movable Type 9", "44,000円/年", "初期1,100円", "月額1,100円"):
                if required not in mt_text:
                    errors.append(f"iCLUSTA Movable Type current marker missing: {required}")

        sla_support = root / "ja/hosting-security/business-hosting-sla-comparison/index.html"
        if sla_support.is_file():
            support_text = sla_support.read_text(encoding="utf-8-sig")
            if re.search(iclusta_a8_pattern, support_text):
                errors.append("Business hosting SLA comparison should funnel internally to iCLUSTA review, not direct iCLUSTA A8")
            if 'data-revenue-route="iclusta"' not in support_text or "/ja/hosting-security/iclusta-review/" not in support_text:
                errors.append("Business hosting SLA comparison iCLUSTA internal funnel missing")

        analytics_path = root / "assets/js/analytics-v5.0.0.js"
        if analytics_path.is_file():
            analytics_text = analytics_path.read_text(encoding="utf-8-sig")
            if "+EDZ5UI+2KX0+" not in analytics_text or "return 'iclusta_gmocloud'" not in analytics_text:
                errors.append("iCLUSTA affiliate provider inference missing in analytics-v5.0.0.js")

        search_index_path = root / "search-index.json"
        if search_index_path.is_file():
            search_text = search_index_path.read_text(encoding="utf-8-sig")
            if "iCLUSTA+ byGMOを2026年8月の契約期間別料金" not in search_text:
                errors.append("iCLUSTA search-index current description missing")

        for rel_path in ("ja/hosting-security/index.html", "ja/topics/web-hosting/index.html", "ja/articles/index.html"):
            target = root / rel_path
            if target.is_file():
                page_text = target.read_text(encoding="utf-8-sig")
                for slug in ("iclusta-review", "iclusta-vs-cpi", "iclusta-vs-xserver-for-wordpress", "iclusta-movable-type-hosting", "business-hosting-sla-comparison"):
                    anchor = f'href="/ja/hosting-security/{slug}/"'
                    pos = page_text.find(anchor)
                    if pos < 0 or "最終確認: 2026-08-07" not in page_text[pos:pos+1800]:
                        errors.append(f"iCLUSTA current card date missing: {rel_path}: {slug}")

        articles_ja_path = root / "sitemaps/articles-ja.xml"
        if articles_ja_path.is_file():
            sitemap_text = articles_ja_path.read_text(encoding="utf-8-sig")
            for slug in ("iclusta-review", "iclusta-vs-cpi", "iclusta-vs-xserver-for-wordpress", "iclusta-movable-type-hosting", "business-hosting-sla-comparison"):
                url = f"https://luqevora.com/ja/hosting-security/{slug}/"
                if not re.search(re.escape(url + "</loc>") + r"\s*<lastmod>2026-08-07</lastmod>", sitemap_text):
                    errors.append(f"iCLUSTA article sitemap lastmod is not current: {slug}")


        ochanoko_pages = (
            "ja/website-builders/ochanoko-saisai-review/index.html",
            "ja/website-builders/ochanoko-saisai-pricing/index.html",
            "ja/website-builders/ochanoko-saisai-basic-vs-advanced/index.html",
            "ja/website-builders/ochanoko-saisai-restaurant-guide/index.html",
            "ja/website-builders/ochanoko-saisai-salon-guide/index.html",
        )
        ochanoko_funnel_pages = (
            "ja/website-builders/ochanoko-saisai-seo-guide/index.html",
            "ja/website-builders/ochanoko-saisai-vs-goope/index.html",
            "ja/website-builders/ochanoko-saisai-vs-jimdo/index.html",
            "ja/website-builders/ochanoko-saisai-vs-studio/index.html",
        )
        ochanoko_a8_pattern = r"https://px\.a8\.net/svt/ejp\?a8mat=4B8452\+3MDZ16\+3CZK\+[A-Z0-9]+"
        ochanoko_pixel_pattern = r"https://www\d+\.a8\.net/0\.gif\?a8mat=4B8452\+3MDZ16\+3CZK\+[A-Z0-9]+"
        ochanoko_links_total = 0
        ochanoko_pixels_total = 0
        ochanoko_revenue_funnels = 0
        for rel_path in ochanoko_pages:
            page_path = root / rel_path
            if not page_path.is_file():
                errors.append(f"Ochanoko revenue page missing: {rel_path}")
                continue
            page_text = page_path.read_text(encoding="utf-8-sig")
            a8_count = len(re.findall(ochanoko_a8_pattern, page_text))
            pixel_count = len(re.findall(ochanoko_pixel_pattern, page_text))
            ochanoko_links_total += a8_count
            ochanoko_pixels_total += pixel_count
            if a8_count != 3:
                errors.append(f"Ochanoko revenue page should have exactly 3 A8 links: {rel_path}: {a8_count}")
            if pixel_count != 3:
                errors.append(f"Ochanoko revenue page should have exactly 3 A8 pixels: {rel_path}: {pixel_count}")
            for required in (
                'data-affiliate-name="ochanoko_saisai"',
                'data-product-name="おちゃのこさいさい"',
                'data-affiliate-position="article-top"',
                'data-affiliate-position="article-mid"',
                'data-affiliate-position="article-bottom"',
                "2026年8月7日",
                "https://www.ocnk.me/pricing",
                "https://www.ocnk.me/feature",
                "https://www.ocnk.me/step",
            ):
                if required not in page_text:
                    errors.append(f"Ochanoko revenue marker missing in {rel_path}: {required}")
            if rel_path != "ja/website-builders/ochanoko-saisai-review/index.html":
                if 'data-revenue-route="ochanoko-saisai"' not in page_text or "/ja/website-builders/ochanoko-saisai-review/" not in page_text:
                    errors.append(f"Ochanoko review funnel missing: {rel_path}")
                else:
                    ochanoko_revenue_funnels += 1
        stats["ochanoko_a8_links_total"] = ochanoko_links_total
        stats["ochanoko_a8_pixels_total"] = ochanoko_pixels_total
        stats["ochanoko_revenue_pages_checked"] = len(ochanoko_pages)
        if ochanoko_links_total != 15 or ochanoko_pixels_total != 15:
            errors.append(f"Ochanoko total A8 links/pixels should be 15/15: {ochanoko_links_total}/{ochanoko_pixels_total}")

        ochanoko_funnels = 0
        for rel_path in ochanoko_funnel_pages:
            page_path = root / rel_path
            if not page_path.is_file():
                errors.append(f"Ochanoko funnel page missing: {rel_path}")
                continue
            page_text = page_path.read_text(encoding="utf-8-sig")
            if re.search(ochanoko_a8_pattern, page_text):
                errors.append(f"Ochanoko funnel page should not contain direct Ochanoko A8: {rel_path}")
            if 'data-revenue-route="ochanoko-saisai"' not in page_text or "/ja/website-builders/ochanoko-saisai-review/" not in page_text:
                errors.append(f"Ochanoko funnel internal route missing: {rel_path}")
            else:
                ochanoko_funnels += 1
        stats["ochanoko_funnel_pages_checked"] = ochanoko_funnels

        ochanoko_review = root / "ja/website-builders/ochanoko-saisai-review/index.html"
        if ochanoko_review.is_file():
            review_text = ochanoko_review.read_text(encoding="utf-8-sig")
            for required in ("1,320円", "1,210円", "1,100円", "2,200円", "2,090円", "1,980円", "7,920円", "30日間", "ショッピングカート機能", "CNAME", "MXレコード"):
                if required not in review_text:
                    errors.append(f"Ochanoko current review marker missing: {required}")

        ochanoko_pricing = root / "ja/website-builders/ochanoko-saisai-pricing/index.html"
        if ochanoko_pricing.is_file():
            pricing_text = ochanoko_pricing.read_text(encoding="utf-8-sig")
            for required in ("1か月契約はクレジットカードのみ", "支払い完了後", "返金され"):
                if required not in pricing_text:
                    errors.append(f"Ochanoko current pricing marker missing: {required}")

        analytics_path = root / "assets/js/analytics-v5.0.0.js"
        if analytics_path.is_file():
            analytics_text = analytics_path.read_text(encoding="utf-8-sig")
            if "+3MDZ16+3CZK+" not in analytics_text or "return 'ochanoko_saisai'" not in analytics_text:
                errors.append("Ochanoko affiliate provider inference missing in analytics-v5.0.0.js")

        catalog_path = root / "product-catalog.json"
        if catalog_path.is_file():
            catalog_text = catalog_path.read_text(encoding="utf-8-sig")
            pos = catalog_text.find('"id": "ochanoko-saisai"')
            if pos < 0:
                errors.append("Ochanoko product catalog entry missing")
            else:
                chunk = catalog_text[pos:pos+9000]
                for required in ("2026-08-07", "30日間無料試用", "7,920円", "CNAME・A・MXレコード"):
                    if required not in chunk:
                        errors.append(f"Ochanoko product catalog current marker missing: {required}")

        product_page = root / "ja/products/ochanoko-saisai/index.html"
        if product_page.is_file():
            product_text = product_page.read_text(encoding="utf-8-sig")
            for required in ("2026-08-07", 'data-revenue-route="ochanoko-saisai"', "/ja/website-builders/ochanoko-saisai-review/", "30日間無料"):
                if required not in product_text:
                    errors.append(f"Ochanoko product page current marker missing: {required}")

        for rel_path in ("ja/website-builders/index.html", "ja/topics/website-builders/index.html", "ja/articles/index.html"):
            target = root / rel_path
            if target.is_file():
                page_text = target.read_text(encoding="utf-8-sig")
                for slug in ("ochanoko-saisai-review", "ochanoko-saisai-pricing", "ochanoko-saisai-basic-vs-advanced", "ochanoko-saisai-restaurant-guide", "ochanoko-saisai-salon-guide", "ochanoko-saisai-seo-guide", "ochanoko-saisai-vs-goope", "ochanoko-saisai-vs-jimdo", "ochanoko-saisai-vs-studio"):
                    anchor = f'href="/ja/website-builders/{slug}/"'
                    pos = page_text.find(anchor)
                    if pos >= 0 and "最終確認: 2026-08-07" not in page_text[pos:pos+1800]:
                        errors.append(f"Ochanoko current card date missing: {rel_path}: {slug}")

        articles_ja_path = root / "sitemaps/articles-ja.xml"
        if articles_ja_path.is_file():
            sitemap_text = articles_ja_path.read_text(encoding="utf-8-sig")
            for slug in ("ochanoko-saisai-review", "ochanoko-saisai-pricing", "ochanoko-saisai-basic-vs-advanced", "ochanoko-saisai-restaurant-guide", "ochanoko-saisai-salon-guide", "ochanoko-saisai-seo-guide", "ochanoko-saisai-vs-goope", "ochanoko-saisai-vs-jimdo", "ochanoko-saisai-vs-studio"):
                url = f"https://luqevora.com/ja/website-builders/{slug}/"
                if not re.search(re.escape(url + "</loc>") + r"\s*<lastmod>2026-08-07</lastmod>", sitemap_text):
                    errors.append(f"Ochanoko article sitemap lastmod is not current: {slug}")

        pages_path = root / "sitemaps/pages.xml"
        if pages_path.is_file():
            pages_text = pages_path.read_text(encoding="utf-8-sig")
            url = "https://luqevora.com/ja/products/ochanoko-saisai/"
            if not re.search(re.escape(url + "</loc>") + r"\s*<lastmod>2026-08-07</lastmod>", pages_text):
                errors.append("Ochanoko product sitemap lastmod is not current")

        # v5.6.2 Giga Wi-Fi revenue-route checks
        giga_page = root / "ja/mobile-connectivity/giga-wifi-review/index.html"
        if giga_page.is_file():
            giga_text = giga_page.read_text(encoding="utf-8-sig")
            giga_marker = "4B8ACR+6F089M+4BRI+BWVTE"
            giga_links = len(re.findall(r'href="https://px\.a8\.net/svt/ejp\?a8mat=[^"]*' + re.escape(giga_marker) + r'[^"]*"', giga_text))
            giga_pixels = len(re.findall(r'src="https://www18\.a8\.net/0\.gif\?a8mat=[^"]*' + re.escape(giga_marker) + r'[^"]*"', giga_text))
            stats["giga_wifi_a8_links_total"] = giga_links
            stats["giga_wifi_a8_pixels_total"] = giga_pixels
            if giga_links != 3 or giga_pixels != 3:
                errors.append(f"Giga Wi-Fi review should have exactly 3 A8 links/pixels: {giga_links}/{giga_pixels}")
            for required in (
                'data-affiliate-name="giga_wifi"',
                'data-affiliate-position="article-top"',
                'data-affiliate-position="article-mid"',
                'data-affiliate-position="article-bottom"',
                '2026年8月7日', '3,278円', '3,630円', '1,650円', '550円', '3,190円', '59,400円', '39,600円', '8日以内',
                'https://lp.cloud-wi-fi.jp/100gb-macaroon3.html',
                'https://lp.cloud-wi-fi.jp/100gb-air2.html',
                'https://lp.cloud-wi-fi.jp/10gb-macaroon3.html',
                'https://lp.cloud-wi-fi.jp/miniplan.html',
                'https://lp.cloud-wi-fi.jp/cancel.html',
            ):
                if required not in giga_text:
                    errors.append(f"Giga Wi-Fi current marker missing: {required}")
            if 'ギガWi-Fiレビュー｜料金・契約期間・端末残債を比較' not in giga_text:
                errors.append("Giga Wi-Fi review title not updated")
        else:
            errors.append(f"Giga Wi-Fi review missing: {giga_page}")

        analytics_path = root / "assets/js/analytics-v5.0.0.js"
        if analytics_path.is_file():
            analytics_text = analytics_path.read_text(encoding="utf-8-sig")
            if "+6F089M+4BRI+" not in analytics_text or "return 'giga_wifi'" not in analytics_text:
                errors.append("Giga Wi-Fi affiliate provider inference missing in analytics-v5.0.0.js")

        search_path = root / "search-index.json"
        if search_path.is_file():
            search_text = search_path.read_text(encoding="utf-8-sig")
            if "ギガWi-Fiレビュー｜料金・契約期間・端末残債を比較" not in search_text:
                errors.append("Giga Wi-Fi search-index title not updated")

        for rel_path in ("ja/mobile-connectivity/index.html", "ja/index.html", "ja/articles/index.html"):
            target = root / rel_path
            if target.is_file():
                page_text = target.read_text(encoding="utf-8-sig")
                anchor = 'href="/ja/mobile-connectivity/giga-wifi-review/"'
                pos = page_text.find(anchor)
                if pos < 0 or "最終確認: 2026-08-07" not in page_text[pos:pos+1800]:
                    errors.append(f"Giga Wi-Fi current card date missing: {rel_path}")

        articles_ja_path = root / "sitemaps/articles-ja.xml"
        if articles_ja_path.is_file():
            sitemap_text = articles_ja_path.read_text(encoding="utf-8-sig")
            url = "https://luqevora.com/ja/mobile-connectivity/giga-wifi-review/"
            if not re.search(re.escape(url + "</loc>") + r"\s*<lastmod>2026-08-07</lastmod>", sitemap_text):
                errors.append("Giga Wi-Fi article sitemap lastmod is not current")


        # v5.6.3 SoftBank Air revenue-route checks
        softbank_air_review = root / "ja/mobile-connectivity/softbank-air-review/index.html"
        softbank_air_compare = root / "ja/mobile-connectivity/home-router-vs-mobile-plan/index.html"
        softbank_air_marker = "4B88SW+G3W8RE+3NMM+HV7V6"
        if softbank_air_review.is_file():
            review_text = softbank_air_review.read_text(encoding="utf-8-sig")
            sb_links = len(re.findall(r'href="https://px\.a8\.net/svt/ejp\?a8mat=[^"]*' + re.escape(softbank_air_marker) + r'[^"]*"', review_text))
            sb_pixels = len(re.findall(r'src="https://www10\.a8\.net/0\.gif\?a8mat=[^"]*' + re.escape(softbank_air_marker) + r'[^"]*"', review_text))
            stats["softbank_air_a8_links_total"] = sb_links
            stats["softbank_air_a8_pixels_total"] = sb_pixels
            if sb_links != 3 or sb_pixels != 3:
                errors.append(f"SoftBank Air review should have exactly 3 A8 links/pixels: {sb_links}/{sb_pixels}")
            for required in (
                'data-affiliate-name="softbank_air_nscompany"',
                'data-affiliate-position="article-top"',
                'data-affiliate-position="article-mid"',
                'data-affiliate-position="article-bottom"',
                '2026年8月7日', '5,368円', '5,698円', '95,040円', '1,980円', '4,950円', '50,000円', '8か月', '2日以内',
                'https://www.softbank.jp/internet/air/price/',
                'https://www.softbank.jp/internet/campaigns/list/air6-ninen-support/',
                'https://www.softbank.jp/internet/campaigns/list/sbair-smartlife/',
                'https://ns-air.net/campaign/original-tokuten/index.html',
                'SoftBank Airレビュー｜料金・端末残債・2026年12月改定を確認',
            ):
                if required not in review_text:
                    errors.append(f"SoftBank Air current marker missing: {required}")
        else:
            errors.append("SoftBank Air review missing")

        if softbank_air_compare.is_file():
            compare_text = softbank_air_compare.read_text(encoding="utf-8-sig")
            if softbank_air_marker in compare_text:
                errors.append("Home-router comparison should funnel internally to SoftBank Air review, not direct SoftBank Air A8")
            if 'data-revenue-route="softbank-air"' not in compare_text or '/ja/mobile-connectivity/softbank-air-review/' not in compare_text:
                errors.append("SoftBank Air internal funnel missing from home-router comparison")
            else:
                stats["softbank_air_funnel_pages_checked"] = 1

        analytics_path = root / "assets/js/analytics-v5.0.0.js"
        if analytics_path.is_file():
            analytics_text = analytics_path.read_text(encoding="utf-8-sig")
            if "+G3W8RE+3NMM+" not in analytics_text or "return 'softbank_air_nscompany'" not in analytics_text:
                errors.append("SoftBank Air affiliate provider inference missing in analytics-v5.0.0.js")

        search_path = root / "search-index.json"
        if search_path.is_file():
            search_text = search_path.read_text(encoding="utf-8-sig")
            if "SoftBank Airレビュー｜料金・端末残債・2026年12月改定を確認" not in search_text:
                errors.append("SoftBank Air search-index title not updated")

        for rel_path in ("ja/mobile-connectivity/index.html", "ja/articles/index.html"):
            target = root / rel_path
            if target.is_file():
                page_text = target.read_text(encoding="utf-8-sig")
                anchor = 'href="/ja/mobile-connectivity/softbank-air-review/"'
                pos = page_text.find(anchor)
                if pos < 0 or "最終確認: 2026-08-07" not in page_text[pos:pos+1800]:
                    errors.append(f"SoftBank Air current card date missing: {rel_path}")

        articles_ja_path = root / "sitemaps/articles-ja.xml"
        if articles_ja_path.is_file():
            sitemap_text = articles_ja_path.read_text(encoding="utf-8-sig")
            url = "https://luqevora.com/ja/mobile-connectivity/softbank-air-review/"
            if not re.search(re.escape(url + "</loc>") + r"\s*<lastmod>2026-08-07</lastmod>", sitemap_text):
                errors.append("SoftBank Air article sitemap lastmod is not current")


        # v5.6.4 Yahoo! Travel revenue-route checks
        yahoo_review = root / "ja/travel-booking/yahoo-travel-review/index.html"
        yahoo_points = root / "ja/travel-booking/yahoo-travel-paypay-points-guide/index.html"
        yahoo_cancel = root / "ja/travel-booking/yahoo-travel-cancellation-guide/index.html"
        yahoo_marker = "4B878Y+CTEZDM+4ZCO+60WN6"
        yahoo_links_total = 0
        yahoo_pixels_total = 0
        for target in (yahoo_review, yahoo_points):
            if not target.is_file():
                errors.append(f"Yahoo Travel monetization page missing: {target}")
                continue
            page_text = target.read_text(encoding="utf-8-sig")
            links = len(re.findall(r'href="https://px\.a8\.net/svt/ejp\?a8mat=' + re.escape(yahoo_marker) + r'"', page_text))
            pixels = len(re.findall(r'src="https://www13\.a8\.net/0\.gif\?a8mat=' + re.escape(yahoo_marker) + r'"', page_text))
            yahoo_links_total += links
            yahoo_pixels_total += pixels
            if links != 3 or pixels != 3:
                errors.append(f"Yahoo Travel monetization page should have exactly 3 A8 links/pixels: {target}: {links}/{pixels}")
            for required in ('data-affiliate-position="article-top"','data-affiliate-position="article-mid"','data-affiliate-position="article-bottom"','2026年8月7日','最大10％','https://travel.yahoo.co.jp/feature/campaign_pointup/','https://travel.yahoo.co.jp/promo/guide/'):
                if required not in page_text:
                    errors.append(f"Yahoo Travel current marker missing: {target}: {required}")
        stats["yahoo_travel_a8_links_total"] = yahoo_links_total
        stats["yahoo_travel_a8_pixels_total"] = yahoo_pixels_total
        if yahoo_links_total != 6 or yahoo_pixels_total != 6:
            errors.append(f"Yahoo Travel total A8 links/pixels should be 6/6: {yahoo_links_total}/{yahoo_pixels_total}")

        if yahoo_cancel.is_file():
            cancel_text = yahoo_cancel.read_text(encoding="utf-8-sig")
            if "+CTEZDM+" in cancel_text:
                errors.append("Yahoo Travel cancellation guide should funnel internally, not contain direct Yahoo Travel A8")
            if 'data-revenue-route="yahoo-travel"' not in cancel_text or '/ja/travel-booking/yahoo-travel-review/' not in cancel_text:
                errors.append("Yahoo Travel cancellation internal funnel missing")
            if 'https://support.yahoo-net.jp/SccAbroadtourtravel/s/topic/0TO2r000000GnwMGAS/' not in cancel_text:
                errors.append("Yahoo Travel cancellation official help source missing")
            else:
                stats["yahoo_travel_funnel_pages_checked"] = 1

        analytics_path = root / "assets/js/analytics-v5.0.0.js"
        if analytics_path.is_file():
            analytics_text = analytics_path.read_text(encoding="utf-8-sig")
            if "+CTEZDM+" not in analytics_text or "return 'yahoo_travel'" not in analytics_text:
                errors.append("Yahoo Travel affiliate provider inference missing in analytics-v5.0.0.js")

        search_path = root / "search-index.json"
        if search_path.is_file():
            search_text = search_path.read_text(encoding="utf-8-sig")
            if "Yahoo!トラベルレビュー｜最大10%・PayPayポイント・予約時の注意点" not in search_text:
                errors.append("Yahoo Travel review search-index title not updated")
            if "Yahoo!トラベルのPayPayポイント｜最大10%・「すぐに使う」と「貯める」を比較" not in search_text:
                errors.append("Yahoo Travel PayPay search-index title not updated")

        yahoo_card_targets = {
            "ja/travel-booking/index.html": ("yahoo-travel-review", "yahoo-travel-paypay-points-guide", "yahoo-travel-cancellation-guide"),
            "ja/articles/index.html": ("yahoo-travel-review",),
        }
        for rel_path, slugs in yahoo_card_targets.items():
            target = root / rel_path
            if target.is_file():
                page_text = target.read_text(encoding="utf-8-sig")
                for slug in slugs:
                    anchor = f'href="/ja/travel-booking/{slug}/"'
                    pos = page_text.find(anchor)
                    if pos < 0 or "最終確認: 2026-08-07" not in page_text[pos:pos+2200]:
                        errors.append(f"Yahoo Travel current card date missing: {rel_path}: {slug}")

        articles_ja_path = root / "sitemaps/articles-ja.xml"
        if articles_ja_path.is_file():
            sitemap_text = articles_ja_path.read_text(encoding="utf-8-sig")
            for slug in ("yahoo-travel-review", "yahoo-travel-paypay-points-guide", "yahoo-travel-cancellation-guide"):
                url = f"https://luqevora.com/ja/travel-booking/{slug}/"
                if not re.search(re.escape(url + "</loc>") + r"\s*<lastmod>2026-08-07</lastmod>", sitemap_text):
                    errors.append(f"Yahoo Travel article sitemap lastmod is not current: {slug}")


        # v5.6.5 TRAVeSIM revenue-route checks
        travesim_review = root / "ja/mobile-connectivity/travesim-review/index.html"
        travesim_marker = "4B88SX+UYL0A+58IY+60WN6"
        if travesim_review.is_file():
            trav_text = travesim_review.read_text(encoding="utf-8-sig")
            trav_links = len(re.findall(r'href="https://px\.a8\.net/svt/ejp\?a8mat=' + re.escape(travesim_marker) + r'"', trav_text))
            trav_pixels = len(re.findall(r'src="https://www19\.a8\.net/0\.gif\?a8mat=' + re.escape(travesim_marker) + r'"', trav_text))
            stats["travesim_a8_links_total"] = trav_links
            stats["travesim_a8_pixels_total"] = trav_pixels
            if trav_links != 3 or trav_pixels != 3:
                errors.append(f"TRAVeSIM review should have exactly 3 A8 links/pixels: {trav_links}/{trav_pixels}")
            for required in (
                'data-affiliate-name="travesim"',
                'data-affiliate-position="article-top"',
                'data-affiliate-position="article-mid"',
                'data-affiliate-position="article-bottom"',
                '2026年8月7日', '2026年8月1日', '2026年8月31日', '140以上', '1,080円', '1,270円', '30日', '90日', '返品・返金', '音声通話・SMS',
                'https://www.daily.berrymobile.jp/thailand/information/15036',
                'https://travesim.com/jp/rounds/world',
                'https://travesim.com/jp/faq/1740989997613',
                'https://travesim.com/jp/faq/1740989947062',
                'TRAVeSIMレビュー｜2026年8月キャンペーン・料金・140か国対応を確認',
            ):
                if required not in trav_text:
                    errors.append(f"TRAVeSIM current marker missing: {required}")
        else:
            errors.append("TRAVeSIM review missing")

        trav_funnels = (
            root / "ja/mobile-connectivity/esim-square-review/index.html",
            root / "ja/mobile-connectivity/ahamo-review/index.html",
        )
        trav_funnel_count = 0
        for target in trav_funnels:
            if target.is_file():
                page_text = target.read_text(encoding="utf-8-sig")
                if travesim_marker in page_text:
                    errors.append(f"TRAVeSIM funnel page should not contain direct TRAVeSIM A8: {target}")
                if 'data-revenue-route="travesim"' in page_text and '/ja/mobile-connectivity/travesim-review/' in page_text:
                    trav_funnel_count += 1
                else:
                    errors.append(f"TRAVeSIM internal funnel missing: {target}")
        stats["travesim_funnel_pages_checked"] = trav_funnel_count
        if trav_funnel_count != 2:
            errors.append(f"TRAVeSIM funnel pages should be 2: {trav_funnel_count}")

        analytics_path = root / "assets/js/analytics-v5.0.0.js"
        if analytics_path.is_file():
            analytics_text = analytics_path.read_text(encoding="utf-8-sig")
            if "+UYL0A+58IY+" not in analytics_text or "return 'travesim'" not in analytics_text:
                errors.append("TRAVeSIM affiliate provider inference missing in analytics-v5.0.0.js")

        search_path = root / "search-index.json"
        if search_path.is_file():
            search_text = search_path.read_text(encoding="utf-8-sig")
            if "TRAVeSIMレビュー｜2026年8月キャンペーン・料金・140か国対応を確認" not in search_text:
                errors.append("TRAVeSIM search-index title not updated")

        for rel_path in ("ja/mobile-connectivity/index.html", "ja/articles/index.html"):
            target = root / rel_path
            if target.is_file():
                page_text = target.read_text(encoding="utf-8-sig")
                anchor = 'href="/ja/mobile-connectivity/travesim-review/"'
                pos = page_text.find(anchor)
                if pos < 0 or "最終確認: 2026-08-07" not in page_text[pos:pos+2400]:
                    errors.append(f"TRAVeSIM current card date missing: {rel_path}")

        articles_ja_path = root / "sitemaps/articles-ja.xml"
        if articles_ja_path.is_file():
            sitemap_text = articles_ja_path.read_text(encoding="utf-8-sig")
            url = "https://luqevora.com/ja/mobile-connectivity/travesim-review/"
            if not re.search(re.escape(url + "</loc>") + r"\s*<lastmod>2026-08-07</lastmod>", sitemap_text):
                errors.append("TRAVeSIM article sitemap lastmod is not current")

        # v5.6.6 Revenue Max Core: sitewide two-stage revenue funnel measurement
        analytics_path = root / "assets/js/analytics-v5.0.0.js"
        if analytics_path.is_file():
            analytics_text = analytics_path.read_text(encoding="utf-8-sig")
            required_analytics_markers = (
                "5.1.0-revenue-max-core",
                "revenue_route_click",
                "revenue_route_impression",
                "revenue_route_entry",
                "luqevora.revenueRouteAttribution.v1",
                "page_affiliate_cta_count",
                "page_revenue_route_count",
                "affiliate_network",
                "normalizeAffiliateName",
            )
            for marker in required_analytics_markers:
                if marker not in analytics_text:
                    errors.append(f"Revenue Max Core analytics marker missing: {marker}")
            duplicate_inference_markers = (
                "+A4EU2+", "+BWPNE+", "+DPKE1M+", "+MMIJE+", "+VK0M2+",
            )
            for marker in duplicate_inference_markers:
                if analytics_text.count(marker) != 1:
                    errors.append(f"Affiliate inference marker should be unique in analytics: {marker}")
        else:
            errors.append("Revenue Max Core analytics file missing")

        revenue_route_markers = 0
        revenue_route_names = set()
        revenue_route_internal_targets = 0
        revenue_route_pattern = re.compile(r'data-revenue-route="([^"]+)"')
        href_pattern = re.compile(r'href="(/[^"]*)"')
        for revenue_html in (root / "ja").rglob("*.html"):
            revenue_text = revenue_html.read_text(encoding="utf-8-sig")
            names = revenue_route_pattern.findall(revenue_text)
            if not names:
                continue
            revenue_route_markers += len(names)
            revenue_route_names.update(names)
            # Conservative count: internal links near a revenue-route marker, enough to detect accidental route loss.
            for match in revenue_route_pattern.finditer(revenue_text):
                window = revenue_text[match.start():match.start() + 1800]
                if href_pattern.search(window):
                    revenue_route_internal_targets += 1
        stats["revenue_max_analytics_version"] = "5.1.0-revenue-max-core"
        stats["revenue_route_markers_total"] = revenue_route_markers
        stats["revenue_route_names_unique"] = len(revenue_route_names)
        stats["revenue_route_internal_targets"] = revenue_route_internal_targets
        if revenue_route_markers < 100:
            errors.append(f"Revenue route marker coverage unexpectedly low: {revenue_route_markers}")
        if len(revenue_route_names) < 20:
            errors.append(f"Revenue route name coverage unexpectedly low: {len(revenue_route_names)}")
        if revenue_route_internal_targets < 60:
            errors.append(f"Revenue route internal target coverage unexpectedly low: {revenue_route_internal_targets}")


        # v5.6.7 SE Ranking Revenue Max checks
        se_ranking_direct_pages = (
            "ja/seo-marketing/se-ranking-review/index.html",
            "ja/seo-marketing/se-ranking-pricing/index.html",
            "ja/products/se-ranking/index.html",
            "ja/seo-marketing/ahrefs-vs-se-ranking/index.html",
            "ja/seo-marketing/semrush-vs-se-ranking/index.html",
            "ja/seo-marketing/se-ranking-vs-ubersuggest/index.html",
            "ja/seo-marketing/se-ranking-vs-mangools/index.html",
        )
        se_direct_total = 0
        se_direct_pages_ok = 0
        for rel_path in se_ranking_direct_pages:
            target = root / rel_path
            if not target.is_file():
                errors.append(f"SE Ranking revenue page missing: {rel_path}")
                continue
            page_text = target.read_text(encoding="utf-8-sig")
            count = page_text.count('data-affiliate-name="se_ranking"')
            se_direct_total += count
            if count != 3:
                errors.append(f"SE Ranking direct page should have exactly 3 affiliate CTAs: {rel_path}: {count}")
            else:
                se_direct_pages_ok += 1
        stats["se_ranking_direct_links_total"] = se_direct_total
        stats["se_ranking_direct_pages_checked"] = se_direct_pages_ok
        if se_direct_total != 21:
            errors.append(f"SE Ranking direct affiliate total should be 21: {se_direct_total}")

        se_ranking_indexed_comparisons = (
            "ja/seo-marketing/ahrefs-vs-se-ranking/index.html",
            "ja/seo-marketing/semrush-vs-se-ranking/index.html",
            "ja/seo-marketing/se-ranking-vs-ubersuggest/index.html",
            "ja/seo-marketing/se-ranking-vs-mangools/index.html",
        )
        se_indexed_ok = 0
        for rel_path in se_ranking_indexed_comparisons:
            target = root / rel_path
            if not target.is_file():
                errors.append(f"SE Ranking indexed comparison missing: {rel_path}")
                continue
            page_text = target.read_text(encoding="utf-8-sig")
            robots_tag_match = re.search(r'<meta\b[^>]*\bname=["\']robots["\'][^>]*>', page_text, re.I)
            robots_tag = robots_tag_match.group(0) if robots_tag_match else ""
            robots_content_match = re.search(r'\bcontent=["\']([^"\']+)["\']', robots_tag, re.I)
            robots_value = robots_content_match.group(1).lower() if robots_content_match else ""
            if "noindex" in robots_value or "index" not in robots_value:
                errors.append(f"SE Ranking comparison should be indexable: {rel_path}: {robots_value or 'robots meta missing'}")
            else:
                se_indexed_ok += 1
        stats["se_ranking_indexed_comparisons"] = se_indexed_ok

        se_ranking_support_pages = (
            "ja/seo-marketing/seo-tools-small-business/index.html",
            "ja/seo-marketing/seobility-alternatives/index.html",
        )
        se_support_ok = 0
        for rel_path in se_ranking_support_pages:
            target = root / rel_path
            if not target.is_file():
                errors.append(f"SE Ranking support page missing: {rel_path}")
                continue
            page_text = target.read_text(encoding="utf-8-sig")
            if 'data-affiliate-name="se_ranking"' in page_text:
                errors.append(f"SE Ranking support page should not contain direct affiliate CTA: {rel_path}")
            if 'data-revenue-route="se-ranking"' not in page_text or '/ja/seo-marketing/se-ranking-review/' not in page_text:
                errors.append(f"SE Ranking support-to-review funnel missing: {rel_path}")
            else:
                se_support_ok += 1
        stats["se_ranking_support_pages_checked"] = se_support_ok

        se_route_markers = 0
        for se_html in (root / "ja").rglob("*.html"):
            se_text = se_html.read_text(encoding="utf-8-sig")
            se_route_markers += se_text.count('data-revenue-route="se-ranking"')
        stats["se_ranking_revenue_route_markers"] = se_route_markers
        if se_route_markers < 15:
            errors.append(f"SE Ranking route coverage unexpectedly low: {se_route_markers}")

        se_review = root / "ja/seo-marketing/se-ranking-review/index.html"
        se_pricing = root / "ja/seo-marketing/se-ranking-pricing/index.html"
        for target in (se_review, se_pricing):
            if target.is_file():
                page_text = target.read_text(encoding="utf-8-sig")
                for marker in ("103.20", "129", "223.20", "279", "14日間", "2026年8月7日"):
                    if marker not in page_text:
                        errors.append(f"SE Ranking current pricing marker missing in {target.name}: {marker}")
        se_product = root / "ja/products/se-ranking/index.html"
        if se_product.is_file():
            product_text = se_product.read_text(encoding="utf-8-sig")
            if "LuQviaが報酬を受け取る" in product_text:
                errors.append("SE Ranking product disclosure incorrectly attributes affiliate revenue to LuQvia")
            if "Luqevoraが報酬を受け取る" not in product_text:
                errors.append("SE Ranking product disclosure does not identify Luqevora")

        product_catalog_path = root / "product-catalog.json"
        if product_catalog_path.is_file():
            try:
                catalog_data = json.loads(product_catalog_path.read_text(encoding="utf-8-sig"))
                catalog_items = catalog_data if isinstance(catalog_data, list) else catalog_data.get("products", catalog_data.get("items", []))
                se_item = next((item for item in catalog_items if item.get("id") == "se-ranking"), None)
                if not se_item or se_item.get("lastVerified") != "2026-08-07":
                    errors.append("SE Ranking product catalog lastVerified is not current")
            except Exception as exc:
                errors.append(f"SE Ranking product catalog check failed: {exc}")

        articles_ja_path = root / "sitemaps/articles-ja.xml"
        if articles_ja_path.is_file():
            sitemap_text = articles_ja_path.read_text(encoding="utf-8-sig")
            expected_cluster_dates = {
                "se-ranking-review": "2026-08-08",
                "se-ranking-pricing": "2026-08-07",
                "ahrefs-vs-se-ranking": "2026-08-07",
                "semrush-vs-se-ranking": "2026-08-07",
                "se-ranking-vs-ubersuggest": "2026-08-07",
                "se-ranking-vs-mangools": "2026-08-07",
                "seo-tools-small-business": "2026-08-08",
            }
            for slug, expected_date in expected_cluster_dates.items():
                url = f"https://luqevora.com/ja/seo-marketing/{slug}/"
                if not re.search(re.escape(url + "</loc>") + rf"\s*<lastmod>{expected_date}</lastmod>", sitemap_text):
                    errors.append(f"SE Ranking cluster sitemap lastmod is not current: {slug}")

        # v5.6.8 Search Authority Consolidation checks
        consolidation_pairs = {
            "en/seo-marketing/seobility-alternatives/index.html": "https://luqevora.com/en/seo-marketing/seo-tools-small-business/",
            "ja/seo-marketing/seobility-alternatives/index.html": "https://luqevora.com/ja/seo-marketing/seo-tools-small-business/",
            "en/products/xserver/index.html": "https://luqevora.com/en/hosting-security/xserver-rental-server-review/",
            "ja/products/xserver/index.html": "https://luqevora.com/ja/hosting-security/xserver-rental-server-review/",
            "en/products/se-ranking/index.html": "https://luqevora.com/en/seo-marketing/se-ranking-review/",
            "ja/products/se-ranking/index.html": "https://luqevora.com/ja/seo-marketing/se-ranking-review/",
            "en/products/semrush/index.html": "https://luqevora.com/en/seo-marketing/semrush-review/",
            "ja/products/semrush/index.html": "https://luqevora.com/ja/seo-marketing/semrush-review/",
            "en/products/ahrefs/index.html": "https://luqevora.com/en/seo-marketing/ahrefs-review/",
            "ja/products/ahrefs/index.html": "https://luqevora.com/ja/seo-marketing/ahrefs-review/",
        }
        consolidation_ok = 0
        product_bridge_ok = 0
        for rel_path, canonical_target in consolidation_pairs.items():
            target = root / rel_path
            if not target.is_file():
                errors.append(f"Authority consolidation source missing: {rel_path}")
                continue
            page_text = target.read_text(encoding="utf-8-sig")
            canonical_marker = f'href="{canonical_target}" rel="canonical"'
            if canonical_marker not in page_text:
                errors.append(f"Authority canonical target mismatch: {rel_path} -> {canonical_target}")
            else:
                consolidation_ok += 1
            if "/products/" in rel_path:
                relative_target = canonical_target.replace("https://luqevora.com", "")
                if 'data-track-event="product_review_open"' not in page_text or f'href="{relative_target}"' not in page_text:
                    errors.append(f"Product-to-review bridge missing: {rel_path}")
                else:
                    product_bridge_ok += 1
        stats["authority_consolidation_sources"] = consolidation_ok
        stats["product_review_bridge_links"] = product_bridge_ok

        noncanonical_urls = tuple(consolidation_pairs.values())  # primary values are checked separately below
        retired_urls = (
            "https://luqevora.com/en/seo-marketing/seobility-alternatives/",
            "https://luqevora.com/ja/seo-marketing/seobility-alternatives/",
            "https://luqevora.com/en/products/xserver/",
            "https://luqevora.com/ja/products/xserver/",
            "https://luqevora.com/en/products/se-ranking/",
            "https://luqevora.com/ja/products/se-ranking/",
            "https://luqevora.com/en/products/semrush/",
            "https://luqevora.com/ja/products/semrush/",
            "https://luqevora.com/en/products/ahrefs/",
            "https://luqevora.com/ja/products/ahrefs/",
        )
        sitemap_hits = 0
        for sitemap_rel in ("sitemaps/pages.xml", "sitemaps/articles-en.xml", "sitemaps/articles-ja.xml"):
            sitemap_target = root / sitemap_rel
            if not sitemap_target.is_file():
                continue
            sitemap_text = sitemap_target.read_text(encoding="utf-8-sig")
            for retired_url in retired_urls:
                if retired_url in sitemap_text:
                    sitemap_hits += 1
                    errors.append(f"Noncanonical URL remains in sitemap: {retired_url}")
        stats["noncanonical_sitemap_hits"] = sitemap_hits

        search_index_path = root / "search-index.json"
        if search_index_path.is_file():
            search_text = search_index_path.read_text(encoding="utf-8-sig")
            if "seobility-alternatives" in search_text:
                errors.append("Retired Seobility duplicate remains in search-index")

        for feed_name in ("feed-en.xml", "feed-ja.xml"):
            feed_target = root / feed_name
            if feed_target.is_file() and "seobility-alternatives" in feed_target.read_text(encoding="utf-8-sig"):
                errors.append(f"Retired Seobility duplicate remains in feed: {feed_name}")

        primary_authority_pages = (
            "en/seo-marketing/seo-tools-small-business/index.html",
            "ja/seo-marketing/seo-tools-small-business/index.html",
            "en/hosting-security/xserver-rental-server-review/index.html",
            "ja/hosting-security/xserver-rental-server-review/index.html",
            "en/seo-marketing/se-ranking-review/index.html",
            "ja/seo-marketing/se-ranking-review/index.html",
            "en/seo-marketing/semrush-review/index.html",
            "ja/seo-marketing/semrush-review/index.html",
            "en/seo-marketing/ahrefs-review/index.html",
            "ja/seo-marketing/ahrefs-review/index.html",
        )
        primary_marker_ok = 0
        for rel_path in primary_authority_pages:
            target = root / rel_path
            if target.is_file() and 'name="luqevora-search-authority"' in target.read_text(encoding="utf-8-sig"):
                primary_marker_ok += 1
            else:
                errors.append(f"Primary search-authority marker missing: {rel_path}")
        stats["primary_search_authority_pages"] = primary_marker_ok

        # v5.6.9 SEO Tool Search Growth checks
        growth_targets = {
            "en/seo-marketing/seo-tools-small-business/index.html": ("Seobility Alternatives 2026", "€49.90", "€179.90"),
            "en/seo-marketing/se-ranking-review/index.html": ("Core $129", "US$129", "US$279"),
            "ja/seo-marketing/semrush-review/index.html": ("Starter", "199米ドル", "Advanced"),
            "en/seo-marketing/semrush-pricing-guide/index.html": ("Starter", "US$199", "Advanced"),
            "ja/seo-marketing/semrush-pricing-guide/index.html": ("Starter", "199米ドル", "Advanced"),
        }
        growth_ok = 0
        for rel_path, markers in growth_targets.items():
            target = root / rel_path
            if not target.is_file():
                errors.append(f"SEO growth target missing: {rel_path}")
                continue
            page_text = target.read_text(encoding="utf-8-sig")
            missing = [m for m in markers if m not in page_text]
            if missing:
                errors.append(f"SEO growth markers missing: {rel_path}: {missing}")
            else:
                growth_ok += 1
        stats["seo_tool_growth_pages_checked"] = growth_ok

        for rel_path in ("en/seo-marketing/seobility-alternatives/index.html", "ja/seo-marketing/seobility-alternatives/index.html"):
            page_text = (root / rel_path).read_text(encoding="utf-8-sig")
            robots_match = re.search(r'<meta\b[^>]*\bname=["\']robots["\'][^>]*>', page_text, re.I)
            robots_tag = robots_match.group(0) if robots_match else ""
            if "noindex" not in robots_tag.lower():
                errors.append(f"Retired Seobility duplicate should be noindex: {rel_path}")

        stale_semrush_markers = (
            "Pro・Guru・Business",
            "Pro, Guru and Business",
            "Pro vs Guru vs Business",
            "Semrush SEO Classic costs $139/month for Pro",
            "Semrush SEO Classicの料金はPro月139ドル",
        )
        stale_hits = 0
        for target in root.rglob("*.html"):
            page_text = target.read_text(encoding="utf-8-sig")
            for stale in stale_semrush_markers:
                if stale in page_text:
                    stale_hits += 1
                    errors.append(f"Stale Semrush plan marker remains: {target.relative_to(root)}: {stale}")
        stats["stale_semrush_plan_hits"] = stale_hits

        search_index_target = root / "search-index.json"
        if search_index_target.is_file():
            stext = search_index_target.read_text(encoding="utf-8-sig")
            for marker in ("Semrush Pricing 2026: SEO, Starter, Pro+ & Advanced", "Seobility Alternatives 2026: 5 Best SEO Tools for Small Businesses"):
                if marker not in stext:
                    errors.append(f"Updated search-index marker missing: {marker}")

        # v5.7.0 XServer Search Growth checks
        xserver_growth = {
            "ja/hosting-security/xserver-rental-server-review/index.html": ("xserver-main-review", "693円", "WordPressクイックスタート"),
            "ja/hosting-security/xserver-rental-server-pricing/index.html": ("xserver-pricing", "24,948円", "99,792円"),
            "ja/hosting-security/xserver-wordpress-quick-start-guide/index.html": ("xserver-wordpress-quickstart", "10日間無料お試し", "ペイディ"),
            "en/hosting-security/xserver-rental-server-review/index.html": ("XServer Japan Hosting Review", "August 8, 2026"),
            "en/hosting-security/xserver-rental-server-pricing/index.html": ("JPY 693/mo", "September 7, 2026"),
        }
        xserver_growth_ok = 0
        for rel_path, markers in xserver_growth.items():
            target = root / rel_path
            if not target.is_file():
                errors.append(f"XServer growth page missing: {rel_path}")
                continue
            page_text = target.read_text(encoding="utf-8-sig")
            missing = [m for m in markers if m not in page_text]
            if missing:
                errors.append(f"XServer growth markers missing: {rel_path}: {missing}")
            else:
                xserver_growth_ok += 1
        stats["xserver_growth_pages_checked"] = xserver_growth_ok

        xserver_direct_pages = {
            "ja/hosting-security/xserver-rental-server-review/index.html": "xsrvrev",
            "ja/hosting-security/xserver-rental-server-pricing/index.html": "xsrvprice",
            "ja/hosting-security/xserver-rental-server-pros-cons/index.html": "xsrvpros",
            "ja/hosting-security/xserver-wordpress-quick-start-guide/index.html": "xsrvwp",
            "ja/hosting-security/xserver-company-website-email-guide/index.html": "xsrvmail",
            "ja/hosting-security/xserver-multiple-domain-site-guide/index.html": "xsrvmulti",
            "ja/hosting-security/xserver-vs-conoha-wing/index.html": "xsrvconoha",
            "ja/hosting-security/xserver-vs-lolipop/index.html": "xsrvlolipop",
            "ja/hosting-security/shin-rental-server-vs-xserver/index.html": "shinxsrv",
        }
        total_xserver_ctas = 0
        for rel_path, page_id in xserver_direct_pages.items():
            page_text = (root / rel_path).read_text(encoding="utf-8-sig")
            ctas = page_text.count(f"&id1={page_id}&") + page_text.count(f"&amp;id1={page_id}&amp;")
            if ctas != 3:
                errors.append(f"XServer page should have exactly 3 tracked CTAs: {rel_path}: {ctas}")
            for pos in ("top","mid","btm"):
                if f"id2={pos}" not in page_text:
                    errors.append(f"XServer CTA position missing: {rel_path}: {pos}")
            total_xserver_ctas += ctas
        stats["xserver_tracked_ctas"] = total_xserver_ctas

        for rel_path, expected in (
            ("ja/products/xserver-business/index.html", "https://luqevora.com/ja/hosting-security/xserver-business-review/"),
            ("en/products/xserver-business/index.html", "https://luqevora.com/en/hosting-security/xserver-business-review/"),
        ):
            page_text = (root / rel_path).read_text(encoding="utf-8-sig")
            if f'href="{expected}" rel="canonical"' not in page_text:
                errors.append(f"XServer Business product canonical mismatch: {rel_path}")

        sitemap_text = "\n".join(p.read_text(encoding="utf-8-sig") for p in (root / "sitemaps").glob("*.xml"))
        for retired_url in ("https://luqevora.com/ja/products/xserver-business/", "https://luqevora.com/en/products/xserver-business/"):
            if retired_url in sitemap_text:
                errors.append(f"Consolidated XServer Business product still in sitemap: {retired_url}")
        # v5.7.4 four-base-color editorial system checks
        style_target = root / "assets/css/style.css"
        legacy_style_target = root / "assets/style.css"
        if style_target.is_file():
            style_text = style_target.read_text(encoding="utf-8-sig")
            base_colors = set()
            for match in re.finditer(r"#[0-9a-fA-F]{6}", style_text):
                base_colors.add(match.group(0).upper())
            for match in re.finditer(r"rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)", style_text):
                rgb = tuple(int(x) for x in match.groups())
                base_colors.add("#%02X%02X%02X" % rgb)
            stats["visual_palette_base_colors"] = len(base_colors)
            allowed_palette = {"#0B1F44", "#1463FF", "#FFFFFF", "#B42318"}
            if base_colors != allowed_palette:
                errors.append(f"v5.7.4 palette must use exactly four base colors: {sorted(base_colors)}")
            if legacy_style_target.is_file() and legacy_style_target.read_text(encoding="utf-8-sig") != style_text:
                errors.append("Legacy /assets/style.css drifted from production /assets/css/style.css")
        css_ref_errors = 0
        for html_path in root.rglob("*.html"):
            html_text = html_path.read_text(encoding="utf-8-sig")
            if '/assets/css/style.css?v=6.5.0' not in html_text:
                css_ref_errors += 1
        stats["css_v650_reference_errors"] = css_ref_errors
        if css_ref_errors:
            errors.append(f"v5.7.4 stylesheet cache-bust mismatch on {css_ref_errors} HTML files")
        visual_targets = (
            "ja/hosting-security/xserver-rental-server-review/index.html",
            "ja/hosting-security/millenvpn-vs-suika-vpn/index.html",
            "en/seo-marketing/se-ranking-review/index.html",
            "en/hosting-security/nordvpn-pricing-guide/index.html",
        )
        visual_guides = 0
        for rel_path in visual_targets:
            target = root / rel_path
            if not target.is_file():
                errors.append(f"Visual-guide target missing: {rel_path}")
                continue
            page_text = target.read_text(encoding="utf-8-sig")
            count = page_text.count('class="article-visual-guide"')
            if count < 1:
                errors.append(f"Article visual guide missing: {rel_path}")
            visual_guides += count
        stats["article_visual_guides"] = visual_guides

        # v5.7.5 table UX hardening: every content table must be horizontally scrollable on narrow screens.
        table_total = 0
        unwrapped_total = 0
        for html_path in root.rglob("*.html"):
            html_text = html_path.read_text(encoding="utf-8-sig")
            table_parser = TableWrapperParser()
            try:
                table_parser.feed(html_text)
            except Exception as exc:
                errors.append(f"Table wrapper parser error: {html_path.relative_to(root).as_posix()}: {exc}")
                continue
            table_total += table_parser.table_total
            if table_parser.unwrapped_tables:
                unwrapped_total += table_parser.unwrapped_tables
                errors.append(
                    f"Unwrapped responsive table: {html_path.relative_to(root).as_posix()}: {table_parser.unwrapped_tables}"
                )
        stats["content_tables"] = table_total
        stats["unwrapped_content_tables"] = unwrapped_total

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
