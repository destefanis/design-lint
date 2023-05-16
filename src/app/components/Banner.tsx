import React, { useState, useEffect } from "react";
import { motion } from "framer-motion/dist/framer-motion";

function Banner({ totalErrorsWithMatches, handleFixAllErrors }) {
  const [isLoading, setIsLoading] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);

  const handleClick = () => {
    if (!isLoading) {
      setIsLoading(true);

      handleFixAllErrors();

      const id = setTimeout(() => {
        setIsLoading(false);
      }, 2000);

      setTimeoutId(id);
    }
  };

  // Set up a cleanup function to cancel the timeout when the component is unmounted
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return (
    <div className="banner-wrapper">
      <div className="banner">
        <span>
          Automatic Fixes Available{" "}
          <span className="error-description__count">
            · ({totalErrorsWithMatches})
          </span>
        </span>
        <motion.button
          whileTap={{ scale: 0.98, opacity: 0.8 }}
          onClick={handleClick}
          className={
            isLoading
              ? "loading-button disabled auto-fix-button"
              : "loading-button auto-fix-button"
          }
        >
          {isLoading ? (
            <div className="button-loading-dots">
              <span className="button-dot" />
              <span className="button-dot" />
              <span className="button-dot" />
            </div>
          ) : (
            <>
              {/* <img
                className="button-sparkles"
                src={require("../assets/sparkles.svg")}
              /> */}
              <span className="auto-fix-button-label">Fix All</span>
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}

export default Banner;
