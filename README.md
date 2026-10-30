# Showmanager

A web app for bands: keep track of festival applications, plan shows and calculate the minimum fee for a gig. The user interface is in German.

## Features

- **Applications:** festivals with deadline and contact, status per season, search and filters, deadlines that are close are highlighted.
- **Shows:** gigs with venue, promoter, fee, travel and hotel, a running order from editable templates, a guest list with quota and a daysheet as PDF.
- **Calculator:** fixed costs of a gig from vehicles, accommodation, crew and other items plus a buffer. Saved automatically for the whole band.
- **Export:** CSV per module and a full backup as JSON.
- **Accounts:** every band member logs in with their own account. After 5 wrong passwords in a row, an account is locked for 15 minutes. Admins create accounts, set new passwords and unlock accounts.
- Can be added to the phone's home screen as an app.

The frontend is Next.js (`src/`), the backend a Python API with FastAPI (`backend/`). Both run in the same Vercel project: the pages call the API under `/api/v1`, which runs as a Python function (`api/index.py`). The API documentation is at `/api/v1/docs`.

## Deployment on Vercel

You need accounts at GitHub, [Vercel](https://vercel.com) and [Turso](https://turso.tech) (hosted SQLite). The free plans are enough.

1. **Fork** this repository on GitHub.
2. In Vercel, choose _Add New → Project_ and import your fork. The build settings stay as they are, Vercel installs the Python packages from `requirements.txt` itself.
3. In the project, open _Storage → Create Database → Turso_, choose the region Frankfurt and connect the database to the project.
4. **Deploy.** The API creates the tables on its first start.
5. Open the app right away and create the first account: as long as there is none, whoever opens the app first creates it and becomes admin. Under _👤 your name_ (top right) you then create the accounts for the others.

## Running locally

Requirements: Node.js ≥ 22 and Python 3.12

```bash
npm install
python3.12 -m venv .venv
.venv/bin/pip install -r requirements-dev.txt
npm run dev        # http://localhost:3000, the API runs on port 8000
```

The settings are in `.env.example`. Locally, the SQLite file `data/showmanager.db` is used. It is created with the starting data on the first start, then the app asks you to create the first account.

After changing the API, run `npm run api:types`: it updates the TypeScript types of the frontend (`src/lib/api/schema.ts`) from the API.

To start over with an empty database: `.venv/bin/python -m backend.reset --yes`. With Turso credentials in `.env`, this resets the live database, so download a backup first.

## Security

- Passwords are stored as scrypt hashes, never in plain text. A login creates a session with a random token: the browser keeps it in an HTTP-only cookie, the database only its SHA-256. Sessions end after 90 days, on logout, and when the password changes (changing your own password keeps the current session).
- After 5 wrong passwords in a row, the account is locked for 15 minutes, and every further wrong password locks it again until a login succeeds or an admin unlocks it. Unknown usernames get the same answer as wrong passwords.
- The backup (JSON) does not contain the accounts.

## Calculator as a single file

The calculator also exists on its own: one HTML file without a server or database, which saves in the browser. It is for anyone who only needs the calculator and does not want to set up the app. The data stays on that one device, a backup (JSON) moves it to another device or browser. A backup of the app can be loaded there as well.

```bash
npm run calculator:build   # → dist/kalkulator.html
npm run calculator:dev     # with reload while working on it
```

The file is built with Vite (`vite.calculator.config.mts`) from the same components as the app; only saving is different (`src/standalone/calculator/`). Changes to the calculator in the app therefore also end up in the file.

**Publishing:** a tag like `calculator-v1.0.0` builds the file, attaches it to a GitHub release and puts it on GitHub Pages. The latest version can always be downloaded at `https://github.com/<owner>/<repo>/releases/latest/download/kalkulator.html`. On the phone, the Pages address works better than the downloaded file: it can be added to the home screen.

```bash
git tag calculator-v1.0.0
git push origin calculator-v1.0.0
```

Set up once: under _Settings → Pages_, choose _GitHub Actions_ as the source, and under _Settings → Environments → github-pages_ allow the tags `calculator-v*` to deploy (by default only the main branch may).

## License

[MIT](LICENSE): free to use, change and share.
