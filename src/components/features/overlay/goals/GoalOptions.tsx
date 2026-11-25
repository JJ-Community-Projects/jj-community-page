import type { Component } from 'solid-js'
import { Select } from '../../../ui/Select'
import { TextField } from '../../../ui/Form'
import type { GoalOrder, ShowCount } from './goalItems.ts'

const SHOW_OPTIONS = [
  'all',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
] as const
type ShowOption = (typeof SHOW_OPTIONS)[number]

export const ShowCountSelect: Component<{
  value: ShowCount
  onChange: (value: ShowCount) => void
}> = (p) => (
  <Select
    label="Shown at a time"
    showLabel
    options={[...SHOW_OPTIONS]}
    value={String(p.value) as ShowOption}
    onChange={(v) => p.onChange(v === 'all' ? 'all' : Number(v))}
    format={(v) => (v === 'all' ? 'All' : v)}
  />
)

export const OrderSelect: Component<{
  value: GoalOrder
  onChange: (value: GoalOrder) => void
}> = (p) => (
  <Select
    label="Order"
    showLabel
    options={['asc', 'desc'] as GoalOrder[]}
    value={p.value}
    onChange={p.onChange}
    format={(v) => (v === 'asc' ? 'Lowest first' : 'Highest first')}
  />
)

export const TitleField: Component<{
  value: string
  onChange: (value: string) => void
}> = (p) => (
  <TextField
    label="Title"
    value={p.value}
    onChange={p.onChange}
    maxLength={40}
    description="Leave empty for no title."
  />
)
