import test from "node:test";
import assert from "node:assert/strict";
import { CompositeEmailService } from "./lib/email.service.js";

test("CompositeEmailService falls back to direct when queue fails", async () => {
  let directCalled = 0;
  const queueSender = {
    send: async () => {
      throw new Error("queue down");
    },
  };
  const directSender = {
    send: async () => {
      directCalled += 1;
      return { provider: "direct", status: "sent" };
    },
  };

  const service = new CompositeEmailService({ queueSender, directSender });
  const result = await service.sendVerificationEmail({
    user: { email: "test@example.com", name: "Test", _id: "user1" },
    token: "plain-token",
  });

  assert.equal(directCalled, 1);
  assert.equal(result.provider, "direct");
});
