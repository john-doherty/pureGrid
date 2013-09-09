# Welcome to pureGrid

pureGrid is a pure JavaScript (no bloated script libraries) editable grid that uses minimal JavaScript and well-formed HTML to deliver a lightning fast data grid.
It only renders the table rows and cells required to occupy your screen and rather than creating new DOM rows on scroll, it simply updates the innerText of each cell (dramatically reducing reflows).

Test drive at http://puregrid.johndoherty.info/

Find more information at http://github.com/john-doherty/pureGrid/wiki

Basic Features

* 
* Reduced DOM nodes makes shifting through large amounts of data fast and scalable
* Fixed table header issue is bypassed as only td's are updated on scroll
* Server Independent (requires only a JavaScript multi dimensional array wrapped as JsonP to work)
* using textContent/innerText to update the cells means the DOM does not have to parse the input string for new nodes - faster!
* passes as much responsibility as possible back to the browser, such as resizing
