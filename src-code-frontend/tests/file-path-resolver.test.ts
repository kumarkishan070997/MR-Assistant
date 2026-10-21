import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { extractFilePath } from '../src/services/file-path-resolver';
import { AnchorChecklistDrawer } from '../src/components/drawers/checklist-drawer';
import { LineNote } from '../src/stores/notes.store';

describe('FilePathResolver', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('extracts file path from data-blob-path on closest .diff-file', () => {
    const diffFile = document.createElement('div');
    diffFile.className = 'diff-file file-holder';
    diffFile.setAttribute('data-blob-path', 'app/Console/Commands/FlagStaleOrders.php');

    const diffContent = document.createElement('div');
    diffContent.className = 'diff-content';

    const table = document.createElement('table');
    const tr = document.createElement('tr');
    tr.className = 'line_holder';
    const td = document.createElement('td');
    td.className = 'diff-line-num';
    td.setAttribute('data-linenumber', '19');

    tr.appendChild(td);
    table.appendChild(tr);
    diffContent.appendChild(table);
    diffFile.appendChild(diffContent);
    document.body.appendChild(diffFile);

    expect(extractFilePath(td)).toBe('app/Console/Commands/FlagStaleOrders.php');
    expect(extractFilePath(tr)).toBe('app/Console/Commands/FlagStaleOrders.php');
  });

  it('extracts file path from header link when inside .diff-content sibling', () => {
    const diffFile = document.createElement('div');
    diffFile.className = 'diff-file file-holder';

    const header = document.createElement('div');
    header.className = 'file-header diff-file-header';
    const link = document.createElement('a');
    link.className = 'file-title-name';
    link.textContent = 'app/Services/PaymentGateway.php';
    header.appendChild(link);

    const diffContent = document.createElement('div');
    diffContent.className = 'diff-content';
    const table = document.createElement('table');
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.textContent = '10';

    tr.appendChild(td);
    table.appendChild(tr);
    diffContent.appendChild(table);

    diffFile.appendChild(header);
    diffFile.appendChild(diffContent);
    document.body.appendChild(diffFile);

    expect(extractFilePath(td)).toBe('app/Services/PaymentGateway.php');
  });

  it('strips mode change and Git metadata from header text (e.g. 0 -> 100644)', () => {
    const diffFile = document.createElement('div');
    diffFile.className = 'diff-file file-holder';

    const header = document.createElement('div');
    header.className = 'file-header';
    header.textContent = 'v app/Console/Commands/FlagStaleOrders.php 0 -> 100644';

    const tr = document.createElement('tr');
    diffFile.appendChild(header);
    diffFile.appendChild(tr);
    document.body.appendChild(diffFile);

    expect(extractFilePath(tr)).toBe('app/Console/Commands/FlagStaleOrders.php');
  });

  it('extracts path on GitHub PR DOM structures', () => {
    const fileCard = document.createElement('div');
    fileCard.className = 'file';
    fileCard.setAttribute('data-file-path', 'src/components/ReviewDrawer.tsx');

    const tr = document.createElement('tr');
    tr.className = 'blob-code';
    fileCard.appendChild(tr);
    document.body.appendChild(fileCard);

    expect(extractFilePath(tr)).toBe('src/components/ReviewDrawer.tsx');
  });

  it('returns unknown_file when no context or file container exists', () => {
    const detachedEl = document.createElement('span');
    expect(extractFilePath(detachedEl)).toBe('unknown_file');
    expect(extractFilePath(null)).toBe('unknown_file');
  });

  it('auto-heals unknown_file notes in ChecklistDrawer.groupNotesByFile', () => {
    // Setup diff file with line 19 in DOM
    const diffFile = document.createElement('div');
    diffFile.className = 'diff-file file-holder';
    diffFile.setAttribute('data-blob-path', 'app/Console/Commands/FlagStaleOrders.php');

    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.setAttribute('data-linenumber', '19');
    tr.appendChild(td);
    diffFile.appendChild(tr);
    document.body.appendChild(diffFile);

    const drawer = new AnchorChecklistDrawer();

    const mockNote: LineNote = {
      id: 'gitlab_proj_1_unknown_file_19',
      platform: 'gitlab',
      projectPath: 'group/proj',
      pullNumber: '1',
      filePath: 'unknown_file',
      lineNumber: 19,
      content: 'Needs refactoring to avoid query in loop',
      isCollapsed: false,
      createdAt: 1000,
      updatedAt: 1000,
    };

    const grouped = drawer.groupNotesByFile([mockNote]);
    expect(grouped['app/Console/Commands/FlagStaleOrders.php']).toBeDefined();
    expect(grouped['unknown_file']).toBeUndefined();
    expect(grouped['app/Console/Commands/FlagStaleOrders.php'][0].filePath).toBe('app/Console/Commands/FlagStaleOrders.php');
  });
});
