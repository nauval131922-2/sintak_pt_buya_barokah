# SINTAK ERP - PT Buya Barokah

Aplikasi ERP/internal web berbasis Next.js App Router untuk PT Buya Barokah/SINTAK. Project ini mencakup dashboard, manufaktur, akuntansi, sales order, purchase order, stok, scraping/import data, jurnal harian produksi, dan manajemen user/role.

## Stack Utama

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS
- SQLite/libSQL (`@libsql/client`)
- Node.js + npm

## Bacaan Awal untuk Developer/AI

Sebelum mengerjakan fitur atau debugging, baca file berikut dalam urutan ini:

1. `AGENTS.md` - aturan kerja agent, command utama, dan batasan penting.
2. `docs/DEV_RULES.md` - standar workflow development, guardrail UI/UX, dan aturan data.
3. `docs/REPO_MAP.md` - peta struktur repository dan area kode penting.

Setelah itu, gunakan `docs/RESUME_SESSION.md` sebagai konteks lanjutan saat melanjutkan sesi sebelumnya.

## Prasyarat

- Node.js versi modern yang kompatibel dengan Next.js 16.
- npm.
- File environment lokal (`.env` atau `.env.development`) jika menjalankan fitur database remote, scraping, cron, atau session production.

## Setup Pertama Kali

Install dependency:

```bash
npm install
```

Inisialisasi database default:

```bash
npm run init-db
```

Untuk database development lokal (`database_dev.sqlite`):

```bash
npm run init-db:dev
```

## Menjalankan Project Lokal

Jalankan development server:

```bash
npm run dev
```

Buka aplikasi di browser:

```text
http://localhost:3000
```

## Build dan Production Start

Build production:

```bash
npm run build
```

Catatan: `npm run build` otomatis menjalankan `prebuild`, yaitu `npm run init-db`, sebelum proses build.

Jalankan hasil build:

```bash
npm run start
```

## Command Penting

| Command | Fungsi |
| --- | --- |
| `npm run dev` | Menjalankan development server Next.js dengan Turbo. |
| `npm run build` | Build production. Otomatis menjalankan `npm run init-db` lewat `prebuild`. |
| `npm run start` | Menjalankan server production setelah build. |
| `npm run lint` | Menjalankan ESLint. |
| `npm run init-db` | Inisialisasi/melengkapi schema database default. |
| `npm run init-db:dev` | Inisialisasi database development dengan `DB_PATH=database_dev.sqlite`. |
| `npm run migrate:sales2025` | Menjalankan migrasi sales 2025. Pakai hanya saat memang diperlukan. |

## Environment Variable

Project dapat berjalan dengan database lokal tanpa konfigurasi remote tambahan. Beberapa environment variable yang dikenali kode:

| Variable | Kegunaan |
| --- | --- |
| `DB_PATH` | Override path database lokal. Default production lokal: `database.sqlite`; development: `database_dev.sqlite`. |
| `USE_REMOTE_DB` | Jika `true`, memakai remote database saat `TURSO_DATABASE_URL` tersedia. |
| `TURSO_DATABASE_URL` | URL database Turso/libSQL remote. |
| `TURSO_AUTH_TOKEN` | Token auth untuk database Turso/libSQL remote. |
| `SESSION_SECRET` | Secret untuk signing session/JWT. Wajib diganti untuk production. |
| `SCRAPER_EMAIL` | Username/email untuk fitur scraping. |
| `SCRAPER_PASSWORD` | Password untuk fitur scraping. |
| `CRON_SECRET` | Secret untuk endpoint cron/maintenance. |

Jangan commit file `.env`, database lokal, atau secret asli ke repository.

## Database

- Database lokal utama biasanya memakai `database.sqlite`.
- Database development dapat memakai `database_dev.sqlite` lewat `npm run init-db:dev`.
- Kode koneksi database ada di `src/lib/db.ts`.
- Definisi schema dan helper terkait ada di `src/lib/schema.ts` dan `scripts/init-db.ts`.
- Perlakukan file `*.sqlite` dan `*.db` sebagai data kerja penting; jangan hapus tanpa instruksi eksplisit.

## Struktur Singkat

| Path | Isi |
| --- | --- |
| `src/app/` | Halaman, layout, dan route handler Next.js App Router. |
| `src/app/api/` | Endpoint backend internal, scraping, import/export, sync, dan CRUD. |
| `src/components/` | Komponen UI reusable dan komponen domain. |
| `src/lib/` | Utilitas database, auth/session, permissions, logger, schema, dan helper. |
| `scripts/` | Script database, migrasi, audit, import, dan debugging operasional. |
| `docs/` | Dokumentasi kerja, aturan development, resume sesi, tutorial, dan backlog. |
| `public/` | Aset statis. |
| `test/` | Test/script validasi behavior tertentu. |

## Validasi Sebelum Commit

Minimal jalankan command yang relevan dengan perubahan:

```bash
npm run lint
```

Untuk perubahan besar pada database/API/UI, pertimbangkan juga:

```bash
npm run build
```

Jika build dijalankan, ingat bahwa `prebuild` akan menjalankan `npm run init-db` terlebih dahulu.
