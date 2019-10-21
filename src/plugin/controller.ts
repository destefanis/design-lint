figma.showUI(__html__, { width: 320, height: 440 });

figma.ui.onmessage = msg => {
  // Fetch a specific node by ID.
  if (msg.type === "fetch-layer-data") {
    let layer = figma.getNodeById(msg.id);
    determineType(layer);

    if (layer["children"]) {
      lintChildLayers(layer["children"]);
    }

    let layerData = JSON.stringify(layer);

    figma.ui.postMessage({
      type: "fetched layer",
      message: layerData
    });
  }

  function lintChildLayers(layers) {
    layers.forEach(function(childLayer) {
      determineType(childLayer);

      if (childLayer["children"]) {
        lintChildLayers(childLayer["children"]);
      }
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

  function updateNodes(selection) {
    // Loop through the current selection in Figma.
    let allNodes = traverse(selection);
    let serializedNodes = JSON.stringify(allNodes, [
      "name",
      "type",
      "children",
      "id"
    ]);

    return serializedNodes;
  }

  if (msg.type === "update-selection") {
    if (figma.currentPage.selection.length === 0) {
      return;
    } else {
      let selection = figma.currentPage.selection;

      // Pass the array back to the UI to be displayed.
      figma.ui.postMessage({
        type: "complete",
        message: updateNodes(selection)
      });
    }
  }

  // Initalize the app
  if (msg.type === "run-app") {
    if (figma.currentPage.selection.length === 0) {
      return;
    } else {
      let selection = figma.currentPage.selection;

      // Pass the array back to the UI to be displayed.
      figma.ui.postMessage({
        type: "complete",
        message: updateNodes(selection)
      });
    }
  }

  function determineType(node) {
    switch (node.type) {
      case "COMPONENT":
      case "INSTANCE":
      case "ELLIPSE":
      case "POLYGON":
      case "STAR":
      case "LINE":
      case "BOOLEAN_OPERATION":
      case "FRAME":
      case "VECTOR": {
        return;
      }
      case "RECTANGLE": {
        lintShapeRules(node);
      }
      case "TEXT": {
        lintTextRules(node);
      }
      default: {
        // do nothing
      }
    }
  }

  function lintTextRules(node) {
    let errors = [];

    if (node.textStyleId === "") {
      errors.push("Missing Text Style");
    }

    if (node.fills.length) {
      if (node.fillStyleId === "") {
        errors.push("Missing Fill Style");
      }
    }

    if (node.strokes.length) {
      if (node.strokeStyleId === "") {
        errors.push("Missing Stroke Style");
      }
    }

    if (node.effects.length) {
      if (node.effectStyleId === "") {
        errors.push("Missing Effects Style");
      }
    }

    console.log(errors);

    return errors;
  }

  function lintShapeRules(node) {
    let errors = [];

    if (node.fills.length) {
      if (node.fillStyleId === "") {
        errors.push("Missing Fill Style");
      }
    }

    // Todo Radius

    if (node.strokes.length) {
      if (node.strokeStyleId === "") {
        errors.push("Missing Stroke Style");
      }
    }

    if (node.effects.length) {
      if (node.effectStyleId === "") {
        errors.push("Missing Effects Style");
      }
    }

    console.log(errors);
    return errors;
  }
};
