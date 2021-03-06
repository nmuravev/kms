var Action = require('../../../action')
var Self = function (p) {
  Action.call(this, p)
  var self = this
  self.id = 'force'
  self._label = 'Graph'
  self._deny = false
  self._icon = 'fa fa-share-alt'
  self.group = 'layout'

  self.registrar.on('show', self.enable.bind(self))
  self.registrar.on('hide', self.disable.bind(self))
}
Self.prototype = Object.create(Action.prototype)

Self.prototype._execute = function () {
  var self = this
  self.registrar.layout = self.registrar.layouts[self.id]
  self.registrar.updateLayout({transit: false})
}

Self.prototype.evaluate = function () {
  var self = this
  if (self.registrar && self.registrar.isVisible()) self.enable()
  else self.disable()
}

module.exports = Self
