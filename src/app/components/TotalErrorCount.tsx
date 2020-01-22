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

  return (
    <React.Fragment>
      {totalErrorCount > 0 ? (
        <div className="total-error-count">
          <h5 className="total-error-header">Total Errors:</h5>
          <span className="error-count">{totalErrorCount}</span>
        </div>
      ) : (
        <div className="total-error-count total-error-count--success">
          <h5 className="total-error-header">All errors fixed!</h5>
          <span className="success-count">
            <svg
              width="12"
              height="10"
              viewBox="0 0 12 10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3.81353 7.88964L0.968732 4.78002L0 5.83147L3.81353 10L12 1.05145L11.0381 0L3.81353 7.88964Z"
                fill="white"
              />
            </svg>
          </span>
        </div>
      )}
    </React.Fragment>
  );
}

export default TotalErrorCount;
