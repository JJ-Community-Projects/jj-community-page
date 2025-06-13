export function getTags() {
  // 2025 charities
  const charities = [
    'CALM',
    'War Child',
    'Autistica',
    'Become',
    'The Grand Appeal',
    'Make-A-Wish',
    'The Trevor Project',
    'WWF',
  ];

  const otherTags = [
    'Just Chatting',
    'Minecraft',
    'Multiplayer',
    'GMod',
    'OpenTTD',
    'Music',
    'Stocking Stuffers',
    'JJ Classics',
  ];

  return {
    tags: otherTags.map((str) => ({
      tag: str.toLowerCase(),
      label: str
    })),
    charityTags: charities.map((str) => ({
      tag: str.toLowerCase(),
      label: str,
    }))
  };
}
