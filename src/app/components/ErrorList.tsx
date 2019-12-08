import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";

function ErrorList(props) {
  let contextTrigger = null;

  const toggleMenu = e => {
    contextTrigger.handleContextClick(e);
  };

  const spring = {
    type: "spring",
    damping: 20,
    stiffness: 200
  };

  // Pass the error we want to ignore back to our parent.
  const handleIgnoreClick = id => {
    props.onIgnoredUpdate(id);
  };

  const errorListItems = props.errors.map((error, index) => (
    <motion.li
      className="error-list-item"
      key={error.node.id + index}
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 1, y: -10, scale: 0 }}
      layoutTransition={spring}
    >
      <span className="error-type">
        <img src={require("../assets/" + error.type.toLowerCase() + ".svg")} />
      </span>
      <span className="error-description">{error.message}</span>
      <span className="context-icon">
        <ContextMenuTrigger
          id={error.node.id + index}
          ref={c => (contextTrigger = c)}
        >
          <img onClick={toggleMenu} src={require("../assets/context.svg")} />
        </ContextMenuTrigger>
      </span>

      <ContextMenu id={error.node.id + index}>
        <MenuItem
          onClick={event => {
            event.stopPropagation();
            handleIgnoreClick(error.node.id);
          }}
        >
          Ignore
        </MenuItem>
        <MenuItem
          data={{ foo: "bar" }}
          onClick={event => {
            event.stopPropagation();
            // handleClick(error.node.id);
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

export default ErrorList;
