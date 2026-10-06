import type {
  CharityItem,
  FundraiserItem,
} from '../../../lib/orpc/private/overlay/contract.ts'

// Static fixtures for the overlay editor previews (`?demo=1`). Never rendered
// on a live OBS URL unless the param is appended explicitly.
//
// Names/logos mirror the real Jingle Jam causes so the preview matches what the
// overlay shows once data is live. `raised`/`raisedFormatted` are illustrative
// GBP figures (dummy data ignores the selected currency).
export type CharitiesPreviewData = {
  userFundraiser: FundraiserItem | null
  charities: CharityItem[]
}

export type FundraisersPreviewData = {
  userFundraiser: FundraiserItem | null
  fundraisers: FundraiserItem[]
}

export const DEMO_USER_FUNDRAISER: FundraiserItem = {
  slug: 'mudkipninja',
  title: 'Mudkipninja',
  raisedFormatted: '£12,480.00',
  raised: 12480,
  imageUrl:
    'https://static-cdn.jtvnw.net/jtv_user_pictures/3432b4ae-f48c-4e95-a4f3-b697f6e50a18-profile_image-300x300.png',
  url: 'https://jinglejam.tiltify.com/',
}

export const DEMO_CHARITIES: CharitiesPreviewData = {
  userFundraiser: DEMO_USER_FUNDRAISER,
  charities: [
    {
      id: '46fb567a-6d11-462a-8945-cd85b39735a6',
      name: 'CALM',
      description:
        'Supporting their life-saving suicide prevention helpline and creating vital online resources for anyone struggling with life.',
      logoUrl:
        'https://assets.jinglejam.no1mann.com/jingle-jam-2026/causes/calm.webp',
      websiteUrl: 'https://www.thecalmzone.net/',
      raised: 1204318,
      raisedFormatted: '£1,204,318.00',
    },
    {
      id: 'a030eee8-edfc-4782-ade9-a883b46a317a',
      name: 'War Child',
      description:
        'Protecting, educating and advocating for children impacted by war worldwide, including in Lebanon, Gaza and Ukraine.',
      logoUrl:
        'https://assets.jinglejam.no1mann.com/jingle-jam-2026/causes/war-child.webp',
      websiteUrl: 'https://www.warchild.org.uk/',
      raised: 1047902,
      raisedFormatted: '£1,047,902.00',
    },
    {
      id: 'b25aeef5-0206-411e-9711-be7005b23722',
      name: 'SpecialEffect',
      description:
        'Supporting people with physical disabilities to access gaming through the innovative use of assistive technology.',
      logoUrl:
        'https://assets.jinglejam.no1mann.com/jingle-jam-2026/causes/specialeffect.webp',
      websiteUrl: 'https://www.specialeffect.org.uk/',
      raised: 892455,
      raisedFormatted: '£892,455.00',
    },
    {
      id: '8544df59-538f-4750-8352-1acb6cd27c1a',
      name: 'Make-A-Wish',
      description:
        "Granting life-changing wishes for children with critical illnesses, creating moments of hope, strength, and joy when they're needed most.",
      logoUrl:
        'https://assets.jinglejam.no1mann.com/jingle-jam-2026/causes/make-a-wish.webp',
      websiteUrl: 'https://worldwish.org/',
      raised: 815220,
      raisedFormatted: '£815,220.00',
    },
    {
      id: '8a1edcb6-d5d1-4b0a-a84c-38ebd4c7c191',
      name: 'The Trevor Project',
      description:
        'Providing 24/7 crisis intervention services to LGBTQ+ young people backed by research, education, advocacy, and peer support.',
      logoUrl:
        'https://assets.jinglejam.no1mann.com/jingle-jam-2026/causes/the-trevor-project.webp',
      websiteUrl: 'https://www.thetrevorproject.org/',
      raised: 640910,
      raisedFormatted: '£640,910.00',
    },
    {
      id: '4cf222bd-6fcd-4126-9b34-4aebc97a1957',
      name: 'WWF',
      description:
        'Leading the fight against climate change for a world where nature and wildlife can thrive for future generations.',
      logoUrl:
        'https://assets.jinglejam.no1mann.com/jingle-jam-2026/causes/wwf.webp',
      websiteUrl: 'https://www.wwf.org.uk/',
      raised: 523780,
      raisedFormatted: '£523,780.00',
    },
    {
      id: '1e060cf5-49e2-4887-b302-3a0a9b518b64',
      name: 'GOSH Charity',
      description:
        'Supporting the GOSH Play Team, who help make hospital a bit less hard and a lot more fun for seriously ill children.',
      logoUrl:
        'https://assets.jinglejam.no1mann.com/jingle-jam-2026/causes/gosh-charity.webp',
      websiteUrl: 'https://www.gosh.org/',
      raised: 412650,
      raisedFormatted: '£412,650.00',
    },
    {
      id: '1eab2296-cf54-4c47-8640-951795d5b76b',
      name: 'Become',
      description:
        'Helping care-experienced young people get the guidance, support, and community that everyone needs.',
      logoUrl:
        'https://assets.jinglejam.no1mann.com/jingle-jam-2026/causes/become.webp',
      websiteUrl: 'https://becomecharity.org.uk/',
      raised: 238940,
      raisedFormatted: '£238,940.00',
    },
  ],
}

export type TeamFundraisersPreviewData = {
  teamName: string
  userFundraiser: FundraiserItem | null
  fundraisers: FundraiserItem[]
}

export type CauseFundraisersPreviewData = {
  userFundraiser: FundraiserItem | null
  fundraisers: FundraiserItem[]
}

export const DEMO_FUNDRAISERS: FundraisersPreviewData = {
  userFundraiser: DEMO_USER_FUNDRAISER,
  fundraisers: [
    {
      slug: 'mudkipninja',
      title: 'Mudkipninja',
      raisedFormatted: '£12,480.00',
      raised: 12480,
      imageUrl:
        'https://static-cdn.jtvnw.net/jtv_user_pictures/3432b4ae-f48c-4e95-a4f3-b697f6e50a18-profile_image-300x300.png',
      url: 'https://jinglejam.tiltify.com/',
    },
    {
      slug: 'mousie',
      title: 'Mousie',
      raisedFormatted: '£9,315.00',
      raised: 9315,
      imageUrl:
        'https://static-cdn.jtvnw.net/jtv_user_pictures/2c3ead1b-d850-4d1d-a274-dcadbaabe17f-profile_image-300x300.png',
      url: 'https://jinglejam.tiltify.com/',
    },
    {
      slug: 'hrry',
      title: 'Hrry',
      raisedFormatted: '£7,890.00',
      raised: 7890,
      imageUrl:
        'https://static-cdn.jtvnw.net/jtv_user_pictures/b96b5bdb-7ae0-420e-b8ed-2410b14ed01e-profile_image-300x300.png',
      url: 'https://jinglejam.tiltify.com/',
    },
    {
      slug: 'chasedbyvoices',
      title: 'ChasedByVoices',
      raisedFormatted: '£5,640.00',
      raised: 5640,
      imageUrl:
        'https://static-cdn.jtvnw.net/jtv_user_pictures/0f4182b8-fe18-4fa8-ba2e-1e513573a10b-profile_image-300x300.png',
      url: 'https://jinglejam.tiltify.com/',
    },
    {
      slug: 'boba',
      title: 'Boba',
      raisedFormatted: '£3,205.00',
      raised: 3205,
      imageUrl:
        'https://static-cdn.jtvnw.net/jtv_user_pictures/e29551ad-15ef-4461-b709-220a8d374d3d-profile_image-300x300.png',
      url: 'https://jinglejam.tiltify.com/',
    },
  ],
}

// Fundraisers-by-team demo (same fundraiser set, plus a team name for the header).
export const DEMO_TEAM_FUNDRAISERS: TeamFundraisersPreviewData = {
  teamName: 'Yogscast',
  userFundraiser: DEMO_USER_FUNDRAISER,
  fundraisers: DEMO_FUNDRAISERS.fundraisers,
}

// Fundraisers-by-cause demo: CALM drives the cause header, shared fundraiser set below.
export const DEMO_CAUSE: CharityItem = DEMO_CHARITIES.charities[0]

export const DEMO_CAUSE_FUNDRAISERS: CauseFundraisersPreviewData = {
  userFundraiser: DEMO_USER_FUNDRAISER,
  fundraisers: DEMO_FUNDRAISERS.fundraisers,
}