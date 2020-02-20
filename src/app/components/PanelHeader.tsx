import * as React from "react";

function PanelHeader(props) {
  return (
    <div className="panel-header">
      <div className="panel-header__action">
        <button className="button--icon" onClick={props.handleHide}>
          →
        </button>
      </div>
      <div className="panel-header__title">{props.title}</div>
    </div>
  );
}

export default PanelHeader;
