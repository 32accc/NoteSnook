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

import { useRef, useState, useEffect } from "react";
import * as Icon from "../icons";
import "./search.css";
import { SuggestionRow } from "./suggestionrow";
import { MainInput } from "./maininput";
import { hexToRGB } from "../../utils/color";
import { FilterInput } from "./filterinput";
import { Button, Flex } from "@theme-ui/components";
import { db } from "../../common/db";
import { filter, parse } from "liqe";

function SearchBox({ onSearch }) {
  let filterSuggestions = getSuggestionArray(Object.keys(Filters));

  const [suggestionsHover, setSuggestionsHover] = useState(false);
  const [suggestions, setSuggestions] = useState(filterSuggestions);
  const [selectionIndex, setSelectionIndex] = useState(-1);
  const [filters, setFilters] = useState([]);
  const [previousFocus, setPreviousFocus] = useState([]);

  const focusInput = (index) => {
    const cursorAtZero = getCursorPosition(document.activeElement) === 0;
    if (filters[index]) {
      document.getElementById(`inputId_${index}`).focus();
      if (cursorAtZero) moveCursorToEnd(index);
    } else {
      document.getElementById("general_input").focus();
    }
  };

  useEffect(() => {
    if (suggestions.length < 1) {
      setSelectionIndex(-1);
    } else {
      scrollRef.current.scrollTop =
        (scrollRef.current.scrollHeight / suggestions.length) *
        (selectionIndex - 1);
    }
  }, [suggestions, selectionIndex]);

  const scrollRef = useRef();
  const inputRef = useRef();
  const definitions = useRef([]);

  return (
    <Flex
      sx={{
        flexDirection: "column",
        mx: 2,
        mb: 2,
        position: "relative"
      }}
    >
      <Flex
        sx={{
          //flexDirection: "row",
          flexWrap: "wrap",
          //alignItems: "center",
          mt: 1,
          boxShadow: "0px 0px 0px 1px var(--border) inset",
          borderRadius: "default",
          ":disabled": {
            bg: "bgSecondary"
          },
          borderBottomLeftRadius: suggestions.length > 0 ? "0px" : "default",
          borderBottomRightRadius: suggestions.length > 0 ? "0px" : "default",
          ":hover:not(:focus)": {
            boxShadow: "0px 0px 0px 1.5px var(--primary) inset"
          },
          ":focus-within": {
            boxShadow: "0px 0px 0px 1.5px var(--primary) inset"
          },
          "::-webkit-scrollbar": { display: "none" },
          scrollbarWidth: "none",
          msOverflowStyle: "none"
        }}
      >
        {filters.map((item, index) => (
          <Flex
            key={"input_" + index}
            sx={{
              alignItems: "center",
              flexGrow: 0
            }}
          >
            <Button
              id={`label_${index}`}
              sx={{
                flexShrink: 0,
                bg: hexToRGB("#9E9E9E", 0.25),
                color: "text",
                display: "inline-block",
                ml: 2,
                textAlign: "center",
                py: "2.5px"
              }}
            >
              {item.label.filterName + ":"}
            </Button>
            <FilterInput
              moveSelection={moveSelection}
              getSuggestions={getSuggestions}
              focusInput={focusInput}
              index={index}
              item={item}
              setSuggestions={setSuggestions}
              setFilters={setFilters}
              filters={filters}
              searchDefinitions={definitions.current}
              onSearch={onSearch}
              setSelectionIndex={setSelectionIndex}
              selectionIndex={selectionIndex}
              suggestions={suggestions}
              inputRef={inputRef.current}
              onBlur={(e) => {
                if (!suggestionsHover) {
                  setSuggestions([]);
                }
              }}
              onFocus={(e) => {
                inputRef.current = e;
                setPreviousFocus([
                  previousFocus[1],
                  { id: e.target.id, index }
                ]);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  addDefinition(
                    filters,
                    definitions.current,
                    e.target.innerText
                  );
                  if (selectionIndex > -1)
                    e.target.innerText =
                      suggestions[selectionIndex].col1 +
                      suggestions[selectionIndex].col2;
                }
              }}
              open={filters[index].input.isCalenderOpen}
            />
          </Flex>
        ))}
        <Flex
          sx={{
            alignItems: "center",
            minWidth: "75px",
            flex: 1
          }}
        >
          <MainInput
            getSuggestions={getSuggestions}
            moveSelection={moveSelection}
            focusInput={focusInput}
            refreshFilters={addFilter}
            filters={filters}
            setFilters={setFilters}
            setSuggestions={setSuggestions}
            onSearch={onSearch}
            setSelectionIndex={setSelectionIndex}
            selectionIndex={selectionIndex}
            suggestions={suggestions}
            searchDefinitions={definitions.current}
            onBlur={() => {
              if (!suggestionsHover) {
                setSuggestions([]);
              }
            }}
            onFocus={(e) => {
              inputRef.current = e;
              setPreviousFocus([
                previousFocus[1],
                { id: e.target.id, undefined }
              ]);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (selectionIndex > -1)
                  e.target.value =
                    suggestions[selectionIndex].col1 +
                    suggestions[selectionIndex].col2;
              }
            }}
          />
          <Button
            onClick={async () => {
              if (filters.length > 0) {
                addDefinition(
                  filters,
                  definitions.current,
                  inputRef.current.target.innerText
                );
                let results = await db.search.filters(definitions.current);
                onSearch(results);
              } else {
                const maininputValue =
                  document.getElementById("general_input").value;
                onSearch(maininputValue);
              }
              //onEnter(maininputValue, filters, onSearch, filterDefinitions);
            }}
            type="button"
            variant="secondary"
            sx={{
              //minimizew styles
              flexShrink: 0,
              cursor: "pointer",
              px: "6px",
              mx: "3px",
              py: "6.5px",
              bg: "white",
              borderRadius: "default",
              ":hover": { bg: "border" },
              borderLeft: "1px solid #D3D3D3"
            }}
          >
            <Icon.Search size={20} />
          </Button>
        </Flex>
      </Flex>
      {suggestions.length ? (
        <Flex
          tabIndex={0}
          ref={scrollRef}
          flexDirection="column"
          onMouseOver={(e) => {
            setSuggestionsHover(true);
          }}
          onMouseLeave={(e) => {
            setSuggestionsHover(false);
          }}
          sx={{
            //try to minimize these styles
            flexDirection: "column",
            alignItems: "flex-start",
            position: "absolute",
            left: 0,
            top: "100%",
            right: 0,
            borderTop: "none",
            borderRadius: "0px 0px 5px 5px",
            boxShadow: "-1px 4px 10px 3px #00000022",
            zIndex: 2,
            height: 200,
            overflowX: "hidden",
            "::-webkit-scrollbar": { display: "none" },
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            ":focus": { outline: "none" }
          }}
          bg="background"
        >
          {suggestions.map((item, index) => (
            <SuggestionRow
              key={`suggestionItem_${index}`}
              index={index}
              item={item}
              bg={selectionIndex === index ? "hover" : "transparent"}
              onClick={() => {
                if (item.isFilterFocused) {
                  inputRef.current.target.innerText = item.col1;
                } else {
                  inputRef.current.target.value = item.col1 + item.col2;
                  addFilter(item.col1 + item.col2, setFilters);
                }
                inputRef.current.target.focus();
                setSuggestions([]);
              }}
            />
          ))}
        </Flex>
      ) : null}
    </Flex>
  );
}
export default SearchBox;

const moveCursorToEnd = (index) => {
  var el = document.getElementById(`inputId_${index}`);
  if (el.childNodes[0]) {
    var range = document.createRange();
    var sel = window.getSelection();
    range.setStart(el?.childNodes[0], el.childNodes[0].textContent.length);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }
};

const getCursorPosition = (editableDiv) => {
  //it is a general method, it should be somehwre else
  var caretPos = 0,
    sel,
    range;
  if (window.getSelection) {
    sel = window.getSelection();
    if (sel.rangeCount) {
      range = sel.getRangeAt(0);
      if (range.commonAncestorContainer.parentNode == editableDiv) {
        caretPos = range.endOffset;
      }
    }
  } else if (document.selection && document.selection.createRange) {
    range = document.selection.createRange();
    if (range.parentElement() == editableDiv) {
      var tempEl = document.createElement("span");
      editableDiv.insertBefore(tempEl, editableDiv.firstChild);
      var tempRange = range.duplicate();
      tempRange.moveToElementText(tempEl);
      tempRange.setEndPoint("EndToEnd", range);
      caretPos = tempRange.text.length;
    }
  }
  return caretPos;
};

const definitionTemplate = {
  filterName: undefined,
  query: "",
  srNo: -1
};

const addDefinition = (filters, definitions, query) => {
  //add definition and checkError are interwined.
  //They must be unmerged from eachother so that the code becomes clear
  for (let filter of filters) {
    let input = filter.input;
    if (!input.error) {
      let isArrayEmpty = false;
      for (let index = 0; index < definitions.length; index++) {
        if (definitions[index].srNo === input.id) {
          isArrayEmpty = true;
          definitionTemplate.filterName = input.filterName;
          definitionTemplate.query = query;
          definitionTemplate.srNo = input.id;
          definitions[index] = definitionTemplate; //make definition
        }
      }

      if (!isArrayEmpty) {
        definitionTemplate.filterName = input.filterName;
        definitionTemplate.query = query;
        definitionTemplate.srNo = input.id;
        definitions.push(definitionTemplate); //definition should be made here not gotten from somewhere else
      }
    }
  }
};

const addFilter = (searchQuery, setFilters) => {
  const isFilter = new RegExp("[a-z]+:").test(searchQuery);
  if (isFilter) {
    Object.keys(Filters).map((item) => {
      if (searchQuery.includes(item)) {
        rewriteMainInput(searchQuery, item);
        setFilters((_filters) => {
          return [..._filters, Filters[item](_filters.length)];
        });
      }
    });
  }
};

const rewriteMainInput = (query, searchTerm) => {
  let splitInputText = query.split(searchTerm);
  let remainingString = String(splitInputText[0]); //to be continued
  document.getElementById("general_input").value = remainingString;
};

const moveSelection = (suggestions, setSelectionIndex) => ({
  Up: () => {
    setSelectionIndex((i) => {
      if (suggestions.length > 0) {
        if (--i < 0) i = suggestions.length - 1;
        return i;
      } else {
        return -1;
      }
    });
  },
  Down: () => {
    setSelectionIndex((i) => {
      if (suggestions.length > 0) {
        if (++i >= suggestions.length) i = 0;
        return i;
      } else {
        return -1;
      }
    });
  }
});

const filterTemplate = (filterName, index = -1) => {
  return {
    label: { filterName: filterName },
    input: {
      filterName: filterName,
      isDateFilter: false,
      hasSuggestions: false,
      comments: "",
      date: { formatted: getCurrentDate() },
      isCalenderOpen: true,
      error: false,
      query: "",
      id: `inputId_${index}`
    }
  };
};

const Filters = {
  notebooks: (index) => {
    let filter = filterTemplate("notebooks", index);
    filter.input.hasSuggestions = true;
    return filter;
  },
  notes: (index) => {
    return filterTemplate(" notes", index);
  },
  tags: (index) => {
    let filter = filterTemplate("tags", index);
    filter.input.hasSuggestions = true;
    return filter;
  },
  topics: (index) => {
    let filter = filterTemplate("topics", index);
    filter.input.hasSuggestions = true;
    return filter;
  },
  intitle: (index) => {
    return filterTemplate("intitle", index);
  },
  before: (index) => {
    let filter = filterTemplate("before", index);
    filter.input.isDateFilter = true;
    return filter;
  },
  during: (index) => {
    let filter = filterTemplate("during", index);
    filter.input.isDateFilter = true;
    return filter;
  },
  after: (index) => {
    let filter = filterTemplate("after", index);
    filter.input.isDateFilter = true;
    return filter;
  }
};

function getCurrentDate() {
  let date = new Date();
  let currentDate = `${date.getDate()}/${
    date.getMonth() + 1
  }/${date.getFullYear()}`;
  return currentDate;
}

const getSuggestions = async (query, input, searchHistory) => {
  let suggestions = [];
  let dummy = [];
  if (input) {
    if (input.hasSuggestions) {
      let searchResults = await db.search.filter(input.filterName, query);
      let result = query === "" ? searchResults.data : searchResults.result;
      result.map((item, index) => {
        dummy[index] = item.title;
      });
    }
    suggestions = getSuggestionArray(dummy, undefined, true);
  } else {
    let searchSuggestions = getSuggestionArray(
      Object.keys(Filters),
      query,
      false
    );
    let historySuggestions = getSuggestionArray(
      filterItems(query, searchHistory)
    );

    dummy.push(...searchSuggestions);
    dummy.push(...historySuggestions);
    suggestions.push(...arrangeAlphabetically(dummy));
  }
  return suggestions;
};

export function filterItems(query, items) {
  //naming is wrong
  //this is fetch suggestions search
  try {
    return filter(
      parse(`text:"${query.toLowerCase()}"`),
      items.map((item) => {
        return { item, text: item.query };
      })
    ).map((v) => {
      return v.item.query;
    });
  } catch {
    return [];
  }
}

const arrangeAlphabetically = (array) => {
  //name can be shortened?
  array.sort(function (a, b) {
    var textA = a.col1.toUpperCase();
    var textB = b.col1.toUpperCase();
    return textA < textB ? -1 : textA > textB ? 1 : 0;
  });
  return array;
};

function getSuggestionArray(array, query = "", isFilterFocused = false) {
  //getSuggestionString, name is not right
  let suggestionArray = [];
  array.map((item) => {
    suggestionArray.push({
      col1: isFilterFocused ? item : item + ":",
      col2: getColumn2(isFilterFocused, item, query),
      isFilterFocused
    });
  });
  return suggestionArray;
}

function getColumn2(isFilterFocused, item, query) {
  if (isFilterFocused) return "";
  if (query === "") return Filters[item]().input.comments;
  return query;
}
