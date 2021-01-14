import * as React from "react";
// import { useState, useRef, useEffect } from "react";

function BulkErrorList(props) {
  // Reduce the size of our array of errors by removing
  // nodes with no errors on them.
  let filteredErrorArray = props.errorArray.filter(
    item => item.errors.length >= 1
  );

  filteredErrorArray.forEach(item => {
    // console.log(countInstancesOfThisError(item));
    console.log(item);
  });

  // Finds how many other nodes have this exact error.
  function countInstancesOfThisError(error) {
    let nodesToBeSelected = [];

    error.forEach(item => {
      if (item.value === error.value) {
        if (item.type === error.type) {
          // nodesToBeSelected.push(item.node.id);
          nodesToBeSelected.push(item);
        }
      }
    });

    // return nodesToBeSelected.length;
    return nodesToBeSelected;
  }

  return <div className="bulk-errors-list">Errors go here</div>;
}

export default BulkErrorList;
