import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveRoleSwitch } from "@/lib/roles";

describe("resolveRoleSwitch", () => {
  it("flags talent enablement when user lacks TALENT role", () => {
    const result = resolveRoleSwitch(["PHOTOGRAPHER"], "TALENT");
    assert.equal(result.needsEnableTalent, true);
  });

  it("does not request enablement when TALENT already present", () => {
    const result = resolveRoleSwitch(["PHOTOGRAPHER", "TALENT"], "TALENT");
    assert.equal(result.needsEnableTalent, false);
  });

  it("does not request enablement when switching to photographer", () => {
    const result = resolveRoleSwitch(["PHOTOGRAPHER"], "PHOTOGRAPHER");
    assert.equal(result.needsEnableTalent, false);
  });
});
