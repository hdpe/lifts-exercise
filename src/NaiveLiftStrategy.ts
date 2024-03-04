import { Lift, LiftSimulationRequest, LiftStrategy } from "./LiftSimulation.js";

type Order = LiftSimulationRequest & {
  filled: boolean;
};

/**
 * An extremely simple lift strategy that simply assigns incoming requests
 * to the first available lift, which will then travel to the destination
 * floor of that request without interruption.
 */
export class NaiveLiftStrategy implements LiftStrategy {
  orders: Map<Lift, Order[]> = new Map();
  unassignedRequests: LiftSimulationRequest[] = [];

  onRequest(lifts: Lift[], request: LiftSimulationRequest): void {
    const lift = lifts.find((lift) => !lift.busy);

    if (!lift) {
      this.unassignedRequests.push(request);
      return;
    }

    this.enqueueOrder(lift, request);
  }

  onFloor(lift: Lift, floor: number): void {
    this.doFloorActions(lift, floor);
  }

  private doFloorActions(lift: Lift, floor: number): void {
    const orders = this.orders.get(lift) ?? [];
    let order = orders[0];

    if (!order) {
      const next = this.unassignedRequests.shift();

      if (next) {
        order = this.enqueueOrder(lift, next);
      }
    }

    if (!order) {
      return;
    }

    const fulfillsOrder = () => order.filled && floor === order.toFloor;

    if (floor === order.fromFloor) {
      lift.stopAndFill();
      embark(lift, order.toFloor);
      order.filled = true;
    } else if (fulfillsOrder()) {
      lift.stopAndFill();
    }

    if (fulfillsOrder()) {
      orders.shift();
      this.doFloorActions(lift, floor);
    }
  }

  private enqueueOrder(lift: Lift, request: LiftSimulationRequest) {
    const order = { ...request, filled: false };

    this.orders.set(lift, [...(this.orders.get(lift) ?? []), order]);

    if (lift.floor === request.fromFloor) {
      this.doFloorActions(lift, lift.floor);
    } else {
      embark(lift, request.fromFloor);
    }

    return order;
  }
}

function embark(lift: Lift, targetFloor: number) {
  if (lift.floor == null) {
    throw new Error("lift not at floor");
  }

  if (lift.floor === targetFloor) {
    return;
  }

  const direction = lift.floor < targetFloor ? 1 : -1;

  lift.setDirection(direction, { targetFloor });
}
