import { describe, it, expect, beforeEach } from 'vitest';
import { isNoiseFile, collapseNoiseFiles } from '../src/services/noise-reducer.service';

describe('NoiseReducerService', () => {
  describe('isNoiseFile', () => {
    it('identifies package manager lockfiles as noise', () => {
      expect(isNoiseFile('package-lock.json')).toBe(true);
      expect(isNoiseFile('frontend/yarn.lock')).toBe(true);
      expect(isNoiseFile('pnpm-lock.yaml')).toBe(true);
      expect(isNoiseFile('composer.lock')).toBe(true);
      expect(isNoiseFile('Cargo.lock')).toBe(true);
      expect(isNoiseFile('go.sum')).toBe(true);
    });

    it('identifies generated files and schemas as noise', () => {
      expect(isNoiseFile('dist/bundle.min.js')).toBe(true);
      expect(isNoiseFile('styles/app.min.css')).toBe(true);
      expect(isNoiseFile('types/api.generated.ts')).toBe(true);
      expect(isNoiseFile('src/schema.json')).toBe(true);
      expect(isNoiseFile('api/v1/client.pb.go')).toBe(true);
    });

    it('identifies SVGs and translation bundles as noise', () => {
      expect(isNoiseFile('assets/icons/chevron-down.svg')).toBe(true);
      expect(isNoiseFile('src/locales/en-US.json')).toBe(true);
      expect(isNoiseFile('translations/fr.json')).toBe(true);
    });

    it('does NOT identify business logic files as noise', () => {
      expect(isNoiseFile('src/services/payment.service.ts')).toBe(false);
      expect(isNoiseFile('app/Models/Order.php')).toBe(false);
      expect(isNoiseFile('main.py')).toBe(false);
      expect(isNoiseFile('cmd/server/main.go')).toBe(false);
      expect(isNoiseFile('components/Button.tsx')).toBe(false);
    });
  });

  describe('collapseNoiseFiles DOM integration', () => {
    beforeEach(() => {
      document.body.innerHTML = '';
    });

    it('finds and clicks toggle buttons on GitHub noise file diffs', () => {
      document.body.innerHTML = `
        <div class="file" data-file-path="package-lock.json">
          <div class="file-header">
            <button class="js-diff-toggle-button" aria-expanded="true">Toggle</button>
          </div>
        </div>
        <div class="file" data-file-path="src/index.ts">
          <div class="file-header">
            <button class="js-diff-toggle-button" aria-expanded="true">Toggle</button>
          </div>
        </div>
      `;

      let clicked = false;
      const btn = document.querySelector('button.js-diff-toggle-button') as HTMLButtonElement;
      btn.addEventListener('click', () => {
        clicked = true;
        btn.setAttribute('aria-expanded', 'false');
      });

      const res = collapseNoiseFiles(document);
      expect(res.totalNoiseFiles).toBe(1);
      expect(res.collapsedCount).toBe(1);
      expect(clicked).toBe(true);
    });
  });
});
