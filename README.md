# Varieties Watch Shop

E-commerce storefront for **[Varieties Watch Shop](https://www.varietieswatchshop.com)** — original watches in Bangladesh with nationwide cash on delivery.

## Tech Stack

- **Frontend**: React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Hosting**: Vercel
- **Tracking**: Meta Pixel + Conversions API (server-side)

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

## Environment Variables

Create a `.env` file with:

```env
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
VITE_SUPABASE_PROJECT_ID=<your-project-id>
```

## Supabase Setup

1. Create a new Supabase project
2. Run migrations from `supabase/migrations/` in order
3. Create an admin user in Auth dashboard
4. Insert admin role: `INSERT INTO user_roles (user_id, role) VALUES ('<user-id>', 'admin')`
5. Set edge function secrets (Gmail API, Meta CAPI)
6. Deploy edge functions: `supabase functions deploy`

## Project Structure

```
src/
├── components/     # UI components (Navbar, Footer, ProductCard, etc.)
├── contexts/       # React contexts (Cart)
├── data/           # Static fallback data
├── hooks/          # Custom hooks (useProducts, useBrands, etc.)
├── integrations/   # Supabase client & types
├── lib/            # Utilities (tracking, CDN image, etc.)
├── pages/          # Route pages (Index, Collection, Admin, etc.)
└── assets/         # Static images
supabase/
├── functions/      # Edge functions (order placement, Meta CAPI)
└── migrations/     # Database schema migrations
```

## License

Private — All rights reserved.
