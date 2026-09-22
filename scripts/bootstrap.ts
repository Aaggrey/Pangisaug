// Bootstrap: apply src/lib/schema.sql to whatever DATABASE_URL points at.
// No dotenv dependency — we read .env ourselves (same trick the probes used),
// so this runs with plain `tsx`/`node --env-file`.
// Idempotent: schema.sql is all CREATE TABLE IF NOT EXISTS / IF NOT EXISTS.

import { readFileSync } from "node:fs";
import { Client } from "pg";

function envValue(key: string): string {
  try {
    const txt = readFileSync(".env", "utf8");
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(new RegExp("^" + key + "\\s*=\\s*(.*)$"));
      if (m) return m[1].trim().replace(/^['"]|['"]$/g, "");
    }
  } catch {
    // fall through to process.env
  }
  return process.env[key] ?? "";
}

async function main() {
  const url = envValue("DATABASE_URL");
  const dbSeg = (() => {
    try {
      const u = new URL(url.replace("postgresql://", "postgres://"));
      return u.pathname.replace(/^\//, "");
    } catch {
      return "(unparsable)";
    }
  })();
  console.log(`bootstrap: connecting to db "${dbSeg}"`);

  const sql = readFileSync("src/lib/schema.sql", "utf8");
  const statements = sql.split(/;\r?\n/).map((s) => s.trim()).filter(Boolean);

  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    for (const stmt of statements) {
      if (/^\s*--/.test(stmt)) continue; // comment lines only
      await client.query(stmt);
    }
    const tables = await client.query(
      `SELECT string_agg(tablename, ', ') AS list FROM pg_tables WHERE schemaname='public' AND tablename IN ('User','Property','PropertyImage','Payment','VisitBooking')`
    );
    console.log(`bootstrap: OK, app tables present: [${tables.rows[0].list}]`);
  } catch (e: any) {
    console.error("bootstrap FAILED: " + String(e.message).split("\n")[0]);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

main();
