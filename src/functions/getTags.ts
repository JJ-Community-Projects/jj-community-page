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
    'Art',
    'Painting',
    '3D-Modeling',
    'Stocking Stuffers',
    'JJ Classics',
    'Speedrun',
    'First Jingle Jam',
    'Variety',
    'Community'
  ];

  return {
    tags: otherTags.map((str) => ({
      tag: str.toLowerCase().replace('\s','-'),
      label: str
    })),
    charityTags: charities.map((str) => ({
      tag: str.toLowerCase().replace('\s','-'),
      label: str,
    }))
  };
}
