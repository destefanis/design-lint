import * as React from "react";

function truncateStyle(string) {
  return string.length > 40 ? string.substring(0, 40) + "..." : string;
}

const StyleContent = ({ style, type, error }) => {
  const renderStylePreview = () => {
    switch (type) {
      case "fill":
        if (error.fillColor) {
          return (
            <div
              className="style-preview fill-preview"
              style={{ background: error.fillColor }}
            ></div>
          );
        } else if (error.paint.type === "IMAGE") {
          return (
            <div className="style-preview">
              <img
                className="style-icon"
                src={require("../assets/image.svg")}
              />
            </div>
          );
        } else if (error.paint.type === "VIDEO") {
          return (
            <div className="style-preview">
              <img
                className="style-icon"
                src={require("../assets/video.svg")}
              />
            </div>
          );
        } else {
          return (
            <div
              className="style-preview fill-preview"
              style={{ background: error.fillColor }}
            ></div>
          );
        }
      case "stroke":
        return (
          <div
            className="style-preview fill-preview"
            style={{ background: error.fillColor }}
          ></div>
        );
      case "text":
        return (
          <div className="style-preview text-preview">
            <span style={{ fontWeight: style.style.fontStyle }}>Ag</span>
          </div>
        );
      case "effects":
        return (
          <div className="style-preview effect-preview">
            <img
              className="effect-icon"
              src={getEffectIcon(style.effects[0].type)}
              alt={style.effectType}
            />
          </div>
        );
      case "effect":
        return (
          <div className="style-preview effect-preview">
            <img
              className="effect-icon"
              src={getEffectIcon(style.effects[0].type)}
              alt={style.effectType}
            />
          </div>
        );
      default:
        return null;
    }
  };

  const getEffectIcon = effectType => {
    switch (effectType) {
      case "DROP_SHADOW":
        return require("../assets/drop-shadow.svg");
      case "INNER_SHADOW":
        return require("../assets/inner-shadow.svg");
      case "LAYER_BLUR":
        return require("../assets/layer-blur.svg");
      case "BACKGROUND_BLUR":
        return require("../assets/background-blur.svg");
      default:
        return "";
    }
  };

  return (
    <div className="style-list-item">
      {renderStylePreview()}
      <span className="style-name">{truncateStyle(style.name)}</span>
    </div>
  );
};

export default StyleContent;
