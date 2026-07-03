# Landing page design plan

Written before the page, so the choices are on record and not retrofitted.

## Palette

Extracted from logo.png by scripts/extract-theme.ts, not picked by hand:

| Name    | Hex       | Use                                        |
| ------- | --------- | ------------------------------------------ |
| ink     | `#0d0d11` | page background                            |
| raised  | `#17171c` | cards, panels, the board                   |
| bone    | `#f6f5f4` | headings and body text                     |
| blue    | `#3c7ad8` | primary actions, links (AA safe on ink)    |
| teal    | `#2aaeb7` | secondary highlights, in-transit states    |
| green   | `#56c9a3` | inbound/success accents, live indicators   |

A muted text tone is derived from bone at reduced opacity rather than adding a seventh color.

## Type

- Display: Barlow Condensed. Barlow comes from US highway signage lettering, which is
  actual freight heritage, and the condensed cut packs headlines like a manifest.
- Body: Barlow. Same family, regular width, so the page stays structured without
  a second personality fighting the display face.
- Data: IBM Plex Mono for SKUs, quantities, ledger rows and microlabels.
  Inventory is numbers, and numbers read best in a mono.

All three are self hosted through fontsource, no CDN request.

## Signature moment

A live movement board in the hero. A schematic warehouse with dock, bins and truck,
where parcel units travel dock to bin to truck. Every travel writes a row into a
ledger that ticks alongside, and bin counts update as units land. This is the core
product idea, every stock change is a ledger entry, shown instead of explained.

With prefers-reduced-motion the board renders a filled ledger and static counts.

## Layout and motion

Manifest aesthetic: hairline borders at low opacity, waybill style section numbers
(01 RECEIVING and so on), mono microlabels, wide dark space between sections.

Motion budget:
- one orchestrated load sequence on the hero (nav, headline, board, in that order)
- scroll reveals per section, single pass, no re-trigger
- hover states on nav links, the CTA and board rows
- nothing else moves

## Sections

nav, hero with board, product in action (real DOM mockups of the app screens),
features (four short items), pricing (three tiers), a closing call to action,
and a footer with product links and contact info.
