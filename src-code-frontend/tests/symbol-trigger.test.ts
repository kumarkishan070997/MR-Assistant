import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../src/components/diff/symbol-trigger';
import { AnchorSymbolTrigger } from '../src/components/diff/symbol-trigger';

describe('AnchorSymbolTrigger (Floating Diff Toolbar)', () => {
  let trigger: AnchorSymbolTrigger;

  beforeEach(() => {
    document.body.innerHTML = '';
    trigger = document.createElement('anchor-symbol-trigger') as AnchorSymbolTrigger;
    document.body.appendChild(trigger);
  });

  it('renders nothing when visible is false', async () => {
    trigger.visible = false;
    trigger.symbol = 'Order';
    await trigger.updateComplete;

    const toolbar = trigger.shadowRoot?.querySelector('.floating-toolbar');
    expect(toolbar).toBeNull();
  });

  it('renders toolbar with Ask AI, Suggestion, and Note when visible', async () => {
    trigger.visible = true;
    trigger.symbol = 'Order';
    trigger.selectedText = 'Order::where';
    trigger.lineNumber = 18;
    trigger.filePath = 'app/Order.php';
    await trigger.updateComplete;

    const toolbar = trigger.shadowRoot?.querySelector('.floating-toolbar');
    expect(toolbar).not.toBeNull();

    const findBtn = trigger.shadowRoot?.querySelector('.find-btn');
    expect(findBtn).not.toBeNull();
    expect(findBtn?.textContent).toContain('Order');

    const aiBtn = trigger.shadowRoot?.querySelector('.ai-btn');
    expect(aiBtn).not.toBeNull();
    expect(aiBtn?.textContent).toContain('Ask AI');

    const suggestionBtn = trigger.shadowRoot?.querySelector('.suggestion-btn');
    expect(suggestionBtn).not.toBeNull();
    expect(suggestionBtn?.textContent).toContain('Suggestion');

    const noteBtn = trigger.shadowRoot?.querySelector('.note-btn');
    expect(noteBtn).not.toBeNull();
    expect(noteBtn?.textContent).toContain('Note');
  });

  it('dispatches anchor-symbol-lookup when Find button is clicked', async () => {
    trigger.visible = true;
    trigger.symbol = 'Order';
    await trigger.updateComplete;

    const listener = vi.fn();
    trigger.addEventListener('anchor-symbol-lookup', listener);

    const findBtn = trigger.shadowRoot?.querySelector('.find-btn') as HTMLButtonElement;
    findBtn.click();

    expect(listener).toHaveBeenCalledTimes(1);
    const event = listener.mock.calls[0][0] as CustomEvent;
    expect(event.detail.symbol).toBe('Order');
  });

  it('dispatches anchor-trigger-suggestion with line number and code snippet', async () => {
    trigger.visible = true;
    trigger.symbol = 'Order';
    trigger.selectedText = 'Order::where("id", 1)';
    trigger.lineNumber = 24;
    trigger.filePath = 'app/Services/OrderService.php';
    await trigger.updateComplete;

    const listener = vi.fn();
    trigger.addEventListener('anchor-trigger-suggestion', listener);

    const suggestionBtn = trigger.shadowRoot?.querySelector('.suggestion-btn') as HTMLButtonElement;
    suggestionBtn.click();

    expect(listener).toHaveBeenCalledTimes(1);
    const event = listener.mock.calls[0][0] as CustomEvent;
    expect(event.detail.selectedText).toBe('Order::where("id", 1)');
    expect(event.detail.lineNumber).toBe(24);
    expect(event.detail.filePath).toBe('app/Services/OrderService.php');
  });

  it('dispatches anchor-trigger-ai when an action is selected from AI dropdown', async () => {
    trigger.visible = true;
    trigger.selectedText = 'return $user->orders();';
    trigger.lineNumber = 10;
    trigger.filePath = 'app/Models/User.php';
    await trigger.updateComplete;

    const listener = vi.fn();
    trigger.addEventListener('anchor-trigger-ai', listener);

    // Open AI dropdown
    const aiBtn = trigger.shadowRoot?.querySelector('.ai-btn') as HTMLButtonElement;
    aiBtn.click();
    await trigger.updateComplete;

    const dropdown = trigger.shadowRoot?.querySelector('.ai-dropdown');
    expect(dropdown).not.toBeNull();

    // Click "Spot Bugs & Issues"
    const items = trigger.shadowRoot?.querySelectorAll('.ai-dropdown-item');
    expect(items?.length).toBeGreaterThan(0);
    const spotBugsBtn = items?.[0] as HTMLButtonElement;
    spotBugsBtn.click();

    expect(listener).toHaveBeenCalledTimes(1);
    const event = listener.mock.calls[0][0] as CustomEvent;
    expect(event.detail.action).toBe('spot_bugs');
    expect(event.detail.selectedText).toBe('return $user->orders();');
    expect(event.detail.lineNumber).toBe(10);
  });
});
