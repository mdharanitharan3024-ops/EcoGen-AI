Use the following conventions for this workspace:

- Keep Cloudflare credentials in `backend/.env`; never expose them to frontend code.
- Keep estimate calculations in `backend/app/services/estimator.py` and persist the assumptions-derived estimate snapshot with each generation.
- Treat energy, compute, and cost values as configured approximations, not measured usage or provider billing.
- Use the Flask API for persistence and provider access; do not simulate successful image generation in the app.
- Follow the existing React, Flask, SQLite, and CSS structure. Keep API changes documented in `backend/API.md` and setup changes documented in `README.md`.
