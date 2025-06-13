import { createSlug } from './slug';

// Test cases
const testCases = [
  { input: 'Hello World', expected: 'hello-world' },
  { input: 'John Doe 123!', expected: 'john-doe-123' },
  { input: '  Spaces  Around  ', expected: 'spaces-around' },
  { input: 'Special@#$%Characters', expected: 'specialcharacters' },
  { input: 'Multiple---Hyphens', expected: 'multiple-hyphens' },
  { input: '-Leading-and-Trailing-', expected: 'leading-and-trailing' },
  { input: 'Ümlaut änd Ácçénts', expected: 'umlaut-and-accents' },
  { input: '', expected: '' },
  { input: '   ', expected: '' },
  { input: '123', expected: '123' },
];

// Run tests
console.log('Running createSlug tests:');
let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const result = createSlug(test.input);
  const success = result === test.expected;

  if (success) {
    passed++;
    console.log(`✅ Test ${index + 1} passed: "${test.input}" → "${result}"`);
  } else {
    failed++;
    console.error(`❌ Test ${index + 1} failed: "${test.input}" → "${result}" (expected "${test.expected}")`);
  }
});

console.log(`\nResults: ${passed} passed, ${failed} failed`);

// Note: In a real project, you would use a proper testing framework like Jest or Vitest
// This is a simple demonstration for the purpose of this task
