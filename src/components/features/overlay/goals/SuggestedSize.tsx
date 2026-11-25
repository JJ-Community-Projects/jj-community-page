import type { Component } from 'solid-js'
import { fieldClass } from '../../../ui/Form'
import type { OverlaySize } from '../overview/formats.ts'

export const SuggestedSize: Component<{ size: OverlaySize }> = (p) => (
  <div class="flex flex-col gap-1 sm:col-span-2">
    <span class={fieldClass.label}>
      Suggested browser source size: about {p.size.width}×{p.size.height}
    </span>
    <p class={fieldClass.help}>
      This is only an estimate from your items and options, and the preview uses
      it. Try different sizes in OBS to find what fits your layout best.
    </p>
  </div>
)
