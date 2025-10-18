export interface Slot {
  id: string
  start: string
  duration: number
  title: string
  subtitle: string
  desc?: string
  markdownDesc?: string
  style: Style
  visible: boolean
  gridTileSize: number
  type: string
  streamType: string
  showYoutubeIcon: boolean
  showTwitchIcon: boolean
  showHighlightIcon: boolean
}


export interface Style {
  linearGradient?: LinearGradient
  background?: string
  border?: string
  elevation?: number
  borderRadius?: number
  spacing?: number
  gridSize?: number
}
export interface LinearGradient {
  colors: string[]
  begin: Begin
  end: End
}


export interface Begin {
  x: number
  y: number
}

export interface End {
  x: number
  y: number
}
