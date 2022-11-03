// Linting functions

// Generic function for creating an error object to pass to the app.
export function createErrorObject(node, type, message, value?) {
  let error = {
    message: "",
    type: "",
    node: "",
    value: ""
  };

  error.message = message;
  error.type = type;
  error.node = node;

  if (value !== undefined) {
    error.value = value;
  }

  return error;
}

// Determine a nodes fills
export function determineFill(fills) {
  let fillValues = [];

  fills.forEach(fill => {
    if (fill.type === "SOLID") {
      let rgbObj = convertColor(fill.color);
      fillValues.push(RGBToHex(rgbObj["r"], rgbObj["g"], rgbObj["b"]));
    } else if (fill.type === "IMAGE") {
      fillValues.push("Image - " + fill.imageHash);
    } else {
      const gradientValues = [];
      fill.gradientStops.forEach(gradientStops => {
        let gradientColorObject = convertColor(gradientStops.color);
        gradientValues.push(
          RGBToHex(
            gradientColorObject["r"],
            gradientColorObject["g"],
            gradientColorObject["b"]
          )
        );
      });
      let gradientValueString = gradientValues.toString();
      fillValues.push(`${fill.type} ${gradientValueString}`);
    }
  });

  return fillValues[0];
}

// Lint border radius
export function checkRadius(node, errors, radiusValues) {
  let cornerType = node.cornerRadius;

  // If node has a key, then recognizes as a symbol and ignores the radius check
  if (node.key) {
    return;
  }

  if (typeof cornerType !== "symbol") {
    if (cornerType === 0) {
      return;
    }
  }

  // If the radius isn't even on all sides, check each corner.
  if (typeof cornerType === "symbol") {
    if (radiusValues.indexOf(node.topLeftRadius) === -1) {
      return errors.push(
        createErrorObject(
          node,
          "radius",
          "Incorrect Top Left Radius",
          node.topRightRadius
        )
      );
    } else if (radiusValues.indexOf(node.topRightRadius) === -1) {
      return errors.push(
        createErrorObject(
          node,
          "radius",
          "Incorrect top right radius",
          node.topRightRadius
        )
      );
    } else if (radiusValues.indexOf(node.bottomLeftRadius) === -1) {
      return errors.push(
        createErrorObject(
          node,
          "radius",
          "Incorrect bottom left radius",
          node.bottomLeftRadius
        )
      );
    } else if (radiusValues.indexOf(node.bottomRightRadius) === -1) {
      return errors.push(
        createErrorObject(
          node,
          "radius",
          "Incorrect bottom right radius",
          node.bottomRightRadius
        )
      );
    } else {
      return;
    }
  } else {
    if (radiusValues.indexOf(node.cornerRadius) === -1) {
      return errors.push(
        createErrorObject(
          node,
          "radius",
          "Incorrect border radius",
          node.cornerRadius
        )
      );
    } else {
      return;
    }
  }
}

/**
 * We strip the additional style key characters so we can check to see if the fill is being used incorrectly
 */
function getFillStyleValue(nodeFillStyle = "") {
  nodeFillStyle = nodeFillStyle.replace("S:", "");
  nodeFillStyle = nodeFillStyle.split(",")[0];
  return nodeFillStyle;
}

// Custom Lint rule that isn't being used yet!
// that ensures our text fills aren't using styles (design tokens) meant for backgrounds.
export function customCheckTextFills(node, errors) {
  // Here we create an array of style keys (https://www.figma.com/plugin-docs/api/PaintStyle/#key)
  // that we want to make sure our text layers aren't using.
  const fillsToCheck = [
    // Light Theme  Text colors
    //Primary
    "4ee8eb5a438921bf08fde7a869da362c276e14e4",
    //Secondary
    "7d1489ff665e5bf5685e4421aafe8c40232c665a",
    //Destructive
    "7318fda20379fe55fe4f6d2aff16f5bc0ddd862d",

    // Light Brand Colors
    //Accent
    "54c06c9ac31536f8df989c6ec50ad9e77ff43bfc",
    //Label
    "040c3240b8b16be432f802a55346e9afd4e563fa"
    // To collect style keys, use a plugin like Inspector, or use console commands like figma.getLocalPaintStyles();
    // in your design system file.
  ];

  let nodeFillStyle = node.fillStyleId;

  // If there are multiple text styles on a single text layer, we can't lint it
  // we can return an error instead.
  if (typeof nodeFillStyle === "symbol") {
    return errors.push(
      createErrorObject(
        node, // Node object we use to reference the error (id, layer name, etc)
        "fill", // Type of error (fill, text, effect, etc)
        "Mixing two styles together", // Message we show to the user
        "Multiple Styles" // Normally we return a hex value here
      )
    );
  }

  const fillStyleValue = getFillStyleValue(nodeFillStyle);

  // If the node (layer) has a fill style, then check to see if there's an error.
  if (fillStyleValue !== "") {
    // If we find the layer has a fillStyle that is not in the array create an error.
    if (!fillsToCheck.includes(fillStyleValue)) {
      return errors.push(
        createErrorObject(
          node, // Node object we use to reference the error (id, layer name, etc)
          "fill", // Type of error (fill, text, effect, etc)
          "Incorrect text color use", // Message we show to the user
          "Using incorrect color on a text layer" // Determines the fill, so we can show a hex value.
        )
      );
    }
    // If there is no fillStyle on this layer,
    // check to see why with our default linting function for fills.
  } else {
    checkFills(node, errors);
  }
}

export function checkBGFills(node, errors) {
  // Do not run if it's a text node
  if (node.type === "TEXT") return;

  // Populate with real Background colors
  const fillsToCheck = [
    //Background
    "92acfdac868878eada624466b66226f82b28e525",
    //Surface
    "547bb9893a38846fb746e7c6ab0b0d50ee596460",
    //Container
    "b9a9acff5a3fad4bd308e98c482cfe97ca97b99d",
    // Icon
    "1e6cc43ca295b794b93f52422513b578e6409c1e"
  ];

  const nodeFillStyle = node.fillStyleId;
  const fillStyleValue = getFillStyleValue(nodeFillStyle);

  // If the node (layer) has a fill style, then check to see if there's an error.
  if (fillStyleValue !== "") {
    // If we find the layer has a fillStyle that is not in the array create an error.
    if (!fillsToCheck.includes(fillStyleValue)) {
      return errors.push(
        createErrorObject(
          node, // Node object we use to reference the error (id, layer name, etc)
          "fill", // Type of error (fill, text, effect, etc)
          "Incorrect background color use", // Message we show to the user
          "Using incorrect color on a background layer" // Determines the fill, so we can show a hex value.
        )
      );
    }
  }
}

// Check for effects like shadows, blurs etc.
export function checkEffects(node, errors) {
  if (node.effects.length) {
    if (node.effectStyleId === "") {
      const effectsArray = [];

      node.effects.forEach(effect => {
        let effectsObject = {
          type: "",
          radius: "",
          offsetX: "",
          offsetY: "",
          fill: "",
          value: ""
        };

        // All effects have a radius.
        effectsObject.radius = effect.radius;

        if (effect.type === "DROP_SHADOW") {
          effectsObject.type = "Drop Shadow";
        } else if (effect.type === "INNER_SHADOW") {
          effectsObject.type = "Inner Shadow";
        } else if (effect.type === "LAYER_BLUR") {
          effectsObject.type = "Layer Blur";
        } else {
          effectsObject.type = "Background Blur";
        }

        if (effect.color) {
          let effectsFill = convertColor(effect.color);
          effectsObject.fill = RGBToHex(
            effectsFill["r"],
            effectsFill["g"],
            effectsFill["b"]
          );
          effectsObject.offsetX = effect.offset.x;
          effectsObject.offsetY = effect.offset.y;
          effectsObject.value = `${effectsObject.type} ${effectsObject.fill} ${effectsObject.radius}px X: ${effectsObject.offsetX}, Y: ${effectsObject.offsetY}`;
        } else {
          effectsObject.value = `${effectsObject.type} ${effectsObject.radius}px`;
        }

        effectsArray.unshift(effectsObject);
      });

      let currentStyle = effectsArray[0].value;

      return errors.push(
        createErrorObject(
          node,
          "effects",
          "Missing effects style",
          currentStyle
        )
      );
    } else {
      return;
    }
  }
}

export function checkFills(node, errors) {
  if (node.fills.length && node.visible === true) {
    if (
      node.fillStyleId === "" &&
      node.fills[0].type !== "IMAGE" &&
      node.fills[0].visible === true
    ) {
      // We may need an array to loop through fill types.
      return errors.push(
        createErrorObject(
          node,
          "fill",
          "Missing fill style",
          determineFill(node.fills)
        )
      );
    } else {
      checkBGFills(node, errors);
      return;
    }
  }
}

export function checkStrokes(node, errors) {
  const strokeToCheck = [
    //Stroke Style Id to check
    //Light Stystem Lines
    //Lines
    "3a5ae402993a2d4e4f1a3b31e03b3a4a052b0d23"
  ];

  const symbolsToIgnore = [
    // Component List for stroke
    // This need a component Key
  ];

  // // If it is from an specific symbol we don't return Error
  if (symbolsToIgnore.includes(node.key)) {
    return;
  }

  if (node.strokes.length) {
    if (node.strokeStyleId === "" && node.visible === true) {
      let strokeObject = {
        strokeWeight: "",
        strokeAlign: "",
        strokeFills: []
      };

      strokeObject.strokeWeight = node.strokeWeight;
      strokeObject.strokeAlign = node.strokeAlign;
      strokeObject.strokeFills = determineFill(node.strokes);

      let currentStyle = `${strokeObject.strokeFills} / ${strokeObject.strokeWeight} / ${strokeObject.strokeAlign}`;

      return errors.push(
        createErrorObject(node, "stroke", "Missing stroke style", currentStyle)
      );
    } else if (node.visible === true && node.strokeStyleId != "") {
      let nodeStrokeStyleId = node.strokeStyleId;
      // We strip the additional style key characters so we can check
      // to see if the stroke is being used incorrectly.
      nodeStrokeStyleId = nodeStrokeStyleId.replace("S:", "");
      nodeStrokeStyleId = nodeStrokeStyleId.split(",")[0];

      if (!strokeToCheck.includes(nodeStrokeStyleId)) {
        let strokeObject = {
          strokeWeight: "",
          strokeAlign: "",
          strokeFills: []
        };

        strokeObject.strokeWeight = node.strokeWeight;
        strokeObject.strokeAlign = node.strokeAlign;
        strokeObject.strokeFills = determineFill(node.strokes);

        let currentStyle = `${strokeObject.strokeFills} / ${strokeObject.strokeWeight} / ${strokeObject.strokeAlign}`;

        return errors.push(
          createErrorObject(node, "stroke", "Wrong stroke style", currentStyle)
        );
      } else {
        return;
      }
    } else {
      return;
    }
  } else {
    return;
  }
}

export function ignoreSymbols(node) {
  const symbolsToIgnore = [
    // Components to exclude (Android and iOS System)
    //Android Bottom Navigation
    "3b7f1611a36d94c2dfd8d1bdcd016320bad1e1c5",
    //Button
    "4c176fb66019af2b55fcd687fa5c358c63251e44"
  ];

  // // if it is an specific symbol, we don't return an error
  if (symbolsToIgnore.includes(node.key)) {
    return;
  } else {
    return;
  }
}

export function checkType(node, errors) {
  if (node.textStyleId === "" && node.visible === true) {
    let textObject = {
      font: "",
      fontStyle: "",
      fontSize: "",
      lineHeight: {}
    };

    textObject.font = node.fontName.family;
    textObject.fontStyle = node.fontName.style;
    textObject.fontSize = node.fontSize;

    // Line height can be "auto" or a pixel value
    if (node.lineHeight.value !== undefined) {
      textObject.lineHeight = node.lineHeight.value;
    } else {
      textObject.lineHeight = "Auto";
    }

    let currentStyle = `${textObject.font} ${textObject.fontStyle} / ${textObject.fontSize} (${textObject.lineHeight} line-height)`;

    return errors.push(
      createErrorObject(node, "text", "Missing text style", currentStyle)
    );
  } else {
    return;
  }
}

// Utility functions for color conversion.
const convertColor = color => {
  const colorObj = color;
  const figmaColor = {};

  Object.entries(colorObj).forEach(cf => {
    const [key, value] = cf;

    if (["r", "g", "b"].includes(key)) {
      figmaColor[key] = (255 * (value as number)).toFixed(0);
    }
    if (key === "a") {
      figmaColor[key] = value;
    }
  });
  return figmaColor;
};

function RGBToHex(r, g, b) {
  r = Number(r).toString(16);
  g = Number(g).toString(16);
  b = Number(b).toString(16);

  if (r.length == 1) r = "0" + r;
  if (g.length == 1) g = "0" + g;
  if (b.length == 1) b = "0" + b;

  return "#" + r + g + b;
}
