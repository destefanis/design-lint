import * as React from "react";
import BulkErrorListItem from "./BulkErrorListItem";
import TotalErrorCount from "./TotalErrorCount";
import { AnimatePresence } from "framer-motion/dist/framer-motion";

function BulkErrorList(props) {
  // Reduce the size of our array of errors by removing nodes with no errors on them.
  let filteredErrorArray = props.errorArray.filter(
    item => item.errors.length >= 1
  );

  filteredErrorArray.forEach(item => {
    // Check each layer/node to see if an error that matches it's layer id
    if (props.ignoredErrorArray.some(x => x.node.id === item.id)) {
      // When we know a matching error exists loop over all the ignored
      // errors until we find it.
      props.ignoredErrorArray.forEach(ignoredError => {
        if (ignoredError.node.id === item.id) {
          // Loop over every error this layer/node until we find the
          // error that should be ignored, then remove it.
          for (let i = 0; i < item.errors.length; i++) {
            if (item.errors[i].value === ignoredError.value) {
              item.errors.splice(i, 1);
              i--;
            }
          }
        }
      });
    }
  });

  let bulkErrorList = [];

  // Create the list we'll use to display all the errors in bulk.
  filteredErrorArray.forEach(item => {
    let nodeErrors = item.errors;

    nodeErrors.forEach(error => {
      // Check to see if another error with this same value exists.
      if (bulkErrorList.some(e => e.type === error.type && e.message === error.message && e.value === error.value)) {
        // Find the error of this type that already exists.
        let duplicateError = bulkErrorList.find(e => e.type === error.type && e.message === error.message && e.value === error.value);
        let nodesThatShareErrors = duplicateError.nodes;
        // Add the nodes id that share this error to the object
        // That way we can select them all at once.
        nodesThatShareErrors.push(error.node.id);
        duplicateError.nodes = nodesThatShareErrors;
        duplicateError.count = duplicateError.nodes.length;
      } else {
        // If this is the first instance of this type of error, add it to the list.
        error.nodes = [error.node.id];
        error.count = 0;
        bulkErrorList.push(error);
      }
    });
  });

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

  const errorListItems = bulkErrorList.map((error, index) => (
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
