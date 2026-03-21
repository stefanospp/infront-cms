import { describe, it, expect } from 'vitest';
import { ContactSchema } from '../../packages/utils/src/validation';

describe('ContactSchema', () => {
  it('rejects empty name', () => {
    const result = ContactSchema.safeParse({
      name: '',
      email: 'test@example.com',
      message: 'This is a valid test message.',
      honeypot: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = ContactSchema.safeParse({
      name: 'John Doe',
      email: 'not-an-email',
      message: 'This is a valid test message.',
      honeypot: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-empty honeypot', () => {
    const result = ContactSchema.safeParse({
      name: 'John Doe',
      email: 'test@example.com',
      message: 'This is a valid test message.',
      honeypot: 'https://spam.com',
    });
    expect(result.success).toBe(false);
  });

  it('rejects message under 10 chars', () => {
    const result = ContactSchema.safeParse({
      name: 'John Doe',
      email: 'test@example.com',
      message: 'Short',
      honeypot: '',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid submission', () => {
    const result = ContactSchema.safeParse({
      name: 'John Doe',
      email: 'test@example.com',
      message: 'This is a valid test message.',
      honeypot: '',
    });
    expect(result.success).toBe(true);
  });
});
