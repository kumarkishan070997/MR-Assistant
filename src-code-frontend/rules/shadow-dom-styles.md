# Rule: Shadow DOM Isolation & Constructable Stylesheets

## Mandatory Rules

1. **Constructable Stylesheet Sharing:**
   - Never inject `<style>` tags with duplicate Tailwind stylesheets into individual shadow roots.
   - All Lit components must extend `AnchorBaseElement` and inherit `sharedExtensionSheet` via `shadowRoot.adoptedStyleSheets`.
   - Component-specific styles must be defined as static `css` tagged templates:
     ```ts
     static override styles = [css`
       :host { display: block; }
     `];
     ```

2. **Zero Host Style Leakage:**
   - Injected UI elements must not declare styles targeting host element tags without `:host` encapsulation.
   - Always verify that host CSS resets (e.g. `box-sizing: border-box`, typography rules) do not override internal extension layout.

3. **CSS Variable & Theme Inheritance:**
   - Host themes (GitHub light/dark/dimmed, GitLab light/dark) penetrate shadow boundaries via CSS custom properties.
   - Always use semantic extension variables (`--anchor-bg`, `--anchor-fg`, `--anchor-border`) mapped to host properties:
     ```css
     :host {
       --anchor-bg: var(--color-canvas-default, var(--gl-background-color-default, #ffffff));
       --anchor-fg: var(--color-fg-default, var(--gl-text-color-default, #1f2328));
       --anchor-border: var(--color-border-default, var(--gl-border-color-default, #d0d7de));
     }
     ```

4. **Table-Aware DOM Insertion:**
   - Never insert custom elements directly between `<tr>` tags in `<tbody>`.
   - Inline notes must be housed within a dedicated `<tr><td colspan="100%">` wrapper element.
