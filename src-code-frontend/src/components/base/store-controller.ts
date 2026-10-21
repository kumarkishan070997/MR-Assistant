import { ReactiveController, ReactiveControllerHost } from 'lit';
import { ReadableAtom } from 'nanostores';

/**
 * Lit ReactiveController integrating Nano Stores atoms with Lit components.
 * Automatically triggers host.requestUpdate() on store mutations and cleanly
 * unsubscribes when the component disconnects from the DOM.
 */
export class StoreController<T> implements ReactiveController {
  private unsubscribe?: () => void;
  public value: T;

  constructor(
    private host: ReactiveControllerHost,
    private store: ReadableAtom<T>
  ) {
    this.host.addController(this);
    this.value = this.store.get();
  }

  hostConnected() {
    this.unsubscribe = this.store.subscribe((nextValue) => {
      this.value = nextValue;
      this.host.requestUpdate();
    });
  }

  hostDisconnected() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = undefined;
    }
  }
}
