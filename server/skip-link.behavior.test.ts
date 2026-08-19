// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import SkipLink from "../client/src/components/SkipLink";

describe("keyboard skip navigation", () => {
  it("moves keyboard focus to the main landmark and updates the fragment", async () => {
    const user = userEvent.setup();
    render(createElement("div", null, createElement(SkipLink), createElement("main", { id: "main-content" }, "Main route content")));
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("link", { name: "Skip to main content" }));
    await user.keyboard("{Enter}");
    expect(document.activeElement).toBe(screen.getByRole("main"));
    expect(window.location.hash).toBe("#main-content");
  });
});
