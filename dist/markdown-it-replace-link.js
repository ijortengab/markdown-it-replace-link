(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.markdownitReplaceLink  = f()}})(function(){var define,module,exports;return (function(){function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}return e})()({1:[function(require,module,exports){

function replaceAttr (token, attrName, replace, env) {
  token.attrs.forEach(function (attr) {
    if (attr[0] === attrName) {
      attr[1] = replace(attr[1], env, token)
    }
  })
}

function replaceNodes (nodes, replace, env, token) {
  if (!nodes) return
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if (node.attribs) {
      if (node.name === 'img' && node.attribs.src) {
        node.attribs.src = replace(node.attribs.src, env, token, node)
      }
      if (node.name === 'a' && node.attribs.href) {
        node.attribs.href = replace(node.attribs.href, env, token, node)
      }
    }
    replaceNodes(node.children, replace, env, token)
  }
}

function replaceHTML (token, replace, env) {
  const htmlparser = require('htmlparser2')
  const serializer = require('dom-serializer')
  const dom = new htmlparser.parseDocument(token.content, {
    recognizeCDATA: true,
    recognizeSelfClosing: true
  })
  replaceNodes(dom.children, replace, env, token)
  token.content = serializer.render(dom)
}

module.exports = function (md, opts) {
  md.core.ruler.after(
    'inline',
    'replace-link',
    function (state) {
      let replace

      if (md.options.replaceLink && typeof md.options.replaceLink === 'function') {
        // Use markdown options (default so far)
        replace = md.options.replaceLink
      } else if (opts && opts.replaceLink && typeof opts.replaceLink === 'function') {
        // Alternatively use plugin options provided upon .use(..)
        replace = opts.replaceLink
      } else {
        return false
      }

      const html = opts && opts.processHTML || false

      if (typeof replace === 'function') {
        state.tokens.forEach(function (blockToken) {
          if (html && blockToken.type === 'html_block') {
            replaceHTML(blockToken, replace, state.env)
          }
          if (blockToken.type === 'inline' && blockToken.children) {
            blockToken.children.forEach(function (token) {
              const type = token.type
              if (html && type === 'html_inline') {
                replaceHTML(token, replace, state.env)
              }
              if (type === 'link_open') {
                replaceAttr(token, 'href', replace, state.env)
              } else if (type === 'image') {
                replaceAttr(token, 'src', replace, state.env)
              }
            })
          }
        })
      }
      return false
    }
  )
}

},{}]},{},[1])(1)
});