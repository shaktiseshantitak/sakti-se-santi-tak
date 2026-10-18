# Page Text System (Control Panel → Settings → Page Text Manager)

Every public page text is editable from the Control Panel. Nothing is deleted: each box
shows the text the site already had, an empty box = that original text, a single space = hide the line.

* `src/utils/siteContent.ts` – hand-written keys (labels, tokens like `{rate}`), limits, cleaning.
* `src/utils/siteContentAuto.ts` – generated list of every remaining JSX text (key `t.<File>.<hash>`).
* `src/utils/contentLists.ts` – editable card lists (Gayatri articles, Curiosity questions/points).
* Pages use `useSiteContent()` → `c('key')` / `tx('key')`.
* To make one more text editable: add one line to `siteContent.ts` and use `c('key')`.
  Test `npm run test:content` fails if a Control-Panel box is not used by any page.

Safety: only whitelisted keys are read; values are plain text (rendered by React, never HTML),
control characters stripped, per-key length cap; saved only through the admin-only settings save.
Deliberately NOT editable: Login/Signup page, error/validation/security messages, session-timeout notice,
payment-gateway window text, admin panel text.

Tests: `npm run test:content | test:lists | test:newsletter | test:render | test:payment | test:admin-layout`

## Control Panel layout (Site Settings)
Sub-sections are defined in `src/components/admin/settings/settingsNav.ts` (grouped: पहचान / स्टोर / सामग्री / सिस्टम).
To add a section: add it to `settingsNav.ts` and render `{settingsSubTab === 'id' && (...)}` in `AdminPage.tsx`
(`npm run test:settings-nav` fails if a listed section has no content block).
Any new saved field still needs: type in `types/index.ts`, state + resync `useEffect` line + save payload line.
Public emails (support/orders/privacy) are validated before save; policy text can use {supportEmail} {ordersEmail} {privacyEmail}.
System emails (signup confirmation, password reset, admin OTP) are sent by Supabase Auth — edit those in the Supabase dashboard.

## Website colours (Control Panel → Site Settings → रंग, थीम एवं स्टाइल)
* Every public-page colour is a CSS variable: `--c-primary, --c-primary-deep, --c-primary-darkest, --c-accent, --c-accent-light, --c-page, --c-surface, --c-text, --c-text-muted, --c-ink`
  plus optional area colours `--c-header-bg, --c-header-text, --c-strip-bg, --c-footer-bg, --c-footer-text`.
  Defaults live in `src/index.css`; saved values (`siteSettings.themeColors`) are applied on top by `ThemeColorInjector`.
* Tailwind classes use e.g. `bg-[color:var(--c-primary)]` (the `color:` hint is required for variables). Never write raw palette hex in public components.
* The amber-* Tailwind ramp follows the accent colour (`--ramp-*`).
* Values are validated `#RRGGBB` only (`utils/themeColors.ts`). The admin panel is excluded (`<html data-admin>`).
* Tests: `npm run test:theme` and `npm run test:theme-editor`.
