import * as React from "react";
// import { useState, useEffect, useRef } from "react";
import "../styles/error-panel.css";

function ErrorPanel(props) {
  const isVisible = props.visibility;
  const node = props.node;
  const errors = props.errors.errors;

  const errorListItems = errors.map(error => (
    <li className="error-list-item">{error}</li>
  ));

  function handleChange() {
    props.onClick();
  }

  return (
    <React.Fragment>
      <div className={`error-panel ${isVisible ? "is-visible" : ""}`}>
        <div className="name-wrapper">
          <span className="name-icon">
            <img
              src={require("../assets/" + node.type.toLowerCase() + ".svg")}
            />
          </span>
          <h2 className="node-name">{node.name.substring(0, 46)}</h2>
        </div>
        <h4 className="error-label">{errors.length} errors</h4>
        <ul className="errors-list">{errorListItems}</ul>
      </div>
      {isVisible ? (
        <div className="overlay" onClick={handleChange}></div>
      ) : null}
    </React.Fragment>
  );
}

export default ErrorPanel;
