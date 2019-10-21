import * as React from "react";
import { useState, useEffect, useRef } from "react";
import "../styles/reset.css";
import "../styles/ui.css";
import classNames from "classnames";

declare function require(path: string): any;

const App = ({}) => {
  const [nodeArray, setNodeAarray] = useState([]);
  const [selectedNode, setSelectedNode] = React.useState({});
  const [selectedListItems, setSelectedListItem] = React.useState([]);
  const [activeNodeIds, setActiveNodeIds] = React.useState([]);

  const onRunApp = React.useCallback(() => {
    parent.postMessage({ pluginMessage: { type: "run-app" } }, "*");
  }, []);

  React.useEffect(() => {
    onRunApp();

    window.onmessage = event => {
      const { type, message } = event.data.pluginMessage;

      // Plugin code returns this message after finished a loop.
      // The data received is serialized so we need to parse it before use.
      if (type === "complete") {
        let nodeObject = JSON.parse(message);
        setNodeAarray(nodeObject);

        // Fetch the first nodes properties
        parent.postMessage(
          { pluginMessage: { type: "fetch-layer-data", id: nodeObject[0].id } },
          "*"
        );

        // Set this node as selected in the side menu
        setSelectedListItem(selectedListItems => {
          selectedListItems.splice(0, selectedListItems.length);
          return selectedListItems.concat(nodeObject[0].id);
        });

        // Expand the item in the side menu
        setActiveNodeIds(activeNodeIds => {
          return activeNodeIds.concat(nodeObject[0].id);
        });
      } else if (type === "fetched layer") {
        setSelectedNode(selectedNode => JSON.parse(message));
      }
    };
  }, []);

  function NodeList(props) {
    const handleNodeClick = id => {
      // Pass the plugin the ID of the layer we want to fetch.
      parent.postMessage(
        { pluginMessage: { type: "fetch-layer-data", id: id } },
        "*"
      );

      setSelectedListItem(selectedListItems => {
        selectedListItems.splice(0, selectedListItems.length);
        return selectedListItems.concat(id);
      });

      setActiveNodeIds(activeNodeIds => {
        if (activeNodeIds.includes(id)) {
          // The ID is already in the active node list, so we probably want to remove it
          return activeNodeIds.filter(activeNodeId => activeNodeId !== id);
        }
        // Since the ID is not already in the list, we want to add it
        return activeNodeIds.concat(id);
      });
    };

    if (nodeArray.length) {
      let nodes = nodeArray;

      const listItems = nodes.map(node => (
        <ListItem
          activeNodeIds={activeNodeIds}
          onClick={handleNodeClick}
          key={node.id}
          node={node}
        />
      ));

      return <ul className="list">{listItems}</ul>;
    } else {
      return <ul className="list"></ul>;
    }
  }

  function ListItem(props) {
    const { activeNodeIds, onClick } = props;
    const node = props.node;
    let childNodes = null;

    // The component calls itself if there are children
    if (node.children) {
      let reversedArray = node.children.slice().reverse();
      childNodes = reversedArray.map(function(childNode) {
        return (
          <ListItem
            activeNodeIds={activeNodeIds}
            onClick={onClick}
            key={childNode.id}
            node={childNode}
          />
        );
      });
    }

    return (
      <li
        id={node.id}
        className={classNames(`list-item`, {
          "list-item--active": activeNodeIds.includes(node.id),
          "list-item--selected": selectedListItems.includes(node.id)
        })}
        onClick={event => {
          event.stopPropagation();
          onClick(node.id);
        }}
      >
        <div className="list-flex-row">
          <span className="list-arrow">
            {childNodes ? (
              <img
                className="list-arrow-icon"
                src={require("../assets/caret.svg")}
              />
            ) : null}
          </span>
          <span className="list-icon">
            <img
              src={require("../assets/" + node.type.toLowerCase() + ".svg")}
            />
          </span>
          <span className="list-name">{node.name.substring(0, 46)}</span>
        </div>
        {childNodes ? <ul className="sub-list">{childNodes}</ul> : null}
      </li>
    );
  }

  return (
    <div>
      <div className="flex-wrapper">
        <NodeList />
      </div>
    </div>
  );
};

export default App;
