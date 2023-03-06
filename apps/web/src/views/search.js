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

import { useEffect, useState } from "react";
import ListContainer from "../components/list-container";
import SearchPlaceholder from "../components/placeholders/search-placeholder";
import { db } from "../common/db";
import SearchBox from "../components/search";
import ProgressBar from "../components/progress-bar";
import { useStore as useNoteStore } from "../stores/note-store";
import { Text, Button, Flex } from "@theme-ui/components";

const filters = ["notes", "notebooks", "topics", "tags"];

function Search() {
  const [searchState, setSearchState] = useState({
    isSearching: false,
    totalItems: 0
  });
  const [results, setResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState();
  const context = useNoteStore((store) => store.context);
  const [searchItem, setSearchItem] = useState([]);

  useEffect(() => {}, []);

  const type = "notes";

  return (
    <>
      <Text variant="subtitle" mx={2}>
        Searching {type}
      </Text>
      <SearchBox
        onSearch={async (query) => {
          console.log("onSearch", query);
          if (typeof query === "object") {
            setResults(query);
            setSearchItem(query);
          } else {
            if (!query) return;

            let array = [];
            let totalItems = 0;
            for (let filter of filters) {
              const [lookupType, items] = await db.search.getFilterData(filter);
              totalItems = totalItems + items.length;
              setSearchState({ isSearching: true, totalItems: totalItems });
              const result = await db.lookup[lookupType](items, query);
              array.push(result);
            }
            setResults(array);
            let firstItem = getItem(array);
            setSearchItem(firstItem);
            setSelectedResult(array.indexOf(firstItem));
            setSearchState({ isSearching: false, totalItems: 0 });
          }
        }}
        // onChange={async (e) => {
        //   const { value } = e.target;
        //   if (!value.length) {
        //     return;
        //   }
        // }}
      />
      {searchState.isSearching ? (
        <Flex
          flex="1"
          justifyContent="center"
          alignItems="center"
          flexDirection="column"
        >
          <SearchPlaceholder
            text={`Searching in ${searchState.totalItems} ${type}...`}
          />
          <ProgressBar
            progress={100}
            width={"60%"}
            duration={3}
            sx={{ mt: 2 }}
          />
        </Flex>
      ) : (
        <>
          <Flex mx={2}>
            {results.map((result, index) =>
              result.length > 0 ? (
                <Button
                  variant="tertiary"
                  sx={{
                    borderColor:
                      index === selectedResult ? "primary" : undefined
                  }}
                  mr={1}
                  onClick={() => {
                    setSearchItem(result);
                    setSelectedResult(index);
                  }}
                >
                  {`${result[0].type}s`}
                </Button>
              ) : (
                []
              )
            )}
          </Flex>
          {searchItem.length > 0 ? (
            <SearchResults
              title={capitalizeFirstLetter(`${searchItem[0].type}s`)}
              context={context}
              type={`${searchItem[0].type}s`}
              results={searchItem}
            ></SearchResults>
          ) : (
            <Text variant="subtitle" mx={2}>
              {"No items to show"}
            </Text>
          )}
        </>
      )}
    </>
  );
}
export default Search;

function SearchResults(props) {
  return (
    <>
      <Text variant="subtitle" color={"primary"} mx={2}>
        {props.title}
      </Text>
      <ListContainer
        context={props.context}
        type={props.type}
        items={props.results}
        placeholder={SearchPlaceholder}
      />
    </>
  );
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function getItem(array) {
  let firstPopulatedItem = [];
  for (let item of array) {
    if (item.length > 0) {
      firstPopulatedItem = item;
      break;
    }
  }
  return firstPopulatedItem;
}
