import { expect, test } from "vitest";
import { makePost } from "./factories";

test("makePost applies overrides", () => {
  expect(makePost({ slug: "x" }).slug).toBe("x");
});
