import * as React from "react";
import "../styles/placeholder.css";

function Placeholder(props) {
  return (
    <div className="placeholder">
      <div className="placeholder-wrapper">
        <img
          className="placeholder-icon"
          src={require("../assets/placeholder-image.png")}
        />
        <h6 className="placeholder-title">Select a layer to inspect</h6>
      </div>
    </div>
  );
}

export default Placeholder;
