import { Evernote } from "./evernote";
import { Markdown } from "./md";
import { HTML } from "./html";
import { GoogleKeep } from "./keep";
import { IProvider } from "./provider";
import { Simplenote } from "./simplenote";

const providerMap = {
  evernote: Evernote,
  md: Markdown,
  html: HTML,
  txt: Markdown,
  keep: GoogleKeep,
  simplenote: Simplenote,
};
export type Providers = keyof typeof providerMap;

export class ProviderFactory {
  static getAvailableProviders(): string[] {
    return Object.keys(providerMap);
  }

  static getProvider(provider: Providers): IProvider {
    return new providerMap[provider]();
  }
}
