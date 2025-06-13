import { similarity } from './similarity';

// Test data
type TestItem = {
  id: number;
  name: string;
};

const testData: TestItem[] = [
  { id: 1, name: 'Apple' },
  { id: 2, name: 'Banana' },
  { id: 3, name: 'Orange' },
  { id: 4, name: 'Pineapple' },
  { id: 5, name: 'Strawberry' },
  { id: 6, name: 'Blueberry' },
  { id: 7, name: 'Blackberry' },
];

// Test function to extract the key
const getKey = (item: TestItem) => item.name;

// Test cases
console.log('Exact match:');
console.log(similarity('Apple', testData, getKey));

console.log('\nPartial match (contained in key):');
console.log(similarity('apple', testData, getKey));

console.log('\nPartial match (key contained in search):');
console.log(similarity('Pineapples are tasty', testData, getKey));

console.log('\nPartial substring match:');
console.log(similarity('berry', testData, getKey));

console.log('\nNo match:');
console.log(similarity('xyz', testData, getKey));

console.log('\nEmpty search term:');
console.log(similarity('', testData, getKey));

console.log('\nEmpty array:');
console.log(similarity('Apple', [], getKey));
