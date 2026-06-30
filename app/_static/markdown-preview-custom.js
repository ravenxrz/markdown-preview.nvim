;(function () {
  var ACTIVE_LINK_CLASS = 'mkdp-toc-active'
  var ACTIVE_ITEM_CLASS = 'mkdp-toc-active-item'
  var TOC_LINK_SELECTOR = '.markdown-body nav a[href^="#"]'
  var scheduled = false
  var lastActiveLink = null

  function decodeHash(hash) {
    try {
      return decodeURIComponent((hash || '').replace(/^#/, ''))
    } catch (_) {
      return (hash || '').replace(/^#/, '')
    }
  }

  function getTocPairs() {
    return Array.prototype.slice.call(document.querySelectorAll(TOC_LINK_SELECTOR))
      .map(function (link) {
        var id = decodeHash(link.getAttribute('href'))
        if (!id) return null
        var heading = document.getElementById(id)
        return heading ? { link: link, heading: heading } : null
      })
      .filter(Boolean)
  }

  function clearActive() {
    document.querySelectorAll('.' + ACTIVE_LINK_CLASS).forEach(function (node) {
      node.classList.remove(ACTIVE_LINK_CLASS)
    })
    document.querySelectorAll('.' + ACTIVE_ITEM_CLASS).forEach(function (node) {
      node.classList.remove(ACTIVE_ITEM_CLASS)
    })
  }

  function setActive(pair) {
    if (!pair || !pair.link) return
    if (lastActiveLink === pair.link) return

    clearActive()
    pair.link.classList.add(ACTIVE_LINK_CLASS)

    var item = pair.link.closest('li')
    if (item) item.classList.add(ACTIVE_ITEM_CLASS)

    lastActiveLink = pair.link

    var nav = pair.link.closest('nav')
    if (nav && (nav.matches(':hover') || nav.matches(':focus-within'))) {
      pair.link.scrollIntoView({ block: 'nearest' })
    }
  }

  function updateActive() {
    scheduled = false

    var pairs = getTocPairs()
    if (!pairs.length) {
      clearActive()
      lastActiveLink = null
      return
    }

    var anchorLine = Math.max(120, window.innerHeight * 0.22)
    var active = pairs[0]

    for (var i = 0; i < pairs.length; i++) {
      var rect = pairs[i].heading.getBoundingClientRect()
      if (rect.top <= anchorLine) {
        active = pairs[i]
      } else {
        break
      }
    }

    setActive(active)
  }

  function scheduleUpdate() {
    if (scheduled) return
    scheduled = true
    window.requestAnimationFrame(updateActive)
  }

  function install() {
    scheduleUpdate()

    if (!window.__mkdpTocScrollspyInstalled) {
      window.__mkdpTocScrollspyInstalled = true
      window.addEventListener('scroll', scheduleUpdate, { passive: true })
      window.addEventListener('resize', scheduleUpdate, { passive: true })
    }

    var root = document.querySelector('.markdown-body') || document.body
    if (window.__mkdpTocMutationObserver) {
      window.__mkdpTocMutationObserver.disconnect()
    }

    window.__mkdpTocMutationObserver = new MutationObserver(function () {
      lastActiveLink = null
      scheduleUpdate()
    })
    window.__mkdpTocMutationObserver.observe(root, { childList: true, subtree: true })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install)
  } else {
    install()
  }
})()
