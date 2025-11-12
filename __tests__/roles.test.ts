import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveRoleSwitch } from "@/lib/roles";

describe("resolveRoleSwitch", () => {
  it("flags model enablement when user lacks MODEL role", () => {
    const result = resolveRoleSwitch(["PHOTOGRAPHER"], "MODEL");
    assert.equal(result.needsEnableModel, true);
  });

  it("does not request enablement when MODEL already present", () => {
    const result = resolveRoleSwitch(["PHOTOGRAPHER", "MODEL"], "MODEL");
    assert.equal(result.needsEnableModel, false);
  });

  it("does not request enablement when switching to photographer", () => {
    const result = resolveRoleSwitch(["PHOTOGRAPHER"], "PHOTOGRAPHER");
    assert.equal(result.needsEnableModel, false);
  });
});
