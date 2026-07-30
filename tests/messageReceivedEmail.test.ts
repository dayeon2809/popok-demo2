import assert from "node:assert/strict";
import test from "node:test";
import { deliverMessageReceivedEmail, isUserMessageFromSender } from "../lib/email/messageReceivedDelivery.ts";

const baseParams = {
  messageId: "message-1",
  conversationId: "conversation-1",
  senderUserId: "sender-1",
  recipientUserId: "recipient-1",
  senderName: "보낸 사람",
  recipientName: "받는 사람",
};

function createDependencies(options?: { email?: string | null; fail?: boolean }) {
  const calls: any[] = [];
  return {
    calls,
    dependencies: {
      getAccountEmail: async () => options?.email === undefined ? "recipient@example.com" : options.email,
      buildEmail: () => ({
        subject: "새 포퐄챗 메시지가 도착했습니다",
        html: "<p>포퐄에서 확인해 주세요.</p>",
        text: "포퐄에서 확인해 주세요.",
      }),
      sendEmail: async (params: any) => {
        calls.push(params);
        return options?.fail
          ? { success: false, error: "mock provider failure" }
          : { success: true, messageId: "mock-message-id" };
      },
    },
  };
}

test("uses message.id as the idempotency entity and omits message content", async () => {
  const { calls, dependencies } = createDependencies();
  const result = await deliverMessageReceivedEmail(baseParams, dependencies);

  assert.equal(result.success, true);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], {
    to: "recipient@example.com",
    subject: "새 포퐄챗 메시지가 도착했습니다",
    html: "<p>포퐄에서 확인해 주세요.</p>",
    text: "포퐄에서 확인해 주세요.",
    eventKey: "message_received",
    entityType: "message",
    entityId: "message-1",
    recipientUserId: "recipient-1",
    conversationId: "conversation-1",
  });
});

test("skips self notifications", async () => {
  const { calls, dependencies } = createDependencies();
  const result = await deliverMessageReceivedEmail(
    { ...baseParams, recipientUserId: baseParams.senderUserId },
    dependencies
  );

  assert.equal(result.skipped, true);
  assert.equal(calls.length, 0);
});

test("passes an empty address to the safe sender when the account has no email", async () => {
  const { calls, dependencies } = createDependencies({ email: null });
  await deliverMessageReceivedEmail(baseParams, dependencies);

  assert.equal(calls.length, 1);
  assert.equal(calls[0].to, "");
});

test("provider failure is returned without throwing", async () => {
  const { calls, dependencies } = createDependencies({ fail: true });
  const result = await deliverMessageReceivedEmail(baseParams, dependencies);

  assert.equal(calls.length, 1);
  assert.equal(result.success, false);
  assert.equal(result.error, "mock provider failure");
});
test("only user messages from the authenticated sender are eligible", () => {
  assert.equal(isUserMessageFromSender({ message_type: "user", sender_id: "sender-1" }, "sender-1"), true);
  assert.equal(isUserMessageFromSender({ message_type: "system", sender_id: null }, "sender-1"), false);
  assert.equal(isUserMessageFromSender({ message_type: "user", sender_id: "someone-else" }, "sender-1"), false);
});
