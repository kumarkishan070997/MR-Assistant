import { describe, it, expect, beforeEach } from 'vitest';
import '../src/components/diff/peek-card';
import { AnchorPeekCard } from '../src/components/diff/peek-card';

describe('AnchorPeekCard (In-Diff Peek Window)', () => {
  let peekCard: AnchorPeekCard;

  beforeEach(() => {
    document.body.innerHTML = '';
    peekCard = document.createElement('anchor-peek-card') as AnchorPeekCard;
    document.body.appendChild(peekCard);
  });

  it('renders nothing when visible is false', async () => {
    peekCard.visible = false;
    peekCard.symbol = 'Order';
    await peekCard.updateComplete;

    const card = peekCard.shadowRoot?.querySelector('.peek-card');
    expect(card).toBeNull();
  });

  it('renders card with symbol and loading state when active', async () => {
    peekCard.visible = true;
    peekCard.symbol = 'Order';
    peekCard.loading = true;
    peekCard.x = 100;
    peekCard.y = 200;
    await peekCard.updateComplete;

    const card = peekCard.shadowRoot?.querySelector('.peek-card');
    expect(card).not.toBeNull();

    const title = peekCard.shadowRoot?.querySelector('.peek-title');
    expect(title?.textContent).toContain('Order');

    const loading = peekCard.shadowRoot?.querySelector('.loading-state');
    expect(loading).not.toBeNull();
    expect(loading?.textContent).toContain('Searching');
  });

  it('renders matching caller references correctly', async () => {
    peekCard.visible = true;
    peekCard.symbol = 'Order';
    peekCard.loading = false;
    peekCard.results = {
      symbol: 'Order',
      totalMatches: 2,
      matches: [
        {
          filePath: 'app/Http/Controllers/OrderController.php',
          lineNumber: 45,
          codeSnippet: 'Order::where("status", "pending")->get();',
          matchUrl: 'https://gitlab.com/org/repo/-/blob/main/app/Http/Controllers/OrderController.php#L45',
        },
      ],
    };
    await peekCard.updateComplete;

    const items = peekCard.shadowRoot?.querySelectorAll('.match-item');
    expect(items?.length).toBe(1);

    const file = items?.[0].querySelector('.match-file');
    expect(file?.textContent).toContain('OrderController.php:45');

    const snippet = items?.[0].querySelector('.match-snippet');
    expect(snippet?.textContent).toContain('Order::where');
  });

  it('closes when close button is clicked', async () => {
    peekCard.visible = true;
    peekCard.symbol = 'Order';
    await peekCard.updateComplete;

    const closeBtn = peekCard.shadowRoot?.querySelector('.peek-close') as HTMLButtonElement;
    closeBtn.click();
    await peekCard.updateComplete;

    expect(peekCard.visible).toBe(false);
  });
});
