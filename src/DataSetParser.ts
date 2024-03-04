import { LiftSimulationRequest } from "./LiftSimulation.js";

export class DataSetParser {
  parse(csv: string): LiftSimulationRequest[] {
    return csv
      .split(/\n/g)
      .map((line) => line.trim())
      .filter((line) => !!line)
      .map((line) => line.split(/,/g).map((field) => +field))
      .map(([timeSeconds, fromFloor, toFloor]) => ({
        timeSeconds,
        fromFloor,
        toFloor
      }));
  }
}
