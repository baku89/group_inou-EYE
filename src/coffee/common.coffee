<<<<<<< Updated upstream
# gui = require 'nw.gui'
# win = gui.Window.get()

# nativeMenuBar = new gui.Menu({type: 'menubar'})

# try
# 	nativeMenuBar.createMacBuiltin('gi-eye')
# 	win.menu = nativeMenuBar
# catch e
# 	console.log e.message
=======
gui = require('nw.gui')
win = gui.Window.get()
nativeMenuBar = new gui.Menu({ type: "menubar" })

nativeMenuBar.createMacBuiltin("My App")
win.menu = nativeMenuBar
>>>>>>> Stashed changes
