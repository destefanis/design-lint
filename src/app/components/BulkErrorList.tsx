import React, { useState } from "react";
import BulkErrorListItem from "./BulkErrorListItem";
import TotalErrorCount from "./TotalErrorCount";
import { AnimatePresence } from "framer-motion/dist/framer-motion";

function BulkErrorList(props) {
  const availableFilters = [
    "All",
    "fill",
    "text",
    "stroke",
    "radius",
    "shadow"
  ];

  const ignoredErrorsMap = {};
  props.ignoredErrorArray.forEach(ignoredError => {
    const nodeId = ignoredError.node.id;
    if (!ignoredErrorsMap[nodeId]) {
      ignoredErrorsMap[nodeId] = new Set();
    }
    ignoredErrorsMap[nodeId].add(ignoredError.value);
  });

  // Filter out ignored errors and create the bulk error list
  const bulkErrorMap = {};
  const filteredErrorArray = props.errorArray.filter(item => {
    const nodeId = item.id;
    const ignoredErrorValues = ignoredErrorsMap[nodeId] || new Set();
    item.errors = item.errors.filter(
      error => !ignoredErrorValues.has(error.value)
    );

    // Create the bulk error list
    item.errors.forEach(error => {
      // Create a unique key based on error properties
      const errorKey = `${error.type}_${error.message}_${error.value}`;
      if (bulkErrorMap[errorKey]) {
        // If the error already exists, update the nodes and count
        bulkErrorMap[errorKey].nodes.push(error.node.id);
        bulkErrorMap[errorKey].count++;
      } else {
        // If this is the first instance of this type of error, add it to the map
        error.nodes = [error.node.id];
        error.count = 1;
        bulkErrorMap[errorKey] = error;
      }
    });

    return item.errors.length >= 1;
  });

  // Convert the bulk error map to an array
  const bulkErrorList = Object.values(bulkErrorMap);

  bulkErrorList.sort((a, b) => b.count - a.count);

  function handleIgnoreChange(error) {
    props.onIgnoredUpdate(error);
  }

  function handleSelectAll(error) {
    parent.postMessage(
      {
        pluginMessage: {
          type: "select-multiple-layers",
          nodeArray: error.nodes
        }
      },
      "*"
    );
  }

  function handleSelect(error) {
    parent.postMessage(
      {
        pluginMessage: {
          type: "fetch-layer-data",
          id: error.node.id
        }
      },
      "*"
    );
  }

  function handleIgnoreAll(error) {
    let errorsToBeIgnored = [];

    filteredErrorArray.forEach(node => {
      node.errors.forEach(item => {
        if (item.value === error.value) {
          if (item.type === error.type) {
            errorsToBeIgnored.push(item);
          }
        }
      });
    });

    if (errorsToBeIgnored.length) {
      props.onIgnoreAll(errorsToBeIgnored);
    }
  }

  const [selectedFilters, setSelectedFilters] = useState(new Set(["All"]));

  const handleFilterClick = filter => {
    const newSelectedFilters = new Set(selectedFilters);
    if (filter === "All") {
      // If "All" is selected, clear other selections
      newSelectedFilters.clear();
      newSelectedFilters.add("All");
    } else {
      // Toggle the selected filter
      if (newSelectedFilters.has(filter)) {
        newSelectedFilters.delete(filter);
      } else {
        newSelectedFilters.add(filter);
      }
      // If no filters are selected, default to "All"
      if (newSelectedFilters.size === 0) {
        newSelectedFilters.add("All");
      } else {
        // If specific filters are selected, remove "All"
        newSelectedFilters.delete("All");
      }
    }
    setSelectedFilters(newSelectedFilters);
  };

  // const errorListItems = bulkErrorList.map((error, index) => (
  //   <BulkErrorListItem
  //     error={error}
  //     index={index}
  //     key={index}
  //     handleIgnoreChange={handleIgnoreChange}
  //     handleSelectAll={handleSelectAll}
  //     handleSelect={handleSelect}
  //     handleIgnoreAll={handleIgnoreAll}
  //   />
  // ));

  // const filteredErrorList = errorListItems.filter(item => {
  //   return selectedFilters.has('All') || selectedFilters.has(item.type);
  // });

  // Filter the bulkErrorList based on the selected filters
  const filteredErrorList = bulkErrorList.filter(error => {
    return selectedFilters.has("All") || selectedFilters.has(error.type);
  });

  // Map the filtered error list to BulkErrorListItem components
  const errorListItems = filteredErrorList.map((error, index) => (
    <BulkErrorListItem
      error={error}
      index={index}
      key={index}
      handleIgnoreChange={handleIgnoreChange}
      handleSelectAll={handleSelectAll}
      handleSelect={handleSelect}
      handleIgnoreAll={handleIgnoreAll}
    />
  ));

  return (
    <div className="bulk-errors-list">
      <div className="filter-pills">
        {availableFilters.map((filter, index) => (
          <>
            <button
              key={filter}
              className={`pill ${
                selectedFilters.has(filter) ? "selected" : ""
              }`}
              onClick={() => handleFilterClick(filter)}
            >
              {filter}
            </button>
            {/* Render the divider after the first filter */}
            {index === 0 && <span className="pill-divider">|</span>}
          </>
        ))}
      </div>
      <div className="panel-body panel-body-errors">
        {bulkErrorList.length ? (
          <ul className="errors-list">
            <AnimatePresence>{errorListItems}</AnimatePresence>
          </ul>
        ) : (
          <div className="success-message">
            <div className="success-shape">
              <img
                className="success-icon"
                src={require("../assets/smile.svg")}
              />
            </div>
            All errors fixed in the selection
          </div>
        )}
      </div>
      <div className="footer sticky-footer">
        <TotalErrorCount errorArray={filteredErrorArray} />
      </div>
    </div>
  );
}

export default BulkErrorList;
