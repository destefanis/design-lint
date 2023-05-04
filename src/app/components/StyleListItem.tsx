import React, { useState } from "react";
import StyleContent from "./StyleContent";

function ListItem({ style, index }) {
  // Use state to keep track of whether the list item is open or collapsed
  const [isOpen, setIsOpen] = useState(false);

  // Function to toggle the isOpen state on click
  const handleToggle = () => {
    setIsOpen(prevIsOpen => !prevIsOpen);
  };

  function truncateStyle(string) {
    return string.length > 28 ? string.substring(0, 28) + "..." : string;
  }

  function handleSelectAll(nodeArray) {
    parent.postMessage(
      {
        pluginMessage: {
          type: "select-multiple-layers",
          nodeArray: nodeArray
        }
      },
      "*"
    );
  }

  // Helper function to convert the first letter to uppercase and the rest to lowercase
  function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  // Conditionally apply the "open" class based on the isOpen state
  const listItemClass = isOpen
    ? "overview-list-item list-item--open"
    : "overview-list-item";

  return (
    <li className={listItemClass} key={index}>
      <div className="overview-content" onClick={handleToggle}>
        <StyleContent
          style={style}
          type={style.type.toLowerCase()}
          error={style}
        />
        <img
          className="overview-icon overview-content-select"
          src={require("../assets/select-all.svg")}
        />
        <img
          className="overview-icon overview-content-arrow"
          src={require("../assets/chevron.svg")}
        />
        {/* <span className="overview-style-name">{truncateStyle(style.name)}</span> */}
      </div>
      <ul className="consumer-sublist">
        {Object.entries(style.groupedConsumers).map(([nodeType, nodeIds]) => (
          <li
            className="consumer-sublist-item"
            key={`${style.name}-${nodeType}`}
            onClick={() => handleSelectAll(nodeIds)} // Pass the array of node IDs
          >
            <img
              className="sublist-item-icon"
              src={require(`../assets/${nodeType.toLowerCase()}.svg`)}
            />
            <span>
              <span className="sublist-item-count">{nodeIds.length}</span>{" "}
              {capitalizeFirstLetter(nodeType)} Layers
            </span>
          </li>
        ))}
      </ul>
    </li>
  );
}

export default ListItem;
