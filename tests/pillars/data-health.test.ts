import { describe, test, expect, afterEach } from "bun:test";
import dataHealth from "../../src/pillars/data-health.js";
import {
  createTestDir,
  cleanup,
  writeFixtures,
  mockProjectInfo,
  getCheck,
} from "../helpers.js";

let dirs: string[] = [];

async function make(name: string, fixtures: Record<string, string> = {}) {
  const dir = await createTestDir(name);
  dirs.push(dir);
  if (Object.keys(fixtures).length > 0) {
    await writeFixtures(dir, fixtures);
  }
  return dir;
}

afterEach(async () => {
  for (const d of dirs) await cleanup(d);
  dirs = [];
});

const freshnessCheck = getCheck(dataHealth, "data-freshness-monitoring");
const qualityTestsCheck = getCheck(dataHealth, "data-quality-tests");
const schemaDocsCheck = getCheck(dataHealth, "schema-documentation");
const piiCheck = getCheck(dataHealth, "pii-classification");
const keyConstraintsCheck = getCheck(dataHealth, "key-constraints-declared");

describe("data-freshness-monitoring", () => {
  test("dbt sources.yml with freshness passes", async () => {
    const dir = await make("freshness-dbt", {
      "models/sources.yml": "version: 2\nsources:\n  - name: raw\n    freshness:\n      warn_after: {count: 12, period: hour}\n",
    });
    const r = await freshnessCheck(dir, mockProjectInfo());
    expect(r.pass).toBe(true);
  });

  test("Airflow DAG with sla= passes", async () => {
    const dir = await make("freshness-airflow", {
      "dags/my_dag.py": "task = PythonOperator(task_id='x', sla=timedelta(hours=1))",
    });
    const r = await freshnessCheck(dir, mockProjectInfo());
    expect(r.pass).toBe(true);
  });

  test("empty dir fails", async () => {
    const dir = await make("freshness-empty");
    const r = await freshnessCheck(dir, mockProjectInfo());
    expect(r.pass).toBe(false);
  });
});

describe("data-quality-tests", () => {
  test("dbt schema.yml with tests passes", async () => {
    const dir = await make("quality-dbt", {
      "models/schema.yml": "version: 2\nmodels:\n  - name: orders\n    columns:\n      - name: id\n        tests:\n          - unique\n",
    });
    const r = await qualityTestsCheck(dir, mockProjectInfo());
    expect(r.pass).toBe(true);
  });

  test("great_expectations project passes", async () => {
    const dir = await make("quality-ge", {
      "great_expectations/great_expectations.yml": "config_version: 3",
    });
    const r = await qualityTestsCheck(dir, mockProjectInfo());
    expect(r.pass).toBe(true);
  });

  test("audit sql directory passes", async () => {
    const dir = await make("quality-audit", {
      "audits/check_nulls.sql": "select count(*) from orders where id is null",
    });
    const r = await qualityTestsCheck(dir, mockProjectInfo());
    expect(r.pass).toBe(true);
  });

  test("empty dir fails", async () => {
    const dir = await make("quality-empty");
    const r = await qualityTestsCheck(dir, mockProjectInfo());
    expect(r.pass).toBe(false);
  });
});

describe("schema-documentation", () => {
  test("dbt schema.yml with description passes", async () => {
    const dir = await make("docs-dbt", {
      "models/schema.yml": "version: 2\nmodels:\n  - name: orders\n    description: 'Order records'\n",
    });
    const r = await schemaDocsCheck(dir, mockProjectInfo());
    expect(r.pass).toBe(true);
  });

  test("DDL COMMENT clause passes", async () => {
    const dir = await make("docs-ddl", {
      "ddl/orders.sql": "CREATE TABLE orders (id BIGINT COMMENT 'order id')",
    });
    const r = await schemaDocsCheck(dir, mockProjectInfo());
    expect(r.pass).toBe(true);
  });

  test("empty dir fails", async () => {
    const dir = await make("docs-empty");
    const r = await schemaDocsCheck(dir, mockProjectInfo());
    expect(r.pass).toBe(false);
  });
});

describe("pii-classification", () => {
  test("dbt meta pii tag passes", async () => {
    const dir = await make("pii-dbt", {
      "models/schema.yml": "version: 2\nmodels:\n  - name: users\n    columns:\n      - name: email\n        meta:\n          pii: true\n",
    });
    const r = await piiCheck(dir, mockProjectInfo());
    expect(r.pass).toBe(true);
  });

  test("data-classification.yml passes", async () => {
    const dir = await make("pii-classification-file", {
      "data-classification.yml": "email: pii",
    });
    const r = await piiCheck(dir, mockProjectInfo());
    expect(r.pass).toBe(true);
  });

  test("empty dir fails", async () => {
    const dir = await make("pii-empty");
    const r = await piiCheck(dir, mockProjectInfo());
    expect(r.pass).toBe(false);
  });
});

describe("key-constraints-declared", () => {
  test("dbt unique/relationships tests pass", async () => {
    const dir = await make("keys-dbt", {
      "models/schema.yml": "version: 2\nmodels:\n  - name: orders\n    columns:\n      - name: id\n        tests:\n          - unique\n      - name: customer_id\n        tests:\n          - relationships:\n              to: ref('customers')\n              field: id\n",
    });
    const r = await keyConstraintsCheck(dir, mockProjectInfo());
    expect(r.pass).toBe(true);
  });

  test("DDL PRIMARY KEY passes", async () => {
    const dir = await make("keys-ddl", {
      "ddl/orders.sql": "CREATE TABLE orders (id BIGINT, PRIMARY KEY (id))",
    });
    const r = await keyConstraintsCheck(dir, mockProjectInfo());
    expect(r.pass).toBe(true);
  });

  test("empty dir fails", async () => {
    const dir = await make("keys-empty");
    const r = await keyConstraintsCheck(dir, mockProjectInfo());
    expect(r.pass).toBe(false);
  });
});
