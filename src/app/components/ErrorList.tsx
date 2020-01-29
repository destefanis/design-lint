import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";

function ErrorList(props) {
  // Pass the error we want to ignore back to our parent.
  const handleIgnoreClick = error => {
    props.onIgnoredUpdate(error);
  };

  const handleIgnoreAll = error => {
    props.onIgnoreAll(error);
  };

  const handleSelectAll = error => {
    props.onSelectAll(error);
  };

  const errorListItems = props.errors.map((error, index) => (
    <motion.li
      positionTransition
      className="error-list-item"
      key={error.node.id + index}
      initial={{ opacity: 1, y: 0, scale: 1 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 1, y: -10, scale: 0 }}
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
          <ContextMenuTrigger
            holdToDisplay={0}
            id={error.node.id + error.value}
          >
            <img src={require("../assets/context.svg")} />
          </ContextMenuTrigger>
        </span>
      </div>

      {error.value ? <div className="current-value">{error.value}</div> : null}

      <ContextMenu id={error.node.id + error.value}>
        <MenuItem
          onClick={event => {
            event.stopPropagation();
            handleSelectAll(error);
          }}
        >
          Select All
        </MenuItem>
        <MenuItem
          onClick={event => {
            event.stopPropagation();
            handleIgnoreClick(error);
          }}
        >
          Ignore
        </MenuItem>
        <MenuItem
          onClick={event => {
            event.stopPropagation();
            handleIgnoreAll(error);
          }}
        >
          Ignore All
        </MenuItem>
      </ContextMenu>
    </motion.li>
  ));

  return (
    <AnimatePresence>
      <ul className="errors-list">{errorListItems}</ul>
    </AnimatePresence>
  );
}

export default React.memo(ErrorList);
