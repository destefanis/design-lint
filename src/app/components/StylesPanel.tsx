import * as React from "react";
import { motion } from "framer-motion/dist/framer-motion";
import PanelHeader from "./PanelHeader";
import "../styles/panel.css";

// Panel for comparing styles
function StylesPanel(props) {
  const isVisible = props.panelVisible;
  const error = props.error;
  let suggestion = null;

  console.log(props.error);

  const variants = {
    open: { opacity: 1, x: 0 },
    closed: { opacity: 0, x: "100%" }
  };

  function handleHide() {
    props.onHandlePanelVisible(false);
  }

  return (
    <React.Fragment>
      <motion.div
        className={`panel`}
        initial={{ opacity: 0, x: "100%" }}
        animate={isVisible ? "open" : "closed"}
        transition={{ duration: 0.3, type: "tween" }}
        variants={variants}
        key="styles-panel"
      >
        <PanelHeader
          title={"Compare Styles"}
          handleHide={handleHide}
        ></PanelHeader>

        {/* textObject.font = node.fontName.family;
    textObject.fontStyle = node.fontName.style;
    textObject.fontSize = node.fontSize;
    textObject.letterSpacingValue = node.letterSpacing.value;
    textObject.letterSpacingUnit = node.letterSpacing.unit;
    textObject.textAlignHorizontal = node.textAlignHorizontal;
    textObject.textAlignVertical = node.textAlignVertical;
    textObject.paragraphIndent = node.paragraphIndent;
    textObject.paragraphSpacing = node.paragraphSpacing;
    textObject.textCase = node.textCase; */}

        <div className="style-comparison">
          {error && (
            <>
              <div className="comparison-wrapper">
                <h4 className="comparison-title">Current</h4>
                <div className="comparison-row">
                  <div className="comparison-row-item row-item-grow">
                    <div className="comparison-value">
                      {props.error.textProperties.font}
                    </div>
                  </div>
                </div>
                <div className="comparison-row">
                  <div className="comparison-row-item">
                    <div className="comparison-value">
                      {props.error.textProperties.fontStyle}
                    </div>
                  </div>
                  <div className="comparison-row-item">
                    <div className="comparison-value">
                      <span className="comparison-label">Size:</span>
                      {props.error.textProperties.fontSize}
                    </div>
                  </div>
                </div>
                <div className="comparison-row">
                  <div className="comparison-row-item">
                    <img
                      className="comparison-icon"
                      src={require("../assets/line-height.svg")}
                    />
                    <div className="comparison-value">
                      {props.error.textProperties.lineHeight}
                    </div>
                  </div>
                  <div className="comparison-row-item">
                    <img
                      className="comparison-icon"
                      src={require("../assets/letter-spacing.svg")}
                    />
                    <div className="comparison-value">
                      {props.error.textProperties.letterSpacingValue}
                    </div>
                  </div>
                  <div className="comparison-row-item">
                    <img
                      className="comparison-icon"
                      src={require("../assets/paragraph-spacing.svg")}
                    />
                    <div className="comparison-value">
                      {props.error.textProperties.paragraphSpacing}
                    </div>
                  </div>
                </div>
                <div className="comparison-row">
                  <div className="comparison-row-item">
                    <div className="comparison-value">
                      <span className="comparison-label">Align:</span>
                      {props.error.textProperties.textAlignHorizontal.toLowerCase()}
                    </div>
                  </div>
                  <div className="comparison-row-item">
                    <div className="comparison-value">
                      <span className="comparison-label">V Align:</span>
                      {props.error.textProperties.textAlignVertical.toLowerCase()}
                    </div>
                  </div>
                </div>
                <div className="comparison-row">
                  <div className="comparison-row-item row-item-grow">
                    <div className="comparison-value">
                      <span className="comparison-label">Case:</span>
                      {props.error.textProperties.textCase.toLowerCase()}
                    </div>
                  </div>
                </div>
              </div>
              <div className="comparison-wrapper">
                <h4 className="comparison-title">
                  {error.suggestions[props.suggestion].name}
                </h4>
                <div className="comparison-row">
                  <div className="comparison-row-item row-item-grow">
                    <div className="comparison-value">
                      {
                        error.suggestions[props.suggestion].textProperties
                          .fontFamily
                      }
                    </div>
                  </div>
                </div>
                <div className="comparison-row">
                  <div className="comparison-row-item">
                    <div className="comparison-value">
                      {
                        error.suggestions[props.suggestion].textProperties
                          .fontStyle
                      }
                    </div>
                  </div>
                  <div className="comparison-row-item">
                    <div className="comparison-value">
                      <span className="comparison-label">Size:</span>
                      {
                        error.suggestions[props.suggestion].textProperties
                          .fontSize
                      }
                    </div>
                  </div>
                </div>
                <div className="comparison-row">
                  <div className="comparison-row-item">
                    <img
                      className="comparison-icon"
                      src={require("../assets/line-height.svg")}
                    />
                    <div className="comparison-value">
                      {
                        error.suggestions[props.suggestion].textProperties
                          .lineHeight.value
                      }
                      {error.suggestions[props.suggestion].textProperties
                        .lineHeight.value !==
                      props.error.textProperties.lineHeight ? (
                        <span className="difference">*</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="comparison-row-item">
                    <img
                      className="comparison-icon"
                      src={require("../assets/letter-spacing.svg")}
                    />
                    <div className="comparison-value">
                      {
                        error.suggestions[props.suggestion].textProperties
                          .letterSpacing.value
                      }
                      {error.suggestions[props.suggestion].textProperties
                        .letterSpacing.value !==
                      props.error.textProperties.letterSpacing ? (
                        <span className="difference">*</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="comparison-row-item">
                    <img
                      className="comparison-icon"
                      src={require("../assets/paragraph-spacing.svg")}
                    />
                    <div className="comparison-value">
                      {
                        error.suggestions[props.suggestion].textProperties
                          .paragraphSpacing
                      }
                      {error.suggestions[props.suggestion].textProperties
                        .paragraphSpacing !==
                      props.error.textProperties.paragraphSpacing ? (
                        <span className="difference">*</span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="comparison-row">
                  <div className="comparison-row-item">
                    <div className="comparison-value">
                      <span className="comparison-label">Align:</span>
                      {error.suggestions[props.suggestion].textProperties
                        .textAlignHorizontal !== undefined
                        ? error.suggestions[
                            props.suggestion
                          ].textProperties.textAlignHorizontal.toLowerCase()
                        : "-"}
                      {error.suggestions[props.suggestion].textProperties
                        .textAlignHorizontal !==
                      props.error.textProperties.textAlignHorizontal ? (
                        <span className="difference">*</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="comparison-row-item">
                    <div className="comparison-value">
                      <span className="comparison-label">V Align:</span>
                      {error.suggestions[props.suggestion].textProperties
                        .textAlignVertical !== undefined
                        ? error.suggestions[
                            props.suggestion
                          ].textProperties.textAlignVertical.toLowerCase()
                        : "-"}
                      {error.suggestions[props.suggestion].textProperties
                        .textAlignVertical !==
                      props.error.textProperties.textAlignVertical ? (
                        <span className="difference">*</span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="comparison-row">
                  <div className="comparison-row-item row-item-grow">
                    <div className="comparison-value">
                      <span className="comparison-label">Case:</span>
                      {error.suggestions[
                        props.suggestion
                      ].textProperties.textCase.toLowerCase()}
                      {error.suggestions[props.suggestion].textProperties
                        .textCase !== props.error.textProperties.textCase ? (
                        <span className="difference">*</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {isVisible ? <div className="overlay" onClick={handleHide}></div> : null}
    </React.Fragment>
  );
}

export default StylesPanel;
