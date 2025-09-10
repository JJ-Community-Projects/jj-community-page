export const getDayBackgroundColor = (day: number) => {
  switch (day) {
    case 0:
      return 'bg-day-1-50'
    case 1:
      return 'bg-day-2-50'
    case 2:
      return 'bg-day-3-50'
    case 3:
      return 'bg-day-4-50'
    case 4:
      return 'bg-day-5-50'
    case 5:
      return 'bg-day-6-50'
    case 6:
      return 'bg-day-7-50'
    default:
      return 'bg-white'
  }
};
