import * as React from "react";
import { motion } from "framer-motion";

import ListItem from "./ListItem";
import TotalErrorCount from "./TotalErrorCount";
import SettingsPanel from "./SettingsPanel";

function NodeList(props) {
  const [panelVisible, setPanelVisible] = React.useState(false);

  // Reduce the size of our array of errors by removing
  // nodes with no errors on them.
  let filteredErrorArray = props.errorArray.filter(
    item => item.errors.length >= 1
  );

  filteredErrorArray.forEach(item => {
    // Check each layer/node to see if an error that matches it's layer id
    if (props.ignoredErrorArray.some(x => x.node.id === item.id)) {
      // When we know a matching error exists loop over all the ignored
      // errors until we find it.
      props.ignoredErrorArray.forEach(ignoredError => {
        if (ignoredError.node.id === item.id) {
          // Loop over every error this layer/node until we find the
          // error that should be ignored, then remove it.
          for (let i = 0; i < item.errors.length; i++) {
            if (item.errors[i].value === ignoredError.value) {
              item.errors.splice(i, 1);
              i--;
            }
          }
        }
      });
    }
  });

  const handleNodeClick = id => {
    // Opens the panel if theres an error.
    let activeId = props.errorArray.find(e => e.id === id);

    if (activeId.errors.length) {
      // Pass the plugin the ID of the layer we want to fetch.
      parent.postMessage(
        { pluginMessage: { type: "fetch-layer-data", id: id } },
        "*"
      );

      props.onErrorUpdate(activeId);

      if (props.visibility === true) {
        props.onVisibleUpdate(false);
      } else {
        props.onVisibleUpdate(true);
      }
    }

    props.onSelectedListUpdate(id);
  };

  const handleOpenFirstError = () => {
    const lastItem = filteredErrorArray[filteredErrorArray.length - 1];
    handleNodeClick(lastItem.id);
  };

  const handlePanelVisible = boolean => {
    setPanelVisible(boolean);
  };

  const handleLintRulesChange = boolean => {
    props.updateLintRules(boolean);
  };

  const handleRefreshSelection = () => {
    props.onRefreshSelection();
  };

  const pageVariants = {
    initial: { opacity: 0, y: 24 },
    enter: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -24 }
  };

  if (props.nodeArray.length) {
    let nodes = props.nodeArray;

    const listItems = nodes.map(node => (
      <ListItem
        ignoredErrorArray={props.ignoredErrorArray}
        activeNodeIds={props.activeNodeIds}
        onClick={handleNodeClick}
        selectedListItems={props.selectedListItems}
        errorArray={filteredErrorArray}
        key={node.id}
        node={node}
      />
    ));

    return (
      <motion.div
        className="page"
        variants={pageVariants}
        exit="exit"
        initial="initial"
        animate="enter"
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20
        }}
      >
        <ul className="list">{listItems}</ul>
        <div className="footer">
          <TotalErrorCount errorArray={filteredErrorArray} />
          <div className="actions-row">
            <button
              className="icon icon--adjust icon--button settings-button"
              onClick={event => {
                event.stopPropagation();
                handlePanelVisible(true);
              }}
            ></button>
            <button
              className="button button--secondary"
              onClick={event => {
                event.stopPropagation();
                handleRefreshSelection();
              }}
            >
              Re-run
            </button>
            <button
              className="button button--primary button--flex"
              disabled={filteredErrorArray.length === 0}
              onClick={event => {
                event.stopPropagation();
                handleOpenFirstError();
              }}
            >
              Jump to next error →
            </button>
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
      </motion.div>
    );
  } else {
    return (
      <React.Fragment>
        <ul className="list"></ul>
        <TotalErrorCount errorArray={filteredErrorArray} />
      </React.Fragment>
    );
  }
}

export default React.memo(NodeList);
