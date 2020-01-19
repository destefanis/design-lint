import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import "../styles/error-panel.css";

function SettingsPanel(props) {
  const isVisible = props.panelVisible;

  const variants = {
    open: { opacity: 1, x: 0 },
    closed: { opacity: 0, x: "100%" }
  };

  function handleHide() {
    props.onHandlePanelVisible(false);
  }

  function clearIgnoredErrors() {
    parent.postMessage(
      {
        pluginMessage: {
          type: "update-storage-from-settings",
          storageArray: []
        }
      },
      "*"
    );
    props.onHandlePanelVisible(false);
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
          <h2 className="node-name">Settings</h2>
        </div>

        <div className="settings-wrapper">
          {props.ignoredErrorArray.length > 0 ? (
            <div className="settings-row">
              <p className="settings-label">
                {props.ignoredErrorArray.length} errors are being ignored.
              </p>
              <div className="button button--dark" onClick={clearIgnoredErrors}>
                Clear ignored errors
              </div>
            </div>
          ) : (
            <div className="settings-row">
              <p className="settings-label">
                You haven't ignored any errors yet.
              </p>
              <div className="button button--dark button--disabled">
                Clear ignored errors
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {isVisible ? <div className="overlay" onClick={handleHide}></div> : null}
    </React.Fragment>
  );
}

export default React.memo(SettingsPanel);
