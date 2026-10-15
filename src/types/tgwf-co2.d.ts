declare module "@tgwf/co2" {
  /**
   * Minimal ambient types for @tgwf/co2 (the package ships no .d.ts).
   * Only the SWD-model `perByte` surface used by this app is declared.
   */
  export interface CO2Options {
    model?: "swd" | "1byte";
    version?: 3 | 4;
    gridIntensity?: unknown;
    rating?: unknown;
  }

  export class CO2 {
    constructor(options?: CO2Options);
    /** Estimated CO2e in grams for the given transfer size in bytes. */
    perByte(bytes: number, green?: boolean): number;
    perVisit(bytes: number, green?: boolean): number;
  }
}
