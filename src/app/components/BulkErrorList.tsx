import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Menu from "./Menu";

function BulkErrorList(props) {
  // Reduce the size of our array of errors by removing nodes with no errors on them.
  let filteredErrorArray = props.errorArray.filter(
    item => item.errors.length >= 1
  );

  let bulkErrorList = [];

  // Create the list we'll use to display all the errors in bulk.
  filteredErrorArray.forEach(item => {
    let nodeErrors = item.errors;

    nodeErrors.forEach(error => {
      // Check to see if another error with this same value exists.
      if (bulkErrorList.some(e => e.value === error.value)) {
        // Find the error of this type that already exists.
        let duplicateError = bulkErrorList.find(e => e.value === error.value);
        let nodesThatShareErrors = [];

        // Add the nodes id that share this error to the object
        // That way we can select them later and get a count.
        nodesThatShareErrors.push(error.node.id);
        nodesThatShareErrors.push(duplicateError.node.id);
        duplicateError.nodes = nodesThatShareErrors;
        duplicateError.count = duplicateError.nodes.length;
      } else {
        // If this is the first instance of this type of error, add it to the list.
        bulkErrorList.push(error);
      }
    });
  });

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

  const errorListItems = bulkErrorList.map((error, index) => (
    <motion.li
      positionTransition
      className="error-list-item"
      key={error.node.id + index}
      initial={{ opacity: 1, y: 0, scale: 1 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0 }}
    >
      <div className="flex-row">
        <span className="error-type">
          <img
            src={require("../assets/" + error.type.toLowerCase() + ".svg")}
          />
        </span>
        <span className="error-description">
          <div className="error-description__message">{error.message}</div>
        </span>
        <span className="context-icon">
          {error.nodes ? (
            <Menu
              error={error}
              menuItems={[
                {
                  label: `Select All`,
                  event: handleSelectAll
                },
                {
                  label: "Ignore",
                  event: handleIgnoreChange
                },
                {
                  label: "Ignore All",
                  event: handleIgnoreAll
                }
              ]}
            />
          ) : (
            <Menu
              error={error}
              menuItems={[
                {
                  label: `Select`,
                  event: handleSelect
                },
                {
                  label: "Ignore",
                  event: handleIgnoreChange
                }
              ]}
            />
          )}
        </span>
      </div>

      {error.value ? <div className="current-value">{error.value}</div> : null}
    </motion.li>
  ));

  return (
    <motion.div
      className="bulk-errors-list"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20
      }}
    >
      <AnimatePresence>
        <ul className="errors-list">{errorListItems}</ul>
      </AnimatePresence>
    </motion.div>
  );
}

export default BulkErrorList;
