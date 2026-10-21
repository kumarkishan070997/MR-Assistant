---
name: create-lit-component
description: Procedure for creating Lit Web Components with Shadow DOM and constructable stylesheets.
---

# Creating a Lit Web Component in PR / MR Context Anchor

When creating an injected UI component (badge, scratchpad, floating trigger, or drawer):

## 1. Inherit from `AnchorBaseElement`
Always extend `AnchorBaseElement` from `src/components/base/anchor-element.ts`. This guarantees automatic attachment of `sharedExtensionSheet` via `shadowRoot.adoptedStyleSheets`.

```ts
import { html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { AnchorBaseElement } from '../base/anchor-element';

@customElement('anchor-example-badge')
export class AnchorExampleBadge extends AnchorBaseElement {
  @property({ type: Number }) count = 0;
  @state() private isOpen = false;

  static override styles = [
    css`
      :host {
        display: inline-flex;
        align-items: center;
      }
    `
  ];

  override render() {
    return html`
      <div class="px-2 py-0.5 rounded text-xs font-mono bg-blue-500/10 text-blue-600 border border-blue-500/20">
        Matches: ${this.count}
      </div>
    `;
  }
}
```

## 2. Event Delegation & Lifecycle
- Implement `disconnectedCallback()` to cleanly unsubscribe from stores or abort pending fetch requests:
  ```ts
  override disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubscribe?.();
  }
  ```
- Retarget custom events when communicating with parent components or host wrappers:
  ```ts
  this.dispatchEvent(new CustomEvent('anchor-action', {
    bubbles: true,
    composed: true, // Pierces Shadow DOM boundary
    detail: { line: this.line }
  }));
  ```
