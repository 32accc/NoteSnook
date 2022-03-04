import { Evernote } from "./evernote";
import { Markdown } from "./md";
import { HTML } from "./html";
import { GoogleKeep } from "./keep";
import { Simplenote } from "./simplenote";
import { OneNote } from "./onenote";

const providerMap = {
  evernote: Evernote,
  md: Markdown,
  html: HTML,
  keep: GoogleKeep,
  simplenote: Simplenote,
  onenote: OneNote,
};

type ProvidersMap = {
  evernote: Evernote;
  md: Markdown;
  html: HTML;
  keep: GoogleKeep;
  simplenote: Simplenote;
  onenote: OneNote;
};

export type Providers = keyof ProvidersMap;

export class ProviderFactory {
  static getAvailableProviders(): string[] {
    return Object.keys(providerMap);
  }

  static getProvider<TProvider extends Providers>(
    provider: TProvider
  ): ProvidersMap[TProvider] {
    const Provider = <unknown>new providerMap[provider]();
    return <ProvidersMap[TProvider]>Provider;
  }
}
