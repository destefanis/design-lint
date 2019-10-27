figma.showUI(__html__, { width: 320, height: 440 });

let originalNodeTree = [];

figma.ui.onmessage = msg => {
  // Fetch a specific node by ID.
  if (msg.type === "fetch-layer-data") {
    let layer = figma.getNodeById(msg.id);
    let layerArray = [];

    layerArray.push(layer);

    figma.currentPage.selection = layerArray;
    figma.viewport.scrollAndZoomIntoView(layerArray);

    // determineType(layer);

    // if (layer["children"]) {
    //   lintChildLayers(layer["children"]);
    // }

    // Need to figure out how to update the error array given the object is parsed.
    // Could there be a function for sending a message that just updates the errors?

    let layerData = JSON.stringify(layer);

    figma.ui.postMessage({
      type: "fetched layer",
      message: layerData
      // errors: lint(msg.nodeArray),
    });
  }

  if (msg.type === "update-errors") {
    console.log("called");
    console.log(originalNodeTree);

    figma.ui.postMessage({
      type: "updated errors",
      errors: lint(originalNodeTree)
    });
  }

  function lintLayers(layers) {
    layers.forEach(function(node) {
      determineType(node);

      if (node["children"]) {
        lintLayers(node["children"]);
      }

      return node;
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

  function lint(nodes) {
    let errorArray = [];

    nodes.forEach(function(node) {
      let newObject = {};
      newObject.id = node.id;
      newObject.errors = determineType(node);

      errorArray.push(newObject);
    });

    return errorArray;
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

  // Initalize the app
  if (msg.type === "run-app") {
    if (figma.currentPage.selection.length === 0) {
      return;
    } else {
      let nodes = traverseNodes(figma.currentPage.selection);
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
        return lintShapeRules(node);
      }
      case "TEXT": {
        return lintTextRules(node);
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

    return errors;
  }
};
