/**
 * Governance gate: every component under src/components/ui must ship a
 * sibling `{Component}.stories.tsx`. Exits non-zero listing offenders.
 */
import { readdirSync, statSync } from "node:fs";
import path from "node:path";

const UI_ROOT = path.join(import.meta.dirname, "..", "src", "components", "ui");
const COMPONENT_FILE = /^[A-Z][A-Za-z0-9]*\.tsx$/;

function collectComponents(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const fullPath = path.join(dir, entry);
    if (statSync(fullPath).isDirectory()) return collectComponents(fullPath);
    return COMPONENT_FILE.test(entry) ? [fullPath] : [];
  });
}

const missing = collectComponents(UI_ROOT).filter((file) => {
  const storyPath = file.replace(/\.tsx$/, ".stories.tsx");
  try {
    return !statSync(storyPath).isFile();
  } catch {
    return true;
  }
});

if (missing.length > 0) {
  console.error("Missing Storybook stories for UI components:");
  for (const file of missing) console.error(`  - ${path.relative(process.cwd(), file)}`);
  process.exit(1);
}

console.log("check-stories: every UI component has a story.");
