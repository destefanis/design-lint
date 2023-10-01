import * as React from "react";
import { motion, AnimatePresence } from "framer-motion/dist/framer-motion";
import "../styles/library.css";

const LibraryPage = ({ libraries = [], onUpdateLibraries, localStyles }) => {
  const hasLibraries = libraries && libraries.length > 0;

  const onLibraryImport = () => {
    parent.postMessage({ pluginMessage: { type: "save-library" } }, "*");
  };

  const removeLibrary = async index => {
    // Remove the library from the libraries array
    const updatedLibraries = [...libraries];
    updatedLibraries.splice(index, 1);

    // Update the state with the new libraries array
    onUpdateLibraries(updatedLibraries);

    // Send a message to the plugin layer to remove the library from client storage
    parent.postMessage(
      {
        pluginMessage: {
          type: "remove-library",
          index: index,
          storageArray: updatedLibraries
        }
      },
      "*"
    );
  };

  const variants = {
    initial: { opacity: 0, y: -12, scale: 1 },
    enter: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -12, scale: 1 }
  };

  return (
    <div className="library-wrapper">
      <div className="library-description">
        <h4 className="library-title">Local Styles</h4>
        <p>
          Design Lint uses styles found in your file for suggestions and
          automatic fixes first.
        </p>
      </div>
      <ul className="library-list">
        <li className="library-list-item" key="local-styles">
          <div className="library-icon-wrapper">
            <img
              className="library-icon"
              src={require("../assets/map-marker.svg")}
            />
          </div>
          <div className="library-list-item-content">
            <h3 className="item-content-title">Local Styles</h3>
            <span className="item-content-styles">
              {localStyles.styles} styles
            </span>
          </div>
        </li>
      </ul>
      <div className="library-description library-saved-section">
        <h4 className="library-title">Saved Libraries</h4>
        <div>
          <p>Want to automatically fix errors using styles from a library?</p>
          <ul>
            <li>Open the file where the styles are defined.</li>
            <li>Run the plugin and click "Save as Library."</li>
            <li>Restart Design Lint—your library is ready to use!</li>
          </ul>
        </div>
      </div>

      <ul className="library-list">
        <AnimatePresence mode="popLayout">
          {libraries.map((library, index) => (
            <motion.li
              className="library-list-item"
              key={index}
              positionTransition
              variants={variants}
              initial="initial"
              animate="enter"
              exit="exit"
            >
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
            </motion.li>
          ))}
          <motion.li
            className="library-list-item save-library"
            key="import"
            positionTransition
            onClick={onLibraryImport}
            whileTap={{ scale: 0.98, opacity: 0.8 }}
            variants={variants}
            initial="enter"
            animate="enter"
            exit="exit"
          >
            <div className="library-icon-wrapper">
              <img
                className="library-icon"
                src={require("../assets/add-blue.svg")}
              />
            </div>
            <h3 className="save-library-label">Save Library</h3>
          </motion.li>
        </AnimatePresence>
      </ul>
    </div>
  );
};

export default LibraryPage;
