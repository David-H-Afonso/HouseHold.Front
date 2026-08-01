# Security Review

## Project Detection

- React 19 + TypeScript + Vite frontend using npm and Vitest/jsdom.
- Backend/API is the sibling `Household.Api` repository; this repository does not implement authorization or hold provider credentials.
- Authentication is bearer-token based through `customFetch`; admin and Seerr permissions are presentation gates only, with backend enforcement reviewed in the sibling repository.
- Existing GitHub Actions runs lint, tests, build, and Docker publishing. Existing nginx configuration supplies CSP and baseline headers.

## Executive Summary

The uncommitted Seerr request UI and app catalog editor do not ship a Seerr API key, CasaOS token, or other new secret to the browser. Backend admin and per-user boundaries are enforced server-side. No Critical or High frontend finding was confirmed, and **no High/Critical findings remain open**. Two concrete lower-severity issues remain: arbitrary upstream Seerr image hosts are loaded automatically, and delete controls are shown for owned requests that Seerr will not permit once they are no longer pending.

## Changes Made

- No frontend application code was changed by this review.
- Added this report only. The High CasaOS credential-race fix and regression test are in the sibling API repository.

## Findings

### Critical

- None.

### High

- None open.

### Medium

- **Open — upstream-controlled browser image requests.** `seerrImageSource` accepts any absolute HTTP(S) URL that passes `safeExternalUrl`, and `FallbackImage` renders it automatically. The production CSP also permits images from every HTTP(S) host. A compromised Seerr response could drive blind GETs to loopback/LAN services from a user's browser. Evidence: `src/components/Seerr/seerrPresentation.ts:26-30`, `src/components/Shared/FallbackImage.tsx:36-80`, `nginx.conf:12`; source URL is produced by `Household.Api/Infrastructure/Integrations/Seerr/SeerrService.cs:932-945`. Restrict images to the configured Seerr public authority or a backend image proxy.

### Low

- **Open correctness — delete control exceeds the upstream ownership/status contract.** The UI shows delete whenever `request.isMine` or the user can manage requests, without requiring pending status. Current Seerr permits a non-manager to delete only their own pending request. Evidence: `src/components/Seerr/SeerrRequestHistory.tsx:37-56`, confirmation path `src/pages/SeerrRequestsPage.tsx:243-259`. Gate non-manager delete on pending status; backend enforcement must remain authoritative.

## Environment Variable Classification

| Variable | Location | Classification | Frontend-safe | Action |
| --- | --- | --- | --- | --- |
| `VITE_API_BASE_URL` / runtime API base URL | Vite/runtime config | public browser configuration | Yes | Keep to a trusted API origin; it is not a secret. |
| Seerr API key | Not present in frontend configuration | backend secret | **No** | Keep exclusively in `Household.Api`/hosting secrets. |
| CasaOS access/refresh tokens | Entered by an admin and posted to the API | backend secret in transit | **No** | Never persist in frontend config or logs; current forms clear after success and API responses are write-only metadata. |

## Test Matrix

| Check | Status | Evidence |
| --- | --- | --- |
| Unmapped user does not browse/load request data | existing UI/contract test | `src/pages/SeerrRequestsPage.test.tsx` |
| Ordinary user defaults to own requests and has no moderation controls | existing UI/contract test | `src/pages/SeerrRequestsPage.test.tsx` |
| Admin configuration UI hidden for ordinary users | existing UI test | `src/pages/SettingsAppsPage.test.tsx` |
| Catalog editor sends metadata only | existing UI/contract test | `src/components/Apps/AppCatalogSettingsSection.test.tsx` |
| Rollback not inferred from backup ID | existing UI test | `src/components/Apps/AppLauncherCard.test.tsx` |
| Unsafe external URL schemes | existing helper coverage/code review | `safeExternalUrl`; no new `javascript:` sink found |
| Backend user A vs user B / admin authorization | verified in sibling API code, not claimed by frontend mocks | `SeerrEndpoints.cs`, `SeerrService.cs`, `AppsModuleEndpoints.cs` |

## Auth And Authorization Matrix

- Unauthenticated routes use `ProtectedRoute`; the API independently requires authorization.
- Admin catalog and Seerr configuration components render only when the authenticated state reports admin, while API endpoints independently call `IsAdmin`.
- Seerr moderation is shown only from server-returned Seerr permissions, not from the Household admin role.
- User ownership is represented by server-returned `isMine`; all actual reads/mutations go through the BFF and never construct a provider URL or provider header in the browser.
- Invalid/expired bearer tokens use the existing one-refresh lock and then clear local persisted auth state.

## Password Reset Review

Not applicable to the reviewed uncommitted integration changes. Existing forced-password-change routing was not modified.

## Rate Limiting Review

- Frontend surfaces safe generic `429` errors and does not automatically retry Seerr/CasaOS mutations.
- Backend Seerr and CasaOS rate policies were reviewed in `Household.Api`; catalog health fan-out remains an API Medium finding.

## CORS, Cookies, CSRF, Headers

- Bearer auth is used; no new cookie/CSRF surface was added.
- External links use `safeExternalUrl`, `target="_blank"`, and `rel="noopener noreferrer"`.
- nginx includes CSP, frame, MIME, referrer, and permissions headers. The broad `img-src http: https:` policy contributes to the Medium image finding.

## Scripts

- `security:secrets`, `security:deps`, `security:sast`, `security:react`, `security:zap`, `security:all`: skipped for this constrained review; no new tooling or package change was justified.

## GitHub Actions And Free Alerts

- Existing `docker.yml` runs npm install, lint, tests, and build on pull requests with `contents: read`; image publishing uses scoped `packages: write` only outside pull requests.
- No paid service or new workflow was added. Repository visibility, secret scanning, Dependabot, and notification settings require manual GitHub confirmation.

## ZAP And Dynamic Scanning

- Skipped: no owned running test target was supplied. Full active scanning was not authorized.

## React Doctor

- Skipped: focused Vitest and production build passed; adding a network-fetched or noisy check was outside this review.

## Manual Checks Still Required

- Confirm production CSP and reverse-proxy headers match `nginx.conf`.
- Confirm no Seerr/CasaOS secret exists in browser/runtime configuration or built assets.
- Verify one ordinary user, one Seerr manager, and one Household admin against a real non-production Seerr instance.
- Confirm GitHub secret-scanning/Dependabot settings and workflow-minute cost in the repository UI.

## Commands To Run

- `npm test -- --run src/pages/SeerrRequestsPage.test.tsx src/pages/SettingsAppsPage.test.tsx src/components/Apps/AppCatalogSettingsSection.test.tsx src/components/Apps/AppLauncherCard.test.tsx src/components/Seerr/SeerrDetailContent.test.tsx src/services/SeerrService.test.ts` — passed, 6 files / 13 tests.
- `npm run build` — passed.

## Continuation Notes For AI Agents

- Fix the image issue at the API URL-construction boundary first, then narrow CSP if compatible with other providers.
- Treat frontend role/permission tests as UI contract tests only; do not represent them as proof of backend authorization.
- Do not move Seerr API keys or CasaOS tokens into `VITE_*`, runtime JS config, local storage, or links.
