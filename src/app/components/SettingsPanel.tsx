import * as React from "react";
import { motion } from "framer-motion";
import PanelHeader from "./PanelHeader";
import SettingsForm from "./SettingsForm";
import "../styles/panel.css";

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
        className={`panel`}
        initial={{ opacity: 0, x: "100%" }}
        animate={isVisible ? "open" : "closed"}
        transition={{ duration: 0.3, type: "tween" }}
        variants={variants}
      >
        <PanelHeader title={"Settings"} handleHide={handleHide}></PanelHeader>

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
                  className="button button--primary"
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
                <div className="button button--primary button--disabled">
                  Clear ignored errors
                </div>
              </React.Fragment>
            )}
          </div>
          <div className="settings-row">
            <h3 className="settings-title">How To Skip Layers</h3>
            <p className="settings-label">
              If you have an illustration or set of layers you want the linter
              to ignore, lock them in the Figma layer list.
            </p>
          </div>
        </div>
      </motion.div>

      {isVisible ? <div className="overlay" onClick={handleHide}></div> : null}
    </React.Fragment>
  );
}

export default React.memo(SettingsPanel);
