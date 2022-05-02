import * as React from "react";
import SettingsPanel from "./SettingsPanel";

function Navigation(props) {
  const [panelVisible, setPanelVisible] = React.useState(false);
  let activePage = props.activePage;

  const layersClick = () => {
    props.onPageSelection("layers");
  };

  const bulkListClick = () => {
    props.onPageSelection("bulk");
  };

  const handleLintRulesChange = boolean => {
    props.updateLintRules(boolean);
  };

  const handlePanelVisible = boolean => {
    setPanelVisible(boolean);
  };

  const handleRefreshSelection = () => {
    props.onRefreshSelection();
  };

  return (
    <div key="nav">
      <div className="navigation-wrapper">
        <nav className="nav">
          <div
            className={`nav-item ${activePage === "layers" ? "active" : ""}`}
            onClick={layersClick}
          >
            Layers
          </div>
          <div
            className={`nav-item ${activePage === "bulk" ? "active" : ""}`}
            onClick={bulkListClick}
          >
            Errors by Category
          </div>
          <div className="nav-icon-wrapper">
            <button
              className="icon icon--refresh icon--button settings-button"
              onClick={event => {
                event.stopPropagation();
                handleRefreshSelection();
              }}
            >
              <img src={require("../assets/refresh.svg")} />
            </button>
            <button
              className="icon icon--adjust icon--button settings-button"
              onClick={event => {
                event.stopPropagation();
                handlePanelVisible(true);
              }}
            ></button>
          </div>
        </nav>
      </div>
      <SettingsPanel
        panelVisible={panelVisible}
        onHandlePanelVisible={handlePanelVisible}
        ignoredErrorArray={props.ignoredErrorArray}
        borderRadiusValues={props.borderRadiusValues}
        updateLintRules={handleLintRulesChange}
        lintVectors={props.lintVectors}
      />
    </div>
  );
}

export default Navigation;
