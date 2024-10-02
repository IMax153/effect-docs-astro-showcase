import { computePosition, offset, shift, size } from "https://cdn.jsdelivr.net/npm/@floating-ui/dom@1.6.10/+esm"

function setupTooltip(referenceNode) {
  const containerNode = document.body
  const popperNode = referenceNode.querySelector(".twoslash-popup-container")

  if (popperNode && popperNode.parentNode) {
    popperNode.parentNode.removeChild(popperNode)
  }

  function updatePosition() {
    containerNode.appendChild(popperNode)
    new Promise((resolve) => requestAnimationFrame(() => {
      requestAnimationFrame(resolve)
    })).then(() =>
      computePosition(referenceNode, popperNode, {
        placement: "bottom-start",
        middleware: [
          offset({
            mainAxis: 1
          }),
          shift({
            padding: 10
          }),
          size({
            padding: 10,
            apply({ availableHeight, availableWidth }) {
              Object.assign(popperNode.style, {
                maxWidth: `${Math.max(0, availableWidth)}px`,
                maxHeight: `${Math.max(0, availableHeight)}px`,
              })
            }
          }),
        ],
      })).then(({ x, y }) => {
        Object.assign(popperNode.style, {
          display: "block",
          left: `${x}px`,
          top: `${y}px`,
        })
      })
  }


  referenceNode.addEventListener("mouseenter", () => {
    updatePosition()
  })
  referenceNode.addEventListener("mouseleave", () => {
    containerNode.removeChild(popperNode)
  })
}

function initTwoslashPopups(container) {
  container.querySelectorAll?.(".twoslash").forEach((el) => {
    setupTooltip(el)
  })
}

initTwoslashPopups(document)

const newTwoslashPopupObserver = new MutationObserver((mutations) =>
  mutations.forEach((mutation) =>
    mutation.addedNodes.forEach((node) => {
      initTwoslashPopups(node)
    })
  )
)
newTwoslashPopupObserver.observe(document.body, { childList: true, subtree: true })

document.addEventListener("astro:page-load", () => {
  initTwoslashPopups(document)
})
