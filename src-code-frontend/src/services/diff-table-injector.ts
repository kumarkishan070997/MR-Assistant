import { ReviewContext } from '../adapters/base.adapter';
import { buildNoteKey, $activeNotes } from '../stores/notes.store';
import '../components/diff/scratchpad-row';
import { AnchorScratchpad } from '../components/diff/scratchpad-row';
import { extractFilePath } from './file-path-resolver';

export class DiffTableInjector {
  /**
   * Injects or ensures the presence of a table-safe scratchpad row directly
   * below the target diff line row.
   */
  public static injectScratchpadRow(
    targetRow: HTMLTableRowElement,
    context: ReviewContext,
    filePath: string,
    lineNumber: number,
    initialContent = ''
  ): HTMLTableRowElement {
    const effectiveFilePath = (filePath && filePath !== 'unknown_file') ? filePath : extractFilePath(targetRow);
    const nextRow = targetRow.nextElementSibling;
    const noteId = buildNoteKey(
      context.platform,
      context.projectPath,
      context.pullNumber,
      effectiveFilePath,
      lineNumber
    );

    // If already exists, toggle or make visible
    if (nextRow && nextRow.classList.contains('anchor-scratchpad-row')) {
      const existingRow = nextRow as HTMLTableRowElement;
      existingRow.style.display = existingRow.style.display === 'none' ? 'table-row' : 'none';
      return existingRow;
    }

    const scratchpadRow = document.createElement('tr');
    scratchpadRow.className = 'anchor-scratchpad-row';
    scratchpadRow.setAttribute('data-note-id', noteId);

    const cell = document.createElement('td');
    cell.colSpan = 100;
    cell.style.padding = '0';
    cell.style.border = 'none';
    cell.style.background = 'transparent';

    const scratchpad = document.createElement('anchor-scratchpad') as AnchorScratchpad;
    scratchpad.noteId = noteId;
    scratchpad.platform = context.platform;
    scratchpad.projectPath = context.projectPath;
    scratchpad.pullNumber = context.pullNumber;
    scratchpad.filePath = effectiveFilePath;
    scratchpad.lineNumber = lineNumber;
    scratchpad.initialContent = initialContent;

    cell.appendChild(scratchpad);
    scratchpadRow.appendChild(cell);

    targetRow.after(scratchpadRow);

    scratchpadRow.addEventListener('anchor-delete-note', () => {
      scratchpadRow.remove();
      DiffTableInjector.updatePinActiveState(targetRow, false);
    });

    DiffTableInjector.updatePinActiveState(targetRow, true);
    return scratchpadRow;
  }

  /**
   * Injects the hoverable pin icon into a diff line number cell.
   */
  public static injectPinButton(
    lineNumCell: HTMLElement,
    targetRow: HTMLTableRowElement,
    context: ReviewContext,
    filePath: string,
    lineNumber: number
  ): HTMLElement {
    if (lineNumCell.querySelector('.anchor-pin-btn')) {
      return lineNumCell.querySelector('.anchor-pin-btn') as HTMLElement;
    }

    const effectiveFilePath = (filePath && filePath !== 'unknown_file') ? filePath : extractFilePath(targetRow);
    const noteId = buildNoteKey(
      context.platform,
      context.projectPath,
      context.pullNumber,
      effectiveFilePath,
      lineNumber
    );

    const hasActiveNote = Boolean($activeNotes.get()[noteId]);

    const pinBtn = document.createElement('button');
    pinBtn.type = 'button';
    pinBtn.className = `anchor-pin-btn ${hasActiveNote ? 'has-note' : ''}`;
    pinBtn.title = hasActiveNote ? 'Open private note' : 'Add private line note';
    pinBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
        <path d="M9.828.722a.5.5 0 0 1 .354.146l4.95 4.95a.5.5 0 0 1 0 .707c-.48.48-1.072.588-1.503.588-.177 0-.335-.018-.46-.039l-3.13 3.13c.015.44-.087 1.05-.543 1.506a.5.5 0 0 1-.707 0L5.353 8.283 1.939 11.7a.5.5 0 0 1-.707 0l-.708-.707a.5.5 0 0 1 0-.708L3.938 6.87 1.408 4.34a.5.5 0 0 1 0-.707c.456-.456 1.066-.558 1.506-.543l3.13-3.13C6.023.085 6.005.027 6.005 0c0-.43.108-1.024.588-1.504a.5.5 0 0 1 .707 0l2.528 2.226zM7.28 2.457a3.02 3.02 0 0 0-.27 1.157c-.026.544.152 1.07.531 1.45l3.424 3.424c.38.38.906.557 1.45.531.428-.02.825-.113 1.157-.27L8.85 3.978 7.28 2.457z"/>
      </svg>
    `;

    pinBtn.style.cssText = `
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      margin-left: 3px;
      background: transparent;
      border: none;
      cursor: pointer;
      color: ${hasActiveNote ? '#0969da' : '#656d76'};
      opacity: ${hasActiveNote ? '1' : '0.75'};
      transition: opacity 0.15s ease, color 0.15s ease, transform 0.15s ease;
      vertical-align: middle;
      padding: 0;
    `;

    pinBtn.addEventListener('mouseenter', () => {
      pinBtn.style.opacity = '1';
      pinBtn.style.color = '#0969da';
      pinBtn.style.transform = 'scale(1.2)';
    });

    pinBtn.addEventListener('mouseleave', () => {
      pinBtn.style.transform = 'scale(1)';
      if (!pinBtn.classList.contains('has-note')) {
        pinBtn.style.opacity = '0.75';
        pinBtn.style.color = '#656d76';
      }
    });

    targetRow.addEventListener('mouseenter', () => {
      if (!pinBtn.classList.contains('has-note')) {
        pinBtn.style.opacity = '1';
        pinBtn.style.color = '#0969da';
      }
    });

    targetRow.addEventListener('mouseleave', () => {
      if (!pinBtn.classList.contains('has-note')) {
        pinBtn.style.opacity = '0.75';
        pinBtn.style.color = '#656d76';
      }
    });

    pinBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      DiffTableInjector.injectScratchpadRow(targetRow, context, effectiveFilePath, lineNumber);
    });

    lineNumCell.appendChild(pinBtn);
    return pinBtn;
  }

  public static updatePinActiveState(targetRow: HTMLTableRowElement, hasNote: boolean) {
    const pin = targetRow.querySelector('.anchor-pin-btn') as HTMLElement | null;
    if (pin) {
      if (hasNote) {
        pin.classList.add('has-note');
        pin.style.color = '#0969da';
        pin.style.opacity = '1';
      } else {
        pin.classList.remove('has-note');
        pin.style.color = '#8c959f';
        pin.style.opacity = '0.4';
      }
    }
  }
}
