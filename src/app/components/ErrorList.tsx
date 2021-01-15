import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Menu from "./Menu";

function ErrorList(props) {
  const handleIgnoreClick = error => {
    props.onIgnoredUpdate(error);
  };

  const handleIgnoreAll = error => {
    props.onIgnoreAll(error);
  };

  const handleSelectAll = error => {
    props.onSelectAll(error);
  };

  // Finds how many other nodes have this exact error.
  function countInstancesOfThisError(error) {
    let nodesToBeSelected = [];

    props.allErrors.forEach(node => {
      node.errors.forEach(item => {
        if (item.value === error.value) {
          if (item.type === error.type) {
            nodesToBeSelected.push(item.node.id);
          }
        }
      });
    });

    return nodesToBeSelected.length;
  }

  const variants = {
    initial: { opacity: 1, y: 10, scale: 1 },
    enter: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -10, scale: 0.8 }
  };

  const errorListItems = props.errors.map((error, index) => (
    <motion.li
      positionTransition
      className="error-list-item"
      key={error.node.id + index}
      variants={variants}
      initial="initial"
      animate="enter"
      exit="exit"
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
          {countInstancesOfThisError(error) > 1 ? (
            <Menu
              error={error}
              menuItems={[
                {
                  label: `Select All (${countInstancesOfThisError(error)})`,
                  event: handleSelectAll
                },
                {
                  label: "Ignore",
                  event: handleIgnoreClick
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
                  label: "Ignore",
                  event: handleIgnoreClick
                },
                {
                  label: "Ignore All",
                  event: handleIgnoreAll
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
    <AnimatePresence>
      <ul className="errors-list">{errorListItems}</ul>
    </AnimatePresence>
  );
}

export default React.memo(ErrorList);
