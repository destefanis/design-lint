import * as React from "react";
import { useState } from "react";

function SettingsForm(props) {
  const [radiusValue, setRadiusValue] = useState("");

  const handleSubmit = event => {
    event.preventDefault();

    if (radiusValue.length) {
      parent.postMessage(
        {
          pluginMessage: {
            type: "update-border-radius",
            radiusValues: radiusValue
          }
        },
        "*"
      );
    }
  };

  function handleClear() {
    parent.postMessage(
      {
        pluginMessage: {
          type: "reset-border-radius"
        }
      },
      "*"
    );
  }

  return (
    <div className="settings-row">
      <form className="settings-form" onSubmit={handleSubmit}>
        <h3 className="settings-title">Border Radius</h3>
        <label className="settings-label">
          Set your preferred border radius values separated by commas (ex: "2,
          4, 6, 8").
        </label>
        <input
          type="text"
          placeholder={props.borderRadiusValues}
          className="settings-input"
          value={radiusValue}
          onChange={e => setRadiusValue(e.target.value)}
        />
      </form>
      <div className="button button--dark" onClick={handleClear}>
        Reset border radius
      </div>
    </div>
  );
}

export default SettingsForm;
