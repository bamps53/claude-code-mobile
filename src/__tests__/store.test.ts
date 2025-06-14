/**
 * Test for utilities
 */

describe('Utility Tests', () => {
  it('should handle basic math', () => {
    expect(2 + 2).toBe(4);
  });

  it('should handle string operations', () => {
    const str = 'hello world';
    expect(str.toUpperCase()).toBe('HELLO WORLD');
  });
});
