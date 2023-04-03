import * as React from "react";
import ErrorListItem from "./ErrorListItem";

function ErrorList(props) {
  const handleIgnoreClick = error => {
    props.onIgnoredUpdate(error);
  };

  const handleIgnoreAll = error => {
    props.onIgnoreAll(error);
  };

  const handleSelectAll = error => {
    props.onSelectAll(error);
  };

  // Finds how many other nodes have this exact error.
  function countInstancesOfThisError(error) {
    let nodesToBeSelected = [];

    props.allErrors.forEach(node => {
      node.errors.forEach(item => {
        if (item.value === error.value) {
          if (item.type === error.type) {
            nodesToBeSelected.push(item.node.id);
          }
        }
      });
    });

    return nodesToBeSelected.length;
  }

  // ErrorListItem and BulkErrorListItem are nearly indentical bar a
  // few differences in what information and context menu items they have.
  const errorListItems = props.errors.map((error, index) => (
    <ErrorListItem
      error={error}
      errorCount={countInstancesOfThisError(error)}
      index={index}
      key={index}
      handleIgnoreChange={handleIgnoreClick}
      handleSelectAll={handleSelectAll}
      handleIgnoreAll={handleIgnoreAll}
    />
  ));

  return <ul className="errors-list errors-list-panel">{errorListItems}</ul>;
}

export default React.memo(ErrorList);
