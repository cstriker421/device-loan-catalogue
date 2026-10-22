// Application layer: coordinates the port and applies simple policy. No SDKs, no I/O of its own
import type { DeviceModel } from '../domain/device-model';
import type { DeviceModelRepo } from '../domain/device-model-repo';

export type ListDeviceModelsDeps = {
  repo: DeviceModelRepo;
};

/** Returns all device models ordered by brand and then model name */
export async function listDeviceModels({
  repo,
}: ListDeviceModelsDeps): Promise<DeviceModel[]> {
  const deviceModels = await repo.list();
  return [...deviceModels].sort(
    (a, b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model),
  );
}