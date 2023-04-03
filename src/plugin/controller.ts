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
let originalNodeTree: readonly any[] = [];
let lintVectors = false;

figma.skipInvisibleInstanceChildren = true;

// Function to generate a UUID
// This way we can store ignored errors per document rather than
// sharing ignored errors across all documents.
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    var r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getDocumentUUID() {
  // Try to get the UUID from the document's plugin data
  let uuid = figma.root.getPluginData("documentUUID");

  // If the UUID does not exist (empty string), generate a new one and store it
  if (!uuid) {
    uuid = generateUUID();
    figma.root.setPluginData("documentUUID", uuid);
  }

  return uuid;
}

// Set the unique ID we use for client storage.
const documentUUID = getDocumentUUID();

figma.on("documentchange", _event => {
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

  // Could this be made less expensive?
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
    figma.clientStorage.setAsync(documentUUID, arrayToBeStored);
  }

  // Clears all ignored errors
  // invoked from the settings menu
  if (msg.type === "update-storage-from-settings") {
    let arrayToBeStored = JSON.stringify(msg.storageArray);
    figma.clientStorage.setAsync(documentUUID, arrayToBeStored);

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

  function lint(nodes, lockedParentNode = false) {
    let errorArray = [];

    // Use a for loop instead of forEach
    for (const node of nodes) {
      // Determine if the layer or its parent is locked.
      const isLayerLocked = lockedParentNode || node.locked;

      // Create a new object.
      const newObject = {
        id: node.id,
        errors: isLayerLocked ? [] : determineType(node),
        children: []
      };

      // Check if the node has children.
      if (node.children) {
        // Recursively run this function to flatten out children and grandchildren nodes.
        newObject.children = node.children.map(childNode => childNode.id);
        errorArray.push(...lint(node.children, isLayerLocked));
      }

      errorArray.push(newObject);
    }

    return errorArray;
  }

  // if (msg.type === "lint-all") {
  //   // Pass the array back to the UI to be displayed.
  //   figma.ui.postMessage({
  //     type: "complete",
  //     errors: lint(originalNodeTree),
  //     message: serializeNodes(msg.nodes)
  //   });

  //   figma.notify(`Design lint is running and will auto refresh for changes`, {
  //     timeout: 2000
  //   });
  // }

  // Generator explorations
  function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
  }

  async function* lintAsync(nodes, lockedParentNode = false) {
    let errorArray = [];

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      // Determine if the layer or its parent is locked.
      const isLayerLocked = lockedParentNode || node.locked;

      // Create a new object.
      const newObject = {
        id: node.id,
        errors: isLayerLocked ? [] : determineType(node),
        children: []
      };

      // Check if the node has children.
      if (node.children) {
        // Recursively run this function to flatten out children and grandchildren nodes.
        newObject.children = node.children.map(childNode => childNode.id);
        for await (const result of lintAsync(node.children, isLayerLocked)) {
          errorArray.push(...result);
        }
      }

      errorArray.push(newObject);

      // Yield the result after processing a certain number of nodes
      if (i % 100 === 0) {
        yield errorArray;
        errorArray = [];
        await delay(40); // Pause for 40ms every 100 items to allow UI to update
      }
    }

    // Yield any remaining results
    if (errorArray.length > 0) {
      yield errorArray;
    }
  }

  if (msg.type === "lint-all") {
    // Use an async function to handle the asynchronous generator
    async function processLint() {
      const finalResult = [];
      for await (const result of lintAsync(originalNodeTree)) {
        finalResult.push(...result);
      }

      // Pass the final result back to the UI to be displayed.
      figma.ui.postMessage({
        type: "complete",
        errors: finalResult,
        message: serializeNodes(msg.nodes)
      });

      figma.notify(`Scan Complete`, {
        timeout: 2000
      });
    }

    // Start the lint process
    figma.notify(`Design Lint is running and will auto refresh for changes`, {
      timeout: 2000
    });

    processLint();
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

      // Fetch the ignored errors for this document.
      figma.clientStorage.getAsync(documentUUID).then(result => {
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
      case "SECTION": {
        return lintSectionRules(node);
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

  function lintSectionRules(node) {
    let errors = [];

    checkFills(node, errors);
    // For some reason section strokes aren't accessible via the API yet.
    // checkStrokes(node, errors);
    checkRadius(node, errors, borderRadiusArray);

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
