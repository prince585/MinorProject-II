# EcoTracker Smart Municipality

EcoTracker is a Next.js 16, React 19, MongoDB, JWT, TailwindCSS, and Leaflet based smart municipality waste management project.

## Environment Variables

Create a local `.env.local` file from `.env.example`:

```bash
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret
```

Both variables are server-side only. Do not prefix them with `NEXT_PUBLIC_`.

## Vercel Deployment

In Vercel, open Project Settings > Environment Variables and add these variables for Production, Preview, and Development as needed:

```bash
MONGO_URI=<your MongoDB Atlas connection string>
JWT_SECRET=<your JWT signing secret>
```

Use the MongoDB Atlas URI and JWT secret supplied for this project. Do not commit real secret values to the repository.

After saving the variables, redeploy the project. The MongoDB helper validates `MONGO_URI` only when an API route connects to the database, so Vercel build/static analysis can import server modules without crashing.

## Local Development

```bash
npm install
npm run dev
```

The login, register, broadcast, dashboard polling, user lookup, and notification API routes use the shared cached Mongoose connection helper.

## Default Demo Accounts

The server safely creates these accounts if they do not already exist:

```bash
Admin email: admin@ecotracker.com
Admin password: Admin@123

Driver email: driver@ecotracker.com
Driver password: Driver@123
```

Use `/admin/login` for the admin console and `/driver/login` for the driver panel.
