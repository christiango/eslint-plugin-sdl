// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * @fileoverview Rule to disallow * as target origin in window.postMessage
 */

"use strict";

const astUtils = require("../ast-utils");

function isWindowOrAny(type) {
  return type === "any" || type === "Window";
}

module.exports = {
  meta: {
    type: "suggestion",
    fixable: "code",
    schema: [],
    docs: {
      description:
        "Always provide specific target origin, not * when sending data to other windows using [`postMessage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage#Security_concerns) to avoid data leakage outside of trust boundary.",
      url: "https://github.com/microsoft/eslint-plugin-sdl/blob/master/docs/rules/no-postmessage-star-origin.md"
    },
    messages: {
      default: "Do not use * as target origin when sending data to other windows"
    }
  },
  create: function (context) {
    const fullTypeChecker = astUtils.getFullTypeChecker(context);
    return {
      "CallExpression[arguments.length>=2][arguments.length<=3][callee.property.name=postMessage]"(
        node
      ) {
        // Check that second argument (target origin) is Literal "*"
        if (!(node.arguments[1].type === "Literal" && node.arguments[1].value == "*")) {
          return;
        }

        // Check that object type is Window when full type information is available
        if (fullTypeChecker) {
          const tsNode = context.sourceCode.parserServices.esTreeNodeToTSNodeMap.get(
            node.callee.object
          );
          const tsType = fullTypeChecker.getTypeAtLocation(tsNode);
          const type = fullTypeChecker.typeToString(tsType);
          // Unions such as Window | null must be checked one constituent at a time.
          if (tsType.isUnionOrIntersection()) {
            if (tsType.types.every((t) => !isWindowOrAny(fullTypeChecker.typeToString(t)))) {
              return;
            }
          } else if (!isWindowOrAny(type)) {
            return;
          }
        }

        context.report({
          node: node,
          messageId: "default"
        });
      }
    };
  }
};
