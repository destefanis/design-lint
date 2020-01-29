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
      <div className="settings-form" onSubmit={handleSubmit}>
        <h3 className="settings-title">Border radius</h3>
        <div className="settings-label">
          Set your preferred border radius values separated by commas (ex: "2,
          4, 6, 8").
        </div>

        <div className="input-icon">
          <div className="input-icon__icon">
            <div className="icon icon--corner-radius icon--black-3"></div>
          </div>
          <input
            type="input"
            className="input-icon__input"
            defaultValue={props.borderRadiusValues}
            onChange={e => setRadiusValue(e.target.value)}
            placeholder="2, 4, 6, 8"
          />
        </div>
      </div>
      <div className="form-button-group">
        <div className="button button--primary" onClick={handleSubmit}>
          Save
        </div>
        <div className="w12"></div>
        <div className="button button--secondary" onClick={handleClear}>
          Reset
        </div>
      </div>
    </div>
  );
}

export default SettingsForm;
