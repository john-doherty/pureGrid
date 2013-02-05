# Welcome to pureGrid

For more information please visit http://github.com/john-doherty/pureGrid/wiki

Basic Features

* Reduced DOM nodes makes shifting through large amounts of data fast and scalable
* Fixed table header issue is bypassed as only td's are updated on scroll
* Server Independent (requires only a JavaScript multi dimensional array wrapped as JsonP to work)
* using textContent/innerText to update the cells means the DOM does not have to parse the input string for new nodes - faster!
* passes as much responsibility as possible back to the browser, such as resizing