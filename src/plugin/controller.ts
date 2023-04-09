import {
  checkRadius,
  checkEffects,
  checkFills,
  checkStrokes,
  checkType
  // customCheckTextFills,
  // uncomment this as an example of a custom lint function ^
} from "./lintingFunctions";
const {
  getLocalPaintStyles,
  saveToLocalStorage,
  getLocalTextStyles,
  getLocalEffectStyles
} = require("./styles");

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
  // send a message to the plugin to look for changes.'
  figma.ui.postMessage({
    type: "change"
  });
});

figma.ui.onmessage = msg => {
  if (msg.type === "close") {
    figma.closePlugin();
  }

  if (msg.type === "step-2") {
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
      type: "step-2-complete",
      message: layerData
    });
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

  // Called when an update in the Figma file happens
  // so we can check what changed.
  if (msg.type === "update-errors") {
    figma.ui.postMessage({
      type: "updated errors",
      errors: lint(originalNodeTree, msg.libraries)
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

  // Function to check if a style key exists locally
  function isStyleKeyLocal(styleKey) {
    const localStyles = figma.getLocalTextStyles();

    for (const style of localStyles) {
      if (style.key === styleKey) {
        return true;
      }
    }

    return false;
  }

  // If a style is local, we can apply it
  function applyLocalStyle(node, styleId) {
    // const localStyles = figma.getLocalTextStyles();
    // const style = localStyles.find(style => style.key === styleKey);
    node.textStyleId = styleId;
  }

  // Some styles are remote so we need to import them first.
  async function applyRemoteStyle(node, importedStyle) {
    try {
      node.textStyleId = importedStyle.id;
    } catch (error) {
      console.error("Error applying remote style:", error);
    }
  }

  // Called from BulkErrorList when updating matching styles
  // or applying suggestion styles.
  if (msg.type === "apply-styles") {
    async function applyStylesToNodes(field, index) {
      const styleKey = msg.error[field][index].key;

      if (isStyleKeyLocal(styleKey)) {
        for (const nodeId of msg.error.nodes) {
          const node = figma.getNodeById(nodeId);

          if (node && node.type === "TEXT") {
            applyLocalStyle(node, msg.error[field][index].id);
          }
        }
      } else {
        // Import the remote style
        let importedStyle;
        try {
          importedStyle = await figma.importStyleByKeyAsync(styleKey);
        } catch (error) {
          if (!error.message.includes("Cannot find style")) {
            console.error("Error importing style:", error);
          }
        }

        // Apply the imported style to all layers
        if (importedStyle) {
          const batchSize = 10;
          for (let i = 0; i < msg.error.nodes.length; i += batchSize) {
            const batch = msg.error.nodes.slice(i, i + batchSize);
            for (const nodeId of batch) {
              const node = figma.getNodeById(nodeId);

              if (node && node.type === "TEXT") {
                await applyRemoteStyle(node, importedStyle);
              }
            }
            await delay(3);
          }
        }
      }
    }

    applyStylesToNodes(msg.field, msg.index);
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

  function lint(nodes, libraries, lockedParentNode = false) {
    let errorArray = [];

    // Use a for loop instead of forEach
    for (const node of nodes) {
      // Determine if the layer or its parent is locked.
      const isLayerLocked = lockedParentNode || node.locked;
      const nodeChildren = node.children;

      // Create a new object.
      const newObject = {
        id: node.id,
        errors: isLayerLocked ? [] : determineType(node, libraries),
        children: []
      };

      // Check if the node has children.
      if (nodeChildren) {
        // Recursively run this function to flatten out children and grandchildren nodes.
        newObject.children = node.children.map(childNode => childNode.id);
        errorArray.push(...lint(node.children, libraries, isLayerLocked));
      }

      errorArray.push(newObject);
    }

    return errorArray;
  }

  function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
  }

  // Counter to keep track of the total number of processed nodes
  let nodeCounter = 0;

  async function* lintAsync(nodes, libraries, lockedParentNode = false) {
    let errorArray = [];

    for (const node of nodes) {
      // Determine if the layer or its parent is locked.
      const isLayerLocked = lockedParentNode || node.locked;

      // Create a new object.
      const newObject = {
        id: node.id,
        errors: isLayerLocked ? [] : determineType(node, libraries),
        children: []
      };

      // Check if the node has children.
      if (node.children) {
        // Recursively run this function to flatten out children and grandchildren nodes.
        newObject.children = node.children.map(childNode => childNode.id);
        for await (const result of lintAsync(
          node.children,
          libraries,
          isLayerLocked
        )) {
          errorArray.push(...result);
        }
      }

      errorArray.push(newObject);

      // Increment the node counter, this is our number of layers total.
      nodeCounter++;
      // console.log(nodeCounter);

      // Yield the result after processing a certain number of nodes
      if (nodeCounter % 1000 === 0) {
        yield errorArray;
        errorArray = [];
        await delay(5);
      }
    }

    // Yield any remaining results
    if (errorArray.length > 0) {
      yield errorArray;
    }
  }

  if (msg.type === "step-3") {
    // Use an async function to handle the asynchronous generator
    async function processLint() {
      const finalResult = [];

      for await (const result of lintAsync(originalNodeTree, msg.libraries)) {
        finalResult.push(...result);
      }

      // Pass the final result back to the UI to be displayed.
      figma.ui.postMessage({
        type: "step-3-complete",
        errors: finalResult,
        message: serializeNodes(originalNodeTree)
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

  // Import local styles to use as recommendations
  // This function doesn't save the styles, that's "save-library"
  if (msg.type === "find-local-styles") {
    (async function() {
      const paintStylesData = await getLocalPaintStyles();
      const textStylesData = await getLocalTextStyles();
      const effectStylesData = await getLocalEffectStyles();
      const fileName = figma.root.name;
      const totalStyles =
        effectStylesData.length +
        textStylesData.length +
        paintStylesData.length;

      const localStyles = {
        name: fileName,
        effects: effectStylesData,
        fills: paintStylesData,
        text: textStylesData,
        styles: totalStyles
      };

      // Send the updated libraries array to the UI layer
      figma.ui.postMessage({
        type: "local-styles-imported",
        message: localStyles
      });
    })();
  }

  // Saves local styles as a library to use in every file.
  if (msg.type === "save-library") {
    (async function() {
      const paintStylesData = await getLocalPaintStyles();
      const textStylesData = await getLocalTextStyles();
      const effectStylesData = await getLocalEffectStyles();
      const fileName = figma.root.name;
      const totalStyles =
        effectStylesData.length +
        textStylesData.length +
        paintStylesData.length;
      const key = "libraryKey";

      const library = {
        name: fileName,
        effects: effectStylesData,
        fills: paintStylesData,
        text: textStylesData,
        styles: totalStyles
      };

      // Fetch the stored libraries from client storage
      const storedLibraries = (await figma.clientStorage.getAsync(key)) || [];

      // Check if a library with the same name already exists in the libraries array
      const existingLibraryIndex = storedLibraries.findIndex(
        storedLibrary => storedLibrary.name === library.name
      );

      if (existingLibraryIndex !== -1) {
        // If the library exists, update the existing library
        storedLibraries[existingLibraryIndex] = library;
      } else {
        // If the library doesn't exist, add it to the libraries array
        storedLibraries.push(library);
      }

      // Save the updated libraries array to client storage
      await figma.clientStorage.setAsync(key, storedLibraries);

      // Send the updated libraries array to the UI layer
      figma.ui.postMessage({
        type: "library-imported",
        message: storedLibraries
      });
    })();
  }

  if (msg.type === "remove-library") {
    figma.clientStorage.setAsync("libraryKey", msg.storageArray);
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

      // Fetch the ignored errors and libraries from client storage
      const ignoredErrorsPromise = figma.clientStorage.getAsync(documentUUID);
      const librariesPromise = figma.clientStorage.getAsync("libraryKey");

      Promise.all([ignoredErrorsPromise, librariesPromise]).then(
        ([ignoredErrors, libraries]) => {
          if (ignoredErrors && ignoredErrors.length) {
            figma.ui.postMessage({
              type: "fetched storage",
              storage: ignoredErrors
            });
          }

          if (libraries && libraries.length) {
            figma.ui.postMessage({
              type: "library-imported-from-storage",
              message: libraries
            });
          }

          (async function() {
            const paintStylesData = await getLocalPaintStyles();
            const textStylesData = await getLocalTextStyles();
            const effectStylesData = await getLocalEffectStyles();
            const fileName = figma.root.name;
            const totalStyles =
              effectStylesData.length +
              textStylesData.length +
              paintStylesData.length;

            const localStyles = {
              name: fileName,
              effects: effectStylesData,
              fills: paintStylesData,
              text: textStylesData,
              styles: totalStyles
            };

            // Send the updated libraries array to the UI layer
            figma.ui.postMessage({
              type: "local-styles-imported",
              message: localStyles
            });
          })();

          // Now that libraries are available, call lint with libraries and send the message
          figma.ui.postMessage({
            type: "step-1",
            message: serializeNodes(nodes),
            errors: lint(firstNode, libraries)
          });
        }
      );

      figma.clientStorage.getAsync("storedActivePage").then(result => {
        if (result.length) {
          figma.ui.postMessage({
            type: "fetched active page",
            storage: result
          });
        }
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

  function determineType(node, libraries) {
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
        return lintTextRules(node, libraries);
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

  function lintTextRules(node, libraries) {
    let errors = [];

    checkType(node, errors, libraries);
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
