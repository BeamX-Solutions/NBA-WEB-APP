This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Supabase Auth setup

Copy `.env.example` to `.env.local` and set the project URL and publishable (or legacy anon) key. Never place a service-role or secret key in a `NEXT_PUBLIC_` variable.

The app reads registration branches from the anon-accessible `list_branches_for_signup` RPC and sends `full_name`, `phone`, `scn`, and `branch_code` as signup metadata. Your deployed backend must create and validate the practitioner profile; the browser does not write it.

In Supabase Auth settings, enable email/password and configure the production Site URL, redirect allowlist, confirmation requirement, and SMTP. Allow these redirect targets for each deployed origin, including `http://localhost:3000` during local testing:

- `/auth/callback` for signup confirmation
- `/auth/callback?flow=recovery` for password recovery

The callback exchanges PKCE codes and sends recovery users to `/reset-password`. Email delivery and confirmation behavior depend on the deployed project settings.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
