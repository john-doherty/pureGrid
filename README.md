# pureGrid

[![Linked In](https://img.shields.io/badge/Linked-In-blue.svg)](https://www.linkedin.com/in/john-i-doherty) [![Twitter Follow](https://img.shields.io/twitter/follow/CambridgeMVP.svg?style=social&label=Twitter&style=plastic)](https://twitter.com/CambridgeMVP)

pureGrid is a pure JavaScript _(no bloated script libraries)_ editable grid that uses minimal JavaScript and well-formed HTML to deliver a lightning fast data grid. It only renders the table rows and cells required to occupy your screen and rather than creating new DOM rows on scroll, it simply updates the innerText of each cell _(dramatically reducing reflows)_.

It uses JavaScript only when ABSOLUTELY necessary, therefore rather than rendering a separate table to lock the header row, it simply skips that row when scrolling. Also, **pureGrid** does not contain any `window.onresize` code, instead the re-sizing is left to the browser.

## Key Features

 * Reduced DOM nodes makes shifting through large amounts of data fast and scalable
 * Fixed table header issue is bypassed as only td's are updated on scroll
 * Server Independent (requires only a JavaScript multi dimensional array wrapped as JsonP to work)
 * using textContent/innerText to update the cells means the DOM does not have to parse the input string for new nodes - faster!
 * passes as much responsibility as possible back to the browser, such as resizing


## Example

Add the `puregrid.css` and `puregrid.js` references to your page.

```html
<link rel="stylesheet" type="text/css" href="styles/puregrid.css" />
<script type="text/javascript" src="script/puregrid.js"></script>
```

Then add a placeholder `<div class="puregrid"></div>` to the body of your HTML where you would like the grid to be rendered. If you include a hidden input with `class="puregrid-data-url"` within your div _(pointing to your JsonP URL)_ pureGrid will load the file immediately.

```html
<div id="testGrid1" class="puregrid">
    <input type="hidden" class="puregrid-data-url" value="data/data-500.js" />
</div>
```

Ensure your `puregrid-data-url` returns a valid JsonP response containing your desired table configuration and data, for example:

```js
pureGrid.bind('testGrid1', {
    caption : '',
    cols : 4,
    rows : 4,
    css: 'test-view',
    firstRowIsHeader: true,
    firstCoIsHeader: true,
    selectableRows : true,
    selectableCells: true,
    editable : true,
    dataTypes : ['','^\\w+$',['one','two','three'],''],
    data : [
        ['','A','B','C','D'],
        ['1', 'A1', 'B1', 'C1', 'D1'],
        ['2', 'A2', 'B2', 'C2', 'D2'],
        ['3', 'A3', 'B3', 'C3', 'D3']
    ]
});
```

That's it, you now have an editable _(or readonly)_ grid that can handle thousands of rows.

## Setting column widths

All visual aspects of the grid are controlled via CSS. Each column is rendered with an associated `col` tag assigned with a class name of `puregrid-col2` for column 2, `puregrid-col3` for column 3 and so on. So, to set the width of a particular column in a grid with an id of `id="testGrid1"` you would use the following CSS:

```css
#testGrid1 .puregrid-col2 { width: 170px; }
#testGrid1 .puregrid-col3 { width: 40px; }
```

## Hooking events

pureGrid uses the Publish–Subscribe pattern, whereby you subscribe to an event and receive a callback when the event fires. This allows you to provide multiple event handlers for the same event in multiple locations. For Example:

```js
pureGrid.event.subscribe('onready', function(){
    alert('ready!');
});
```

## Please Note

This code was written in 2013, a lot has changed since then and I'm planning a write to make it production ready.

## License

Licensed under [ISC License](LICENSE) &copy; [John Doherty](http://www.johndoherty.info)
