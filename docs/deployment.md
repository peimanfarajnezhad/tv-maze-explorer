# Deployment (GitHub Pages)

The app is deployed to [GitHub Pages](https://pages.github.com/) on every push to `main` via the [Deploy to GitHub Pages](../.github/workflows/deploy.yml) workflow.

## GitHub Pages SPA routing workaround (404 fix)

GitHub Pages is a **static file host** with no server-side rewrite engine. When a user opens or refreshes a non-root URL (e.g. `https://username.github.io/tv-maze-explorer/search` or `.../shows/123`), Pages looks for a file at that path. No such file exists — only the SPA’s `index.html` exists — so Pages returns **404**.

**Workaround / trick:** GitHub Pages serves a custom [404 page](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-custom-404-page-for-your-github-pages-site) when it cannot find a file, and **the browser URL is preserved**. If that 404 page is a **copy of `index.html`**, then:

1. The user gets the same SPA shell for any “missing” path.
2. The URL in the address bar stays e.g. `/tv-maze-explorer/search`.
3. Vue Router reads `location.pathname` and renders the correct route.

The deploy workflow therefore copies `dist/index.html` to `dist/404.html` after the Vite build and before uploading the artifact. No router or app code changes are required; history mode and `base: '/tv-maze-explorer/'` stay as-is.

**Summary:** Copying `index.html` to `404.html` is a well-known workaround to fix SPA 404s on GitHub Pages when using client-side (history) routing.
