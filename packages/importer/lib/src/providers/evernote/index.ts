import { Enex } from "@notesnook/enex";
import { IProvider, ProviderSettings } from "../provider";
import { ContentType, Note, Notebook } from "../../models/note";
import { ElementHandler } from "./elementhandlers";
import { File } from "../../utils/file";
import { path } from "../../utils/path";

export class Evernote implements IProvider {
  public supportedExtensions = [".enex"];
  public version = "1.0.0";
  public name = "Evernote";

  async process(files: File[], settings: ProviderSettings): Promise<Note[]> {
    const notes: Note[] = [];

    for (const file of files) {
      if (file.extension && !this.supportedExtensions.includes(file.extension))
        continue;

      const enex = new Enex(file.text);
      let notebook: Notebook | undefined;
      if (enex.isNotebook) {
        notebook = {
          notebook: path.basename(file.name),
          topic: "All notes",
        };
      }

      for (let enNote of enex.notes) {
        const note: Note = {
          title: enNote.title,
          tags: enNote.tags,
          dateCreated: enNote.created?.getTime(),
          dateEdited: enNote.updated?.getTime(),
          attachments: [],
          notebooks: notebook ? [notebook] : [],
        };

        const elementHandler = new ElementHandler(
          note,
          enNote,
          settings.hasher
        );
        const html = await enNote.content.toHtml(elementHandler);
        note.content = {
          data: html,
          type: ContentType.HTML,
        };
        notes.push(note);
      }
    }

    return notes;
  }
}
