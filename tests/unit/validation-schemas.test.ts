import test from "node:test";
import assert from "node:assert/strict";
import { loginSchema } from "../../src/app/(auth)/login/schema.ts";
import { registerSchema } from "../../src/app/(auth)/register/schema.ts";
import { newClientSchema } from "../../src/app/(dashboard)/clients/new/schema.ts";

test("login schema validates email and password", () => {
  const valid = loginSchema.safeParse({
    email: "admin@brandradar.ai",
    password: "12345678"
  });
  assert.equal(valid.success, true);

  const invalid = loginSchema.safeParse({
    email: "bad-email",
    password: "123"
  });
  assert.equal(invalid.success, false);
});

test("register schema enforces password confirmation", () => {
  const mismatch = registerSchema.safeParse({
    email: "admin@brandradar.ai",
    password: "12345678",
    confirmPassword: "87654321"
  });
  assert.equal(mismatch.success, false);
});

test("new client schema requires at least one platform", () => {
  const invalid = newClientSchema.safeParse({
    name: "Acme",
    domain: "acme.com",
    industry: "SaaS",
    platformSlugs: []
  });
  assert.equal(invalid.success, false);

  const valid = newClientSchema.safeParse({
    name: "Acme",
    domain: "acme.com",
    industry: "SaaS",
    platformSlugs: ["chatgpt"]
  });
  assert.equal(valid.success, true);
});
