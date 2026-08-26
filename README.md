
## Local image assets

The hosted Manus build uses persistent `/manus-storage/` image URLs. For a standalone local clone, download the referenced visual assets into the ignored Vite public directory:

```bash
pnpm install
pnpm assets:download
```

Then create `.env.local` with:

```bash
VITE_KABIYAHE_LOCAL_ASSETS=true
```

Start the app with `pnpm dev`. The fetcher downloads the current hero, lake, falls, sunset, Enchanted Kingdom, Al Fresco Springs, Laresio, and emblem assets into `client/public/assets/`. The local asset directory is intentionally gitignored so deployment does not package duplicate binaries; the source includes the fetch command and asset manifest needed by every clone.
