import { type Component, JSX } from 'solid-js'
import { TickerHeader } from './TickerHeader'

export type Theme = 'default' | 'red' | 'blue'

// Prebuilt variants for common ticker headers, composed from the generic TickerHeader.
// Keep this file small and focused (< 200 LOC) and avoid external deps.

export type JJHeaderProps = {
  theme?: Theme
  logoUrl?: string
  // Allow overriding default labels if needed
  title?: string
  subtitle?: string
  children?: JSX.Element
}

export const JJHeader: Component<JJHeaderProps> = (p) => {
  return (
    <TickerHeader
      theme={p.theme}
      logoUrl={p.logoUrl}
      title={p.title ?? 'Jingle Jam'}
      subtitle={p.subtitle ?? 'Community'}
    >
      {p.children}
    </TickerHeader>
  )
}

export type CauseHeaderProps = {
  theme?: Theme
  logoUrl?: string
  name: string
  showRaised?: boolean
  // Optional custom raised text already formatted by caller
  raisedText?: string
  extra?: JSX.Element
}

export const CauseHeader: Component<CauseHeaderProps> = (p) => {
  return (
    <TickerHeader theme={p.theme} logoUrl={p.logoUrl} title={p.name}>
      {p.showRaised && p.raisedText ? (
        <p class="font-bold">{p.raisedText}</p>
      ) : null}
      {p.extra}
    </TickerHeader>
  )
}

export type TeamHeaderProps = {
  theme?: Theme
  logoUrl?: string
  teamName: string
  subtitle?: string
  extra?: JSX.Element
}

export const TeamHeader: Component<TeamHeaderProps> = (p) => {
  return (
    <TickerHeader
      theme={p.theme}
      logoUrl={p.logoUrl}
      title={p.teamName}
      subtitle={p.subtitle}
    >
      {p.extra}
    </TickerHeader>
  )
}

export type CustomHeaderProps = {
  theme?: Theme
  logoUrl?: string
  title?: string
  subtitle?: string
  children?: JSX.Element
}

export const CustomHeader: Component<CustomHeaderProps> = (p) => (
  <TickerHeader
    theme={p.theme}
    logoUrl={p.logoUrl}
    title={p.title}
    subtitle={p.subtitle}
  >
    {p.children}
  </TickerHeader>
) 
