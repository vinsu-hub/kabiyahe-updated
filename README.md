
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

A copy is also available in the public GitHub Release [Kabiyahe stock images v1.0.0](https://github.com/vinsu-hub/kabiyahe-updated/releases/tag/v1.0.0-stock-images). Download `kabiyahe-stock-images-v1.0.0.zip`, verify it against SHA-256 `33b1439e525dbc26af1dd80618e932170be8948164a2ca9696c9944b27028b7d`, and extract it outside the project directory when you need an offline local asset copy. The normal recommended setup remains `pnpm assets:download` so the deployment source tree stays free of binary media.
