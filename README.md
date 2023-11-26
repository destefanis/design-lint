# Design Lint

![Design Lint Gif Example](https://github.com/destefanis/design-lint/blob/master/assets/lint-example.gif)


Find and fix errors in your designs with Design Lint, a plugin for Figma.

[View Plugin Page](https://www.figma.com/c/plugin/801195587640428208)

Design Lint finds missing styles within your designs on all your layers. Ensure your designs are ready for development or design collaboration by fixing inconsistencies.

While it's running, Design Lint will update automatically as you fix errors. Clicking on layer will also select that layer in your design. Navigating between each error is fast and much easier than trying to find errors on your own.

## Features 
* Selecting a layer with an error will also select the layer in Figma, letting you navigate your page and fix errors with full context.
* Design Lint polls for changes and will update as you fix errors.
* "Ignore" or "Ignore All" buttons let you skip special layers.
* Use the "Select All" option to fix multiple errors at once that share the same value.
* Need to skip layers like illustrations? Locked layers in Figma will be skipped from linting.
* Custom border radius values can be set within settings and are stored in Client Storage.

![Design Lint Ignore Example](https://github.com/destefanis/design-lint/blob/master/assets/ignore-example.gif)

![Design Lint Selection Example](https://github.com/destefanis/design-lint/blob/master/assets/new-selection.gif)

Because Design Lint doesn't try and manage your library, there's no logging in, accounts, or syncing. This open source plugin is designed to make fixing errors easy and let you get back to designing. Want to write specific rules for your own organization? Feel free to fork this repo and edit to your liking!

## Install from the Figma Plugin Page
Although this plugin is open source, for most users you'll want to install from the Figma plugin community page.
[View Plugin Page](https://www.figma.com/c/plugin/801195587640428208)

## To Run Locally use following commands
* Run `yarn` to install dependencies.
* Run `yarn build:watch` to start webpack in watch mode.

### To Edit it
The react code, components, and UI can be found here [App.tsx](./src/app/components/App.tsx).  
The Figma API, Storage, and Linting happens in [controller.ts](./src/plugin/controller.ts).
Linting functions and rules can be found in [lintingFunctions.ts](./src/plugin/lintingFunctions.ts).

### How the Linting Works
Different layers (referred to as Nodes in the Figma API) have different properties to lint. First we loop through the layers the user has selected. For each layer we determine that layers type.

```javascript
function determineType(node) {
    switch (node.type) {
      case "SLICE":
      case "GROUP": {
        // Groups styles apply to their children so we can skip this node type.
        let errors = [];
        return errors;
      }
      case "CIRCLE":
      case "VECTOR":
      case "STAR":
      case "BOOLEAN_OPERATION":
      case "SQUARE": {
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
```

Some of these node types have the same requirements so there are generic functions that call multiple linting functions which are imported from [lintingFunctions.ts](./src/plugin/lintingFunctions.ts).

```javascript
function lintTextRules(node) {
    let errors = [];

    checkType(node, errors);
    checkFills(node, errors);
    checkEffects(node, errors);
    checkStrokes(node, errors);

    return errors;
  }
```

So for instance, this function runs the linting rules for typography, fills, effects, and strokes on this layer since its a piece of text, and text layers have all those properties. Where as a Frame only lints for fills, effects, and strokes, as it can't have any type styles.

### What does Design Lint check for by default?

**Out of the box, Design Lint only checks for layers that are not using styles**. In Figma, best practice is to use styles (also referred to as design tokens) on all of your layers, so your type, colors, spacing etc are all consistent.

That being said, Design Lint is ready for you to write custom rules for your team. For example, if you wanted to ensure that no text layers are using background specific colors, you could check for this, an example is provided below.

### Error Array

Design Lint references one array of all the errors returned by the lint rules. Each error in the array is an object. A given layer in Figma can have multiple errors, let's say it's missing both a text style and using an incorrect fill color, so we use that layers unique ID (set by Figma) to identify which errors belong to it.

### Error Object

When a linting function runs and finds an error, we return an error object. This object has the original nodes information, it's ID (which we use to select it), it's name, what kind of layer it is, etc. When writing a custom error, you can customize the messages it returns. Node and type (fill, text, effect, stroke, or radius) are required.

```javascript
  return errors.push(
    createErrorObject(
      node, // Node object we use to reference the error (id, layer name, etc)
      "fill", // Type of error (fill, text, effect, etc)
      "Missing Text Style", // Large text to indicate what the error is.
      "Multiple Styles" // Some linting functions use another function here to return a fill HEX value or a number.
    )
  );
```


### Writing Custom Rules

Until I have time to write a formal tutorial, I've added a [placeholder linting function with comments](https://github.com/destefanis/design-lint/blob/4c3c40cdd47e93db8e01bb110d992c7235b40efd/src/plugin/lintingFunctions.ts#L163-L212) that will guide you through creating some basic custom rules for your design team.

```javascript
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
  // we can return an error instead. If this were a frame, rectangle, or other layer type, we could remove this check.
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
```

#### Import your function in controller.ts
Once you've written some custom functions for checking specific rules, make sure to [import your function here](https://github.com/destefanis/design-lint/blob/4c3c40cdd47e93db8e01bb110d992c7235b40efd/src/plugin/controller.ts#L9-L10) in the controller.ts file.

Let's say we've written a custom rule for text layers, make sure to [change what functions run for text layers here](https://github.com/destefanis/design-lint/blob/8d8c38719def3c3ea8f3daf482447fa6a3f2cdcf/src/plugin/controller.ts#L1623-L1625) under the `lintTextRules` function.


#### Changing the border radius default

If you plan on using this app as a private plugin you'll likely want to change the default border radius values which are `[0, 2, 4, 8, 16, 24, 32]`. This can be acheived by changing these values in [App.tsx](./src/app/components/App.tsx#L23) and in [controller.ts](./src/plugin/controller.ts#L12). 

### Tooling
This repo is using following:
* [Figma Plugin React Template](https://github.com/nirsky/figma-plugin-react-template)
* React + Webpack
* TypeScript
* TSLint
* Prettier precommit hook
