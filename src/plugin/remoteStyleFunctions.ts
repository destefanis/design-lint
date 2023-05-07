import { determineFill, gradientToCSS } from "./lintingFunctions";

export async function fetchRemoteStyles(usedRemoteStyles) {
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
      if (typeof styleId !== "symbol") {
        // Check if the style with the given styleId already exists in the usedRemoteStyles.fills array
        const existingStyle = usedRemoteStyles.fills.find(
          style => style.id === styleId
        );

        if (existingStyle) {
          // If the style exists, update the count and consumers properties
          existingStyle.count += 1;
          existingStyle.consumers.push(node);
        } else {
          // If the style does not exist, create a new style object and push it to the usedRemoteStyles.fills array
          const style = figma.getStyleById(styleId);

          let currentFill = determineFill(node.fills);
          let nodeFillType = node.fills[0].type;
          let cssSyntax = null;

          if (nodeFillType === "SOLID") {
            cssSyntax = currentFill;
          } else if (
            nodeFillType !== "SOLID" &&
            nodeFillType !== "VIDEO" &&
            nodeFillType !== "IMAGE"
          ) {
            cssSyntax = gradientToCSS(node.fills[0]);
          }

          usedRemoteStyles.fills.push({
            id: node.fillStyleId,
            type: "fill",
            paint: style.paints[0],
            name: style.name,
            count: 1,
            consumers: [node],
            fillColor: cssSyntax
          });
        }
      }
    }

    if (node.strokeStyleId) {
      const styleId = node.strokeStyleId;
      if (typeof styleId !== "symbol") {
        // Check if the stroke style with the given styleId already exists in the usedRemoteStyles.strokes array
        const existingStyle = usedRemoteStyles.strokes.find(
          style => style.id === styleId
        );

        if (existingStyle) {
          // If the stroke style exists, update the count and consumers properties
          existingStyle.count += 1;
          existingStyle.consumers.push(node);
        } else {
          // If the stroke style does not exist, create a new style object and push it to the usedRemoteStyles.strokes array
          const style = figma.getStyleById(styleId);

          let nodeFillType = style.paints[0].type;
          let cssSyntax = null;

          if (nodeFillType === "SOLID") {
            cssSyntax = determineFill(style.paints);
          } else if (nodeFillType !== "IMAGE" && nodeFillType !== "VIDEO") {
            cssSyntax = gradientToCSS(node.strokes[0]);
          }

          usedRemoteStyles.strokes.push({
            id: node.strokeStyleId,
            type: "stroke",
            paint: style.paints[0],
            name: style.name,
            count: 1,
            consumers: [node],
            fillColor: cssSyntax
          });
        }
      }
    }

    if (node.type === "TEXT" && node.textStyleId) {
      const styleId = node.textStyleId;
      if (typeof styleId !== "symbol") {
        // Check if the text style with the given styleId already exists in the usedRemoteStyles.text array
        const existingStyle = usedRemoteStyles.text.find(
          style => style.id === styleId
        );

        if (existingStyle) {
          // If the text style exists, update the count and consumers properties
          existingStyle.count += 1;
          existingStyle.consumers.push(node);
        } else {
          // If the text style does not exist, create a new style object and push it to the usedRemoteStyles.text array
          const style = figma.getStyleById(styleId);

          usedRemoteStyles.text.push({
            id: node.textStyleId,
            type: "text",
            name: style.name,
            description: style.description,
            key: style.key,
            count: 1,
            consumers: [node],
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
    }

    if (node.effectStyleId) {
      const styleId = node.effectStyleId;
      if (typeof styleId !== "symbol") {
        // Check if the effect style with the given styleId already exists in the usedRemoteStyles.effects array
        const existingStyle = usedRemoteStyles.effects.find(
          style => style.id === styleId
        );

        if (existingStyle) {
          // If the effect style exists, update the count and consumers properties
          existingStyle.count += 1;
          existingStyle.consumers.push(node);
        } else {
          // If the effect style does not exist, create a new style object and push it to the usedRemoteStyles.effects array
          const style = figma.getStyleById(styleId);

          usedRemoteStyles.effects.push({
            id: node.effectStyleId,
            type: "effect",
            effects: style.effects,
            name: style.name,
            count: 1,
            consumers: [node]
          });
        }
      }
    }
  }

  // console.log("Remote styles:", usedRemoteStyles);
}

const groupConsumersByType = consumers => {
  const groupedConsumers = {};

  consumers.forEach(consumer => {
    let nodeType = consumer.type;
    let nodeId = consumer.id;

    if (!groupedConsumers[nodeType]) {
      groupedConsumers[nodeType] = [];
    }

    groupedConsumers[nodeType].push(nodeId);
  });

  return groupedConsumers;
};

// Function to apply groupConsumersByType to the global styles library
export const groupLibrary = globalStylesLibrary => {
  return Object.fromEntries(
    Object.entries(globalStylesLibrary).map(([key, value]) => {
      // Check if the value is an array (i.e., styles)
      if (Array.isArray(value)) {
        // Apply the groupConsumersByType function to the styles
        const stylesWithGroupedConsumers = value.map(style => {
          const groupedConsumers = groupConsumersByType(style.consumers);
          return { ...style, groupedConsumers };
        });
        return [key, stylesWithGroupedConsumers];
      } else {
        // For non-array properties, copy the original value
        return [key, value];
      }
    })
  );
};
