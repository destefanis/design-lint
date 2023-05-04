import * as React from "react";
import StyleListItem from "./StyleListItem";

const StylesPage = ({ stylesInUse }) => {
  const hasStylesInUse = stylesInUse && stylesInUse.length > 0;

  return (
    <div className="styles-overview-wrapper">
      <div>
        <h4>Styles</h4>
        <p>Overview of how styles are used in your page.</p>
      </div>
      {stylesInUse && (
        <div>
          <h4>Fills</h4>
          <ul className="style-overview-list">
            {stylesInUse.fills.map((style, index) => (
              <StyleListItem style={style} index={index} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default StylesPage;
