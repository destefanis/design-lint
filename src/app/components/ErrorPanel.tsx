import * as React from "react";
import ErrorList from "./ErrorList";
import NextButton from "./NextButton";
import PrevButton from "./PrevButton";
import { motion, AnimatePresence } from "framer-motion";
import "../styles/error-panel.css";
import { filter } from "../../../node_modules/@types/minimatch";

function ErrorPanel(props) {
  const isVisible = props.visibility;
  const node = props.node;
  const reducedErrorArray = props.errorArray.filter(
    item => item.errors.length >= 1
  );
  let filteredErrorArray = reducedErrorArray;

  props.ignoredErrorArray.forEach(id => {
    // Check if any of our ignored errors exist within our error array.
    if (filteredErrorArray.some(item => item.id === id)) {
      // Find and update the "error" array of the matching node.
      let obj = filteredErrorArray.find(x => x.id === id);
      let index = filteredErrorArray.indexOf(obj);
      filteredErrorArray.fill((obj.errors = []), index, index++);
    }
  });

  let activeId = props.errorArray.find(e => e.id === node.id);
  let errors = activeId.errors;

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

  function autoNavigate() {
    setTimeout(function() {
      if (filteredErrorArray.length > 0) handleNextNavigation();
    }, 1000);
  }

  // Open and closes the panel.
  function handleChange() {
    props.onClick();
  }

  // Passes the ignored error back to it's parent.
  function handleIgnoreChange(id) {
    props.onIgnoredUpdate(id);
  }

  return (
    <React.Fragment>
      <motion.div
        className={`error-panel`}
        animate={isVisible ? "open" : "closed"}
        transition={{ duration: 0.3, type: "tween" }}
        variants={variants}
      >
        <div className="name-wrapper">
          {/* <span className="name-icon">
            <img
              src={require("../assets/" + node.type.toLowerCase() + ".svg")}
            />
          </span> */}
          <h2 className="node-name">{node.name.substring(0, 46)}</h2>
        </div>

        {errors.length ? (
          <React.Fragment>
            <h4 className="error-label">Errors — {errors.length}</h4>
            <ErrorList onIgnoredUpdate={handleIgnoreChange} errors={errors} />
          </React.Fragment>
        ) : (
          <AnimatePresence>
            {/* {autoNavigate()} */}
            <motion.h3
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 1, y: -10, scale: 0 }}
              className="success-message"
            >
              <div className="success-shape">
                <img
                  className="success-emoji"
                  src={require("../assets/confetti.svg")}
                />
              </div>
              All errors fixed!
            </motion.h3>
          </AnimatePresence>
        )}
        <div className="button-wrapper">
          <PrevButton
            filteredErrorArray={filteredErrorArray}
            onHandleNav={handlePrevNavigation}
            activeId={activeId}
          />
          <NextButton
            filteredErrorArray={filteredErrorArray}
            onHandleNav={handleNextNavigation}
            activeId={activeId}
          />
        </div>
      </motion.div>

      {isVisible ? (
        <div className="overlay" onClick={handleChange}></div>
      ) : null}
    </React.Fragment>
  );
}

export default ErrorPanel;
