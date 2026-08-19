import { describe, expect, it } from "vitest";
import { isInAppDeliveryEnabled, selectWorkspaceNotificationRecipientIds } from "./db";

describe("notification recipient and preference policy", () => {
  it("delivers only to distinct workspace recipients other than the initiating actor", () => {
    expect(selectWorkspaceNotificationRecipientIds([{ userId: 4 }, { userId: 9 }, { userId: 4 }, { userId: 12 }], 4)).toEqual([9, 12]);
  });

  it("uses the persisted in-app preference as the delivery gate", () => {
    expect(isInAppDeliveryEnabled({ inAppEnabled: true })).toBe(true);
    expect(isInAppDeliveryEnabled({ inAppEnabled: false })).toBe(false);
  });
});
