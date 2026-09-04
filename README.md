
## Local image assets

App pages reference stock photography directly under `/assets/`. For a standalone local clone, download those files into the ignored Vite public directory:

```bash
pnpm install
pnpm assets:download
```

Start the app with `pnpm dev`. The fetcher downloads 26 web-sized JPEGs (21 destination
photos plus 5 generic Laguna images) into `client/public/assets/`. The local asset
directory is intentionally gitignored so deployment does not package duplicate binaries.

Source: the individual `.jpg` assets on the public GitHub Release
[El-Biyahe! stock images v2.0.0](https://github.com/vinsu-hub/el-biyahe-stock-images/releases/tag/v2.0.0)
(fetched one-by-one so the Vercel build needs no unzip binary; the bundled
`el-biyahe-stock-images-v2.0.0.zip`, SHA-256 `de37a30255bb755baa16e44c158cb669bf5f66bf7002c04433d5810c1128adac`, is also attached).
Every destination photo is from Wikimedia Commons under a free licence (CC BY, CC BY-SA,
CC0, or Public Domain); per-image attribution is in
[`scripts/destination-photo-manifest.json`](scripts/destination-photo-manifest.json) and
is surfaced in-app on the destination detail page for CC BY / CC BY-SA images.
`scripts/build-destination-photos.mjs` regenerates the archive from the manifest.

The previous [Kabiyahe stock images v1.0.0](https://github.com/vinsu-hub/kabiyahe-updated/releases/tag/v1.0.0-stock-images)
release (SHA-256 `33b1439e525dbc26af1dd80618e932170be8948164a2ca9696c9944b27028b7d`) is kept
as a documented fallback but is no longer used.
