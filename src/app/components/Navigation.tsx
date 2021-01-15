import * as React from "react";
// import { useState, useRef, useEffect } from "react";

function Navigation(props) {
  let activePage = props.activePage;

  const layersClick = () => {
    props.onPageSelection("layers");
  };

  const bulkListClick = () => {
    props.onPageSelection("bulk");
  };

  return (
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
          Errors by Count
        </div>
      </nav>
    </div>
  );
}

export default Navigation;
