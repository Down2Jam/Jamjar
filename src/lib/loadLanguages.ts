import fs from "fs";
import path from "path";
import YAML from "yaml";

export function loadLanguages() {
  const filePath = path.join(process.cwd(), "src", "data", "languages.yaml");
  const file = fs.readFileSync(filePath, "utf8");
  return YAML.parse(file);
}
