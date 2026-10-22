// Seeds the catalogue through the repository port & safe to run more than once
import { getDeviceModelRepo } from '../config/appServices';
import { createDeviceModel } from '../domain/device-model';
import { deviceModelSeed } from './device-models';

async function main(): Promise<void> {
  if (!process.env.COSMOS_KEY) {
    console.error('COSMOS_KEY is not set in this shell. Export it, then run again.');
    process.exit(1);
  }

  const repo = getDeviceModelRepo();
  let created = 0;
  let skipped = 0;

  for (const input of deviceModelSeed) {
    const deviceModel = createDeviceModel(input); // validates the seed data too
    if (await repo.get(deviceModel.id)) {
      skipped++;
      continue;
    }
    await repo.create(deviceModel);
    created++;
  }

  console.log(`Seed complete: ${created} created, ${skipped} already present.`);
}

main().catch((error) => {
  console.error('Seed failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});