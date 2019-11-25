import * as React from "react";
import classNames from "classnames";

function ErrorList(props) {
  const errorListItems = props.errors.map(error => (
    <li className="error-list-item">{error}</li>
  ));

  return <ul className="errors-list">{errorListItems}</ul>;
}

export default ErrorList;
