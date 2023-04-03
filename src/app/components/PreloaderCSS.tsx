import * as React from "react";

function PreloaderCSS() {
  const loading = (
    <div className="css-preloader">
      <div className="css-preloader-row">
        <div className="circle circle--first"></div>
        <div className="circle circle--second"></div>
        <div className="circle circle--third"></div>
      </div>
    </div>
  );

  return <React.Fragment>{loading}</React.Fragment>;
}

export default PreloaderCSS;
