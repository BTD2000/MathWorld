
function renderBBCode(element, text) {
  const source = String(text ?? "");
  const root = document.createDocumentFragment();
  const stack = [{ node: root, tag: "root" }];

  const tokenPattern =
    /\[(\/?)(b|i|u|s|list|url|ruler)(?:=([^\]]*))?\]|\[\*\]/gi;

  function current() {
    return stack[stack.length - 1].node;
  }

  function addText(value) {
    current().append(document.createTextNode(value));
  }

  function closeTag(tag) {
    for (let i = stack.length - 1; i > 0; i--) {
      if (stack[i].tag === tag) {
        stack.length = i;
        return true;
      }
    }
    return false;
  }

  let lastIndex = 0;
  let match;

  while ((match = tokenPattern.exec(source)) !== null) {
    addText(source.slice(lastIndex, match.index));
    lastIndex = tokenPattern.lastIndex;

    const token = match[0];

    if (token.toLowerCase() === "[*]") {
      const listIndex = stack.findLastIndex(
        item => item.tag === "list"
      );

      if (listIndex === -1) {
        addText(token);
        continue;
      }

      if (stack.at(-1).tag === "li") {
        stack.pop();
      }

      const li = document.createElement("li");
      stack[listIndex].node.append(li);
      stack.push({ node: li, tag: "li" });
      continue;
    }

    const closing = match[1] === "/";
    const tag = match[2].toLowerCase();
    const argument = match[3];

    if (closing) {
      if (!closeTag(tag)) addText(token);
      continue;
    }

    if (tag === "ruler") {
      const hr = document.createElement("hr");
      current().append(hr);
      continue;
    }

    let node;

    if (tag === "list") {
        const type = argument?.trim().toLowerCase();

        if (type === "1") {
            node = document.createElement("ol");
            node.type = "1";
        } else if (type === "a") {
            node = document.createElement("ol");
            node.type = "a";
        } else if (type === "a-upper") {
            node = document.createElement("ol");
            node.type = "A";
        } else if (type === "i") {
            node = document.createElement("ol");
            node.type = "i";
        } else if (type === "i-upper") {
            node = document.createElement("ol");
            node.type = "I";
        } else {
            node = document.createElement("ul");
        }
}
    else if (tag === "url") {
      if (!argument) {
        node = document.createElement("span");
        current().append(node);
        stack.push({ node, tag });
        continue;
      }

      try {
        const url = new URL(argument.trim());
        if (!["http:", "https:"].includes(url.protocol)) {
          addText(token);
          continue;
        }

        node = document.createElement("a");
        node.href = url.href;
        node.target = "_blank";
        node.rel = "noopener noreferrer";
      } catch {
        addText(token);
        continue;
      }
    } else {
      const names = {
        b: "strong",
        i: "em",
        u: "u",
        s: "s"
      };
      node = document.createElement(names[tag]);
    }

    current().append(node);
    stack.push({ node, tag });
  }

  addText(source.slice(lastIndex));

  // Convert [url]https://example.com[/url] to a safe link.
  root.querySelectorAll("span").forEach(span => {
    const href = span.textContent.trim();

    try {
      const url = new URL(href);
      if (!["http:", "https:"].includes(url.protocol)) return;

      const link = document.createElement("a");
      link.href = url.href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = span.textContent;
      span.replaceWith(link);
    } catch {
      // Keep invalid URLs as text.
    }
  });

  element.replaceChildren(root);
}