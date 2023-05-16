// Linting functions

// Generic function for creating an error object to pass to the app.
export function createErrorObject(
  node,
  type,
  message,
  value?,
  matches?,
  suggestions?,
  fillColor?,
  textProperties?
) {
  let error = {
    message: "",
    type: "",
    node: "",
    value: "",
    ...(matches && { matches: matches }),
    ...(suggestions && { suggestions: suggestions }),
    fillColor: "",
    textProperties: {}
  };

  error.message = message;
  error.type = type;
  error.node = node;
  error.fillColor = fillColor;
  error.textProperties = textProperties;

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
    } else if (fill.type === "VIDEO") {
      fillValues.push("Video Fill");
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
      gradientValueString = gradientValueString.replace(/,/g, ", ");
      let gradientType = null;

      if (fill.type === "GRADIENT_LINEAR") {
        gradientType = "Linear Gradient";
      } else if (fill.type === "GRADIENT_RADIAL") {
        gradientType = "Radial Gradient";
      } else if (fill.type === "GRADIENT_ANGULAR") {
        gradientType = "Angular Gradient";
      } else if (fill.type === "GRADIENT_DIAMOND") {
        gradientType = "Diamond Gradient";
      }

      fillValues.push(`${gradientType} ${gradientValueString}`);
    }
  });

  return fillValues[0];
}

// Lint border radius
export function checkRadius(node, errors, radiusValues) {
  let cornerType = node.cornerRadius;

  if (typeof cornerType !== "symbol") {
    if (cornerType === 0) {
      return;
    }
    if (cornerType === node.height) {
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

// Custom Lint rule that isn't being used yet!
// that ensures our text fills aren't using styles (design tokens) meant for backgrounds.
export function customCheckTextFills(node, errors) {
  // Here we create an array of style keys (https://www.figma.com/plugin-docs/api/PaintStyle/#key)
  // that we want to make sure our text layers aren't using.
  const fillsToCheck = [
    "4b93d40f61be15e255e87948a715521c3ae957e6"
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

  // We strip the additional style key characters so we can check
  // to see if the fill is being used incorrectly.
  nodeFillStyle = nodeFillStyle.replace("S:", "");
  nodeFillStyle = nodeFillStyle.split(",")[0];

  // If the node (layer) has a fill style, then check to see if there's an error.
  if (nodeFillStyle !== "") {
    // If we find the layer has a fillStyle that matches in the array create an error.
    if (fillsToCheck.includes(nodeFillStyle)) {
      return errors.push(
        createErrorObject(
          node, // Node object we use to reference the error (id, layer name, etc)
          "fill", // Type of error (fill, text, effect, etc)
          "Incorrect text color use", // Message we show to the user
          "Using a background color on a text layer" // Determines the fill, so we can show a hex value.
        )
      );
    }
    // If there is no fillStyle on this layer,
    // check to see why with our default linting function for fills.
  } else {
    checkFills(node, errors);
  }
}

// Compares colors to see if they're equal.
function colorsAreEqual(color1, color2) {
  const threshold = 0.0001;
  const rDiff = Math.abs(color1.r - color2.r);
  const gDiff = Math.abs(color1.g - color2.g);
  const bDiff = Math.abs(color1.b - color2.b);
  const aDiff = Math.abs(color1.a - color2.a);

  return (
    rDiff < threshold &&
    gDiff < threshold &&
    bDiff < threshold &&
    aDiff < threshold
  );
}

// Helper function for comparing effect types to see if there's a match.
function effectsMatch(nodeEffects, styleEffects) {
  if (nodeEffects.length !== styleEffects.length) return false;

  return nodeEffects.every((nodeEffect, index) => {
    const styleEffect = styleEffects[index];

    if (nodeEffect.type !== styleEffect.type) return false;
    if (nodeEffect.radius !== styleEffect.radius) return false;

    if (nodeEffect.color) {
      const nodeColor = convertColor(nodeEffect.color);
      const styleColor = convertColor(styleEffect.color);

      if (!colorsAreEqual(nodeColor, styleColor)) return false;
    }

    if (
      nodeEffect.type === "DROP_SHADOW" ||
      nodeEffect.type === "INNER_SHADOW"
    ) {
      if (
        nodeEffect.offset.x !== styleEffect.offset.x ||
        nodeEffect.offset.y !== styleEffect.offset.y ||
        nodeEffect.spread !== styleEffect.spread
      ) {
        return false;
      }
    }

    return true;
  });
}

export function newCheckEffects(
  node,
  errors,
  libraries,
  localStylesLibrary,
  importedStyles
) {
  if (node.effects.length && node.visible === true) {
    let effectStyleId = node.effectStyleId;

    if (typeof effectStyleId === "symbol") {
      return;
    }

    if (node.effectStyleId === "") {
      let matchingEffects = [];

      // Generate currentStyle string
      let currentStyle = node.effects
        .map(effect => {
          let type = effect.type
            .replace(/_/g, " ")
            .toLowerCase()
            .replace(/\b[a-z]/g, l => l.toUpperCase());
          let radius = effect.radius;
          let offsetX = effect.offset ? effect.offset.x : "";
          let offsetY = effect.offset ? effect.offset.y : "";
          let color = effect.color
            ? RGBToHex(...Object.values(convertColor(effect.color)))
            : "";

          if (type === "DROP_SHADOW" || type === "INNER_SHADOW") {
            return `${type} ${color} ${radius}px X: ${offsetX}, Y: ${offsetY}`;
          } else {
            return `${type} ${radius}px`;
          }
        })
        .join(", ");

      if (importedStyles && importedStyles.effects) {
        matchingEffects = importedStyles.effects
          .map(effectStyle => ({
            name: effectStyle.name,
            id: effectStyle.id,
            key: effectStyle.id.replace(/S:|,/g, ""),
            value: effectStyle.name,
            source: "Remote Style",
            effects: effectStyle.effects
          }))
          .filter(effectStyle =>
            effectsMatch(node.effects, effectStyle.effects)
          );
      }

      if (matchingEffects.length === 0) {
        if (localStylesLibrary && localStylesLibrary.effects) {
          matchingEffects = localStylesLibrary.effects
            .map(effectStyle => ({
              name: effectStyle.name,
              id: effectStyle.id,
              key: effectStyle.id.replace(/S:|,/g, ""),
              value: effectStyle.name,
              source: "Local Library",
              effects: effectStyle.effects
            }))
            .filter(effectStyle =>
              effectsMatch(node.effects, effectStyle.effects)
            );
        }
      }

      if (libraries && libraries.length > 0) {
        for (const library of libraries) {
          if (library.effects && library.effects.length > 0) {
            for (const effectStyle of library.effects) {
              if (effectsMatch(node.effects, effectStyle.effects)) {
                matchingEffects.push({
                  name: effectStyle.name,
                  key: effectStyle.id.replace(/S:|,/g, ""),
                  id: effectStyle.id,
                  value: effectStyle.name,
                  source: library.name
                });
              }
            }
          }
        }
      }

      if (matchingEffects.length > 0) {
        return errors.push(
          createErrorObject(
            node,
            "effects",
            "Missing effects style",
            currentStyle,
            matchingEffects
          )
        );
      } else {
        return errors.push(
          createErrorObject(
            node,
            "effects",
            "Missing effects style",
            currentStyle
          )
        );
      }
    } else {
      return;
    }
  }
}

// Check for effects like shadows, blurs etc.
export function checkEffects(node, errors) {
  if (node.effects.length && node.visible === true) {
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

export function gradientToCSS(nodeFill) {
  const nodeFillType = nodeFill.type;
  let cssGradient = "";

  if (nodeFillType === "GRADIENT_LINEAR") {
    const stops = nodeFill.gradientStops
      .map(stop => {
        const color = `rgba(${Math.round(stop.color.r * 255)}, ${Math.round(
          stop.color.g * 255
        )}, ${Math.round(stop.color.b * 255)}, ${stop.color.a})`;
        return `${color} ${Math.round(stop.position * 100)}%`;
      })
      .join(", ");
    cssGradient = `linear-gradient(${stops})`;
  } else if (
    nodeFillType === "GRADIENT_RADIAL" ||
    nodeFillType === "GRADIENT_DIAMOND"
  ) {
    const stops = nodeFill.gradientStops
      .map(stop => {
        const color = `rgba(${Math.round(stop.color.r * 255)}, ${Math.round(
          stop.color.g * 255
        )}, ${Math.round(stop.color.b * 255)}, ${stop.color.a})`;
        return `${color} ${Math.round(stop.position * 100)}%`;
      })
      .join(", ");
    cssGradient = `radial-gradient(${stops})`;
  } else if (nodeFillType === "GRADIENT_ANGULAR") {
    const stops = nodeFill.gradientStops
      .map(stop => {
        const color = `rgba(${Math.round(stop.color.r * 255)}, ${Math.round(
          stop.color.g * 255
        )}, ${Math.round(stop.color.b * 255)}, ${stop.color.a})`;
        return `${color} ${Math.round(stop.position * 100)}%`;
      })
      .join(", ");
    cssGradient = `conic-gradient(${stops})`;
  }

  return cssGradient;
}

// Check library and local styles for matching
function checkMatchingFills(style, nodeFill) {
  // If style or nodeFill is undefined, return false
  if (!style || !nodeFill) {
    return false;
  }

  // If we pass an array, we need to just check the first fill as that's what is visible.
  if (Array.isArray(nodeFill)) {
    nodeFill = nodeFill[nodeFill.length - 1];
  }

  if (nodeFill.type === "SOLID" && style.type === "SOLID") {
    return (
      style.color.r === nodeFill.color.r &&
      style.color.g === nodeFill.color.g &&
      style.color.b === nodeFill.color.b &&
      style.opacity === nodeFill.opacity
    );
  } else if (
    (nodeFill.type === "GRADIENT_LINEAR" && style.type === "GRADIENT_LINEAR") ||
    (nodeFill.type === "GRADIENT_RADIAL" && style.type === "GRADIENT_RADIAL") ||
    (nodeFill.type === "GRADIENT_ANGULAR" &&
      style.type === "GRADIENT_ANGULAR") ||
    (nodeFill.type === "GRADIENT_DIAMOND" && style.type === "GRADIENT_DIAMOND")
  ) {
    return determineFill([style]) === determineFill([nodeFill]);
  }

  return false;
}

export function newCheckFills(
  node,
  errors,
  libraries,
  localStylesLibrary,
  importedStyles
) {
  if (
    (node.fills.length && node.visible === true) ||
    typeof node.fills === "symbol"
  ) {
    let nodeFills = node.fills;
    let fillStyleId = node.fillStyleId;

    if (typeof nodeFills === "symbol") {
      return errors.push(
        createErrorObject(node, "fill", "Missing fill style", "Mixed values")
      );
    }

    if (typeof fillStyleId === "symbol") {
      return;
    }

    // If the fills are visible, aren't an image or a video, then lint them.
    if (
      node.fillStyleId === "" &&
      node.fills[0].type !== "IMAGE" &&
      node.fills[0].type !== "VIDEO" &&
      node.fills[0].visible === true
    ) {
      let matchingFills = [];
      let suggestedFills = [];

      if (importedStyles && importedStyles.fills) {
        matchingFills = importedStyles.fills
          .map(fillStyle => ({
            name: fillStyle.name,
            id: fillStyle.id,
            key: fillStyle.id.replace(/S:|,/g, ""),
            value: fillStyle.name,
            source: "Remote Style",
            paint: fillStyle.paint,
            count: fillStyle.count
          }))
          .filter(fillStyle => checkMatchingFills(fillStyle.paint, nodeFills));
      }

      if (matchingFills.length === 0) {
        if (localStylesLibrary && localStylesLibrary.fills) {
          matchingFills = localStylesLibrary.fills
            .map(fillStyle => ({
              name: fillStyle.name,
              id: fillStyle.id,
              key: fillStyle.id.replace(/S:|,/g, ""),
              value: fillStyle.name,
              source: "Local Library",
              paint: fillStyle.paint
            }))
            .filter(fillStyle =>
              checkMatchingFills(fillStyle.paint, nodeFills)
            );
        }
      }

      if (matchingFills.length === 0 && libraries && libraries.length > 0) {
        for (const library of libraries) {
          if (library.fills && library.fills.length > 0) {
            for (const fillStyle of library.fills) {
              const style = fillStyle;

              if (checkMatchingFills(style.paint, nodeFills)) {
                matchingFills.push({
                  name: style.name,
                  id: style.id,
                  key: style.id.replace(/S:|,/g, ""),
                  value: style.name,
                  source: library.name
                });
              } else if (
                style.type === "GRADIENT" &&
                nodeFills[0].type === "GRADIENT"
              ) {
                suggestedFills.push(fillStyle);
              }
            }
          }
        }
      }

      let currentFill = determineFill(node.fills);
      let nodeFillType = nodeFills[0].type;
      let cssSyntax = null;

      if (nodeFillType === "SOLID") {
        cssSyntax = currentFill;
      } else if (nodeFillType !== "SOLID") {
        cssSyntax = gradientToCSS(nodeFills[0]);
      }

      if (matchingFills.length > 0) {
        return errors.push(
          createErrorObject(
            node,
            "fill",
            "Missing fill style",
            currentFill,
            matchingFills,
            null,
            cssSyntax
          )
        );
      } else if (suggestedFills.length > 0) {
        return errors.push(
          createErrorObject(
            node,
            "fill",
            "Missing fill style",
            currentFill,
            null,
            suggestedFills,
            cssSyntax
          )
        );
      } else {
        return errors.push(
          createErrorObject(node, "fill", "Missing fill style", currentFill)
        );
      }
    } else {
      return;
    }
  }
}

export function checkFills(node, errors) {
  if (
    (node.fills.length && node.visible === true) ||
    typeof node.fills === "symbol"
  ) {
    let nodeFills = node.fills;
    let fillStyleId = node.fillStyleId;

    if (typeof nodeFills === "symbol") {
      return errors.push(
        createErrorObject(node, "fill", "Missing fill style", "Mixed values")
      );
    }

    if (typeof fillStyleId === "symbol") {
      return errors.push(
        createErrorObject(node, "fill", "Missing fill style", "Mixed values")
      );
    }

    if (
      node.fillStyleId === "" &&
      node.fills[0].type !== "IMAGE" &&
      node.fills[0].type !== "VIDEO" &&
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
      return;
    }
  }
}

export function newCheckStrokes(
  node,
  errors,
  libraries,
  localStylesLibrary,
  importedStyles
) {
  if (node.strokes.length && node.visible === true) {
    let strokeStyleId = node.strokeStyleId;

    if (typeof strokeStyleId === "symbol") {
      return;
    }

    if (node.strokeStyleId === "") {
      let matchingStrokes = [];

      let strokeObject = {
        strokeWeight: "",
        strokeAlign: "",
        strokeFills: []
      };

      let strokeWeight = node.strokeWeight;

      if (typeof strokeWeight === "symbol") {
        strokeWeight = `${node.strokeTopWeight}, ${node.strokeRightWeight}, ${node.strokeBottomWeight}, ${node.strokeLeftWeight}`;
      }

      strokeObject.strokeWeight = strokeWeight;
      strokeObject.strokeAlign = node.strokeAlign;
      strokeObject.strokeFills = determineFill(node.strokes);

      // If there are multiple strokes on a node,
      // it's probbaly intentional or shouldn't be matched.
      if (node.strokes.length > 1) {
        return errors.push(
          createErrorObject(
            node,
            "stroke",
            "Mutiple fills on a stroke",
            `Stroke: ${strokeObject.strokeWeight} / ${strokeObject.strokeAlign}`
          )
        );
      }

      // We only want to check the first stroke for a missing color.
      let firstStroke = node.strokes[node.strokes.length - 1];

      if (importedStyles && importedStyles.fills) {
        matchingStrokes = importedStyles.fills
          .map(strokeStyle => ({
            name: strokeStyle.name,
            id: strokeStyle.id,
            key: strokeStyle.id.replace(/S:|,/g, ""),
            value: strokeStyle.name,
            source: "Remote Style",
            paint: strokeStyle.paint,
            count: strokeStyle.count
          }))
          .filter(strokeStyle =>
            checkMatchingFills(strokeStyle.paint, firstStroke)
          );
      }

      if (matchingStrokes.length === 0) {
        if (localStylesLibrary && localStylesLibrary.fills) {
          matchingStrokes = localStylesLibrary.fills
            .map(strokeStyle => ({
              name: strokeStyle.name,
              id: strokeStyle.id,
              key: strokeStyle.id.replace(/S:|,/g, ""),
              value: strokeStyle.name,
              source: "Local Library",
              paint: strokeStyle.paint
            }))
            .filter(strokeStyle =>
              checkMatchingFills(strokeStyle.paint, firstStroke)
            );
        }
      }

      if (matchingStrokes.length === 0 && libraries && libraries.length > 0) {
        for (const library of libraries) {
          if (library.fills && library.fills.length > 0) {
            for (const fillStyle of library.fills) {
              const style = fillStyle;

              if (checkMatchingFills(style.paint, firstStroke)) {
                matchingStrokes.push({
                  name: style.name,
                  id: style.id,
                  key: style.id.replace(/S:|,/g, ""),
                  value: style.name,
                  source: library.name,
                  paint: style.paint
                });
              }
            }
          }
        }
      }

      let currentStroke = `${strokeObject.strokeFills} / ${strokeObject.strokeWeight} / ${strokeObject.strokeAlign}`;
      let strokeFill = strokeObject.strokeFills;

      let nodeFillType = node.strokes[0].type;
      let cssSyntax = null;

      if (nodeFillType === "SOLID") {
        cssSyntax = strokeFill;
      } else if (nodeFillType !== "SOLID") {
        cssSyntax = gradientToCSS(node.strokes[0]);
      }

      if (matchingStrokes.length > 0) {
        return errors.push(
          createErrorObject(
            node,
            "stroke",
            "Missing stroke style",
            currentStroke,
            matchingStrokes,
            null,
            cssSyntax
          )
        );
      } else {
        return errors.push(
          createErrorObject(
            node,
            "stroke",
            "Missing stroke style",
            currentStroke,
            null,
            null,
            cssSyntax
          )
        );
      }
    } else {
      return;
    }
  }
}

export function checkStrokes(node, errors) {
  if (node.strokes.length) {
    if (node.strokeStyleId === "" && node.visible === true) {
      let strokeObject = {
        strokeWeight: "",
        strokeAlign: "",
        strokeFills: []
      };

      // With the update to stroke alignment, sometimes
      // strokes can be symhols (figma.mixed)
      let strokeWeight = node.strokeWeight;

      // Check for a mixed stroke weight and return a generic error
      if (typeof strokeWeight === "symbol") {
        return errors.push(
          createErrorObject(
            node,
            "stroke",
            "Missing stroke style",
            "Mixed sizes or alignment"
          )
        );
      }

      strokeObject.strokeWeight = node.strokeWeight;
      strokeObject.strokeAlign = node.strokeAlign;
      strokeObject.strokeFills = determineFill(node.strokes);

      let currentStyle = `${strokeObject.strokeFills} / ${strokeObject.strokeWeight} / ${strokeObject.strokeAlign}`;

      return errors.push(
        createErrorObject(node, "stroke", "Missing stroke style", currentStyle)
      );
    } else {
      return;
    }
  }
}

function checkMatchingStyles(style, textObject) {
  let lineHeightCheck;

  if (style.lineHeight.value !== undefined) {
    lineHeightCheck = style.lineHeight.value;
  } else {
    lineHeightCheck = "Auto";
  }

  return (
    style.fontFamily === textObject.font &&
    style.fontStyle === textObject.fontStyle &&
    style.fontSize === textObject.fontSize &&
    lineHeightCheck === textObject.lineHeight &&
    style.letterSpacing.value === textObject.letterSpacingValue &&
    style.letterSpacing.unit === textObject.letterSpacingUnit &&
    style.textCase === textObject.textCase &&
    style.paragraphSpacing === textObject.paragraphSpacing
  );
}

function roundToDecimalPlaces(value, decimalPlaces) {
  const multiplier = Math.pow(10, decimalPlaces);
  return Math.round(value * multiplier) / multiplier;
}

export function checkType(
  node,
  errors,
  libraries,
  localStylesLibrary,
  importedStyles
) {
  if (node.textStyleId === "" && node.visible === true) {
    let textObject = {
      font: "",
      fontStyle: "",
      fontSize: "",
      lineHeight: {},
      letterSpacingValue: "",
      letterSpacingUnit: "",
      textAlignHorizontal: "",
      textAlignVertical: "",
      paragraphIndent: "",
      paragraphSpacing: "",
      textCase: ""
    };

    let fontStyle = node.fontName;
    let fontSize = node.fontName;

    if (typeof fontStyle === "symbol" || typeof fontSize === "symbol") {
      return errors.push(
        createErrorObject(
          node,
          "text",
          "Missing text style",
          "Mixed sizes or families"
        )
      );
    }

    textObject.font = node.fontName.family;
    textObject.fontStyle = node.fontName.style;
    textObject.fontSize = node.fontSize;
    textObject.letterSpacingValue = node.letterSpacing.value;
    textObject.letterSpacingUnit = node.letterSpacing.unit;
    textObject.textAlignHorizontal = node.textAlignHorizontal;
    textObject.textAlignVertical = node.textAlignVertical;
    textObject.paragraphIndent = node.paragraphIndent;
    textObject.paragraphSpacing = node.paragraphSpacing;
    textObject.textCase = node.textCase;

    // Line height can be "auto" or a pixel value
    if (node.lineHeight.value !== undefined) {
      textObject.lineHeight = node.lineHeight.value;
    } else {
      textObject.lineHeight = "Auto";
    }

    let matchingStyles = [];
    let suggestedStyles = [];

    const checkSuggestions = library => {
      for (const textStyle of library.text) {
        const style = textStyle.style;

        let lineHeightCheck;

        if (node.lineHeight.value !== undefined) {
          lineHeightCheck = style.lineHeight.value;
        } else {
          lineHeightCheck = "Auto";
        }

        if (checkMatchingStyles(style, textObject)) {
          matchingStyles.push({
            name: textStyle.name,
            id: textStyle.id,
            key: textStyle.key,
            count: textStyle.count,
            value:
              textStyle.name +
              " · " +
              style.fontSize +
              "/" +
              style.lineHeight.value,
            source: library.name
          });
        } else if (
          style.fontFamily === textObject.font &&
          style.fontStyle === textObject.fontStyle &&
          style.fontSize === textObject.fontSize
        ) {
          if (!suggestedStyles.some(obj => obj.name === textStyle.name)) {
            suggestedStyles.push({
              name: textStyle.name,
              id: textStyle.id,
              key: textStyle.key,
              count: textStyle.count,
              value:
                textStyle.name +
                " · " +
                style.fontSize +
                "/" +
                style.lineHeight.value,
              source: library.name,
              textProperties: textStyle.style
            });
          }
        }
      }
    };

    // See if we have matches with remote styles
    if (importedStyles && importedStyles.text) {
      checkSuggestions(importedStyles);
    }

    if (localStylesLibrary && localStylesLibrary.text) {
      checkSuggestions(localStylesLibrary);
    }

    if (matchingStyles.length === 0 && libraries && libraries.length > 0) {
      for (const library of libraries) {
        if (library.text && library.text.length > 0) {
          checkSuggestions(library);
        }
      }
    }

    let lineHeightFormatted = null;

    if (textObject.lineHeight === "Auto") {
      lineHeightFormatted = "Auto";
    } else {
      let roundedLineHeight = roundToDecimalPlaces(textObject.lineHeight, 1);
      if (node.lineHeight.unit === "PERCENT") {
        lineHeightFormatted = roundedLineHeight + "%";
      } else {
        lineHeightFormatted = roundedLineHeight;
      }
    }

    let currentStyle = `${textObject.font} ${textObject.fontStyle} · ${textObject.fontSize}/${lineHeightFormatted}`;

    // Create error object with fixes if matching styles are found
    if (matchingStyles.length > 0) {
      return errors.push(
        createErrorObject(
          node,
          "text",
          "Missing text style",
          currentStyle,
          matchingStyles
        )
      );
    } else if (suggestedStyles.length > 0) {
      // We may not have exact matches, so we'll suggest some that are very close.
      return errors.push(
        createErrorObject(
          node,
          "text",
          "Missing text style",
          currentStyle,
          null,
          suggestedStyles,
          null,
          textObject
        )
      );
    } else {
      // If nothing is remotely close, just keep the error as is.
      return errors.push(
        createErrorObject(node, "text", "Missing text style", currentStyle)
      );
    }
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
