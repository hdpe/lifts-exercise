import { Lift, LiftSimulationRequest } from "./LiftSimulation.js";

export class Logger {
  timeFormat = new Intl.NumberFormat("en", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });

  logRequest(timeSeconds: number, request: LiftSimulationRequest) {
    const direction =
      request.toFloor > request.fromFloor
        ? "up"
        : request.toFloor < request.fromFloor
        ? "down"
        : "??";

    this.log(
      timeSeconds,
      `Passenger on floor ${request.fromFloor} pressed ${direction} (going to floor ${request.toFloor})`
    );
  }

  logStopAndFill(
    timeSeconds: number,
    lift: Lift,
    floor: number,
    waitSeconds: number
  ) {
    this.log(
      timeSeconds,
      `Lift ${lift.name} arrived on floor ${floor}; waiting for ${waitSeconds} seconds`
    );
  }

  logStartMove(
    timeSeconds: number,
    lift: Lift,
    currentFloor: number,
    targetFloor: number
  ) {
    this.log(
      timeSeconds,
      `Lift ${lift.name} leaving floor ${currentFloor}; heading to floor ${targetFloor}`
    );
  }

  private log(timeSeconds: number, message: string) {
    console.log(`${this.timeFormat.format(timeSeconds)}: ${message}`);
  }
}
