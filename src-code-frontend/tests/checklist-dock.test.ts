import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../src/components/drawers/checklist-dock';
import { AnchorChecklistDock } from '../src/components/drawers/checklist-dock';

describe('AnchorChecklistDock (Draggable Floating Dock)', () => {
  let dock: AnchorChecklistDock;

  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    dock = document.createElement('anchor-checklist-dock') as AnchorChecklistDock;
    document.body.appendChild(dock);
  });

  it('renders dock pill with brand emblem, notes count, review button, and drag grip', async () => {
    await dock.updateComplete;

    const pill = dock.shadowRoot?.querySelector('.dock-pill');
    expect(pill).not.toBeNull();

    const title = dock.shadowRoot?.querySelector('.brand-title');
    expect(title?.textContent).toBe('PeerPilot');

    const grip = dock.shadowRoot?.querySelector('.drag-grip');
    expect(grip).not.toBeNull();

    const reviewBadge = dock.shadowRoot?.querySelector('.badge-ai-review');
    expect(reviewBadge).not.toBeNull();
    expect(reviewBadge?.textContent).toContain('Review PR');
  });

  it('dispatches anchor-toggle-checklist when clicked normally without drag', async () => {
    await dock.updateComplete;

    const listener = vi.fn();
    dock.addEventListener('anchor-toggle-checklist', listener);

    const pill = dock.shadowRoot?.querySelector('.dock-pill') as HTMLElement;
    pill.click();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].detail).toEqual({ initialTab: 'notes' });
  });

  it('dispatches anchor-toggle-checklist with initialTab ai-review when Review PR is clicked', async () => {
    await dock.updateComplete;

    const listener = vi.fn();
    dock.addEventListener('anchor-toggle-checklist', listener);

    const reviewBadge = dock.shadowRoot?.querySelector('.badge-ai-review') as HTMLElement;
    reviewBadge.click();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].detail).toEqual({ initialTab: 'ai-review' });
  });

  it('restores saved dock position from localStorage if valid', async () => {
    localStorage.setItem('peerpilot_dock_position', JSON.stringify({ x: 120, y: 240 }));

    const newDock = document.createElement('anchor-checklist-dock') as AnchorChecklistDock;
    document.body.appendChild(newDock);
    await newDock.updateComplete;

    expect(newDock.style.left).toBe('120px');
    expect(newDock.style.top).toBe('240px');
  });

  it('updates position during drag and saves to localStorage', async () => {
    await dock.updateComplete;

    const pill = dock.shadowRoot?.querySelector('.dock-pill') as HTMLElement;
    pill.setPointerCapture = vi.fn();
    pill.releasePointerCapture = vi.fn();

    // Mock getBoundingClientRect
    vi.spyOn(dock, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      top: 200,
      width: 250,
      height: 40,
      right: 350,
      bottom: 240,
      x: 100,
      y: 200,
      toJSON: () => {},
    });

    // 1. Pointer Down
    pill.dispatchEvent(
      new PointerEvent('pointerdown', {
        button: 0,
        clientX: 120,
        clientY: 210,
        pointerId: 1,
        bubbles: true,
      })
    );

    // 2. Pointer Move (move by 50px right, 30px down)
    pill.dispatchEvent(
      new PointerEvent('pointermove', {
        clientX: 170,
        clientY: 240,
        pointerId: 1,
        bubbles: true,
      })
    );

    expect(parseFloat(dock.style.left)).toBe(150);
    expect(parseFloat(dock.style.top)).toBe(230);

    // 3. Pointer Up
    pill.dispatchEvent(
      new PointerEvent('pointerup', {
        clientX: 170,
        clientY: 240,
        pointerId: 1,
        bubbles: true,
      })
    );

    const saved = localStorage.getItem('peerpilot_dock_position');
    expect(saved).not.toBeNull();
    const parsed = JSON.parse(saved!);
    expect(parsed.x).toBe(150);
    expect(parsed.y).toBe(230);
  });
});
