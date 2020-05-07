(function(rAF) {
  var firstContentfulPaint;
  var isImage = false;
  var currentNode;
  var callbacks = [];

  function onFirstContentfulPaint(callback) {
    callbacks.push(callback);
    reportFCP();
  }

  function reportFCP() {
    if (firstContentfulPaint >= 0) {
      callbacks.forEach(function(callback) {
        callback(firstContentfulPaint, currentNode);
      });
      callbacks = [];
    }
  }

  function isVisible(node) {
    return node.offsetHeight > 0;
  }

  function isImageCompleted() {
    if (currentNode.complete && isVisible(currentNode)) {
      firstContentfulPaint = performance.now();
      reportFCP();
    } else {
      rAF(() => isImageCompleted());
    }
  }

  function checkFCP() {
    var iterator = document.createNodeIterator(
      document.body,
      NodeFilter.SHOW_ALL,
      function(node) {
        if (!node) {
          return false;
        }

        var isNonEmptyTextNode =
          node.nodeType === Node.TEXT_NODE &&
          /[^s]/.test(node.nodeValue.trim());

        if (isNonEmptyTextNode && isVisible(node.parentNode)) {
          return isNonEmptyTextNode;
        }

        var isContentfulImage = node.tagName === "IMG" && node.src != "";

        if (isContentfulImage) {
          isImage = true;
          return isContentfulImage;
        }

        return false;
      },
      false
    );

    currentNode = iterator.nextNode();

    if (currentNode != null) {
      if (isImage) {
        rAF(isImageCompleted);
      } else {
        rAF(() => {
          firstContentfulPaint = performance.now();
          reportFCP();
        });
      }
    } else {
      rAF(checkFCP);
    }
  }

  rAF(checkFCP);

  self["perfMetrics"] = self["perfMetrics"] || {};
  self["perfMetrics"]["onFirstContentfulPaint"] = onFirstContentfulPaint;
})(requestAnimationFrame);
