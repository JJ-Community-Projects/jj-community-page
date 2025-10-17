import { JSX } from 'solid-js'

export function interleaveComponents(
  children: JSX.Element[],
  headers: JSX.Element[],
  gap = 3,
): JSX.Element[] {
  const h = headers.length
  const x = h * gap * 3
  const newChildren = Array.from({ length: x }, () => children).flat()
  const result: JSX.Element[] = []

  let hi = 0
  for (let i = 0; i < x; i++) {
    if (i % gap === 0) {
      result.push(headers[hi])
      hi = (hi + 1) % h
    }
    result.push(newChildren[i])
  }

  return result
}

// Test-oriented variant mirroring interleaveComponents, using JSX elements directly
export function interleaveComponents2(
  children: JSX.Element[],
  headers: JSX.Element[],
  gap = 3,
): JSX.Element[] {
  const h = headers.length
  const x = h * gap * 3
  const newChildren = Array.from({ length: x }, () => children).flat()
  const result: JSX.Element[] = []

  let hi = 0
  for (let i = 0; i < x; i++) {
    if (i % gap === 0) {
      result.push(headers[hi])
      hi = (hi + 1) % h
    }
    result.push(newChildren[i])
  }

  return result
}
