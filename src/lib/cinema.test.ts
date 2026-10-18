import { describe, expect, it } from "vitest";
import { bookingTotal } from "./cinema";

describe("precios", () => {
  it("entrada general a 4,50 €", () => {
    expect(bookingTotal(2, 0, false)).toBe(9);
  });
  it("viernes mayores de 65 a 2 €", () => {
    expect(bookingTotal(3, 2, true)).toBe(8.5);
  });
  it("fuera del viernes no hay descuento", () => {
    expect(bookingTotal(2, 2, false)).toBe(9);
  });
});
