# CBTweb — CBT Progress Application Portal

**CBTweb** is a React and Firebase web application for collecting and reviewing applications to the CBT Progress course/team. It presents a Bengali student-facing eligibility flow with an animated mascot, then collects a candidate dossier. An authenticated admin panel reviews applications, changes their status, queues notification documents, maintains an applicant conversation and exports accepted candidates as CSV.

## Application flow

The public route `/` starts with an “Octopus Filtration” questionnaire. A candidate must answer the eligibility questions positively to reach the application form. The form collects identity, academic, contact and motivation data, then creates a pending document in the Firestore `applications` collection.

The `/admin` route uses Firebase Email/Password authentication and checks the authenticated UID against the `admins` collection. Authorized admins can filter and search applications, accept or reject candidates, inspect details, exchange messages stored in `messages`, and download accepted records as a CSV file. Status changes also create an email-style document in `mail`; a separate email extension or backend worker would be required to actually deliver those messages.

| Route | Purpose |
|---|---|
| `/` | Student eligibility questionnaire and application form |
| `/admin` | Authenticated application review dashboard |
| `/api/health` | Express health check returning `{ "status": "ok" }` |

## Data model and security

The frontend uses Firebase Auth and Firestore through `src/firebase.ts`. The current rules define `applications`, `messages`, `mail`, `admins` and `admin_access` collections. Candidate creation is allowed for the required application fields and `pending` status; admin reads/updates are controlled by the `admins` collection. The rules intentionally deny all other documents by default.

The repository includes a Firebase web configuration file. Firebase web configuration values are identifiers rather than a substitute for security rules, but production deployments should still review the project, enable only required providers, remove test/admin bootstrap paths, validate every field server-side, add abuse protection and keep privileged credentials out of the client.

## Run locally

### Requirements

Use a recent Node.js release and npm. The project uses Vite, React, TypeScript, Tailwind CSS v4, Firebase, Express, Motion and Lucide React.

```bash
git clone https://github.com/rofiqmpi/CBTweb.git
cd CBTweb
npm install
npm run dev
```

Open the URL printed by the development server. The custom `server.ts` starts an Express server on port `3000` and mounts Vite middleware in development. In production, build the frontend first and start the server with `NODE_ENV=production`:

```bash
npm run build
NODE_ENV=production npm run dev
```

The repository's Firebase project must have the required Firestore database and Email/Password Authentication provider configured. Admin access also requires valid `admin_access` and `admins` documents that match the rules.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Starts the Express/Vite development server |
| `npm run build` | Creates the Vite production build in `dist/` |
| `npm run preview` | Runs Vite's preview server |
| `npm run lint` | Runs TypeScript type checking with `tsc --noEmit` |
| `npm run clean` | Removes the Vite `dist/` directory |

## Project structure

```text
CBTweb/
├── src/components/StudentPortal.tsx  # public questionnaire and application form
├── src/components/AdminPanel.tsx    # auth-protected review dashboard
├── src/components/Mascot.tsx        # animated SVG mascot
├── src/firebase.ts                   # Firebase app/Auth/Firestore/Storage setup
├── src/types.ts                      # application and message types
├── firestore.rules                   # Firestore access policy
├── server.ts                         # Express + Vite entry point
├── index.html
└── package.json
```

## Current limitations

The questionnaire is client-side eligibility logic and is not a substitute for server-side admission validation. Admin status changes and email queue writes happen from the client after authentication. The mail collection is only a queue/document convention; sending requires Firebase Extensions or a trusted server process. The CSV is generated in the browser, and there is no pagination, audit log, automated test suite or production deployment configuration in the repository.

## License

No explicit license was present in the original repository. Add a license before redistributing the application.
