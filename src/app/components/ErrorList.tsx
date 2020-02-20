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
          <Menu
            error={error}
            menuItems={[
              {
                label: "Select All",
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
