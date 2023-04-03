import * as React from "react";
import { motion } from "framer-motion/dist/framer-motion";

function PanelHeader(props) {
  return (
    <div className="panel-header">
      <div className="panel-header__action">
        <motion.button
          className="button--icon"
          onClick={props.handleHide}
          whileTap={{ scale: 0.9, opacity: 0.8 }}
        >
          <img
            className="panel-collapse-icon"
            src={require("../assets/forward-arrow.svg")}
          />
        </motion.button>
      </div>
      <div className="panel-header__title">{props.title}</div>
    </div>
  );
}

export default PanelHeader;
