# AutoDrive frontend

Next.js frontend for the AutoDrive vehicle management application.

**Production:** https://autodrive-lilac.vercel.app  
**Backend API:** https://autodrive-api-idsz.onrender.com

## Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- ESLint

## Environment

Create `.env.local` from `.env.example`:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

## Development

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`.

## Validation

```bash
npm run lint
npm run build
```

The production deployment uses Vercel with `frontend` configured as the project root directory.

For full project documentation, architecture, backend setup and deployment details, see the [root README](../README.md).
