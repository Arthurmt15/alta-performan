import { cn } from "@/utils/cn";

describe("cn helper", () => {
  it("mergeia classes", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
  it("lida com falsy", () => {
    expect(cn("bg-red-500", false as any, undefined as any)).toBe("bg-red-500");
  });
  it("tailwind-merge resolve conflitos", () => {
    expect(cn("text-sm text-lg")).toBe("text-lg");
  });
});
