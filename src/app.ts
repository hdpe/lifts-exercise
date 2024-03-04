import path from "node:path";
import { readFile } from "node:fs/promises";
import {
  LiftSimulation,
  LiftSimulationInitialState,
  LiftSimulationRequest
} from "./LiftSimulation.js";
import { NaiveLiftStrategy } from "./NaiveLiftStrategy.js";
import { Logger } from "./Logger.js";
import { DataSetParser } from "./DataSetParser.js";

const FLOOR_COUNT = 50;
const LIFT_COUNT = 5;

(async () => {
  try {
    const requests = await parseRequests();

    simulate(requests);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();

function simulate(requests: LiftSimulationRequest[]) {
  const simulation = new LiftSimulation({
    liftStrategy: new NaiveLiftStrategy(),
    initialState: newInitialState(),
    requests,
    logger: new Logger()
  });

  simulation.start();
}

async function parseRequests(): Promise<LiftSimulationRequest[]> {
  const csv = await readFile(path.resolve(__dirname, "dataSet.csv"), {
    encoding: "utf-8"
  });

  return new DataSetParser().parse(csv);
}

function newInitialState(): LiftSimulationInitialState {
  const lifts = [];
  for (let i = 0; i < LIFT_COUNT; i++) {
    lifts.push({ floor: randomFloor() });
  }
  return { lifts };
}

function randomFloor(): number {
  return Math.floor(Math.random() * (FLOOR_COUNT + 1));
}
