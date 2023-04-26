import {
  checkRadius,
  newCheckStrokes,
  checkType,
  newCheckFills,
  newCheckEffects
  // customCheckTextFills,
  // uncomment this as an example of a custom lint function ^
} from "./lintingFunctions";
const {
  getLocalPaintStyles,
  getLocalTextStyles,
  getLocalEffectStyles
} = require("./styles");

figma.showUI(__html__, { width: 360, height: 580 });

let borderRadiusArray = [0, 2, 4, 8, 16, 24, 32];
let originalNodeTree: readonly any[] = [];
let lintVectors = false;
let localStylesLibrary = {};

// Styles used in our page
const usedRemoteStyles = {
  name: "Remote Styles",
  fills: [],
  strokes: [],
  text: [],
  effects: []
};

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
    let newRadiusArray = null;
    if (typeof msg.radiusValues === "string") {
      let newString = msg.radiusValues.replace(/\s+/g, "");
      newRadiusArray = newString.split(",");
      newRadiusArray = newRadiusArray
        .filter(x => x.trim().length && !isNaN(x))
        .map(Number);

      // Most users won't add 0 to the array of border radius so let's add it in for them.
      if (newRadiusArray.indexOf(0) === -1) {
        newRadiusArray.unshift(0);
      }
    } else {
      newRadiusArray = msg.radiusValues;
    }

    // Update the array we pass into checkRadius for linting.
    newRadiusArray = newRadiusArray.sort((a, b) => a - b);
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

  // Function to check if a style key exists locally for text layers.
  function isStyleKeyLocal(styleKey) {
    const localStyles = figma.getLocalTextStyles();

    for (const style of localStyles) {
      if (style.key === styleKey) {
        return true;
      }
    }

    return false;
  }

  // Check if a style key exists in use, like local styles but checks remote styles too.
  function isStyleInUse(styleId) {
    const style = figma.getStyleById(styleId);
    return style !== null;
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
    function applyLocalFillStyle(node, styleId) {
      node.fillStyleId = styleId;
    }

    function applyLocalStrokeStyle(node, styleId) {
      node.strokeStyleId = styleId;
    }

    function applyLocalEffectStyle(node, styleId) {
      node.effectStyleId = styleId;
    }

    async function applyStylesToNodes(field, index) {
      const styleKey = msg.error[field][index].key;
      const styleId = msg.error[field][index].id;

      if (
        (msg.error.type === "text" && isStyleInUse(styleId)) ||
        (msg.error.type === "text" && isStyleKeyLocal(styleKey))
      ) {
        for (const nodeId of msg.error.nodes) {
          const node = figma.getNodeById(nodeId);

          if (node && node.type === "TEXT") {
            applyLocalStyle(node, styleId);
          }
        }
      } else if (
        (msg.error.type === "fill" && isStyleInUse(styleId)) ||
        (msg.error.type === "fill" && isStyleKeyLocal(styleKey))
      ) {
        for (const nodeId of msg.error.nodes) {
          const node = figma.getNodeById(nodeId);

          if (node) {
            applyLocalFillStyle(node, styleId);
          }
        }
      } else if (
        (msg.error.type === "stroke" && isStyleInUse(styleId)) ||
        (msg.error.type === "stroke" && isStyleKeyLocal(styleKey))
      ) {
        for (const nodeId of msg.error.nodes) {
          const node = figma.getNodeById(nodeId);

          if (node) {
            applyLocalStrokeStyle(node, styleId);
          }
        }
      } else if (
        (msg.error.type === "effects" && isStyleInUse(styleId)) ||
        (msg.error.type === "effects" && isStyleKeyLocal(styleKey))
      ) {
        for (const nodeId of msg.error.nodes) {
          const node = figma.getNodeById(nodeId);

          if (node) {
            applyLocalEffectStyle(node, styleId);
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

              if (node && node.type === "TEXT" && msg.error.type === "text") {
                await applyRemoteStyle(node, importedStyle);
              } else if (node && msg.error.type === "fill") {
                node.fillStyleId = importedStyle.id;
              } else if (node && msg.error.type === "stroke") {
                node.strokeStyleId = importedStyle.id;
              }
            }
            await delay(3);
          }
        }
      }
    }

    // we pass in suggestions or messages as fields
    // index is which of the multiple styles they chose from in the suggestions array.
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

      // If the user hasn't selected anything, show the empty state.
      figma.ui.postMessage({
        type: "show-empty-state"
      });

      return;
    } else {
      let nodes = figma.currentPage.selection;
      let firstNode = [];

      firstNode.push(figma.currentPage.selection[0]);

      // Maintain the original tree structure so we can enable
      // refreshing the tree and live updating errors.
      originalNodeTree = nodes;

      // Show the preloader until we're ready to render content.
      figma.ui.postMessage({
        type: "show-preloader"
      });

      // Fetch the ignored errors and libraries from client storage
      const ignoredErrorsPromise = figma.clientStorage.getAsync(documentUUID);
      const librariesPromise = figma.clientStorage.getAsync("libraryKey");

      Promise.all([ignoredErrorsPromise, librariesPromise]).then(
        async ([ignoredErrors, libraries]) => {
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

          async function findRemoteStyles() {
            const currentPage = figma.currentPage;

            const nodes = currentPage
              .findAllWithCriteria({
                types: [
                  "TEXT",
                  "FRAME",
                  "COMPONENT",
                  "RECTANGLE",
                  "ELLIPSE",
                  "INSTANCE",
                  "VECTOR",
                  "LINE"
                ]
              })
              .filter(node => {
                // Check for remote styles
                return (
                  node.fillStyleId ||
                  node.strokeStyleId ||
                  (node.type === "TEXT" && node.textStyleId) ||
                  node.effectStyleId
                );
              });

            for (const node of nodes) {
              if (node.fillStyleId) {
                const styleId = node.fillStyleId;
                if (
                  !usedRemoteStyles.fills.find(style => style.id === styleId) &&
                  typeof styleId !== "symbol"
                ) {
                  const style = figma.getStyleById(styleId);
                  usedRemoteStyles.fills.push({
                    id: node.fillStyleId,
                    type: "fill",
                    paint: style.paints[0],
                    name: style.name,
                    count: style.consumers.length
                  });
                }
              }

              if (node.strokeStyleId) {
                const styleId = node.strokeStyleId;
                if (
                  !usedRemoteStyles.strokes.find(
                    style => style.id === styleId
                  ) &&
                  typeof styleId !== "symbol"
                ) {
                  const style = figma.getStyleById(styleId);
                  usedRemoteStyles.strokes.push({
                    id: node.strokeStyleId,
                    type: "stroke",
                    paint: style.paints[0],
                    name: style.name,
                    count: style.consumers.length
                  });
                }
              }

              if (node.type === "TEXT" && node.textStyleId) {
                const styleId = node.textStyleId;
                if (
                  !usedRemoteStyles.text.find(style => style.id === styleId) &&
                  typeof styleId !== "symbol"
                ) {
                  const style = figma.getStyleById(styleId);
                  usedRemoteStyles.text.push({
                    id: node.textStyleId,
                    type: "text",
                    name: style.name,
                    description: style.description,
                    key: style.key,
                    count: style.consumers.length,
                    style: {
                      fontStyle: style.fontName.style,
                      fontSize: style.fontSize,
                      textDecoration: style.textDecoration,
                      letterSpacing: style.letterSpacing,
                      lineHeight: style.lineHeight,
                      paragraphIndent: style.paragraphIndent,
                      paragraphSpacing: style.paragraphSpacing,
                      fontFamily: style.fontName.family,
                      textAlignHorizontal: style.textAlignHorizontal,
                      textAlignVertical: style.textAlignVertical,
                      textAutoResize: style.textAutoResize,
                      textCase: style.textCase
                    }
                  });
                }
              }

              if (node.effectStyleId) {
                const styleId = node.effectStyleId;
                if (
                  !usedRemoteStyles.effects.find(
                    style => style.id === styleId
                  ) &&
                  typeof styleId !== "symbol"
                ) {
                  const style = figma.getStyleById(styleId);
                  usedRemoteStyles.effects.push({
                    id: node.effectStyleId,
                    type: "effect",
                    effects: style.effects,
                    name: style.name,
                    count: style.consumers.length
                  });
                }
              }
            }

            console.log("Remote styles:", usedRemoteStyles);
          }

          await findRemoteStyles();

          const updateLocalStylesLibrary = async () => {
            const paintStylesData = await getLocalPaintStyles();
            const textStylesData = await getLocalTextStyles();
            const effectStylesData = await getLocalEffectStyles();
            const totalStyles =
              effectStylesData.length +
              textStylesData.length +
              paintStylesData.length;

            const localStyles = {
              name: "Local Styles",
              effects: effectStylesData,
              fills: paintStylesData,
              text: textStylesData,
              styles: totalStyles
            };

            // Update the global variable
            localStylesLibrary = localStyles;

            // Send the updated libraries array to the UI layer
            figma.ui.postMessage({
              type: "local-styles-imported",
              message: localStyles
            });
          };

          // Wait for the localStylesLibrary to be updated
          await updateLocalStylesLibrary();
          console.log(localStylesLibrary);

          // Now that libraries are available, call lint with libraries and localStylesLibrary, then send the message
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
          borderRadiusArray = borderRadiusArray.sort((a, b) => a - b);

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
        return lintVectorRules(node, libraries);
      }
      case "POLYGON":
      case "STAR":
      case "ELLIPSE": {
        return lintShapeRules(node, libraries);
      }
      case "FRAME": {
        return lintFrameRules(node, libraries);
      }
      case "SECTION": {
        return lintSectionRules(node, libraries);
      }
      case "INSTANCE":
      case "RECTANGLE": {
        return lintRectangleRules(node, libraries);
      }
      case "COMPONENT": {
        return lintComponentRules(node, libraries);
      }
      case "COMPONENT_SET": {
        // Component Set is the frame that wraps a set of variants
        // the variants within the set are still linted as components (lintComponentRules)
        // this type is generally only present where the variant is defined so it
        // doesn't need as many linting requirements.
        return lintVariantWrapperRules(node, libraries);
      }
      case "TEXT": {
        return lintTextRules(node, libraries);
      }
      case "LINE": {
        return lintLineRules(node, libraries);
      }
      default: {
        // Do nothing
      }
    }
  }

  function lintComponentRules(node, libraries) {
    let errors = [];

    // Example of how we can make a custom rule specifically for components
    // if (node.remote === false) {
    //   errors.push(
    //     createErrorObject(node, "component", "Component isn't from library")
    //   );
    // }

    newCheckFills(
      node,
      errors,
      libraries,
      localStylesLibrary,
      usedRemoteStyles
    );
    checkRadius(node, errors, borderRadiusArray);
    newCheckEffects(
      node,
      errors,
      libraries,
      localStylesLibrary,
      usedRemoteStyles
    );
    newCheckStrokes(
      node,
      errors,
      libraries,
      localStylesLibrary,
      usedRemoteStyles
    );

    return errors;
  }

  function lintVariantWrapperRules(node, libraries) {
    let errors = [];

    // checkFills(node, errors);
    newCheckFills(
      node,
      errors,
      libraries,
      localStylesLibrary,
      usedRemoteStyles
    );

    return errors;
  }

  function lintLineRules(node, libraries) {
    let errors = [];

    newCheckStrokes(
      node,
      errors,
      libraries,
      localStylesLibrary,
      usedRemoteStyles
    );
    newCheckEffects(
      node,
      errors,
      libraries,
      localStylesLibrary,
      usedRemoteStyles
    );

    return errors;
  }

  function lintFrameRules(node, libraries) {
    let errors = [];

    // checkFills(node, errors);
    newCheckFills(
      node,
      errors,
      libraries,
      localStylesLibrary,
      usedRemoteStyles
    );
    newCheckStrokes(
      node,
      errors,
      libraries,
      localStylesLibrary,
      usedRemoteStyles
    );
    checkRadius(node, errors, borderRadiusArray);
    newCheckEffects(
      node,
      errors,
      libraries,
      localStylesLibrary,
      usedRemoteStyles
    );

    return errors;
  }

  function lintSectionRules(node, libraries) {
    let errors = [];

    newCheckFills(
      node,
      errors,
      libraries,
      localStylesLibrary,
      usedRemoteStyles
    );
    // For some reason section strokes aren't accessible via the API yet.
    // checkStrokes(node, errors);
    checkRadius(node, errors, borderRadiusArray);

    return errors;
  }

  function lintTextRules(node, libraries) {
    let errors = [];

    checkType(node, errors, libraries, localStylesLibrary, usedRemoteStyles);
    newCheckFills(
      node,
      errors,
      libraries,
      localStylesLibrary,
      usedRemoteStyles
    );

    newCheckEffects(
      node,
      errors,
      libraries,
      localStylesLibrary,
      usedRemoteStyles
    );
    newCheckStrokes(
      node,
      errors,
      libraries,
      localStylesLibrary,
      usedRemoteStyles
    );

    return errors;
  }

  function lintRectangleRules(node, libraries) {
    let errors = [];

    newCheckFills(
      node,
      errors,
      libraries,
      localStylesLibrary,
      usedRemoteStyles
    );
    checkRadius(node, errors, borderRadiusArray);
    newCheckStrokes(
      node,
      errors,
      libraries,
      localStylesLibrary,
      usedRemoteStyles
    );
    newCheckEffects(
      node,
      errors,
      libraries,
      localStylesLibrary,
      usedRemoteStyles
    );

    return errors;
  }

  function lintVectorRules(node, libraries) {
    let errors = [];

    // This can be enabled by the user in settings.
    if (lintVectors === true) {
      newCheckFills(
        node,
        errors,
        libraries,
        localStylesLibrary,
        usedRemoteStyles
      );
      newCheckStrokes(
        node,
        errors,
        libraries,
        localStylesLibrary,
        usedRemoteStyles
      );
      newCheckEffects(
        node,
        errors,
        libraries,
        localStylesLibrary,
        usedRemoteStyles
      );
    }

    return errors;
  }

  function lintShapeRules(node, libraries) {
    let errors = [];

    newCheckFills(
      node,
      errors,
      libraries,
      localStylesLibrary,
      usedRemoteStyles
    );
    newCheckStrokes(
      node,
      errors,
      libraries,
      localStylesLibrary,
      usedRemoteStyles
    );
    newCheckEffects(
      node,
      errors,
      libraries,
      localStylesLibrary,
      usedRemoteStyles
    );

    return errors;
  }
};
