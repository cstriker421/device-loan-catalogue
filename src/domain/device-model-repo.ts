import type { DeviceModel } from './device-model';

export interface DeviceModelRepo {
  create(deviceModel: DeviceModel): Promise<void>;
  get(id: string): Promise<DeviceModel | undefined>;
  /** Returns every stored device model in no particular order */
  list(): Promise<DeviceModel[]>;
}