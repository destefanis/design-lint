figma.showUI(__html__, { width: 360, height: 600 });

let originalNodeTree = [];

figma.ui.onmessage = msg => {
  // Fetch a specific node by ID.
  if (msg.type === "fetch-layer-data") {
    let layer = figma.getNodeById(msg.id);
    let layerArray = [];

    // Using selection and viewport requires an array.
    layerArray.push(layer);

    // Moves the layer into focus and selects so the user can update it.
    figma.currentPage.selection = layerArray;
    figma.viewport.scrollAndZoomIntoView(layerArray);

    let layerData = JSON.stringify(layer, [
      "id",
      "name",
      "description",
      "fills",
      "key",
      "type",
      "remote",
      "paints",
      "fontName",
      "fontSize",
      "font"
    ]);

    figma.ui.postMessage({
      type: "fetched layer",
      message: layerData
    });
  }

  if (msg.type === "update-errors") {
    figma.ui.postMessage({
      type: "updated errors",
      errors: lint(originalNodeTree)
    });
  }

  // Traverses the node tree
  function traverse(node) {
    if ("children" in node) {
      if (node.type !== "INSTANCE") {
        for (const child of node.children) {
          traverse(child);
        }
      }
    }
    return node;
  }

  function traverseNodes(selection) {
    let traversedNodes = traverse(selection);

    return traversedNodes;
  }

  // Serialize nodes to pass back to the UI.
  function seralizeNodes(nodes) {
    let serializedNodes = JSON.stringify(nodes, [
      "name",
      "type",
      "children",
      "id"
    ]);

    return serializedNodes;
  }

  function lint(nodes) {
    let errorArray = [];
    let childArray = [];

    nodes.forEach(node => {
      // Create a new object.
      let newObject = {};

      // Give it the existing node id.
      newObject.id = node.id;

      // Check object for errors.
      newObject.errors = determineType(node);

      // Recursively run this function to flatten out children and grandchildren nodes
      if (node["children"]) {
        node["children"].forEach(childNode => {
          childArray.push(childNode.id);
        });
        newObject.children = childArray;
        errorArray.push(...lint(node["children"]));
      }

      errorArray.push(newObject);
    });

    return errorArray;
  }

  // Initalize the app
  if (msg.type === "run-app") {
    if (figma.currentPage.selection.length === 0) {
      return;
    } else {
      let nodes = traverseNodes(figma.currentPage.selection);

      // Maintain the original tree structure so we can enable
      // refreshing the tree and live updating errors.
      originalNodeTree = nodes;

      // Pass the array back to the UI to be displayed.
      figma.ui.postMessage({
        type: "complete",
        message: seralizeNodes(nodes),
        errors: lint(nodes)
      });
    }
  }

  function determineType(node) {
    switch (node.type) {
      case "INSTANCE": {
        let errors = [];
        return errors;
      }
      case "ELLIPSE":
      case "POLYGON":
      case "STAR":
      case "LINE":
      case "BOOLEAN_OPERATION":
      case "FRAME":
      case "VECTOR":
      case "GROUP": {
        let errors = [];
        return errors;
      }
      case "RECTANGLE": {
        return lintShapeRules(node);
      }
      case "TEXT": {
        return lintTextRules(node);
      }
      case "COMPONENT": {
        return lintComponentRules(node);
      }
      default: {
        // do nothing
      }
    }
  }

  // Generic function for creating an error object to pass to the app.
  function createErrorObject(node, type, message, value?) {
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

  function determineFill(fills) {
    let fillValues = [];

    fills.forEach(fill => {
      if (fill.type === "SOLID") {
        let rgbObj = convertColor(fill.color);
        fillValues.push(RGBToHex(rgbObj.r, rgbObj.g, rgbObj.b));
      }
    });

    return fillValues;
  }

  function lintComponentRules(node) {
    let errors = [];

    if (node.remote === false) {
      errors.push(
        createErrorObject(node, "component", "Component isn't from library")
      );
    }

    return errors;
  }

  function lintTextRules(node) {
    let errors = [];

    if (node.textStyleId === "") {
      let textObject = {
        font: "",
        fontStyle: "",
        fontSize: "",
        lineHeight: {}
      };

      textObject.font = node.fontName.family;
      textObject.fontStyle = node.fontName.style;
      textObject.fontSize = node.fontSize;
      textObject.lineHeight = node.lineHeight.value;

      let currentStyle = `${textObject.font} ${textObject.fontStyle} / ${textObject.fontSize} (${textObject.lineHeight} line-height)`;

      errors.push(
        createErrorObject(node, "text", "Missing text style", currentStyle)
      );
    }

    if (node.fills.length) {
      if (node.fillStyleId === "" && node.fills[0].type !== "IMAGE") {
        // We may need an array to loop through fill types.
        errors.push(
          createErrorObject(
            node,
            "fill",
            "Missing fill style",
            determineFill(node.fills)
          )
        );
      }
    }

    if (node.strokes.length) {
      if (node.strokeStyleId === "") {
        errors.push(createErrorObject(node, "stroke", "Missing stroke style"));
      }
    }

    if (node.effects.length) {
      if (node.effectStyleId === "") {
        errors.push(
          createErrorObject(node, "effects", "Missing effects style")
        );
      }
    }

    return errors;
  }

  function lintShapeRules(node) {
    let errors = [];
    let cornerType = node.cornerRadius;
    const radiusValues = [0, 4, 8];

    console.log(node);

    if (node.fills.length) {
      if (node.fillStyleId === "" && node.fills[0].type !== "IMAGE") {
        // We may need an array to loop through fill types.
        errors.push(
          createErrorObject(
            node,
            "fill",
            "Missing fill style",
            determineFill(node.fills)
          )
        );
      }
    }

    // If the radius isn't even on all sides, check each corner.
    if (typeof cornerType === "symbol") {
      if (radiusValues.indexOf(node.topLeftRadius) === -1) {
        errors.push(
          createErrorObject(node, "radius", "Incorrect Top Left Radius")
        );
      }

      if (radiusValues.indexOf(node.topRightRadius) === -1) {
        errors.push(
          createErrorObject(node, "radius", "Incorrect top right radius")
        );
      }

      if (radiusValues.indexOf(node.bottomLeftRadius) === -1) {
        errors.push(
          createErrorObject(node, "radius", "Incorrect bottom left radius")
        );
      }

      if (radiusValues.indexOf(node.bottomRightRadius) === -1) {
        errors.push(
          createErrorObject(node, "radius", "Incorrect bottom right radius")
        );
      }
    } else {
      if (radiusValues.indexOf(node.cornerRadius) === -1) {
        errors.push(
          createErrorObject(node, "radius", "Incorrect border radius")
        );
      }
    }

    if (node.strokes.length) {
      if (node.strokeStyleId === "") {
        let strokeObject = {
          strokeWeight: "",
          strokeAlign: "",
          strokeFills: []
        };

        strokeObject.strokeWeight = node.strokeWeight;
        strokeObject.strokeAlign = node.strokeAlign;
        strokeObject.strokeFills = determineFill(node.strokes);

        let currentStyle = `${strokeObject.strokeFills} / ${strokeObject.strokeWeight} / ${strokeObject.strokeAlign}`;

        errors.push(
          createErrorObject(
            node,
            "stroke",
            "Missing stroke style",
            currentStyle
          )
        );
      }
    }

    if (node.effects.length) {
      if (node.effectStyleId === "") {
        const effectsArray = [];

        node.effects.forEach(effect => {
          let effectsObject = {
            type: "",
            radius: "",
            offsetX: "",
            offsetY: "",
            fill: ""
          };

          // All effects have a radius.
          effectsObject.radius = effect.radius;

          if (effect.type === "DROP_SHADOW") {
            effectsObject.type = "Drop Shadow";
            let effectsFill = convertColor(effect.color);
            effectsObject.fill = RGBToHex(
              effectsFill.r,
              effectsFill.g,
              effectsFill.b
            );
          } else if (effect.type === "INNER_SHADOW") {
            let effectsFill = convertColor(effect.color);
            effectsObject.fill = RGBToHex(
              effectsFill.r,
              effectsFill.g,
              effectsFill.b
            );
            effectsObject.type = "Drop Shadow";
          } else if (effect.type === "LAYER_BLUR") {
            effectsObject.type = "Layer Blur";
          } else {
            effectsObject.type = "Background Blur";
          }

          effectsArray.unshift(effectsObject);
        });

        let currentStyle = `${effectsArray[0].type} / ${effectsArray[0].radius}px`;

        errors.push(
          createErrorObject(
            node,
            "effects",
            "Missing effects style",
            currentStyle
          )
        );
      }
    }

    return errors;
  }
};

const convertColor = color => {
  const colorObj = color;
  const figmaColor = {};

  Object.entries(colorObj).forEach(cf => {
    const [key, value] = cf;

    if (["r", "g", "b"].includes(key)) {
      figmaColor[key] = (value * 255).toFixed(0);
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

function RGBAToHexA(r, g, b, a) {
  r = Number(r).toString(16);
  g = Number(g).toString(16);
  b = Number(b).toString(16);
  a = Math.round(a * 255).toString(16);

  if (r.length == 1) r = "0" + r;
  if (g.length == 1) g = "0" + g;
  if (b.length == 1) b = "0" + b;
  if (a.length == 1) a = "0" + a;

  return "#" + r + g + b + a;
}
