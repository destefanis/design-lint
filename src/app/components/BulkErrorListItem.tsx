import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion/dist/framer-motion";

// A copy of ErrorListItem with slight differences for showing
// in the bulk list of errors.

function BulkErrorListItem(props) {
  const ref = useRef();
  const [menuState, setMenuState] = useState(false);
  let error = props.error;

  useOnClickOutside(ref, () => hideMenu());

  const showMenu = () => {
    setMenuState(true);
  };

  const hideMenu = () => {
    setMenuState(false);
  };

  function handleIgnoreChange(error) {
    props.handleIgnoreChange(error);
  }

  function handleSelectAll(error) {
    props.handleSelectAll(error);
  }

  function handleSelect(error) {
    props.handleSelect(error);
  }

  function handleIgnoreAll(error) {
    props.handleIgnoreAll(error);
  }

  function truncate(string) {
    return string.length > 52 ? string.substring(0, 49) + "..." : string;
  }

  const variants = {
    initial: { opacity: 0, y: 12, scale: 1 },
    enter: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -12, scale: 0.96 }
  };

  return (
    <motion.li
      className="error-list-item"
      ref={ref}
      onClick={showMenu}
      positionTransition
      key={error.node.id + props.index}
      variants={variants}
      initial="initial"
      animate="enter"
      exit="exit"
      type={error.type.toLowerCase()}
    >
      <div className="flex-row">
        <span className="error-type">
          <img
            src={require("../assets/error-type/" +
              error.type.toLowerCase() +
              ".svg")}
          />
        </span>
        <span className="error-description">
          {error.nodes.length > 1 ? (
            <div className="error-description__message">
              {error.message} ({error.count})
            </div>
          ) : (
            <div className="error-description__message">{error.message}</div>
          )}
          {error.value ? (
            <div className="current-value">{truncate(error.value)}</div>
          ) : null}
        </span>
        <span className="context-icon">
          <div className="menu" ref={ref}>
            <div className="menu-trigger" onClick={showMenu}>
              <img src={require("../assets/context.svg")} />
            </div>
          </div>
        </span>

        {error.nodes.length > 1 ? (
          <ul
            className={
              "menu-items select-menu__list " +
              (menuState ? "select-menu__list--active" : "")
            }
          >
            <li
              className="select-menu__list-item"
              key="list-item-1"
              onClick={event => {
                event.stopPropagation();
                handleSelectAll(error);
                hideMenu();
              }}
            >
              Select All ({error.count})
            </li>
            <li
              className="select-menu__list-item"
              key="list-item-3"
              onClick={event => {
                event.stopPropagation();
                handleIgnoreAll(error);
                hideMenu();
              }}
            >
              Ignore All
            </li>
          </ul>
        ) : (
          <ul
            className={
              "menu-items select-menu__list " +
              (menuState ? "select-menu__list--active" : "")
            }
          >
            <li
              className="select-menu__list-item"
              key="list-item-1"
              onClick={event => {
                event.stopPropagation();
                handleSelect(error);
                hideMenu();
              }}
            >
              Select
            </li>
            <li
              className="select-menu__list-item"
              key="list-item-2"
              onClick={event => {
                event.stopPropagation();
                handleIgnoreChange(error);
                hideMenu();
              }}
            >
              Ignore
            </li>
          </ul>
        )}
      </div>
    </motion.li>
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

export default BulkErrorListItem;
