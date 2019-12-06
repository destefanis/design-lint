import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";

function ErrorList(props) {
  const spring = {
    type: "spring",
    damping: 20,
    stiffness: 200
  };

  const errorListItems = props.errors.map(error => (
    <motion.li
      className="error-list-item"
      key={error.node.id + error.type}
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
        <img src={require("../assets/context.svg")} />
      </span>
    </motion.li>
  ));

  return (
    <AnimatePresence>
      <ul className="errors-list">{errorListItems}</ul>
    </AnimatePresence>
  );
}

export default ErrorList;
