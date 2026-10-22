// Infrastructure layer: Cosmos DB adapter for the DeviceModelRepo port
// All configuration arrives through Options and not from the environment here
import { CosmosClient } from '@azure/cosmos';
import type { Container } from '@azure/cosmos';
import { DefaultAzureCredential } from '@azure/identity';
import { createDeviceModel } from '../domain/device-model';
import type { DeviceModel } from '../domain/device-model';
import type { DeviceModelRepo } from '../domain/device-model-repo';

export type CosmosDeviceModelRepoOptions = {
  endpoint: string;
  database: string;
  container: string;
  /** Access key for local development (DefaultAzureCredential is used if omitted) */
  key?: string;
};

/** The shape stored in the Cosmos container, kept deliberately separate from the domain type */
type DeviceModelDocument = {
  id: string; // also the partition key (/id)
  brand: string;
  model: string;
  category: string;
};

const toDocument = (deviceModel: DeviceModel): DeviceModelDocument => ({
  id: deviceModel.id,
  brand: deviceModel.brand,
  model: deviceModel.model,
  category: deviceModel.category,
});

// Rebuilds through the factory so anything read from the database is re-validated
const toDomain = (doc: DeviceModelDocument): DeviceModel =>
  createDeviceModel({
    id: doc.id,
    brand: doc.brand,
    model: doc.model,
    category: doc.category,
  });

const hasStatusCode = (error: unknown, code: number): boolean =>
  typeof error === 'object' &&
  error !== null &&
  (error as { code?: unknown }).code === code;

export class CosmosDeviceModelRepo implements DeviceModelRepo {
  private readonly container: Container;

  constructor(options: CosmosDeviceModelRepoOptions) {
    const client = new CosmosClient(
      options.key
        ? { endpoint: options.endpoint, key: options.key }
        : { endpoint: options.endpoint, aadCredentials: new DefaultAzureCredential() },
    );
    this.container = client
      .database(options.database)
      .container(options.container);
  }

  async create(deviceModel: DeviceModel): Promise<void> {
    try {
      await this.container.items.create<DeviceModelDocument>(
        toDocument(deviceModel),
      );
    } catch (error) {
      if (hasStatusCode(error, 409)) {
        throw new Error(`Device model "${deviceModel.id}" already exists`);
      }
      throw error;
    }
  }

  async get(id: string): Promise<DeviceModel | undefined> {
    try {
      // The partition key is /id, so the partition key value is the id itself
      const { resource } = await this.container
        .item(id, id)
        .read<DeviceModelDocument>();
      return resource ? toDomain(resource) : undefined;
    } catch (error) {
      if (hasStatusCode(error, 404)) {
        return undefined;
      }
      throw error;
    }
  }

  async list(): Promise<DeviceModel[]> {
    const { resources } = await this.container.items
      .query<DeviceModelDocument>('SELECT c.id, c.brand, c.model, c.category FROM c')
      .fetchAll();
    return resources.map(toDomain);
  }
}