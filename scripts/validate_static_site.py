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
            if "2026年8月7日" not in suika_html:
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
                "2026年8月7日",
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
