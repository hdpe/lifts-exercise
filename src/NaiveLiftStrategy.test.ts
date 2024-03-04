import { test, expect } from "@jest/globals";
import { NaiveLiftStrategy } from "./NaiveLiftStrategy.js";
import { Lift, LiftSimulationRequest } from "./LiftSimulation.js";
import { spy } from "sinon";

test("onRequest when available lift sets no direction for lift if at correct floor", () => {
  const strategy = new NaiveLiftStrategy();

  const lift = newLift(1);
  const setDirection = spy(lift, "setDirection");

  strategy.onRequest([lift], newRequest({ fromFloor: 1, toFloor: 1 }));

  expect(setDirection.args).toEqual([]);
});

test("onRequest when available lift sets direction for lift if at lower floor", () => {
  const strategy = new NaiveLiftStrategy();

  const lift = newLift(0);
  const setDirection = spy(lift, "setDirection");

  strategy.onRequest([lift], newRequest({ fromFloor: 1 }));

  expect(setDirection.args).toEqual([[1, { targetFloor: 1 }]]);
});

test("onRequest when available lift sets direction for lift if at higher floor", () => {
  const strategy = new NaiveLiftStrategy();

  const lift = newLift(2);
  const setDirection = spy(lift, "setDirection");

  strategy.onRequest([lift], newRequest({ fromFloor: 1 }));

  expect(setDirection.args).toEqual([[-1, { targetFloor: 1 }]]);
});

test("onRequest when unavailable lift enqueues order for lift when next available", () => {
  const strategy = new NaiveLiftStrategy();

  const lift = newLift(0);
  lift.busy = true;
  const setDirection = spy(lift, "setDirection");

  strategy.onRequest([lift], newRequest({ fromFloor: 1 }));

  expect(setDirection.args).toEqual([]);

  lift.busy = false;
  strategy.onFloor(lift, 0);

  expect(setDirection.args).toEqual([[1, { targetFloor: 1 }]]);
});

test("onRequest when lift at correct floor to fill fills and sets direction", () => {
  const strategy = new NaiveLiftStrategy();

  const lift = newLift(1);

  const setDirection = spy(lift, "setDirection");
  const stopAndFill = spy(lift, "stopAndFill");

  strategy.onRequest([lift], newRequest({ fromFloor: 1, toFloor: 2 }));

  expect(setDirection.args).toEqual([[1, { targetFloor: 2 }]]);
  expect(stopAndFill.args).toEqual([[]]);
});

test("onFloor when lift filled and at correct floor to empty stops to empty", () => {
  const strategy = new NaiveLiftStrategy();

  const lift = newLift(0);

  const setDirection = spy(lift, "setDirection");
  const stopAndFill = spy(lift, "stopAndFill");

  strategy.onRequest([lift], newRequest({ fromFloor: 1, toFloor: 2 }));
  strategy.onFloor(lift, 1);
  strategy.onFloor(lift, 2);

  expect(setDirection.args).toEqual([
    [1, { targetFloor: 1 }],
    [1, { targetFloor: 2 }]
  ]);
  expect(stopAndFill.args).toEqual([[], []]);
  expect(strategy.orders.get(lift)!.length).toBe(0);
});

test("onFloor when lift empty and at correct floor to empty does not stop to empty", () => {
  const strategy = new NaiveLiftStrategy();

  const lift = newLift(3);

  const setDirection = spy(lift, "setDirection");
  const stopAndFill = spy(lift, "stopAndFill");

  strategy.onRequest([lift], newRequest({ fromFloor: 1, toFloor: 2 }));
  strategy.onFloor(lift, 3);
  strategy.onFloor(lift, 2);

  expect(setDirection.args).toEqual([[-1, { targetFloor: 1 }]]);
  expect(stopAndFill.args).toEqual([]);
});

test("onFloor with no-op order fulfills order", () => {
  const strategy = new NaiveLiftStrategy();

  const lift = newLift(1);

  const setDirection = spy(lift, "setDirection");
  const stopAndFill = spy(lift, "stopAndFill");

  strategy.onRequest([lift], newRequest({ fromFloor: 1, toFloor: 1 }));
  strategy.onFloor(lift, 1);

  expect(setDirection.args).toEqual([]);
  expect(stopAndFill.args).toEqual([[]]);
  expect(strategy.orders.get(lift)!.length).toBe(0);
});

function newLift(floor: number) {
  return new Lift(`_test lift`, floor);
}

function newRequest(
  props: Partial<LiftSimulationRequest>
): LiftSimulationRequest {
  return {
    fromFloor: 1000,
    toFloor: 2000,
    timeSeconds: 3000,
    ...props
  };
}
