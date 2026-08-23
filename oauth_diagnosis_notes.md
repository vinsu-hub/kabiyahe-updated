# OAuth callback failure diagnosis

The `/plan/new` login attempt reached the OAuth callback and passed the code/state validation. The failure occurred during `db.upsertUser` while synchronizing the authenticated user: the database driver reported `connect ETIMEDOUT`. This was not a redirect URI or nonce mismatch.

The callback now retries transient MySQL connection failures up to three bounded attempts. If the database remains unavailable, it returns HTTP 503 with a safe retry message instead of the misleading generic `OAuth callback failed` response. The existing nonce/state validation remains fail-closed.

Validation covers missing parameters (400), malformed or unbound state (403), transient database classification, `/plan/new` desktop/mobile login initiation, TypeScript, production build, and the full Vitest suite. A live authenticated callback remains dependent on the external OAuth portal and database availability.
