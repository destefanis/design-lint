import * as React from "react";
import { motion } from "framer-motion/dist/framer-motion";
import PanelHeader from "./PanelHeader";
import "../styles/panel.css";

function LibraryPanel(props) {
  const isVisible = props.panelVisible;

  const variants = {
    open: { opacity: 1, x: 0 },
    closed: { opacity: 0, x: "100%" }
  };

  function handleHide() {
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
        key="settings-panel"
      >
        <PanelHeader title={"Library"} handleHide={handleHide}></PanelHeader>

        <div className="settings-wrapper">
          <div className="empty-state-wrapper">
            <div className="background-wrapper">
              <img
                className="empty-state-background"
                src={require("../assets/mesh-background.png")}
              />
            </div>
            <div className="empty-state">
              <div className="empty-state__image">
                <img
                  className="layer-icon"
                  src={require("../assets/library.svg")}
                />
              </div>
              <div className="empty-state__title">
                Import your style library from your design system for automatic
                fixes.
              </div>
              <button className="button button--primary button--full">
                Import Styles
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {isVisible ? <div className="overlay" onClick={handleHide}></div> : null}
    </React.Fragment>
  );
}

export default LibraryPanel;
