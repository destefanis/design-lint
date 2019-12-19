import * as React from "react";

function NextButton(props) {
  let nextButton;

  function selectNext() {
    props.onHandleNav();
  }

  function NextAvailable(id, array) {
    let currentIndex = array.findIndex(item => item.id === id);

    if (array.length <= 1) {
      return false;
    } else {
      return true;
    }
  }

  if (NextAvailable(props.activeId.id, props.filteredErrorArray)) {
    nextButton = (
      <button onClick={selectNext} className="button button--next">
        Next
      </button>
    );
  } else {
    nextButton = (
      <button
        onClick={selectNext}
        disabled
        className="button button--disabled button--next"
      >
        Next
      </button>
    );
  }

  return <React.Fragment>{nextButton}</React.Fragment>;
}

export default NextButton;
