export type GridFit = {
  columns: number
  rows: number
  /** Side of one square tile, in px. */
  tile: number
  /** Space between tiles, in px. */
  gap: number
}

/** Gap and outer padding as a share of the tile, so tiny strips keep their logos. */
export const GAP_RATIO = 0.1

/**
 * The column count that gives `count` square tiles the largest size inside
 * `width` × `height`: a wide, low box ends up as one row, a tall, narrow one
 * as one column. Padding around the grid is one gap on every side.
 * `cellHeight` is a cell's height per tile width (above 1 when a label sits
 * under the tile).
 */
export function fitGrid(
  count: number,
  width: number,
  height: number,
  cellHeight = 1,
): GridFit {
  if (count < 1 || width <= 0 || height <= 0)
    return { columns: 0, rows: 0, tile: 0, gap: 0 }
  let best: GridFit = { columns: 1, rows: count, tile: 0, gap: 0 }
  for (let columns = 1; columns <= count; columns++) {
    const rows = Math.ceil(count / columns)
    // n cells + (n - 1) gaps + 2 paddings = n cells + (n + 1) gaps
    const tile = Math.min(
      width / (columns + (columns + 1) * GAP_RATIO),
      height / (rows * cellHeight + (rows + 1) * GAP_RATIO),
    )
    if (tile > best.tile) best = { columns, rows, tile, gap: tile * GAP_RATIO }
  }
  return {
    ...best,
    tile: Math.floor(best.tile),
    gap: Math.floor(best.gap),
  }
}
