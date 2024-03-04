import { test, expect } from "@jest/globals";
import { stub } from "sinon";
import {
  Intent,
  LiftSimulation,
  LiftSimulationOptions,
  LiftStrategy
} from "./LiftSimulation";
import { Logger } from "./Logger.js";

test("start with no requests returns zero passenger time", () => {
  const simulation = newSimulation({
    initialState: { lifts: [] },
    requests: []
  });

  const { totalPassengerTimeSeconds } = simulation.start();

  expect(totalPassengerTimeSeconds).toBe(0);
});

test("start with single request and lift at correct floor returns expected result", () => {
  const simulation = newSimulation({
    liftStrategy: {
      onRequest() {},
      onFloor(lift, floor) {
        if (floor === 0) {
          lift.stopAndFill();
          lift.setDirection(1, newIntent());
        } else {
          lift.stopAndFill();
        }
      }
    },
    initialState: { lifts: [{ floor: 0 }] },
    requests: [{ timeSeconds: 0, fromFloor: 0, toFloor: 1 }]
  });

  const { totalPassengerTimeSeconds } = simulation.start();

  expect(totalPassengerTimeSeconds).toBeCloseTo(10.6);
});

test("start with single request and lift needs to move returns expected result", () => {
  const simulation = newSimulation({
    liftStrategy: {
      onRequest(lifts) {
        lifts[0].setDirection(1, newIntent());
      },
      onFloor(lift, floor) {
        if (floor === 1) {
          lift.stopAndFill();
          lift.setDirection(1, newIntent());
        } else if (floor === 2) {
          lift.stopAndFill();
        }
      }
    },
    initialState: { lifts: [{ floor: 0 }] },
    requests: [{ timeSeconds: 0, fromFloor: 1, toFloor: 2 }]
  });

  const { totalPassengerTimeSeconds } = simulation.start();

  expect(totalPassengerTimeSeconds).toBeCloseTo(10.6);
});

function newSimulation(
  opts: Pick<LiftSimulationOptions, "initialState" | "requests"> &
    Partial<LiftSimulationOptions>
): LiftSimulation {
  return new LiftSimulation({
    liftStrategy: nullStrategy(),
    logger: stub(new Logger()),
    ...opts
  });
}

function nullStrategy(): LiftStrategy {
  return { onFloor() {}, onRequest() {} };
}

function newIntent(): Intent {
  return {
    targetFloor: 1000
  };
}
