/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
class Search {
  constructor(db) {
    this._db = db;
  }
  /**
   *
   * @param {[{query,filterName}]} definitions
   * @returns
   */
  async filters(definitions) {
    //name is cumbersome
    let notes = [];
    await this._db.notes.init();
    console.log("search", definitions);
    let index = 0;
    for (let definition of definitions) {
      let _notes = await this.getFilteredNotes(
        definition,
        definition.filterName
      );
      let newNotes = [];
      for (let note of notes) {
        for (let _note of _notes) {
          if (JSON.stringify(note) == JSON.stringify(_note))
            newNotes.push(note);
        }
      }
      if (index > 0 && notes.length > 0) notes = [];
      if (index === 0) notes = _notes;
      notes.push(...newNotes);
      index++;
    }
    return notes;
  }

  //filtersearch, single filter search filter
  filter = async (filterName, query) => {
    const [_filterName, data] = await this.getFilterData(filterName);
    if (_filterName !== undefined && data !== undefined) {
      let result = await this._db.lookup[_filterName](data, query);
      return { result, data };
    } else {
      return { result: [], data: [] };
    }
  };

  async getFilteredNotes(definition, filterName) {
    let notes = [];
    filterName = filterName.trim();
    let result = await (await this.filter(filterName, definition.query)).result;
    console.log("beginSearch", definition, result);

    switch (filterName) {
      case "notebooks": {
        for (let notebook of result)
          for (let topic of notebook.topics) {
            for (let note of this._db.notebooks
              .notebook(topic.notebookId)
              .topics.topic(topic.id).all) {
              if (this._db.notes.note(note))
                notes.push(this._db.notes.note(note)._note);
            }
          }
        console.log("beginSearch notebook", notes);
        return notes;
      }
      case "notes": {
        console.log("beginSearch notes", notes);
        let allNotes = this._db.notes.all;
        let notes = await this._db.lookup["notes"](allNotes, definition.query);
        return notes;
      }
      case "topics": {
        for (let topic of result)
          for (let note of this._db.notebooks
            .notebook(topic.notebookId)
            .topics.topic(topic.id).all) {
            if (this._db.notes.note(note))
              notes.push(this._db.notes.note(note)._note);
          }
        console.log("beginSearch topic", notes);
        return notes;
      }
      case "tags": {
        for (let tag of result)
          for (let note of tag.noteIds) {
            if (this._db.notes.note(note))
              notes.push(this._db.notes.note(note)._note);
          }
        console.log("beginSearch tag", notes);
        return notes;
      }
      case "intitle": {
        let allNotes = this._db.notes.all;
        notes = this._db.lookup["_byTitle"](allNotes, definition.query);
        console.log("beginSearch intitle", notes);
        return notes;
      }
      case "before": {
        let unixTime = this.standardDate(definition.query).getTime();
        let _notes = this._db.notes.all;
        for (let note of _notes) {
          if (note.dateCreated < unixTime) {
            notes.push(note);
          }
        }
        return notes;
      }
      case "during": {
        let unixTime = this.standardDate(definition.query).getTime();
        let _notes = this._db.notes.all;
        console.log("beginSearch before", definition.query, unixTime, _notes);
        for (let note of _notes) {
          let dateCreated = new Date(note.dateCreated);
          let noteDate = this.dateFormat(dateCreated).DDMMYY;
          let selectedUnix = new Date(unixTime);
          let selectedDate = this.dateFormat(selectedUnix).DDMMYY;
          if (noteDate === selectedDate) {
            notes.push(note);
          }
        }
        console.log("beginSearch during", notes);
        return notes;
      }
      case "after": {
        let unixTime = this.standardDate(definition.query).getTime();
        let _notes = this._db.notes.all;
        console.log("beginSearch before", definition.value, unixTime, _notes);
        for (let note of _notes) {
          if (note.dateCreated > unixTime) {
            notes.push(note);
          }
        }
        console.log("beginSearch after", notes);
        return notes;
      }
      default:
        return notes;
    }
  }

  async getFilterData(filterName) {
    switch (filterName) {
      case "notes":
        await this._db.notes.init();
        return ["notes", this._db.notes.all];
      case "notebooks":
        return ["notebooks", this._db.notebooks.all];
      case "topics": {
        const notebooks = this._db.notebooks.all;
        if (!notebooks) return ["topics", []];

        let topics = [];
        for (let notebook of notebooks) {
          let _topics = this._db.notebooks.notebook(notebook.id).topics.all;
          if (_topics.length > 0)
            for (let _topic of _topics) topics.push(_topic);
        }
        return ["topics", topics];
      }
      case "tags":
        return ["tags", this._db.tags.all];
      case "trash":
        return ["trash", this._db.trash.all];
      case "_byTitle": {
        await this._db.notes.init();
        return ["notes", this._db.notes.all];
      }
      default:
        return [];
    }
  }

  dateFormat(date) {
    //this should be someplace else
    return {
      DDMMYY: date.getDate() + "/" + date.getMonth() + "/" + date.getFullYear()
    };
  }

  standardDate(date) {
    const [day, month, year] = date.split("/");
    return new Date(year, month - 1, day);
  }
}
export default Search;
