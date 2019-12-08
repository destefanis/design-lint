figma.showUI(__html__, { width: 320, height: 480 });

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

  // function createErrorObject(node, type, message, serializedValue, value) {
  function createErrorObject(node, type, message) {
    let error = {
      message: "",
      type: "",
      node: ""
    };

    error.message = message;
    error.type = type;
    error.node = node;

    return error;
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
    console.log(node);

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
      textObject.lineHeight = node.lineHeight;

      let serializedtextStyle =
        textObject.font + textObject.fontStyle + textObject.fontSize;

      errors.push(createErrorObject(node, "text", "Missing text style"));
    }

    if (node.fills.length) {
      if (node.fillStyleId === "") {
        errors.push(createErrorObject(node, "fill", "Missing fill style"));
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
        errors.push(createErrorObject(node, "fill", "Missing fill style"));
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
};
