import * as React from "react";

function ErrorList(props) {
  console.log(props);
  const errorListItems = props.errors.map(error => (
    <li className="error-list-item">{error.message}</li>
  ));

  return <ul className="errors-list">{errorListItems}</ul>;
}

export default ErrorList;
