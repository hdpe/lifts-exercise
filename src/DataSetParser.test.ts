import { test, expect } from "@jest/globals";
import { DataSetParser } from "./DataSetParser.js";
import { LiftSimulationRequest } from "./LiftSimulation.js";

test("parse returns requests", () => {
  const requests = new DataSetParser().parse(`
    1, 2,3

    4,5,6
    `);

  expect(requests).toEqual([
    { timeSeconds: 1, fromFloor: 2, toFloor: 3 },
    { timeSeconds: 4, fromFloor: 5, toFloor: 6 }
  ] as LiftSimulationRequest[]);
});
