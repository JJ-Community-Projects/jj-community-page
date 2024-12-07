import {type BarSeriesOption, type EChartsOption} from "echarts";

export interface Stats {
  streams: StatsStream[]
  creators: {
    [key: string]: {
      appearance: number,
      minutes: number,
    }
  }
}

export interface StatsStream {
  title: string
  creators: string[]
  color: string
  start: string
  end: string
  yogs: number
  fundraiser: number
  total: number
  collections: number
  donations: number
  minutes: number
  yogs_per_minute: number
  fundraiser_per_minute: number,
  total_per_minute: number,
  collections_per_minute: number,
  donations_per_minute:number
  avg_donation_amount:number
}

declare type Values<T> = T[keyof T]
const _Series = () => {
  const b: EChartsOption = {}
  return b.series
}

const _V = () => {
  const b: BarSeriesOption = {}
  return b.data
}
const _VS = () => {
  const b: BarSeriesOption = {}
  return b!.data![0]
}

export type Series = ReturnType<typeof _Series>
type Data = ReturnType<typeof _V>
export type SingleData = ReturnType<typeof _VS>

export enum StatsValueType {
  Total = 'Total',
  TotalPerMinute = 'TotalPerMinute',
  Yogs = 'Yogs',
  YogsPerMinute = 'YogsPerMinute',
  Fundraiser = 'Fundraiser',
  FundraiserPerMinute = 'FundraiserPerMinute',
  Collections = 'Collections',
  CollectionsPerMinute = 'CollectionsPerMinute',
  Donations = 'Donations',
  DonationsPerMinute = 'DonationsPerMinute',
  AvgDonationAmount = 'AvgDonationAmount',
}

export interface StatsSettings {
  show2021: boolean
  show2022: boolean
  show2023: boolean
  onlyTop15: boolean
  order: 'date' | 'amount'
  value: StatsValueType
  showDay1: boolean
}

const _XAxis = () => {
  const b: EChartsOption = {}
  return b.xAxis
}
export type XAxis = ReturnType<typeof _XAxis>
