import * as React from "react";
import { useState } from "react";

import Navigation from "./Navigation";
import NodeList from "./NodeList";
import Preloader from "./Preloader";
import EmptyState from "./EmptyState";
import Panel from "./Panel";
import BulkErrorList from "./BulkErrorList";

import "../styles/figma.ds.css";
import "../styles/ui.css";
import "../styles/empty-state.css";

const App = ({}) => {
  const [errorArray, setErrorArray] = useState([]);
  const [activePage, setActivePage] = useState("page");
  const [ignoredErrorArray, setIgnoreErrorArray] = useState([]);
  const [activeError, setActiveError] = React.useState({});
  const [selectedNode, setSelectedNode] = React.useState({});
  const [isVisible, setIsVisible] = React.useState(false);
  const [nodeArray, setNodeArray] = useState([]);
  const [selectedListItems, setSelectedListItem] = React.useState([]);
  const [activeNodeIds, setActiveNodeIds] = React.useState([]);
  const [borderRadiusValues, setBorderRadiusValues] = useState([
    0,
    2,
    4,
    8,
    16,
    24,
    32
  ]);
  const [lintVectors, setLintVectors] = useState(false);
  const [initialLoad, setInitialLoad] = React.useState(false);
  const [timedLoad, setTimeLoad] = React.useState(false);

  let newWindowFocus = false;
  let counter = 0;

  window.addEventListener("keydown", function(e) {
    if (e.key === "Escape") {
      // Close plugin when pressing Escape
      window.parent.postMessage({ pluginMessage: { type: "close" } }, "*");
    }
  });

  const updateSelectedList = id => {
    setSelectedListItem(selectedListItems => {
      selectedListItems.splice(0, selectedListItems.length);
      return selectedListItems.concat(id);
    });

    setActiveNodeIds(activeNodeIds => {
      if (activeNodeIds.includes(id)) {
        // Remove this node if it exists in the array already from intial run.
        // Don't ignore it if there's only one layer total.
        if (activeNodeIds.length !== 1) {
          return activeNodeIds.filter(activeNodeId => activeNodeId !== id);
        } else {
          return activeNodeIds;
        }
      }
      // Since the ID is not already in the list, we want to add it
      return activeNodeIds.concat(id);
    });
  };

  const updateNavigation = page => {
    setActivePage(page);

    parent.postMessage(
      {
        pluginMessage: {
          type: "update-active-page-in-settings",
          page: page
        }
      },
      "*"
    );
  };

  const updateActiveError = error => {
    setActiveError(error);
  };

  const ignoreAll = errors => {
    setIgnoreErrorArray(ignoredErrorArray => [...ignoredErrorArray, ...errors]);
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

  const updateLintRules = boolean => {
    setLintVectors(boolean);

    parent.postMessage(
      {
        pluginMessage: {
          type: "update-lint-rules-from-settings",
          boolean: boolean
        }
      },
      "*"
    );
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
    parent.postMessage(
      { pluginMessage: { type: "run-app", lintVectors: lintVectors } },
      "*"
    );
  }, []);

  // Recursive function for detecting if the user updates a layer.
  // polls for up to two minutes.
  function pollForChanges() {
    if (newWindowFocus === false && counter < 600) {
      // How often we poll for new changes.
      let timer = 1500;

      parent.postMessage({ pluginMessage: { type: "update-errors" } }, "*");
      counter++;

      setTimeout(() => {
        pollForChanges();
      }, timer);
    }
  }

  function updateVisibility() {
    if (isVisible === true) {
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }
  }

  // If no layer is selected after 3 seconds, show the empty state.
  setTimeout(function() {
    setTimeLoad(true);
  }, 3000);

  React.useEffect(() => {
    // Update client storage so the next time we run the app
    // we don't have to ignore our errors again.
    if (initialLoad !== false && ignoredErrorArray.length) {
      parent.postMessage(
        {
          pluginMessage: {
            type: "update-storage",
            storageArray: ignoredErrorArray
          }
        },
        "*"
      );
    }
  }, [ignoredErrorArray]);

  React.useEffect(() => {
    onRunApp();

    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);

    window.onmessage = event => {
      const { type, message, errors, storage } = event.data.pluginMessage;

      // Plugin code returns this message after we return the first node
      // for performance, then we lint the remaining layers.
      if (type === "complete") {
        let nodeObject = JSON.parse(message);

        // setNodeArray(nodeObject);
        updateErrorArray(errors);

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

        setInitialLoad(true);
      } else if (type === "first node") {
        let nodeObject = JSON.parse(message);

        setNodeArray(nodeObject);
        updateErrorArray(errors);

        // Set this node as selected in the side menu
        setSelectedListItem(selectedListItems => {
          selectedListItems.splice(0, selectedListItems.length);
          return selectedListItems.concat(nodeObject[0].id);
        });

        setActiveNodeIds(activeNodeIds => {
          return activeNodeIds.concat(nodeObject[0].id);
        });

        // After we have the first node, we want to
        // lint the remaining selection.
        parent.postMessage(
          {
            pluginMessage: {
              type: "lint-all",
              nodes: nodeObject
            }
          },
          "*"
        );

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
      } else if (type === "fetched storage") {
        let clientStorage = JSON.parse(storage);

        setIgnoreErrorArray(ignoredErrorArray => [
          ...ignoredErrorArray,
          ...clientStorage
        ]);
      } else if (type === "fetched active page") {
        let clientStorage = JSON.parse(storage);
        setActivePage(clientStorage);
      } else if (type === "fetched border radius") {
        // Update border radius values from storage
        let clientStorage = JSON.parse(storage);
        setBorderRadiusValues([...clientStorage]);
      } else if (type === "reset storage") {
        let clientStorage = JSON.parse(storage);
        setIgnoreErrorArray([...clientStorage]);
        parent.postMessage({ pluginMessage: { type: "update-errors" } }, "*");
      } else if (type === "fetched layer") {
        // Grabs the properties of the first layer.
        setSelectedNode(() => JSON.parse(message));

        // Ask the controller to lint the layers for errors.
        parent.postMessage({ pluginMessage: { type: "update-errors" } }, "*");
      } else if (type === "updated errors") {
        // Once the errors are returned, update the error array.
        updateErrorArray(errors);
      }
    };
  }, []);

  return (
    <div className="container">
      <Navigation
        onPageSelection={updateNavigation}
        activePage={activePage}
        updateLintRules={updateLintRules}
        ignoredErrorArray={ignoredErrorArray}
        borderRadiusValues={borderRadiusValues}
        lintVectors={lintVectors}
        onRefreshSelection={onRunApp}
      />
      {activeNodeIds.length !== 0 ? (
        <div>
          {activePage === "layers" ? (
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
          ) : (
            <BulkErrorList
              errorArray={errorArray}
              ignoredErrorArray={ignoredErrorArray}
              onIgnoredUpdate={updateIgnoredErrors}
              onIgnoreAll={ignoreAll}
              ignoredErrors={ignoredErrorArray}
              onClick={updateVisibility}
              onSelectedListUpdate={updateSelectedList}
            />
          )}
        </div>
      ) : timedLoad === false ? (
        <Preloader />
      ) : (
        <EmptyState onHandleRunApp={onRunApp} />
      )}

      {Object.keys(activeError).length !== 0 && errorArray.length ? (
        <Panel
          visibility={isVisible}
          node={selectedNode}
          errorArray={errorArray}
          onIgnoredUpdate={updateIgnoredErrors}
          onIgnoreAll={ignoreAll}
          ignoredErrors={ignoredErrorArray}
          onClick={updateVisibility}
          onSelectedListUpdate={updateSelectedList}
        />
      ) : null}
    </div>
  );
};

export default App;
