const { describe, it } = require("node:test");
const assert = require("node:assert");
const http = require("node:http");
const app = require("../server");

function request(server, method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, `http://localhost:${server.address().port}`);
    const options = { method, hostname: url.hostname, port: url.port, path: url.pathname };
    if (body) options.headers = { "Content-Type": "application/json" };
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve({ status: res.statusCode, body: data }));
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

describe("DRAGON-IA server", () => {
  let server;

  it("serves the frontend on GET /", async () => {
    server = app.listen(0);
    try {
      const res = await request(server, "GET", "/");
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.includes("DRAGON-IA"));
    } finally {
      server.close();
    }
  });

  it("returns 400 when message is missing", async () => {
    server = app.listen(0);
    try {
      const res = await request(server, "POST", "/api/chat", {});
      assert.strictEqual(res.status, 400);
    } finally {
      server.close();
    }
  });

  it("returns 500 when API key is not set", async () => {
    const original = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    server = app.listen(0);
    try {
      const res = await request(server, "POST", "/api/chat", { message: "hello" });
      assert.strictEqual(res.status, 500);
      const data = JSON.parse(res.body);
      assert.ok(data.error.includes("OPENAI_API_KEY"));
    } finally {
      if (original) process.env.OPENAI_API_KEY = original;
      server.close();
    }
  });
});
