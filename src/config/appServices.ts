// Composition root AKA the only place that decides which adapters the app uses
// Cosmos settings come from env vars, so each env
// (dev on machine, test in Azure) can point at its own db

import { CosmosDeviceModelRepo } from '../infra/cosmos-device-model-repo';
import type { DeviceModelRepo } from '../domain/device-model-repo';

// Reads a required setting when it is needed (not at import time)
// The error names the var but never echoes any val
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`${name} must be set to a non-empty value.`);
  }
  return value.trim();
}

let deviceModelRepo: DeviceModelRepo | undefined;

/** Lazy singleton (built on first use then reused for every later call) */
export function getDeviceModelRepo(): DeviceModelRepo {
  if (!deviceModelRepo) {
    const endpoint = requireEnv('COSMOS_ENDPOINT');
    const database = requireEnv('COSMOS_DATABASE_ID');
    const container = requireEnv('COSMOS_CONTAINER_ID');

    deviceModelRepo = new CosmosDeviceModelRepo({
      endpoint,
      database,
      container,
      key: requireEnv('COSMOS_KEY'),
    });

    // One line saying which db this instance talks to (never logs the key)
    console.info(
      JSON.stringify({
        event: 'repo.created',
        cosmosHost: new URL(endpoint).host,
        database,
        container,
      }),
    );
  }
  return deviceModelRepo;
}