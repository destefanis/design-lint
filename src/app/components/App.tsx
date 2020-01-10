import * as React from "react";
import { useState, useEffect, useRef } from "react";
import "../styles/reset.css";
import "../styles/ui.css";
import ErrorPanel from "./ErrorPanel";
import NodeList from "./NodeList";

declare function require(path: string): any;

const App = ({}) => {
  const [errorArray, setErrorArray] = useState([]);
  const [ignoredErrorArray, setIgnoreErrorArray] = useState([]);
  const [activeError, setActiveError] = React.useState({});
  const [selectedNode, setSelectedNode] = React.useState({});
  const [isVisible, setIsVisible] = React.useState(false);
  const [nodeArray, setNodeArray] = useState([]);
  const [selectedListItems, setSelectedListItem] = React.useState([]);
  const [activeNodeIds, setActiveNodeIds] = React.useState([]);

  let newWindowFocus = false;
  let counter = 0;
  let totalErrorCount = determineCount(errorArray);

  const updateSelectedList = id => {
    setSelectedListItem(selectedListItems => {
      selectedListItems.splice(0, selectedListItems.length);
      return selectedListItems.concat(id);
    });

    setActiveNodeIds(activeNodeIds => {
      if (activeNodeIds.includes(id)) {
        // The ID is already in the active node list,
        // so we probably want to remove it
        return activeNodeIds.filter(activeNodeId => activeNodeId !== id);
      }
      // Since the ID is not already in the list, we want to add it
      return activeNodeIds.concat(id);
    });
  };

  const updateActiveError = error => {
    setActiveError(error);
  };

  const updateIgnoredErrors = error => {
    if (ignoredErrorArray.some(e => e.node.id === error.node.id)) {
      if (ignoredErrorArray.some(e => e.value === error.value)) {
        return;
      } else {
        setIgnoreErrorArray([error].concat(ignoredErrorArray));
      }
    } else {
      setIgnoreErrorArray([error].concat(ignoredErrorArray));
    }
  };

  const updateErrorArray = errors => {
    setErrorArray(errors);
  };

  const updateVisible = val => {
    setIsVisible(val);
  };

  const onFocus = () => {
    newWindowFocus = true;
    counter = 0;
  };

  const onBlur = () => {
    newWindowFocus = false;
    pollForChanges();
  };

  const onRunApp = React.useCallback(() => {
    parent.postMessage({ pluginMessage: { type: "run-app" } }, "*");
  }, []);

  // Recursive function for detecting if the user updates a layer.
  // polls for up to two minutes.
  function pollForChanges() {
    if (newWindowFocus === false && counter < 600) {
      parent.postMessage({ pluginMessage: { type: "update-errors" } }, "*");
      counter++;

      setTimeout(() => {
        pollForChanges();
      }, 1000);
    }
  }

  function determineCount(array) {
    let count = 0;

    array.forEach(arrayItem => {
      if (arrayItem.errors) {
        count = count + arrayItem.errors.length;
      }
    });

    return count;
  }

  function updateVisibility() {
    if (isVisible === true) {
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }
  }

  React.useEffect(() => {
    onRunApp();

    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);

    window.onmessage = event => {
      const { type, message, errors } = event.data.pluginMessage;

      // Plugin code returns this message after finished a loop through the layers.
      if (type === "complete") {
        let nodeObject = JSON.parse(message);
        setNodeArray(nodeObject);
        updateErrorArray(errors);

        // Fetch the first nodes properties and lint them.
        parent.postMessage(
          {
            pluginMessage: {
              type: "fetch-layer-data",
              id: nodeObject[0].id,
              nodeArray: nodeObject
            }
          },
          "*"
        );

        // Set this node as selected in the side menu
        setSelectedListItem(selectedListItems => {
          selectedListItems.splice(0, selectedListItems.length);
          return selectedListItems.concat(nodeObject[0].id);
        });

        setActiveNodeIds(activeNodeIds => {
          return activeNodeIds.concat(nodeObject[0].id);
        });
      } else if (type === "fetched layer") {
        // Grabs the properties of the first layer.
        setSelectedNode(selectedNode => JSON.parse(message));

        // Ask the controller to lint the layers for errors.
        parent.postMessage({ pluginMessage: { type: "update-errors" } }, "*");
      } else if (type === "updated errors") {
        // Once the errors are returned, update the error array.
        updateErrorArray(errors);
      }
    };
  }, []);

  return (
    <div>
      <div className="flex-wrapper">
        {activeNodeIds.length !== 0 ? (
          <NodeList
            onErrorUpdate={updateActiveError}
            onVisibleUpdate={updateVisible}
            onSelectedListUpdate={updateSelectedList}
            visibility={isVisible}
            nodeArray={nodeArray}
            errorArray={errorArray}
            ignoredErrorArray={ignoredErrorArray}
            selectedListItems={selectedListItems}
            activeNodeIds={activeNodeIds}
          />
        ) : null}
        <div className="total-error-count">
          <h5 className="total-error-header">Total Errors:</h5>
          <span className="error-count">{totalErrorCount}</span>
        </div>
        {Object.keys(activeError).length !== 0 ? (
          <ErrorPanel
            visibility={isVisible}
            node={selectedNode}
            errorArray={errorArray}
            onIgnoredUpdate={updateIgnoredErrors}
            ignoredErrors={ignoredErrorArray}
            onClick={updateVisibility}
            onSelectedListUpdate={updateSelectedList}
          />
        ) : null}
      </div>
    </div>
  );
};

export default App;
