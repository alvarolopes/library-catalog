# End-to-end tests

The Playwright test exercises the production SPA bundle, API, and PostgreSQL through the browser. Start the full Compose stack before running it; Playwright intentionally does not start services itself.

```bash
docker compose up -d --build
cd e2e
npm ci
npx playwright install chromium
npm test
```

The test creates a uniquely named genre, author, and book through the UI, verifies the resolved relationship in the book list, and removes all three records before it finishes. Run it again immediately to confirm the cleanup.

Set `E2E_BASE_URL` only when the SPA runs somewhere other than `http://localhost:5173`.
