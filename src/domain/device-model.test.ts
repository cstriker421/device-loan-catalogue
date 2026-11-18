import { describe, it, expect } from 'vitest';
import {
  createDeviceModel,
  DEVICE_CATEGORIES,
  DeviceModelValidationError,
  type DeviceModelInput,
} from './device-model';

const validInput: DeviceModelInput = {
  id: 'dm-001',
  brand: 'Dell',
  model: 'XPS 13',
  category: 'laptop',
};

/** Runs the factory and returns the validation error it throws (fails the test if it doesn't throw). */
function validationErrorFor(input: DeviceModelInput): DeviceModelValidationError {
  try {
    createDeviceModel(input);
  } catch (error) {
    expect(error).toBeInstanceOf(DeviceModelValidationError);
    return error as DeviceModelValidationError;
  }
  throw new Error('Expected createDeviceModel to throw, but it did not');
}

describe('createDeviceModel', () => {
  describe('valid input', () => {
    it('should create a device model from valid input', () => {
      expect(createDeviceModel(validInput)).toEqual(validInput);
    });

    it.each(DEVICE_CATEGORIES)('should accept the "%s" category', (category) => {
      expect(createDeviceModel({ ...validInput, category }).category).toBe(category);
    });

    it('should trim surrounding whitespace from brand and model', () => {
      const result = createDeviceModel({ ...validInput, brand: '  Dell  ', model: '  XPS 13 ' });
      expect(result.brand).toBe('Dell');
      expect(result.model).toBe('XPS 13');
    });

    it('should return an immutable object', () => {
      const result = createDeviceModel(validInput);
      expect(Object.isFrozen(result)).toBe(true);
    });

    it('should accept values exactly at the length limits', () => {
      const result = createDeviceModel({
        id: 'a'.repeat(64),
        brand: 'b'.repeat(50),
        model: 'm'.repeat(100),
        category: 'other',
      });
      expect(result.id).toHaveLength(64);
      expect(result.brand).toHaveLength(50);
      expect(result.model).toHaveLength(100);
    });
  });

  describe('id rules', () => {
    it.each([
      ['empty', ''],
      ['too long (65 characters)', 'a'.repeat(65)],
      ['containing a space', 'dm 001'],
      ['containing a slash', 'dm/001'],
    ])('should reject an id that is %s', (_label, id) => {
      const error = validationErrorFor({ ...validInput, id });
      expect(error.issues).toHaveLength(1);
      expect(error.issues[0]).toContain('id');
    });

    it('should reject an id that is not a string', () => {
      const error = validationErrorFor({ ...validInput, id: 42 as unknown as string });
      expect(error.issues[0]).toContain('id');
    });
  });

  describe('brand and model rules', () => {
    it.each([
      ['empty', ''],
      ['only whitespace', '   '],
      ['too long (51 characters)', 'b'.repeat(51)],
    ])('should reject a brand that is %s', (_label, brand) => {
      const error = validationErrorFor({ ...validInput, brand });
      expect(error.issues).toEqual(['brand is required (1-50 characters)']);
    });

    it.each([
      ['empty', ''],
      ['only whitespace', '   '],
      ['too long (101 characters)', 'm'.repeat(101)],
    ])('should reject a model that is %s', (_label, model) => {
      const error = validationErrorFor({ ...validInput, model });
      expect(error.issues).toEqual(['model is required (1-100 characters)']);
    });
  });

  describe('category rules', () => {
    it.each([['empty', ''], ['unknown', 'toaster'], ['wrong case', 'Laptop']])(
      'should reject a category that is %s',
      (_label, category) => {
        const error = validationErrorFor({ ...validInput, category });
        expect(error.issues).toHaveLength(1);
        expect(error.issues[0]).toContain('category must be one of');
      },
    );
  });

  describe('error reporting', () => {
    it('should report every problem at once, not just the first', () => {
      const error = validationErrorFor({ id: '', brand: '', model: '', category: 'toaster' });
      expect(error.issues).toHaveLength(4);
    });

    it('should expose a named error whose message lists the issues', () => {
      const error = validationErrorFor({ ...validInput, brand: '' });
      expect(error.name).toBe('DeviceModelValidationError');
      expect(error.message).toBe('Invalid device model: brand is required (1-50 characters)');
    });
  });
});
