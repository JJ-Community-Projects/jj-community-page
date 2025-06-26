import {type Component, Show} from "solid-js";

interface TagProps {
  label: string;
  tag?: string;
  variant?: 'default' | 'interactive' | 'charity' | 'selected';
  count?: number;
  onRemove?: () => void;
  onClick?: (e: Event) => void;
}

/**
 * Unified Tag component for consistent tag styling across the application
 * Supports different variants and interactive states
 */
export const TagPill: Component<TagProps> = (props) => {
  const baseClasses = "rounded-full px-2 py-1 text-sm inline-flex items-center";

  const variantClasses = () => {
    switch(props.variant) {
      case 'interactive':
        return "bg-accent-200 hover:bg-accent-300 text-white cursor-pointer transition-colors";
      case 'charity':
        return "bg-primary-200 hover:bg-primary-300 text-white cursor-pointer transition-colors";
      case 'selected':
        return "bg-accent/10 text-accent";
      default:
        return "bg-accent-100 text-accent-800";
    }
  };

  return (
    <div class={`${baseClasses} ${variantClasses()}`} onClick={props.onClick}>
      {props.label}
      <Show when={props.count !== undefined}>
        <span class="ml-1">({props.count})</span>
      </Show>
      <Show when={props.onRemove}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            props.onRemove?.();
          }}
          class="ml-1 text-current hover:text-accent-600"
          aria-label={`Remove tag ${props.label}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clip-rule="evenodd"/>
          </svg>
        </button>
      </Show>
    </div>
  );
};
