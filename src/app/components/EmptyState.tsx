import * as React from "react";
import { motion } from "framer-motion";

function EmptyState(props) {
  const onRunApp = () => {
    props.onHandleRunApp();
  };

  return (
    <motion.div
      className="empty-state-wrapper"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20
      }}
    >
      <div className="empty-state">
        <div className="empty-state__image">
          <img className="layer-icon" src={require("../assets/layers.svg")} />
        </div>
        <div className="empty-state__title">
          Select a frame or multiple frames
        </div>
      </div>
      <button
        className="button button--primary button--full"
        onClick={onRunApp}
      >
        Run Design Lint
      </button>
    </motion.div>
  );
}

export default EmptyState;
