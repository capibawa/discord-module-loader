import { readdirSync } from 'fs';
import { join } from 'path';
import glob from 'tiny-glob';

export async function getFiles(dir: string): Promise<any[]> {
  try {
    const items = await glob(`${dir}/**/*.{js,ts}`, { absolute: true });

    if (items.length === 0) {
      return [];
    }

    const files = await Promise.all(
      items.map(async (item) => {
        const module = await import(item);
        return module.default;
      }),
    );

    return files;
  } catch (err) {
    console.error(`Error while importing files from ${dir}`, err);

    return [];
  }
}

// This could be refactored as it's only being used to load default validations.
export async function getFilesFromPath(path: string): Promise<any[]> {
  try {
    const dirents = readdirSync(path, { withFileTypes: true });

    if (dirents.length === 0) {
      return [];
    }

    const items: string[] = [];

    for (const item of dirents) {
      const filePath = join(path, item.name);

      if (
        item.isFile() &&
        item.name !== 'index.js' &&
        item.name !== 'index.ts' &&
        (item.name.endsWith('.js') || item.name.endsWith('.ts')) &&
        !item.name.startsWith('.d.ts')
      ) {
        items.push(filePath);
      } else if (item.isDirectory()) {
        items.push(...(await getFilesFromPath(filePath)));
      }
    }

    const files = await Promise.all(
      items.map(async (item) => {
        const module = await import(item);
        return module.default;
      }),
    );

    return files;
  } catch (err) {
    console.error(`Error while importing files from ${path}`, err);

    return [];
  }
}
