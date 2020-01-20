import {
  createErrorObject,
  checkRadius,
  checkEffects,
  checkFills,
  checkStrokes,
  checkType
} from "./lintingFunctions";

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
    figma.notify(`Layer ${layer.name} selected`, { timeout: 750 });
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

  // Could this be made less expensive?
  if (msg.type === "update-errors") {
    figma.ui.postMessage({
      type: "updated errors",
      errors: lint(originalNodeTree)
    });
  }

  // Updates client storage with a new ignored error.
  if (msg.type === "update-storage") {
    let arrayToBeStored = JSON.stringify(msg.storageArray);
    figma.clientStorage.setAsync("storedErrorsToIgnore", arrayToBeStored);
  }

  // Clears all ignored errors
  if (msg.type === "update-storage-from-settings") {
    let arrayToBeStored = JSON.stringify(msg.storageArray);
    figma.clientStorage.setAsync("storedErrorsToIgnore", arrayToBeStored);

    figma.ui.postMessage({
      type: "reset storage",
      storage: arrayToBeStored
    });

    figma.notify("Cleared ignored errors", { timeout: 1000 });
  }

  if (msg.type === "select-multiple-layers") {
    const layerArray = msg.nodeArray;
    let nodesToBeSelected = [];

    layerArray.forEach(item => {
      let layer = figma.getNodeById(item);
      // Using selection and viewport requires an array.
      nodesToBeSelected.push(layer);
    });

    // Moves the layer into focus and selects so the user can update it.
    figma.currentPage.selection = nodesToBeSelected;
    figma.viewport.scrollAndZoomIntoView(nodesToBeSelected);
    figma.notify("Multiple layers selected", { timeout: 1000 });
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
      figma.notify("Select a frame or multiple frames", { timeout: 2000 });
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

      figma.notify(`Design lint is running and will auto refresh for changes`, {
        timeout: 2000
      });

      figma.clientStorage.getAsync("storedErrorsToIgnore").then(result => {
        figma.ui.postMessage({
          type: "fetched storage",
          storage: result
        });
      });
    }
  }

  function determineType(node) {
    switch (node.type) {
      case "SLICE":
      case "GROUP": {
        // Groups styles apply to their children so we can skip this node type.
        let errors = [];
        return errors;
      }
      case "POLYGON":
      case "VECTOR":
      case "STAR":
      case "BOOLEAN_OPERATION":
      case "ELLIPSE": {
        return lintShapeRules(node);
      }
      case "FRAME":
      case "INSTANCE":
      case "RECTANGLE": {
        return lintRectangleRules(node);
      }
      case "COMPONENT": {
        return lintComponentRules(node);
      }
      case "TEXT": {
        return lintTextRules(node);
      }
      case "LINE": {
        return lintLineRules(node);
      }
      default: {
        // Do nothing
      }
    }
  }

  function lintComponentRules(node) {
    let errors = [];

    if (node.remote === false) {
      errors.push(
        createErrorObject(node, "component", "Component isn't from library")
      );
    }

    checkFills(node, errors);
    checkRadius(node, errors);
    checkEffects(node, errors);
    checkStrokes(node, errors);

    return errors;
  }

  function lintLineRules(node) {
    let errors = [];

    checkStrokes(node, errors);
    checkEffects(node, errors);

    return errors;
  }

  function lintTextRules(node) {
    let errors = [];

    checkType(node, errors);
    checkFills(node, errors);
    checkEffects(node, errors);
    checkStrokes(node, errors);

    return errors;
  }

  function lintRectangleRules(node) {
    let errors = [];

    checkFills(node, errors);
    checkRadius(node, errors);
    checkStrokes(node, errors);
    checkEffects(node, errors);

    return errors;
  }

  function lintShapeRules(node) {
    let errors = [];

    checkFills(node, errors);
    checkStrokes(node, errors);
    checkEffects(node, errors);

    return errors;
  }
};
