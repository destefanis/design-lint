import * as React from "react";
import { motion } from "framer-motion/dist/framer-motion";
import "../styles/library.css";

const LibraryPage = ({ libraries = [], onUpdateLibraries }) => {
  const hasLibraries = libraries && libraries.length > 0;
  console.log(libraries);

  const onLibraryImport = () => {
    parent.postMessage({ pluginMessage: { type: "find-library" } }, "*");
  };

  const removeLibrary = async index => {
    // Remove the library from the libraries array
    const updatedLibraries = [...libraries];
    updatedLibraries.splice(index, 1);

    // Update the state with the new libraries array
    onUpdateLibraries(updatedLibraries);

    // Send a message to the plugin layer to remove the library from client storage
    parent.postMessage(
      { pluginMessage: { type: "remove-library", index } },
      "*"
    );
  };

  return (
    <div>
      {hasLibraries ? (
        <ul className="library-list">
          {libraries.map((library, index) => (
            <li className="library-list-item" key={index}>
              <div className="library-icon-wrapper">
                <img
                  className="library-icon"
                  src={require("../assets/library.svg")}
                />
              </div>
              <div className="library-list-item-content">
                <h3 className="item-content-title">{library.name}</h3>
                <span className="item-content-styles">
                  {library.styles} styles
                </span>
              </div>
              <motion.button
                onClick={() => removeLibrary(index)}
                className="icon icon--button library-remove"
                whileTap={{ scale: 0.9, opacity: 0.8 }}
              >
                <img src={require("../assets/subtract.svg")} />
              </motion.button>
            </li>
          ))}
          <li
            className="library-list-item"
            key="import"
            onClick={onLibraryImport}
          >
            <div className="library-icon-wrapper">
              <img
                className="library-icon"
                src={require("../assets/add.svg")}
              />
            </div>
            Save Library
          </li>
        </ul>
      ) : (
        <motion.div className="empty-state-wrapper">
          <div className="background-wrapper">
            <img
              className="empty-state-background"
              src={require("../assets/mesh-background.png")}
            />
          </div>
          <div className="empty-state">
            <div className="empty-state__image">
              <img
                className="layer-icon"
                src={require("../assets/new-logo.svg")}
              />
            </div>
            <div className="empty-state__title">
              Automatically fix errors by importing your styles.
            </div>
            <button
              className="button button--primary button--full"
              onClick={onLibraryImport}
            >
              Import Library
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default LibraryPage;
