import { LitElement, css, CSSResultGroup } from 'lit';

// Shared Constructable Stylesheet instance for all extension ShadowRoots
export const sharedExtensionSheet = new CSSStyleSheet();

export class AnchorBaseElement extends LitElement {
  static override shadowRootOptions: ShadowRootInit = { mode: 'open' };

  static override styles: CSSResultGroup = [
    css`
      :host {
        display: block;
        box-sizing: border-box;
      }
      *, *::before, *::after {
        box-sizing: inherit;
      }
    `
  ];

  override connectedCallback() {
    super.connectedCallback();
    if (this.shadowRoot && !this.shadowRoot.adoptedStyleSheets.includes(sharedExtensionSheet)) {
      this.shadowRoot.adoptedStyleSheets = [
        sharedExtensionSheet,
        ...this.shadowRoot.adoptedStyleSheets
      ];
    }
  }
}
