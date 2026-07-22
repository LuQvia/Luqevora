# Kinsta Application Readiness v4.3.5

## Purpose

This release prepares the public Luqevora.com site for a Kinsta affiliate application without publishing an unapproved tracking link.

## Public identity

- Media/service name: **Luqevora.com**
- Operator display: **LuQvia**
- English footer: **Operated by LuQvia**
- Japanese footer: **運営：LuQvia**

No operator legal-form description is published on the public pages. Stale wording was also removed from archived legacy HTML structured data.

## Application-supporting pages

The release verifies both English and Japanese versions of:

- About / 運営者情報
- Editorial Policy / 編集方針
- Affiliate Disclosure / 広告掲載方針
- Privacy Policy / プライバシーポリシー
- Terms / 利用規約
- Contact / お問い合わせ
- Kinsta review article

## Kinsta link policy before approval

The Kinsta review pages use official-source links only. No affiliate identifier, referral parameter, or unapproved tracking URL is included. After approval, add only the tracking link issued inside the Kinsta affiliate dashboard and identify it as a sponsored link.

## Deployment

Deploy the contents generated from the `public/` directory using the repository's existing GitHub Pages workflow. Uploading the complete source package preserves the build, validation, and future article-generation system.
