import { readFileSync } from 'fs';
import path from 'path';

import { expect, type Locator } from '@playwright/test';

const image = readFileSync(path.join(__dirname, '../fixtures/files/small-15x15.jpg'));

/** A real local image under an attempt-chosen name, for genuine uploads through the product. */
export const imageFile = (name: string) => ({ name, mimeType: 'image/jpeg', buffer: image });

/** Drops local files onto a drag-and-drop zone, as a user dragging them from their file manager. */
export async function dropFiles(zone: Locator, files: Array<ReturnType<typeof imageFile>>) {
  const dataTransfer = await zone.page().evaluateHandle(
    payload => {
      const transfer = new DataTransfer();
      for (const file of payload) {
        const bytes = Uint8Array.from(atob(file.content), character => character.charCodeAt(0));
        transfer.items.add(new File([bytes], file.name, { type: file.mimeType }));
      }
      return transfer;
    },
    files.map(file => ({ name: file.name, mimeType: file.mimeType, content: file.buffer.toString('base64') })),
  );
  await zone.dispatchEvent('drop', { dataTransfer });
  await dataTransfer.dispose();
}

/**
 * The preview of an upload must point at the file the API stored. A frontend
 * built without `DISABLE_MOCK_UPLOADS=1` swaps local uploads for placeholder
 * images and never sends the file.
 */
export async function expectStoredUpload(preview: Locator) {
  await expect(
    preview,
    'The upload was mocked: build the frontend with DISABLE_MOCK_UPLOADS=1 (see docs/e2e.md)',
  ).toHaveAttribute('href', /\/api\/files\//);
}
