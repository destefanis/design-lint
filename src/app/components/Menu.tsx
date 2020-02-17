import * as React from "react";
import { useState, useRef, useEffect } from "react";

function Menu(props) {
  const ref = useRef();
  const [menuState, setMenuState] = useState(false);

  useOnClickOutside(ref, () => hideMenu());

  const showMenu = () => {
    setMenuState(true);
  };

  const hideMenu = () => {
    setMenuState(false);
  };

  return (
    <div className="menu" ref={ref}>
      <div className="menu-trigger" onClick={showMenu}>
        <img src={require("../assets/context.svg")} />
      </div>
      <ul
        className={
          "menu-items select-menu__list " +
          (menuState ? "select-menu__list--active" : "")
        }
      >
        {props.menuItems.map((item, i) => {
          return (
            <li
              className="select-menu__list-item"
              key={i}
              onClick={event => {
                event.stopPropagation();
                item.event(props.error);
                hideMenu();
              }}
            >
              {item.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// React hook click outside the component
function useOnClickOutside(ref, handler) {
  useEffect(() => {
    const listener = event => {
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler(event);
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

export default React.memo(Menu);
