import {
  checkRadius,
  checkEffects,
  checkFills,
  checkStrokes,
  checkType
  // customCheckTextFills,
  // uncomment this as an example of a custom lint function ^
} from "./lintingFunctions";

figma.showUI(__html__, { width: 360, height: 580 });

let borderRadiusArray = [0, 2, 4, 8, 16, 24, 32];
let originalNodeTree = [];
let lintVectors = false;

figma.skipInvisibleInstanceChildren = true;

figma.on("documentchange", event => {
  // When a change happens in the document
  // send a message to the plugin to look for changes.
  figma.ui.postMessage({
    type: "change"
  });
});

figma.ui.onmessage = msg => {
  if (msg.type === "close") {
    figma.closePlugin();
  }

  // Fetch a specific node by ID.
  if (msg.type === "fetch-layer-data") {
    let layer = figma.getNodeById(msg.id);
    let layerArray = [];

    // Using figma UI selection and scroll to viewport requires an array.
    layerArray.push(layer);

    // Moves the layer into focus and selects so the user can update it.
    // uncomment the line below if you want to notify something has been selected.
    // figma.notify(`Layer ${layer.name} selected`, { timeout: 750 });
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

  // TODO make a custom function to check for changes
  // on the specific document nodes that have been updated
  // using documentchange
  if (msg.type === "update-errors") {
    figma.ui.postMessage({
      type: "updated errors",
      errors: lint(originalNodeTree)
    });
  }

  // Updates client storage with a new ignored error
  // when the user selects "ignore" from the context menu
  if (msg.type === "update-storage") {
    let arrayToBeStored = JSON.stringify(msg.storageArray);
    figma.clientStorage.setAsync("storedErrorsToIgnore", arrayToBeStored);
  }

  // Clears all ignored errors
  // invoked from the settings menu
  if (msg.type === "update-storage-from-settings") {
    let arrayToBeStored = JSON.stringify(msg.storageArray);
    figma.clientStorage.setAsync("storedErrorsToIgnore", arrayToBeStored);

    figma.ui.postMessage({
      type: "reset storage",
      storage: arrayToBeStored
    });

    figma.notify("Cleared ignored errors", { timeout: 1000 });
  }

  // Remembers the last tab selected in the UI and sets it
  // to be active (layers vs error by category view)
  if (msg.type === "update-active-page-in-settings") {
    let pageToBeStored = JSON.stringify(msg.page);
    figma.clientStorage.setAsync("storedActivePage", pageToBeStored);
  }

  // Changes the linting rules, invoked from the settings menu
  if (msg.type === "update-lint-rules-from-settings") {
    lintVectors = msg.boolean;
  }

  // For when the user updates the border radius values to lint from the settings menu.
  if (msg.type === "update-border-radius") {
    let newString = msg.radiusValues.replace(/\s+/g, "");
    let newRadiusArray = newString.split(",");
    newRadiusArray = newRadiusArray
      .filter(x => x.trim().length && !isNaN(x))
      .map(Number);

    // Most users won't add 0 to the array of border radius so let's add it in for them.
    if (newRadiusArray.indexOf(0) === -1) {
      newRadiusArray.unshift(0);
    }

    // Update the array we pass into checkRadius for linting.
    borderRadiusArray = newRadiusArray;

    // Save this value in client storage.
    let radiusToBeStored = JSON.stringify(borderRadiusArray);
    figma.clientStorage.setAsync("storedRadiusValues", radiusToBeStored);

    figma.ui.postMessage({
      type: "fetched border radius",
      storage: JSON.stringify(borderRadiusArray)
    });

    figma.notify("Saved new border radius values", { timeout: 1000 });
  }

  if (msg.type === "reset-border-radius") {
    borderRadiusArray = [0, 2, 4, 8, 16, 24, 32];
    figma.clientStorage.setAsync("storedRadiusValues", []);

    figma.ui.postMessage({
      type: "fetched border radius",
      storage: JSON.stringify(borderRadiusArray)
    });

    figma.notify("Reset border radius value", { timeout: 1000 });
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

  // Serialize nodes to pass back to the UI.
  function serializeNodes(nodes) {
    let serializedNodes = JSON.stringify(nodes, [
      "name",
      "type",
      "children",
      "id"
    ]);

    return serializedNodes;
  }

  function lint(nodes, lockedParentNode?) {
    let errorArray = [];
    let childArray = [];

    nodes.forEach(node => {
      let isLayerLocked;

      // Create a new object.
      let newObject = {};

      // Give it the existing node id.
      newObject["id"] = node.id;

      let children = node.children;

      // Don't lint locked layers or the children/grandchildren of locked layers.
      if (lockedParentNode === undefined && node.locked === true) {
        isLayerLocked = true;
      } else if (lockedParentNode === undefined && node.locked === false) {
        isLayerLocked = false;
      } else if (lockedParentNode === false && node.locked === true) {
        isLayerLocked = true;
      } else {
        isLayerLocked = lockedParentNode;
      }

      if (isLayerLocked === true) {
        newObject["errors"] = [];
      } else {
        newObject["errors"] = determineType(node);
      }

      if (!children) {
        errorArray.push(newObject);
        return;
      } else if (children) {
        // Recursively run this function to flatten out children and grandchildren nodes
        node["children"].forEach(childNode => {
          childArray.push(childNode.id);
        });

        newObject["children"] = childArray;

        // If the layer is locked, pass the optional parameter to the recursive Lint
        // function to indicate this layer is locked.
        if (isLayerLocked === true) {
          errorArray.push(...lint(node["children"], true));
        } else {
          errorArray.push(...lint(node["children"], false));
        }
      }

      errorArray.push(newObject);
    });

    return errorArray;
  }

  if (msg.type === "lint-all") {
    // Pass the array back to the UI to be displayed.
    figma.ui.postMessage({
      type: "complete",
      errors: lint(originalNodeTree),
      message: serializeNodes(msg.nodes)
    });

    figma.notify(`Design lint is running and will auto refresh for changes`, {
      timeout: 2000
    });
  }

  // Initialize the app
  if (msg.type === "run-app") {
    if (figma.currentPage.selection.length === 0) {
      figma.notify("Select a frame(s) to get started", { timeout: 2000 });
      return;
    } else {
      let nodes = figma.currentPage.selection;
      let firstNode = [];

      firstNode.push(figma.currentPage.selection[0]);

      // Maintain the original tree structure so we can enable
      // refreshing the tree and live updating errors.
      originalNodeTree = nodes;

      // We want to immediately render the first selection
      // to avoid freezing up the UI.
      figma.ui.postMessage({
        type: "first node",
        message: serializeNodes(nodes),
        errors: lint(firstNode)
      });

      figma.clientStorage.getAsync("storedErrorsToIgnore").then(result => {
        figma.ui.postMessage({
          type: "fetched storage",
          storage: result
        });
      });

      figma.clientStorage.getAsync("storedActivePage").then(result => {
        figma.ui.postMessage({
          type: "fetched active page",
          storage: result
        });
      });

      figma.clientStorage.getAsync("storedRadiusValues").then(result => {
        if (result.length) {
          borderRadiusArray = JSON.parse(result);

          figma.ui.postMessage({
            type: "fetched border radius",
            storage: result
          });
        }
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
      case "BOOLEAN_OPERATION":
      case "VECTOR": {
        return lintVectorRules(node);
      }
      case "POLYGON":
      case "STAR":
      case "ELLIPSE": {
        return lintShapeRules(node);
      }
      case "FRAME": {
        return lintFrameRules(node);
      }
      case "INSTANCE":
      case "RECTANGLE": {
        return lintRectangleRules(node);
      }
      case "COMPONENT": {
        return lintComponentRules(node);
      }
      case "COMPONENT_SET": {
        // Component Set is the frame that wraps a set of variants
        // the variants within the set are still linted as components (lintComponentRules)
        // this type is generally only present where the variant is defined so it
        // doesn't need as many linting requirements.
        return lintVariantWrapperRules(node);
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

    // Example of how we can make a custom rule specifically for components
    // if (node.remote === false) {
    //   errors.push(
    //     createErrorObject(node, "component", "Component isn't from library")
    //   );
    // }

    checkFills(node, errors);
    checkRadius(node, errors, borderRadiusArray);
    checkEffects(node, errors);
    checkStrokes(node, errors);

    return errors;
  }

  function lintVariantWrapperRules(node) {
    let errors = [];

    checkFills(node, errors);

    return errors;
  }

  function lintLineRules(node) {
    let errors = [];

    checkStrokes(node, errors);
    checkEffects(node, errors);

    return errors;
  }

  function lintFrameRules(node) {
    let errors = [];

    checkFills(node, errors);
    checkStrokes(node, errors);
    checkRadius(node, errors, borderRadiusArray);
    checkEffects(node, errors);

    return errors;
  }

  function lintTextRules(node) {
    let errors = [];

    checkType(node, errors);
    checkFills(node, errors);

    // We could also comment out checkFills and use a custom function instead
    // Take a look at line 122 in lintingFunction.ts for an example.
    // customCheckTextFills(node, errors);
    checkEffects(node, errors);
    checkStrokes(node, errors);

    return errors;
  }

  function lintRectangleRules(node) {
    let errors = [];

    checkFills(node, errors);
    checkRadius(node, errors, borderRadiusArray);
    checkStrokes(node, errors);
    checkEffects(node, errors);

    return errors;
  }

  function lintVectorRules(node) {
    let errors = [];

    // This can be enabled by the user in settings.
    if (lintVectors === true) {
      checkFills(node, errors);
      checkStrokes(node, errors);
      checkEffects(node, errors);
    }

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
