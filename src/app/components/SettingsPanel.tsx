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

  function handleCheckbox() {
    if (props.lintVectors === false) {
      props.updateLintRules(true);
    } else if (props.lintVectors === true) {
      props.updateLintRules(false);
    }
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
            <h3 className="settings-title">Lint Vectors (Default Off)</h3>
            <div className="settings-label">
              Illustrations, vectors, and boolean shapes often throw a lot of
              errors as they rarely use styles for fills. If you'd like to lint
              them as well, check the box below.
              <div className="settings-checkbox-group" onClick={handleCheckbox}>
                <input
                  name="vectorsCheckbox"
                  type="checkbox"
                  checked={props.lintVectors}
                />
                <label>Lint Vectors and Boolean Shapes</label>
              </div>
            </div>
          </div>
          <div className="settings-row">
            <h3 className="settings-title">Ignored errors</h3>
            {props.ignoredErrorArray.length > 0 ? (
              <React.Fragment>
                <div className="settings-label">
                  {props.ignoredErrorArray.length} errors are being ignored in
                  selection.
                </div>
                <button
                  className="button button--primary"
                  onClick={clearIgnoredErrors}
                >
                  Reset ignored errors
                </button>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <div className="settings-label">
                  You haven't ignored any errors yet.
                </div>
              </React.Fragment>
            )}
          </div>
          <div className="settings-row">
            <h3 className="settings-title">How to skip layers?</h3>
            <div className="settings-label">
              If you have an illustration or set of layers you want the linter
              to ignore, lock them in the Figma layer list.
            </div>
          </div>
        </div>
      </motion.div>

      {isVisible ? <div className="overlay" onClick={handleHide}></div> : null}
    </React.Fragment>
  );
}

export default React.memo(SettingsPanel);
