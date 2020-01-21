import * as React from "react";

function TotalErrorCount(props) {
  let totalErrorCount = determineCount(props.errorArray);

  function determineCount(array) {
    let count = 0;

    array.forEach(arrayItem => {
      if (arrayItem.errors) {
        count = count + arrayItem.errors.length;
      }
    });

    return count;
  }

  // if (totalErrorCount === 0) {
  //   console.log('all clear!');
  // }

  return (
    <div className="total-error-count">
      <h5 className="total-error-header">Total Errors:</h5>
      <span className="error-count">{totalErrorCount}</span>
    </div>
  );
}

export default TotalErrorCount;
