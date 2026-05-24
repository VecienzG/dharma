# Dharma — Branding Decisions

Documento sorgente per decisioni di brand della fork Dharma di Twenty.

## Identità

- **Nome prodotto**: Dharma
- **Tagline**: "Il tuo studio, allineato."
- **Tone of voice**: calmo, professionale, minimal, italiano colloquiale ma preciso.
- **Owner**: Beautiful Life Creative Studio — Vincenzo Guida (P.IVA 10544051211).

## Palette finale

I valori sono applicati come override su CSS variables generate dal tema Twenty (`.light` / `.dark`). Vedi `dharma-overrides.css`.

### Light theme
- Primary brand (indaco profondo): `#3B3B98`
- Primary brand hover: `#2E2E7A`
- Accent (oro caldo): `#C9A961`
- Background page: `#FAF8F5` (warm off-white)
- Background surface: `#FFFFFF`
- Border subtle: `#E8E3DA`

### Dark theme
- Primary brand: `#7A7AD6` (indaco più luminoso per leggibilità)
- Accent (oro caldo): `#D9BF85`
- Background page: `#0F0F12`
- Background surface: `#17171C`
- Border subtle: `#26262E`

Razionale: indaco trasmette professionalità e calma, oro caldo come accent per momenti di valore (CTA, highlight). Background warm off-white evita rigidità tipica dei CRM enterprise (vs `#FFFFFF` puro).

## Typography

- **UI / body**: `Inter` (già caricata da Twenty da Google Fonts) — mantenuta per coerenza e già ottimizzata per dashboards.
- **Display / heading auth**: nessun cambio per ora. Inter copre headings senza necessità di font display aggiuntivo. Decisione: tenerlo minimal per evitare richieste font extra.
- **Mono**: `DM Mono` (già caricata) — mantenuta.

Razionale: ridurre dipendenze e weight load. Inter già scelta da Twenty, è una scelta solida per app professionale.

## Copy table — onboarding & auth

| Inglese (msgid)                   | Italiano Dharma (msgstr)                   |
|-----------------------------------|--------------------------------------------|
| Welcome to Twenty                 | Benvenuto in Dharma                        |
| Welcome to your workspace         | Benvenuto nel tuo studio                   |
| Choose a Workspace                | Scegli uno studio                          |
| Create your workspace             | Crea il tuo studio                         |
| Continue with Email               | Continua con l'e-mail                      |
| Setup your 2FA                    | Configura la verifica in due passaggi      |
| Verify code from the app          | Inserisci il codice dall'app               |
| Join {workspaceName} team         | Unisciti al team di {workspaceName}        |
| By using Twenty, you agree to the | Usando Dharma, accetti i                   |
| Twenty fields                     | Campi Dharma                               |
| Page Not Found \| Twenty          | Pagina non trovata \| Dharma               |
| What is Twenty?                   | Che cos'è Dharma?                          |
| Join your team on Twenty          | Unisciti al tuo team su Dharma             |
| Connect to Twenty                 | Accedi a Dharma                            |

## Asset

### Done
- `dharma-logo.svg` — monogramma "D" minimal in indaco su fondo trasparente. SVG inline, scalabile.
- Sostituzione referenza primary logo in `Logo.tsx` auth.
- Sostituzione referenza logo email.

### TODO (richiede asset binari)
- Favicon set completo `images/icons/windows11/*.png`, `android/*.png`, `ios/*.png` (oltre 100 file PNG da rigenerare con tool tipo `favicon.io` o `realfavicongenerator.net` dal logo SVG Dharma).
- `social-card.png` per og:image (1200x630).
- Logo Twenty fisico in `public/images/integrations/twenty-logo.svg` — non sostituire, è asset interno usato come "integrazione".
- Splash screen iOS / Windows tiles.

Per ora i PNG legacy mostrano il logo Twenty originale ma index.html punta solo a `android-launchericon-48-48.png` come favicon e `ios/192.png` come apple-touch-icon. Quando si rigenererà il set, partire dall'SVG Dharma.

## File coinvolti (root override Dharma)

- `packages/twenty-front/src/modules/dharma/branding/dharma-overrides.css` — palette override.
- `packages/twenty-front/src/modules/dharma/branding/dharma-logo.svg` — logo monogramma.
- `packages/twenty-front/index.html` — title, meta, og.
- `packages/twenty-front/public/manifest.json` — name, short_name.
- `packages/twenty-front/src/index.tsx` — import dharma-overrides.css.
- `packages/twenty-front/src/modules/auth/components/Logo.tsx` — default logo URL.
- `packages/twenty-front/src/modules/auth/sign-in-up/components/FooterNote.tsx` — link legali Dharma.
- `packages/twenty-front/src/locales/it-IT.po` — copy italiano.
- `packages/twenty-emails/src/locales/it-IT.po` — copy email italiano.
- `packages/twenty-emails/src/components/Logo.tsx` — email logo.

## Decisioni esplicite escluse

- NO Tailwind (Twenty usa Linaria, decisione utente 2026-05-24).
- NO font display aggiuntivo (mantieni Inter).
- NO modifica file CSS auto-generati `theme-light.css` / `theme-dark.css` (override via file separato).
- NO modifica `AppPath.ts` o `useCreateAppRouter.tsx`.
- NO sostituzione `twenty-logo.svg` in `integrations/` (è asset legacy, non visible nel chrome principale).
