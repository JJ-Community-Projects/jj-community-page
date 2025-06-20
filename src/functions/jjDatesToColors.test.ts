import { test } from 'node:test';
import assert from 'node:assert';
import { DateTime } from "luxon";
import { jjDatesToColors, getStreamColor, getStreamColorTW, getStreamColors } from "./jjDatesToColors";
import { JJColors } from "../lib/JJColors";

// Test data: Create DateTime objects for December 1st for different years
// This will give us different weekdays for the start of Jingle Jam
const testDates = [
  { year: 2020, expectedWeekday: 2 }, // Tuesday
  { year: 2021, expectedWeekday: 3 }, // Wednesday
  { year: 2022, expectedWeekday: 4 }, // Thursday
  { year: 2023, expectedWeekday: 5 }, // Friday
  { year: 2024, expectedWeekday: 7 }, // Sunday
  { year: 2025, expectedWeekday: 1 }, // Monday
  { year: 2026, expectedWeekday: 2 }, // Tuesday
];

// Test dates for getStreamColors function
const streamColorTestDates = [
  DateTime.fromISO("2023-12-01T12:00:00"), // December 1st, 2023
  DateTime.fromISO("2023-12-02T18:30:00"), // December 2nd, 2023
  DateTime.fromISO("2023-12-03T20:00:00"), // December 3rd, 2023
  DateTime.fromISO("2024-12-01T12:00:00"), // December 1st, 2024 (different year)
];

// Create test streams for each day of a week in December 2023
const testYear = 2023;
const testStreams: DateTime[] = [];
for (let day = 1; day <= 7; day++) {
  testStreams.push(DateTime.fromObject({ year: testYear, month: 12, day }));
}

test('jjDatesToColors function maps weekdays to color indices correctly', async (t) => {
  for (const { year, expectedWeekday } of testDates) {
    await t.test(`Testing year ${year}`, () => {
      const jjStart = DateTime.fromObject({ year, month: 12, day: 1 });
      const actualWeekday = jjStart.weekday;

      // Verify the weekday is as expected
      assert.strictEqual(actualWeekday, expectedWeekday, `Expected weekday ${expectedWeekday}, but got ${actualWeekday}`);

      // Get the color mapping
      const colorMap = jjDatesToColors(jjStart);

      // Verify the mapping is correct
      // The day of Jingle Jam start should map to color index 0
      assert.strictEqual(colorMap[actualWeekday], 0, `Expected color index 0 for weekday ${actualWeekday}, but got ${colorMap[actualWeekday]}`);

      // Verify the next day maps to color index 1
      const nextDay = actualWeekday === 7 ? 1 : actualWeekday + 1;
      assert.strictEqual(colorMap[nextDay], 1, `Expected color index 1 for weekday ${nextDay}, but got ${colorMap[nextDay]}`);

      // Verify the previous day maps to color index 6
      const prevDay = actualWeekday === 1 ? 7 : actualWeekday - 1;
      assert.strictEqual(colorMap[prevDay], 6, `Expected color index 6 for weekday ${prevDay}, but got ${colorMap[prevDay]}`);

      // Verify all weekdays (1-7) are mapped to a color index (0-6)
      const weekdays = [1, 2, 3, 4, 5, 6, 7];
      const mappedIndices = weekdays.map(day => colorMap[day]);
      const expectedIndices = [0, 1, 2, 3, 4, 5, 6];

      // Sort the mapped indices to compare with expected indices
      const sortedIndices = [...mappedIndices].sort((a, b) => a - b);
      assert.deepStrictEqual(sortedIndices, expectedIndices, `Not all weekdays are mapped to color indices 0-6. Got: ${mappedIndices}`);
    });
  }
});

test('getStreamColor function returns valid hex colors', async (t) => {
  for (const streamStart of testStreams) {
    await t.test(`Testing stream on ${streamStart.toLocaleString(DateTime.DATE_FULL)}`, () => {
      // Get the color for the stream
      const color = getStreamColor(streamStart);

      // Verify the color is a valid hex color
      const isValidHexColor = /^#[0-9A-F]{6}$/i.test(color);
      assert.ok(isValidHexColor, `Expected a valid hex color, but got ${color}`);

      // Test with different shades
      const shades = ['100', '500', '900'];
      shades.forEach(shade => {
        const colorWithShade = getStreamColor(streamStart, shade);
        const isValidHexColorWithShade = /^#[0-9A-F]{6}$/i.test(colorWithShade);
        assert.ok(isValidHexColorWithShade, `Expected a valid hex color for shade ${shade}, but got ${colorWithShade}`);
      });
    });
  }
});

test('getStreamColorTW function returns valid Tailwind color classes', async (t) => {
  for (const streamStart of testStreams) {
    await t.test(`Testing stream on ${streamStart.toLocaleString(DateTime.DATE_FULL)}`, () => {
      // Get the Tailwind color class for the stream
      const colorClass = getStreamColorTW(streamStart);

      // Verify the color class follows the expected format
      const isValidColorClass = /^bg-day-[1-7]-\d+$/.test(colorClass);
      assert.ok(isValidColorClass, `Expected a valid Tailwind color class, but got ${colorClass}`);

      // Test with different shades
      const shades = ['100', '500', '900'];
      shades.forEach(shade => {
        const colorClassWithShade = getStreamColorTW(streamStart, shade);
        const isValidColorClassWithShade = /^bg-day-[1-7]-\d+$/.test(colorClassWithShade);
        assert.ok(isValidColorClassWithShade, `Expected a valid Tailwind color class for shade ${shade}, but got ${colorClassWithShade}`);
      });
    });
  }
});

test('getStreamColors function returns complete color palettes', async (t) => {
  for (const streamStart of testStreams) {
    await t.test(`Testing stream on ${streamStart.toLocaleString(DateTime.DATE_FULL)}`, () => {
      // Get the color palette for the stream
      const colorPalette = getStreamColors(streamStart);

      // Verify the color palette has the expected structure
      const expectedShades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
      const hasAllShades = expectedShades.every(shade => shade in colorPalette);
      assert.ok(hasAllShades, `Color palette is missing some shades. Expected: ${expectedShades}, Got: ${Object.keys(colorPalette)}`);

      // Verify all colors in the palette are valid hex colors
      const allColorsValid = Object.values(colorPalette).every(color => /^#[0-9A-F]{6}$/i.test(color as string));
      assert.ok(allColorsValid, "Some colors in the palette are not valid hex colors");
    });
  }
});

// Test specifically for 2025 (Monday start)
test('jjDatesToColors returns correct mapping for 2025', async (t) => {
  // Create a DateTime object for December 1st, 2025
  const jjStart2025 = DateTime.fromObject({ year: 2025, month: 12, day: 1 });

  // Verify it's a Monday (weekday 1)
  assert.strictEqual(jjStart2025.weekday, 1, `Expected December 1st, 2025 to be a Monday (weekday 1), but got ${jjStart2025.weekday} (${jjStart2025.weekdayLong})`);

  // Get the color mapping for 2025
  const colorMap2025 = jjDatesToColors(jjStart2025);

  // Expected mapping for 2025 (Monday start):
  // Monday (1) -> color index 0
  // Tuesday (2) -> color index 1
  // Wednesday (3) -> color index 2
  // Thursday (4) -> color index 3
  // Friday (5) -> color index 4
  // Saturday (6) -> color index 5
  // Sunday (7) -> color index 6
  const expectedMapping = {
    1: 0, // Monday -> color index 0
    2: 1, // Tuesday -> color index 1
    3: 2, // Wednesday -> color index 2
    4: 3, // Thursday -> color index 3
    5: 4, // Friday -> color index 4
    6: 5, // Saturday -> color index 5
    7: 6  // Sunday -> color index 6
  };

  // Check if the actual mapping matches the expected mapping
  for (let weekday = 1; weekday <= 7; weekday++) {
    const expected = expectedMapping[weekday];
    const actual = colorMap2025[weekday];

    assert.strictEqual(actual, expected, `Weekday ${weekday} (${DateTime.fromObject({ weekday }).weekdayLong}): Expected color index ${expected}, but got ${actual}`);
  }
});

// Test getStreamColors with multiple dates
test('getStreamColors returns correct color palettes for different dates', async (t) => {
  for (const date of streamColorTestDates) {
    await t.test(`Testing date: ${date.toLocaleString(DateTime.DATETIME_FULL)}`, () => {
      // Get the color palette for the date
      const colors = getStreamColors(date);

      // Verify the color palette has the expected structure
      const expectedShades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
      const hasAllShades = expectedShades.every(shade => shade in colors);
      assert.ok(hasAllShades, `Color palette is missing some shades. Expected: ${expectedShades}, Got: ${Object.keys(colors)}`);

      // Verify all colors in the palette are valid hex colors
      const allColorsValid = Object.values(colors).every(color => /^#[0-9A-F]{6}$/i.test(color as string));
      assert.ok(allColorsValid, "Some colors in the palette are not valid hex colors");

      // Verify specific shades
      const lightShade = colors["100"];
      const mediumShade = colors["500"];
      const darkShade = colors["900"];

      assert.ok(/^#[0-9A-F]{6}$/i.test(lightShade), `Expected a valid hex color for light shade (100), but got ${lightShade}`);
      assert.ok(/^#[0-9A-F]{6}$/i.test(mediumShade), `Expected a valid hex color for medium shade (500), but got ${mediumShade}`);
      assert.ok(/^#[0-9A-F]{6}$/i.test(darkShade), `Expected a valid hex color for dark shade (900), but got ${darkShade}`);
    });
  }
});
