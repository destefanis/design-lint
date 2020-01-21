import * as React from "react";
import { motion } from "framer-motion";
import SettingsForm from "./SettingsForm";
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
        initial={{ opacity: 0, x: "100%" }}
        animate={isVisible ? "open" : "closed"}
        transition={{ duration: 0.3, type: "tween" }}
        variants={variants}
      >
        <div className="name-wrapper">
          <h2 className="node-name">Settings</h2>
        </div>

        <div className="settings-wrapper">
          <SettingsForm borderRadiusValues={props.borderRadiusValues} />
          <div className="settings-row">
            <h3 className="settings-title">Ignored Errors</h3>
            {props.ignoredErrorArray.length > 0 ? (
              <React.Fragment>
                <p className="settings-label">
                  {props.ignoredErrorArray.length} errors are being ignored.
                </p>
                <div
                  className="button button--dark"
                  onClick={clearIgnoredErrors}
                >
                  Clear ignored errors
                </div>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <p className="settings-label">
                  You haven't ignored any errors yet.
                </p>
                <div className="button button--dark button--disabled">
                  Clear ignored errors
                </div>
              </React.Fragment>
            )}
          </div>
        </div>
      </motion.div>

      {isVisible ? <div className="overlay" onClick={handleHide}></div> : null}
    </React.Fragment>
  );
}

export default React.memo(SettingsPanel);
