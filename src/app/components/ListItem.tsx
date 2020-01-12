import * as React from "react";
import classNames from "classnames";

function ListItem(props) {
  const { activeNodeIds, onClick } = props;
  const node = props.node;
  let childNodes = null;
  let errorObject = { errors: [] };
  let childErrorsCount = 0;

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

  // Check to see if this node has corresponding errors.
  if (filteredErrorArray.some(e => e.id === node.id)) {
    errorObject = filteredErrorArray.find(e => e.id === node.id);
  }

  // The component calls itself if there are children
  if (node.children) {
    // Find errors in this node's children.
    childErrorsCount = findNestedErrors(node);

    let reversedArray = node.children.slice().reverse();
    childNodes = reversedArray.map(function(childNode) {
      return (
        <ListItem
          ignoredErrorArray={props.ignoredErrorArray}
          activeNodeIds={props.activeNodeIds}
          selectedListItems={props.selectedListItems}
          errorArray={filteredErrorArray}
          onClick={onClick}
          key={childNode.id}
          node={childNode}
        />
      );
    });
  }

  // Recursive function for finding the amount of errors
  // nested within this nodes children.
  function findNestedErrors(node) {
    let errorCount = 0;

    node.children.forEach(childNode => {
      if (filteredErrorArray.some(e => e.id === childNode.id)) {
        let childErrorObject = filteredErrorArray.find(
          e => e.id === childNode.id
        );
        errorCount = errorCount + childErrorObject.errors.length;
      }

      if (childNode.children) {
        errorCount = errorCount + findNestedErrors(childNode);
      }
    });

    return errorCount;
  }

  return (
    <li
      id={node.id}
      className={classNames(`list-item`, {
        "list-item--active": props.activeNodeIds.includes(node.id),
        "list-item--selected": props.selectedListItems.includes(node.id)
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
          <img src={require("../assets/" + node.type.toLowerCase() + ".svg")} />
        </span>
        <span className="list-name">{node.name.substring(0, 46)}</span>
        {childErrorsCount >= 1 && (
          <span className="child-error-count">{/* {childErrorsCount} */}</span>
        )}
        {errorObject.errors.length >= 1 && (
          <span className="error-count">{errorObject.errors.length}</span>
        )}
      </div>
      {childNodes ? <ul className="sub-list">{childNodes}</ul> : null}
    </li>
  );
}

export default ListItem;
