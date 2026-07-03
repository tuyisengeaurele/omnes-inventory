# Omnes Inventory

Multi-tenant inventory management for small and mid-size businesses. Track stock across warehouses, purchase from suppliers, fulfill orders, and keep a full audit trail of every movement.

## Layout

This is an npm workspaces monorepo:

| Path             | What it is                                      |
| ---------------- | ----------------------------------------------- |
| `apps/marketing` | Public landing site (Vite + React)              |
| `apps/web`       | The app itself (Vite + React)                   |
| `apps/api`       | REST API (Express + Prisma + Postgres)          |
| `packages/shared`| Types and zod schemas shared between the layers |

## Running it locally

You need Node 20 or newer and a Postgres instance. Docker is the easy path for Postgres, but a native install works fine too.

1. Clone and install:

   ```sh
   git clone https://github.com/tuyisengeaurele/omnes-inventory.git
   cd omnes-inventory
   npm install
   ```

2. Start Postgres (and Mailhog for catching dev emails):

   ```sh
   docker-compose up -d
   ```

   No Docker? Create a database named `omnes_inventory` on your own Postgres and adjust `DATABASE_URL` in the next step. Set `SMTP_TRANSPORT=console` so emails print to the terminal instead of going through Mailhog.

3. Configure the environment:

   ```sh
   cp .env.example .env
   ```

   The defaults match the docker-compose services, so if you went the Docker route you can leave the file as is.

4. Set up the database:

   ```sh
   npm run db:migrate
   npm run db:seed
   ```

   The seed creates a demo tenant with an admin login, a few warehouses, categories and products, so there is something to click around in right away. Credentials are printed at the end of the seed run.

5. Run it:

   ```sh
   npm run dev
   ```

   API on http://localhost:4000, app on http://localhost:5173.

The landing site runs separately since it has no backend dependency:

```sh
npm run dev:marketing
```

## Scripts

| Command                | What it does                          |
| ---------------------- | ------------------------------------- |
| `npm run dev`          | API and web app together              |
| `npm run dev:marketing`| Landing site only                     |
| `npm run lint`         | ESLint across the whole repo          |
| `npm run format`       | Prettier across the whole repo        |
