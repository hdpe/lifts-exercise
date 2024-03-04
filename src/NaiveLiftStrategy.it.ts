import { test, expect } from "@jest/globals";
import { stub } from "sinon";
import { LiftSimulation } from "./LiftSimulation.js";
import { NaiveLiftStrategy } from "./NaiveLiftStrategy.js";
import { Logger } from "./Logger.js";

test("strategy supports colocated and no-op requests", () => {
  const simulation = new LiftSimulation({
    liftStrategy: new NaiveLiftStrategy(),
    initialState: { lifts: [{ floor: 0 }] },
    requests: [
      { timeSeconds: 20, fromFloor: 0, toFloor: 0 },
      { timeSeconds: 40, fromFloor: 0, toFloor: 1 }
    ],
    logger: stub(new Logger())
  });

  const { totalPassengerTimeSeconds } = simulation.start();

  expect(totalPassengerTimeSeconds).toBeCloseTo(30.6);
});
