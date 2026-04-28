import { snapPoint, snapValue } from "./grid";

describe("grid utilities", () => {
  it("snaps numbers to the nearest grid line", () => {
    expect(snapValue(9)).toBe(0);
    expect(snapValue(11)).toBe(20);
    expect(snapValue(31)).toBe(40);
  });

  it("snaps points without changing the grid size", () => {
    expect(snapPoint(26, 44)).toEqual({ x: 20, y: 40 });
  });
});
