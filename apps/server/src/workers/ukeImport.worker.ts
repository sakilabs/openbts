import { workerData, parentPort } from "node:worker_threads";

if (!parentPort) throw new Error("This file must be run as a worker thread");

const task = workerData?.task as string;

let didComplete = false;

const originalLog = console.log;
console.log = (...args: unknown[]) => {
  originalLog(...args);
  const message = args.join(" ");
  if (message.includes("Import completed successfully")) didComplete = true;
};

try {
  switch (task) {
    case "importStations": {
      const { importStations } = await import("@openbts/uke-importer/stations");
      await importStations();
      break;
    }
    case "importRadiolines": {
      const { importRadiolines } = await import("@openbts/uke-importer/radiolines");
      await importRadiolines();
      break;
    }
    case "importPermitDevices": {
      const { importPermitDevices } = await import("@openbts/uke-importer/device-registry");
      await importPermitDevices();
      break;
    }
    default:
      throw new Error(`Unknown task: ${task}`);
  }

  parentPort.postMessage({ success: true, result: didComplete });
} catch (e) {
  parentPort.postMessage({ success: false, error: e instanceof Error ? e.message : String(e) });
}
