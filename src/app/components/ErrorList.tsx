import * as React from "react";

function ErrorList(props) {
  console.log(props);

  // function setErrorIcon(type) {
  //   if (type === "fill") {
  //     return ()
  //   }
  // };

  const errorListItems = props.errors.map(error => (
    <li className="error-list-item">
      <span className="error-type">
        <img src={require("../assets/" + error.type.toLowerCase() + ".svg")} />
      </span>
      {error.message}
    </li>
  ));

  return <ul className="errors-list">{errorListItems}</ul>;
}

export default ErrorList;
