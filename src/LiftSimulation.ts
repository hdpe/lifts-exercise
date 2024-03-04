import { EventEmitter } from "node:events";
import { Logger } from "./Logger.js";

export interface LiftSimulationOptions {
  liftStrategy: LiftStrategy;
  initialState: LiftSimulationInitialState;
  requests: LiftSimulationRequest[];
  logger: Logger;
}

export interface LiftSimulationInitialState {
  lifts: LiftSimulationLiftInitialState[];
}

export interface LiftSimulationLiftInitialState {
  floor: number;
}

const FLOOR_HEIGHT = 3;
const LIFT_SPEED = 5;
const LIFT_WAIT_SECONDS = 10;
const TICK_DURATION_SECONDS = 0.1;

export class LiftSimulation {
  elapsedSeconds: number = 0;
  totalPassengerTimeSeconds?: number;
  liftStrategy: LiftStrategy;
  requests: LiftSimulationRequest[];
  logger: Logger;
  lifts: Lift[];

  constructor({
    liftStrategy,
    initialState,
    requests,
    logger
  }: LiftSimulationOptions) {
    this.liftStrategy = liftStrategy;
    this.requests = [...requests];
    this.logger = logger;
    this.lifts = initialState.lifts.map((it, i) => new Lift(`${i}`, it.floor));
    this.lifts.forEach((lift) => {
      lift.tick();
      lift.events
        .addListener("stopAndFill", (evt) => this.stopAndFillListener(evt))
        .addListener("startMove", (evt) => this.startMoveListener(evt));
    });
  }

  start(): LiftSimulationResult {
    const lastFloorsByLift = new Map<Lift, number>();

    // eslint-disable-next-line no-constant-condition
    while (true) {
      for (const request of this.popRequests(this.elapsedSeconds)) {
        this.logger.logRequest(this.elapsedSeconds, request);
        this.liftStrategy.onRequest(this.lifts, request);
      }

      for (const lift of this.lifts) {
        if (lift.floor != null && lift.floor !== lastFloorsByLift.get(lift)) {
          this.liftStrategy.onFloor(lift, lift.floor);
          lastFloorsByLift.set(lift, lift.floor);
        }
      }

      if (this.isFinished()) {
        break;
      }

      for (const lift of this.lifts) {
        lift.tick();
      }

      this.incrementCounters();
    }

    return {
      totalPassengerTimeSeconds: this.totalPassengerTimeSeconds ?? 0
    };
  }

  private popRequests(time: number) {
    const popCount = this.requests.filter((it) =>
      isZeroish(it.timeSeconds - time)
    ).length;

    return this.requests.splice(0, popCount);
  }

  private isFinished() {
    return !this.requests.length && !this.lifts.some((lift) => lift.busy);
  }

  private incrementCounters() {
    this.elapsedSeconds += TICK_DURATION_SECONDS;

    if (this.lifts.some((lift) => lift.used)) {
      this.totalPassengerTimeSeconds =
        (this.totalPassengerTimeSeconds ?? 0) + TICK_DURATION_SECONDS;
    }
  }

  private stopAndFillListener(event: StopAndFillEvent) {
    this.logger.logStopAndFill(
      this.elapsedSeconds,
      event.lift,
      event.lift.floor!,
      event.waitSeconds
    );
  }

  private startMoveListener(event: StartMoveEvent) {
    this.logger.logStartMove(
      this.elapsedSeconds,
      event.lift,
      event.lift.floor!,
      event.intent.targetFloor
    );
  }
}

export interface LiftSimulationRequest {
  timeSeconds: number;
  fromFloor: number;
  toFloor: number;
}

export interface LiftSimulationResult {
  totalPassengerTimeSeconds: number;
}

export type Direction = -1 | 0 | 1;

export class Lift {
  name: string;
  floor?: number;
  y: number;
  direction: Direction = 0;
  requestedDirection: Direction = 0;
  intent?: Intent;
  waitSeconds: number = 0;
  ready: boolean = false;
  busy: boolean = false;
  used: boolean = false;
  events = new EventEmitter<LiftEvents>();

  get waiting() {
    return !isZeroish(this.waitSeconds);
  }

  constructor(name: string, floor: number) {
    this.name = name;
    this.floor = floor;
    this.y = this.floor * FLOOR_HEIGHT;
  }

  stopAndFill() {
    this.requestedDirection = 0;
    this.intent = undefined;
    this.direction = 0;
    this.waitSeconds = LIFT_WAIT_SECONDS;
    this.busy = false;
    this.used = true;
    this.events.emit("stopAndFill", {
      lift: this,
      waitSeconds: this.waitSeconds
    });
  }

  setDirection(direction: Direction, intent: Intent) {
    this.requestedDirection = direction;
    this.intent = intent;
    this.busy = true;
  }

  tick() {
    if (this.waiting) {
      this.waitSeconds -= TICK_DURATION_SECONDS;
      if (!this.waiting) {
        this.ready = true;
      }
      return;
    }

    if (this.requestedDirection !== 0 && this.ready) {
      this.ready = false;
      this.events.emit("startMove", { lift: this, intent: this.intent! });
    }

    this.direction = this.requestedDirection;
    this.y += this.direction * LIFT_SPEED * TICK_DURATION_SECONDS;

    this.floor = isZeroish(this.y % FLOOR_HEIGHT)
      ? Math.round(this.y / FLOOR_HEIGHT)
      : undefined;
  }
}

function isZeroish(fp: number) {
  return Math.abs(fp) < 0.0001;
}

export interface LiftStrategy {
  onRequest(lifts: Lift[], request: LiftSimulationRequest): void;
  onFloor(lift: Lift, floor: number): void;
}

type LiftEvents = {
  stopAndFill: StopAndFillEvent[];
  startMove: StartMoveEvent[];
};

interface LiftEvent {
  lift: Lift;
}

interface StopAndFillEvent extends LiftEvent {
  waitSeconds: number;
}

interface StartMoveEvent extends LiftEvent {
  intent: Intent;
}

export interface Intent {
  targetFloor: number;
}
