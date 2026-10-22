export const DEVICE_CATEGORIES = [
  'laptop',
  'tablet',
  'phone',
  'camera',
  'headphones',
  'other',
] as const;

export type DeviceCategory = (typeof DEVICE_CATEGORIES)[number];

/** The kind of device the campus can lend (ie "Dell XPS 13") */
export type DeviceModel = Readonly<{
  id: string;
  brand: string;
  model: string;
  category: DeviceCategory;
}>;

/** What callers hand to the factory */
export type DeviceModelInput = {
  id: string;
  brand: string;
  model: string;
  category: string;
};

/** When input breaks a domain rule -- `issues` lists every problem found */
export class DeviceModelValidationError extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(`Invalid device model: ${issues.join('; ')}`);
    this.name = 'DeviceModelValidationError';
    this.issues = issues;
  }
}

const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

const isText = (value: unknown, maxLength: number): value is string =>
  typeof value === 'string' &&
  value.trim().length > 0 &&
  value.trim().length <= maxLength;

/** Validates the input and returns an immutable DeviceModel */
export function createDeviceModel(input: DeviceModelInput): DeviceModel {
  const issues: string[] = [];

  if (typeof input.id !== 'string' || !ID_PATTERN.test(input.id)) {
    issues.push('id is required: 1-64 characters, letters, digits, "-" or "_"');
  }
  if (!isText(input.brand, 50)) {
    issues.push('brand is required (1-50 characters)');
  }
  if (!isText(input.model, 100)) {
    issues.push('model is required (1-100 characters)');
  }
  if (!DEVICE_CATEGORIES.includes(input.category as DeviceCategory)) {
    issues.push(`category must be one of: ${DEVICE_CATEGORIES.join(', ')}`);
  }

  if (issues.length > 0) {
    throw new DeviceModelValidationError(issues);
  }

  return Object.freeze({
    id: input.id,
    brand: input.brand.trim(),
    model: input.model.trim(),
    category: input.category as DeviceCategory,
  });
}
