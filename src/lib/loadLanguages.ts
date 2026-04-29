import YAML from "yaml";
import languagesFile from "@/data/languages.yaml?raw";

export function loadLanguages() {
  return YAML.parse(languagesFile);
}
