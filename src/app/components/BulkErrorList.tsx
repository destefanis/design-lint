import React, { useState } from "react";
import BulkErrorListItem from "./BulkErrorListItem";
import TotalErrorCount from "./TotalErrorCount";
import { AnimatePresence, motion } from "framer-motion/dist/framer-motion";
import PreloaderCSS from "./PreloaderCSS";

function BulkErrorList(props) {
  const availableFilters = [
    "All",
    "text",
    "fill",
    "stroke",
    "radius",
    "effects"
  ];

  const ignoredErrorsMap = {};
  props.ignoredErrorArray.forEach(ignoredError => {
    const nodeId = ignoredError.node.id;
    if (!ignoredErrorsMap[nodeId]) {
      ignoredErrorsMap[nodeId] = new Set();
    }
    ignoredErrorsMap[nodeId].add(ignoredError.value);
  });

  // Filter out ignored errors
  const filteredErrorArray = props.errorArray.filter(item => {
    const nodeId = item.id;
    const ignoredErrorValues = ignoredErrorsMap[nodeId] || new Set();
    item.errors = item.errors.filter(
      error => !ignoredErrorValues.has(error.value)
    );
    return item.errors.length >= 1;
  });

  const createBulkErrorList = (errorArray, ignoredErrorsMap) => {
    const bulkErrorMap = {};
    errorArray.forEach(item => {
      const nodeId = item.id;
      const ignoredErrorValues = ignoredErrorsMap[nodeId] || new Set();
      item.errors = item.errors.filter(
        error => !ignoredErrorValues.has(error.value)
      );

      item.errors.forEach(error => {
        // Check if the error.matches exists and has content
        const hasMatches = error.matches && error.matches.length > 0;
        const hasSuggestions = error.matches && error.matches.length > 0;

        // Create a unique key based on error properties and whether it's a match
        const errorKey = `${error.type}_${error.message}_${error.value}_${hasSuggestions}_${hasMatches}`;
        if (bulkErrorMap[errorKey]) {
          bulkErrorMap[errorKey].nodes.push(error.node.id);
          bulkErrorMap[errorKey].count++;
        } else {
          error.nodes = [error.node.id];
          error.count = 1;
          bulkErrorMap[errorKey] = error;
        }
      });
    });
    return Object.values(bulkErrorMap);
  };

  // Create the bulk error list using the createBulkErrorList function
  const bulkErrorList = createBulkErrorList(
    filteredErrorArray,
    ignoredErrorsMap
  );
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

  function handleFixAll(error) {
    parent.postMessage(
      {
        pluginMessage: {
          type: "apply-styles",
          error: error,
          field: "matches",
          index: 0
        }
      },
      "*"
    );
  }

  function handleSuggestion(error) {
    parent.postMessage(
      {
        pluginMessage: {
          type: "apply-styles",
          error: error,
          field: "suggestions",
          index: 0
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

  // Filter the bulkErrorList based on the selected filters
  const filteredErrorList = bulkErrorList.filter(error => {
    return selectedFilters.has("All") || selectedFilters.has(error.type);
  });

  // Map the filtered error list to BulkErrorListItem components
  const errorListItems = filteredErrorList.map((error, index) => (
    <BulkErrorListItem
      error={error}
      index={index}
      key={`${error.node.id}-${error.type}-${index}`}
      handleIgnoreChange={handleIgnoreChange}
      handleSelectAll={handleSelectAll}
      handleSelect={handleSelect}
      handleIgnoreAll={handleIgnoreAll}
      handleFixAll={handleFixAll}
      handleSuggestion={handleSuggestion}
    />
  ));

  // Framer motion variant for the list
  const listVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        delayChildren: 0.1
      }
    }
  };

  const pageVariants = {
    initial: { opacity: 1, x: 10 },
    enter: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -10 }
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="enter"
      exit="exit"
      className="bulk-errors-list"
      key="bulk-list"
    >
      <div className="filter-pills">
        {availableFilters.map((filter, index) => (
          <React.Fragment key={filter}>
            <motion.button
              key={filter}
              className={`pill ${
                selectedFilters.has(filter) ? "selected" : ""
              }`}
              onClick={() => handleFilterClick(filter)}
              whileTap={{ scale: 0.9, opacity: 0.8 }}
            >
              {filter}
            </motion.button>
            {/* Render the divider after the first filter */}
            {index === 0 && <span className="pill-divider">|</span>}
          </React.Fragment>
        ))}
      </div>
      <div className="panel-body panel-body-errors">
        {!props.initialLoadComplete ? (
          // Render the Preloader component when initialLoadComplete is false and there are no errors
          <PreloaderCSS />
        ) : bulkErrorList.length ? (
          <AnimatePresence mode="popLayout">
            <motion.ul
              variants={listVariants}
              initial="hidden"
              animate="show"
              className="errors-list"
              key="wrapper-list"
            >
              {errorListItems}
            </motion.ul>
          </AnimatePresence>
        ) : (
          // Render the success message when there are no errors and initialLoadComplete is true
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
    </motion.div>
  );
}

export default BulkErrorList;
