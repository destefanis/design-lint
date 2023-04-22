import * as React from "react";

function truncateStyle(string) {
  return string.length > 28 ? string.substring(0, 28) + "..." : string;
}

const StyleContent = ({ style, type, error }) => {
  const renderStylePreview = () => {
    switch (type) {
      case "fill":
        return (
          <div
            className="style-preview fill-preview"
            style={{ background: error.fillColor }}
          ></div>
        );
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
            <span style={{ fontWeight: style.fontWeight }}>Ag</span>
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
