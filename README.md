# dbviz

Paste a PostgreSQL connection string. See your entire schema as an interactive diagram.

https://github.com/Chandan-ml/dbviz/raw/main/docs/demo.mov


---

## The problem

Understanding a database schema means digging through migration files, running `information_schema` queries, or setting up a heavy tool like DBeaver. None of that is fast.

dbviz gives you a visual map in seconds.

---

## Features

- **Auto-renders all tables and columns** from any PostgreSQL database
- **PK / FK badges** on every column
- **Animated edges** showing foreign key relationships
- **Drag** tables to rearrange the layout
- **Search** to highlight specific tables
- **Export as PNG** for documentation or pull requests

---

## Getting started

**1. Clone**
```bash
git clone https://github.com/Chandan-ml/dbviz.git
cd dbviz
```

**2. Start the backend**
```bash
cd server && npm install && npm run dev
```

**3. Start the frontend**
```bash
cd ../client && npm install && npm run dev
```

**4. Open** `http://localhost:5173`, paste your connection string, hit **Connect**.

---

## Try the demo database

```bash
docker run --name dbviz-postgres \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=sampledb \
  -p 5432:5432 -d postgres

docker exec -i dbviz-postgres psql -U admin -d sampledb < docs/demo-schema.sql
```

Then connect with:
```
postgresql://admin:password@localhost:5432/sampledb
```

The demo is a 16-table e-commerce schema — users, products, variants, orders, payments, shipments, reviews, coupons — realistic enough to show what dbviz actually does with a complex schema.

---

## Stack

- **Frontend** — React, TypeScript, Vite, React Flow
- **Backend** — Node.js, TypeScript, Express, node-postgres

---


---

## License

MIT
