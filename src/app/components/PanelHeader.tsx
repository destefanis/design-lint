import * as React from "react";

function PanelHeader(props) {
  return (
    <div className="panel__header">
      <div className="panel__action">
        <button className="button--icon" onClick={props.handleHide}>
          →
        </button>
      </div>
      <h2 className="panel__title">{props.title}</h2>
    </div>
  );
}

export default PanelHeader;
