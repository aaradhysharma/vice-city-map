# Vice City IRL — Miami map

Mark 2. A bright single-page map of real-world GTA / Vice City marketing stops and parody prototypes in Miami and South Florida.

Marketing and parody prototypes. Fan and press matches — no story spoilers.

**v2.0.0**

## What’s on the map

`src/data/locations.json` is the source of truth:

- **25 stops**
- **5 blimp flyovers**

Each stop has an in-game name (`name`), the real place (`realName`), and an optional `parodyOf` line such as `E11EVEN → NINE1NINE`. The panel leads with the in-game name.

Three pins are shifted slightly in `src/data/model.ts` so they sit on the published place:

- Hotel Y / W South Beach → 2201 Collins Ave
- Downtown GTA 6 banner → YVE Hotel, 146 Biscayne Blvd
- Goodyear blimp base → hangar on the west side of Pompano Beach Airpark

Filters: All, Blimp, Ads, Arenas & stadiums, Beach (includes hotels), Clubs, Landmarks, Shops/Restaurants, Events, Art, Cars.

The next blimp row is whichever flyover is still ahead on the Miami calendar. From October 26, 2026, that is November 1 at Hard Rock Stadium.

## Run locally

```bash
npm install
npm run dev
```

Dev server: [http://127.0.0.1:4177](http://127.0.0.1:4177)

```bash
npm test
npm run build
npm run preview
```

`npm test` checks that the JSON still has 25 stops, the NINE1NINE mapping, 5 blimp dates, and that the next flyover from 2026-10-26 is Hard Rock Stadium. `npm run preview` serves the production build on the same port.

Map tiles are Esri’s World Street Map (bright, no API key). CARTO raster tiles watermark without a key, so they aren’t used. The page itself is static once loaded. Tiles still need a network connection.

## Deploy

The repo is a Vite static site. [vercel.json](vercel.json) sets the build to `npm run build` and the output to `dist`.

On Vercel, import the project (framework preset: Vite) and deploy. No environment variables are required.
