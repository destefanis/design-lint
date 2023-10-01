import React, { useState } from "react";
import BulkErrorListItem from "./BulkErrorListItem";
import TotalErrorCount from "./TotalErrorCount";
import { AnimatePresence, motion } from "framer-motion/dist/framer-motion";
import PreloaderCSS from "./PreloaderCSS";
import Banner from "./Banner";
import Modal from "./Modal";
import StylesPanel from "./StylesPanel";

function BulkErrorList(props) {
  const [currentError, setCurrentError] = useState(null);
  const [panelError, setPanelError] = useState(null);
  const [panelStyleSuggestion, setPanelStyleSuggestion] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [panelVisible, setPanelVisible] = React.useState(false);

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
        const hasSuggestions =
          error.suggestions && error.suggestions.length > 0;

        // Sort matches and suggestions by count (how often they're used)
        if (hasMatches) {
          error.matches.sort((a, b) => (b.count || 0) - (a.count || 0));
        } else if (hasSuggestions) {
          error.suggestions.sort((a, b) => (b.count || 0) - (a.count || 0));
          // Remove style suggestions with deprecated in the title.
          error.suggestions = error.suggestions.filter(suggestion => {
            return !suggestion.name.toLowerCase().includes("deprecated");
          });
        }

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

  // Create an array of errors that have matches
  const errorsWithMatches = bulkErrorList.filter(error => {
    return error.matches && error.matches.length > 0;
  });

  // Calculate the total number of errors with matches
  const totalErrorsWithMatches = errorsWithMatches.reduce((total, error) => {
    return total + error.count;
  }, 0);

  const handleFixAllFromBanner = () => {
    errorsWithMatches.forEach(error => {
      handleFixAll(error);
    });
  };

  function handleIgnoreChange(error) {
    props.onIgnoredUpdate(error);
  }

  function handlePanelVisible(boolean) {
    setPanelVisible(boolean);
  }

  function handleUpdatePanelError(error) {
    setPanelError(error);
  }

  function handleUpdatePanelSuggestion(index) {
    setPanelStyleSuggestion(index);
  }

  function handleBorderRadiusUpdate(value) {
    props.updateBorderRadius(value);
  }

  function handleCreateStyle(error) {
    setCurrentError(error);
    setIsModalOpen(true);
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
          index: 0,
          count: error.count
        }
      },
      "*"
    );
  }

  function handleSuggestion(error, index) {
    parent.postMessage(
      {
        pluginMessage: {
          type: "apply-styles",
          error: error,
          field: "suggestions",
          index: index,
          count: error.count
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
      handleCreateStyle={handleCreateStyle}
      handleSelect={handleSelect}
      handleIgnoreAll={handleIgnoreAll}
      handleFixAll={handleFixAll}
      handleSuggestion={handleSuggestion}
      handleBorderRadiusUpdate={handleBorderRadiusUpdate}
      handlePanelVisible={handlePanelVisible}
      handleUpdatePanelError={handleUpdatePanelError}
      handleUpdatePanelSuggestion={handleUpdatePanelSuggestion}
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
    initial: { opacity: 1, y: 0 },
    enter: { opacity: 1, y: 0 },
    exit: { opacity: 1, y: 0 }
  };

  const variants = {
    initial: { opacity: 0, y: -12 },
    enter: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 12 }
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
            {totalErrorsWithMatches > 0 && (
              <motion.div
                key="banner"
                variants={variants}
                initial="initial"
                animate="enter"
                exit="exit"
              >
                <Banner
                  totalErrorsWithMatches={totalErrorsWithMatches}
                  handleFixAllErrors={handleFixAllFromBanner}
                />
              </motion.div>
            )}
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
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        error={currentError}
      />
      <StylesPanel
        panelVisible={panelVisible}
        onHandlePanelVisible={handlePanelVisible}
        error={panelError}
        suggestion={panelStyleSuggestion}
      />
    </motion.div>
  );
}

export default BulkErrorList;
