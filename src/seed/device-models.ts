import type { DeviceModelInput } from '../domain/device-model';

/** Sample catalogue data with fixed IDs for local development */
export const deviceModelSeed: DeviceModelInput[] = [
  { id: 'dm-001', brand: 'Dell', model: 'XPS 13', category: 'laptop' },
  { id: 'dm-002', brand: 'Apple', model: 'MacBook Air 13', category: 'laptop' },
  { id: 'dm-003', brand: 'Lenovo', model: 'ThinkPad T14', category: 'laptop' },
  { id: 'dm-004', brand: 'Apple', model: 'iPad 10th Generation', category: 'tablet' },
  { id: 'dm-005', brand: 'Samsung', model: 'Galaxy Tab S9', category: 'tablet' },
  { id: 'dm-006', brand: 'Google', model: 'Pixel 8', category: 'phone' },
  { id: 'dm-007', brand: 'Canon', model: 'EOS R50', category: 'camera' },
  { id: 'dm-008', brand: 'Sony', model: 'WH-1000XM5', category: 'headphones' },
];