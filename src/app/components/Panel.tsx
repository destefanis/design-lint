import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";

import ErrorList from "./ErrorList";
import PanelHeader from "./PanelHeader";

import "../styles/panel.css";

function Panel(props) {
  const isVisible = props.visibility;
  const node = props.node;

  // Reduce the size of our array of errors by removing
  // nodes with no errors on them.
  let filteredErrorArray = props.errorArray.filter(
    item => item.errors.length >= 1
  );

  filteredErrorArray.forEach(item => {
    // Check each layer/node to see if an error that matches it's layer id
    if (props.ignoredErrors.some(x => x.node.id === item.id)) {
      // When we know a matching error exists loop over all the ignored
      // errors until we find it.
      props.ignoredErrors.forEach(ignoredError => {
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

  let activeId = props.errorArray.find(e => e.id === node.id);
  let errors = [];
  if (activeId !== undefined) {
    errors = activeId.errors;
  }

  const variants = {
    open: { opacity: 1, x: 0 },
    closed: { opacity: 0, x: "100%" }
  };

  function handlePrevNavigation() {
    let currentIndex = filteredErrorArray.findIndex(
      item => item.id === activeId.id
    );
    if (filteredErrorArray[currentIndex + 1] !== undefined) {
      activeId = filteredErrorArray[currentIndex + 1];
    } else if (currentIndex !== 0) {
      activeId = filteredErrorArray[0];
    } else {
      activeId = filteredErrorArray[currentIndex - 1];
    }

    props.onSelectedListUpdate(activeId.id);

    parent.postMessage(
      { pluginMessage: { type: "fetch-layer-data", id: activeId.id } },
      "*"
    );
  }

  function handleNextNavigation() {
    let currentIndex = filteredErrorArray.findIndex(
      item => item.id === activeId.id
    );
    let lastItem = currentIndex + filteredErrorArray.length - 1;

    if (filteredErrorArray[currentIndex - 1] !== undefined) {
      activeId = filteredErrorArray[currentIndex - 1];
    } else if (filteredErrorArray.length === 1) {
      activeId = filteredErrorArray[0];
    } else {
      activeId = filteredErrorArray[lastItem];
    }

    props.onSelectedListUpdate(activeId.id);

    parent.postMessage(
      { pluginMessage: { type: "fetch-layer-data", id: activeId.id } },
      "*"
    );
  }

  // Open and closes the panel.
  function handleChange() {
    props.onClick();
  }

  // Passes the ignored error back to it's parent.
  function handleIgnoreChange(error) {
    props.onIgnoredUpdate(error);
  }

  function handleSelectAll(error) {
    let nodesToBeSelected = [];

    filteredErrorArray.forEach(node => {
      node.errors.forEach(item => {
        if (item.value === error.value) {
          if (item.type === error.type) {
            nodesToBeSelected.push(item.node.id);
          }
        }
      });
    });

    if (nodesToBeSelected.length) {
      parent.postMessage(
        {
          pluginMessage: {
            type: "select-multiple-layers",
            nodeArray: nodesToBeSelected
          }
        },
        "*"
      );
    }
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

  // We need an conditional statement for rendering in case the user deletes the selected layer.
  return (
    <React.Fragment>
      {activeId !== undefined ? (
        <motion.div
          className={`panel`}
          animate={isVisible ? "open" : "closed"}
          transition={{ duration: 0.3, type: "tween" }}
          variants={variants}
        >
          <PanelHeader
            title={node.name}
            handleHide={handleChange}
          ></PanelHeader>

          <div className="panel-body">
            {errors.length ? (
              <React.Fragment>
                <div className="error-label">Errors — {errors.length}</div>
                <ErrorList
                  onIgnoredUpdate={handleIgnoreChange}
                  onIgnoreAll={handleIgnoreAll}
                  onSelectAll={handleSelectAll}
                  errors={errors}
                  allErrors={filteredErrorArray}
                />
              </React.Fragment>
            ) : (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 1, y: -10, scale: 0 }}
                  className="success-message"
                >
                  <div className="success-shape">
                    <img
                      className="success-icon"
                      src={require("../assets/smile.svg")}
                    />
                  </div>
                  All errors fixed in the selection
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          <div className="panel-footer">
            <button
              onClick={handlePrevNavigation}
              disabled={filteredErrorArray.length <= 1}
              className="button button--secondary button--flex"
            >
              ← Previous
            </button>

            <button
              onClick={handleNextNavigation}
              disabled={filteredErrorArray.length <= 1}
              className="button button--secondary button--flex"
            >
              Next →
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          className={`panel`}
          animate={isVisible ? "open" : "closed"}
          transition={{ duration: 0.3, type: "tween" }}
          variants={variants}
        >
          <div className="name-wrapper">
            <h2 className="node-name">Node is missing or has been deleted</h2>
          </div>
        </motion.div>
      )}
      {isVisible ? (
        <div className="overlay" onClick={handleChange}></div>
      ) : null}
    </React.Fragment>
  );
}

export default React.memo(Panel);
