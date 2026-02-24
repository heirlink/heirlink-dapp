import { readFileSync } from "fs";
import path from "path";
import { docsNav } from "@/content/docs/config";

export { docsNav };

export function getDocContent(slug: string): string {
  const file = slug === "" ? "index" : slug;
  const filePath = path.join(process.cwd(), "src/content/docs", `${file}.md`);
  try {
    return readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}
