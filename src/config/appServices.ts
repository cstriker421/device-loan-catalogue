// Composition root
// Everything is hard-wired except the Cosmos key, which comes from the env

import { CosmosDeviceModelRepo } from '../infra/cosmos-device-model-repo';
import type { DeviceModelRepo } from '../domain/device-model-repo';

let deviceModelRepo: DeviceModelRepo | undefined;

/** Lazy singleton */
export function getDeviceModelRepo(): DeviceModelRepo {
  if (!deviceModelRepo) {
    deviceModelRepo = new CosmosDeviceModelRepo({
      endpoint: 'https://deviceloan-dev-gdm-cosmos.documents.azure.com:443/',
      database: 'catalogue-db',
      container: 'device-models',
      key: process.env.COSMOS_KEY,
    });
  }
  return deviceModelRepo;
}