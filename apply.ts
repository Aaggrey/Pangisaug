import { readFileSync } from "fs";
import { Client } from "pg";
const env = readFileSync(".env", "utf8");
const get = (k: string) => { const m = env.match(new RegExp("^" + k + '\\s*=\\s*["\']?([^"\'\r\n]+)["\']?', "m")); return m?.[1] ?? ""; };
(async () => {
  const c = new Client({ connectionString: get("DATABASE_URL") });
  await c.connect();
  for (const stmt of readFileSync("schema.regen.sql","utf8").split(/;\r?\n/)) {
    const s = stmt.trim();
    if (!s) continue;
    await c.query(s);
  }
  console.log("DDL applied OK");
  const t = await c.query("SELECT string_agg(tablename, ', ') l FROM pg_tables WHERE schemaname='public' AND tablename NOT IN ('health_check','lakebase_attributes')");
  console.log("app tables now: " + t.rows[0].l);
  await c.end();
})().catch(async (e:any) => { console.log("FAIL: " + String(e.message).split(/[\r\n:]/)[0].slice(0,90)); try { await c.end(); } catch{} });
