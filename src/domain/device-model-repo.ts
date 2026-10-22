import type { DeviceModel } from './device-model';

export interface DeviceModelRepo {
  create(deviceModel: DeviceModel): Promise<void>;
  get(id: string): Promise<DeviceModel | undefined>;
}