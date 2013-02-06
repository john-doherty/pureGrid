/**
 * @license
 * (c) 2013 John Doherty
 * john{dot}doherty{at}eliteology{dot}com
 * https://github.com/john-doherty/pureGrid
 *
 * Distributed under MIT license.
 * All rights reserved.
 *
 **/
 
// returns the index of an item in an array
Array.prototype.indexOf = function(val)
{
	for(var i=0,l=this.length;i<l;i++)
	{
		if (this[i]===val) return i;
	}
	return -1;
};

// does a regex match on a string
String.prototype.matches = function(v){ 
	return (new RegExp(v,'gm')).test(this); 
};

// 'this {0} a {1}'.format('is','test') = 'this is a test';
String.prototype.format = function() { 
	var a = arguments; 
	return this.replace(/\{\d+\}/g, function(c){return a[c.match(/\d+/)];}); 
};

// returns true if any of the parameters match the value of this string
String.prototype.anyOf = function () {
    
	for (var i = 0, l = arguments.length; i < l; i++) {
        if (arguments[i] == this) {
            return true;
        }
    }
    return false;
};

// executes a function with parameters after a predefined delay (milliseconds)
Function.prototype.delay = function (d /* delay in ms */, b /* bind (the value of this inside calling function) */) {
    var s = this, a = [].slice.call(arguments, 2);
    return window.setTimeout(function () { s.apply(b || s, a); }, d);
};

// repeatedly executes a function at every (milliseconds) interval until the function returns true (cancelling the interval)
Function.prototype.repeat = function (d /* delay in ms */, b /* bind (the value of this inside calling function) */) {
    var s = this, a = [].slice.call(arguments, 2);
    var f = function () { if (s.apply(b || s, a) === true) clearInterval(s.__t); };
    s.__t = window.setInterval(f, d);
};

//
// usage 'red editable data-maxcols-4'.getCssKeyValue('data-maxcols');
// or var cssVal = element.className.getCssKeyValue('data','maxcols');
//
String.prototype.getCssKeyValue = function(k /* key */)
{
	return this.matches(k + '-([a-z0-9]+)') ? (new RegExp(k + '-([a-z0-9]+)','gim')).exec(this)[1] : '';
};

//
// return item(s) where property or index equals value (multi dimensional arrays of array or object)
//
Array.prototype.where = function(p /* property or index */, v /* value */)
{
	var r = [];
	for (var i=0, l=this.length; i<l; i++) 
	{
		if (this[i][p]==v)
		{
			r[r.length] = this[i];
		}
	}
	return r;
};

// returns the first item in an array or null
Array.prototype.first = function() { return (this.length>0) ? this[0] : null; };

// returns the last item in an array or null
Array.prototype.last = function() { return (this.length>0) ? this[this.length-1] : null; };

//
// set of cross browser helper methods
//
var tools = {

    // if running in debug mode, write values to the console window
    trace : function (s) { 
	    if (window.console && window.console.log) { window.console.log(s); };
    },

	// cancels an event
    cancelEvent: function (e) {
        e = e || event;
        if (e.stopPropagation) { e.stopPropagation(); e.preventDefault(); }
        else if(typeof e.cancelBubble != 'undefined') { e.cancelBubble = true; e.returnValue = false; }
        return false;
    },

    // returns a collection of elements were attribute values matches 
    getElementsByAttributeValue: function (parent, tagName, attributeName, attributeValue) {

        var nodes = (parent || document).getElementsByTagName(tagName || '*'),
            css = '(^|\\s)' + attributeValue + '(\\s|$)',
            result = [];

        for (var i = 0, l = nodes.length; i < l; i++) {

            var node = nodes[i];

            if ((node[attributeName] === attributeValue) || (node.getAttribute(attributeName) === attributeValue) ||
                (attributeName === "class" && node.className && node.className.matches(css))) {
                result.push(node);
            }
        }

        return result;
    },

	// shorthand method to create elements with attributes
    createElement: function (parent, tagName, attributes, innerText, innerHtml) {

        var el = document.createElement(tagName);

        if (attributes) {
            for (var key in attributes) {
                if (key === 'style' && typeof el.style.cssText != 'undefined') { el.style.cssText = attributes[key]; }
                else if (key === 'style') { el.style = attributes[key]; }
                else if (key == "class") { el.className = attributes[key]; }
                else if (key == "id") { el.id = attributes[key]; }
                else if (typeof this[key] != 'string') { el[key] = attributes[key]; } // expando
                else { el.setAttribute(key, attributes[key]); }
            }
        }
        if (innerText) { el.appendChild(document.createTextNode(innerText)); }
        if (innerHtml) { el.innerHTML = innerHtml; }
        if (parent) { parent.appendChild(el); }

        return el;
    },

	// adds a css class to an element if it does not already exist
    addCss: function (el, val) {
        var css = el.className||"";
        if (!css.matches('(^|\\s)' + val)) {
            el.className += (css=="") ? val : " " + val;
        }
    },

	// removes css from an element if it exists
    removeCss: function (el, val) {

        var css = el.className;

        if (css && css.matches('(^|\\s)' + val)) {
            el.className = css.replace(new RegExp('(^|\\s)' + val, 'gi'), '');
        }
    }

}

//
// main pureGrid object.
// (you can have multiple pureGrids on the screen, each one is added to the pureGrid.items collection)
//
var pureGrid = {

	// collection of on screen grids indexed by id 
	items : [],
	
    // is the pureGrid ready for interaction?
	ready : false,

	event : {
	
		// allows an application to subscribe to events
		subscribe : function(eventName, callback) {
		
			// if the event is supported and a call-back function is supplied
			if (pureGrid._.events.indexOf(eventName)>-1 && typeof callback === 'function') 
			{
				// assign event subscriber
				pureGrid._.subscribers.push({'name':eventName,'callback':callback});
			}
		},
		
		// removes an event subscriber
		unsubscribe : function(name, callback){
			for(var i = pureGrid._.subscribers.length-1; i >= 0; i--)
			{
				var sub = pureGrid._.subscribers[i]
				if (sub.name === name && sub.callback === callback)
				{
					pureGrid._.subscribers.splice(i,1);
				}
			}
			
			// ensure the array still exists
			pureGrid._.subscribers = [] || pureGrid._.subscribers;
		}
	},

	// main entry point. Scans the DOM for <div class="puregrid"></div> and turns them into a pureGrid
	init : function()
	{
        if (/loaded|complete/i.test(document.readyState)) {
            pureGrid.ready = true;
		
			// find table placeholder containers
			var tbls = tools.getElementsByAttributeValue(null, 'div', 'class', 'puregrid');
			
			for (var i=0, l=tbls.length; i<l; i++)
			{
				// create new table and add it to the array of items
				pureGrid.items.push(new pureGrid._.create(tbls[i]));
			}
			
			// fire the on ready event
			pureGrid._.fireEvent('onready');
		}
		
        // returning true will force the function.repeater to stop
        return pureGrid.ready;
	},
	
	// get a table by ID
	getById: function (tableId)
	{
	    return pureGrid.items.where('id', tableId).first();
	},
	
	// set data at a particular row/column
	updateCell: function (tableId, rowIndex, colIndex, value)
	{
	    var tbl = pureGrid.items.where('id', tableId).first();

	    if (tbl)
		{
	        tbl.updateCell(rowIndex, colIndex, value);
		}
	},
	
	// adds a row of data to the table at certain position
	addRow: function (tableId, rowIndex, rowData)
	{
	    var tbl = pureGrid.items.where('id', tableId).first();

	    if (tbl && rowData.length > 0)
		{
	        rowIndex = (rowIndex || tbl.data.length) - 1;
		
			//TODO: need to padd/trim the rowData if the length does not match existing data
		
		    if (rowIndex >= 0)
			{
		        tbl.data.splice(rowIndex + tbl.startRowIndex, 0, rowData);
			}
			else
			{
		        tbl.data = tbl.data.concat(rowData);
			}
			
			// re-render the table as the number of rows has changed
			tbl.render();

			return rowIndex + 1;
		}
		
		return -1;
		// we need to update the scroller code so it know the number of rows (height) has increased.
	},
	
	// removes a row from the table
	removeRow: function (tableId, rowIndex)
	{
	    var tbl = pureGrid.items.where('id', tableId).first();

	    if (tbl && tbl.data.length > 0)
		{
	        tbl.data.splice(rowIndex, 1);
			
	        // if the row was visible, force a redraw
	        if (tbl.isCellVisible( rowIndex)) tbl.redraw();
		}
		// we need to update the scroller code so it knows the number of rows has decreased! (height)
	},
	
	// updates a row in the table
	updateRow: function (tableId, rowIndex, rowData)
	{
	    var tbl = pureGrid.items.where('id', tableId).first();

	    if (tbl && tbl.data.length > 0)
		{
	        tbl.data.splice(rowIndex, 1, rowData);
			
	        // if the row is visible, force a redraw
	        if (tbl.isCellVisible(rowIndex)) tbl.redraw();
		}
	},
	
	// select a cell
	selectCell : function(tableId, rowIndex, colIndex)
	{
	    var tbl = pureGrid.items.where('id', tableId).first();

	    if (tbl)
		{
	        tbl.selectCell(rowIndex, colIndex);
		}
	},
	
	// place a cell into edit mode
	editCell: function (tableId, rowIndex, colIndex)
	{
	    var tbl = pureGrid.items.where("id", tableId).first();

	    if (tbl)
		{
	        tbl.selectCell(rowIndex, colIndex);
	        tbl.editCell(rowIndex, colIndex);
		}
	},
	
	// is a row within the visual region of the screen ?
	isCellVisible: function (tableId, rowIndex)
	{
	    var tbl = pureGrid.items.where('id', tableId).first();

	    if (tbl)
		{
	        return tbl.isCellVisible(rowIndex);
	    }

		return false;
	},
	
	// does the same as reload only using the local array rather then reloading from the server
	refresh: function (tableId)
	{
		alert('to be implemented..');
	},
	
	// requests the url 
	load: function (tableId, url /* jsonp url */)
	{
	    var tbl = pureGrid.items.where('id', tableId).first();

	    if (tbl)
		{
	        tbl.load(url);
		}
	},
	
	// modifies the scroll position and triggers a redraw at the specified row/col
	scrollTo: function (tableId, rowIndex, colIndex) {
	
	    var tbl = pureGrid.items.where('id', tableId).first();

	    if (tbl) {
	        tbl.scrollTo(rowIndex);
	    }
	},
	
	// binds json data to the table, executed via JsonP
	bind: function (tableId, config)
	{
	    var tbl = pureGrid.getById(tableId);

		if (tbl)
		{
			tools.removeCss(tbl.container, 'loading');
			
			if (config)
			{
				// apply config passed by param
				for (var a in config)
				{
					if (a!='data' && config[a]!=undefined) tbl.config[a] = config[a];
				}
			
				// assign the table data
				tbl.data = config.data || [];
				
				// reset has data flag
				tbl.hasData = (tbl.data && tbl.data.length>0);
			}
			
			// render the table
		    tbl.render();

			return;
		}
	},

	// private members
	_ : {

	    // get text property name for this browser
		txtProp : ('textContent' in document.createElement('span')) ? 'textContent' : 'innerText',
		
		// array to hold event subscribers
		subscribers : [],

		// list of supported events
		events : ['onready','onrowclick','onrowdblclick','oncellclick','onscroll','oncontextclick'],

		// internal fireEvent mthod used to let subscribers know an event has occurred
		fireEvent : function(name, instance)
		{
			var subs = pureGrid._.subscribers.where('name', name),
				args = [].slice.call(arguments,2);

			for (var i=0, l=subs.length; i<l; i++)
			{
				if (typeof subs[i].callback === 'function')
				{
					subs[i].callback.apply(instance, args);
				}
			}
		},

		// creates a new grid object that will be stored in the pureGrid.items collection
		create : function(el, config /* optional config object */)
		{
			this.id = el.id;									// assign table id to object
			this.data = config && config.data || [];			// data array
			this.busy = false;									// is the table busy doing something ?
			this.dataUrl = '';									// data source url
			this.scriptTag = null;								// script tag used for loading JsonP data
			this.hasData = false;	                            // does the table contain any data ?
			this.isDirty = false;								// flag used to determine if table data has changed
			this.inEditMode = false;							// is the table currently been edited?

			// get element styles
			var cn = el.className || '';

			// assign default config & get values from class name
			this.config = {
				caption : '',															// caption of table to be displayed above the table
				rows : parseInt(cn.getCssKeyValue('puregrid-rows')) || -1,				// number of rows to render	
				cols : parseInt(cn.getCssKeyValue('puregrid-cols')) || -1,				// number of cols to render
				firstRowIsHeader : (cn.getCssKeyValue('puregrid-firstrowisheader')>-1),	// row to use as column headers
				firstCoIsHeader : (cn.indexOf('puregrid-firstcolisheader')>-1),			// should we display row numbers ?
				selectableRows : (cn.indexOf('puregrid-selectablerows')>-1),			// is the user allowed to select rows
				selectableCells : (cn.indexOf('puregrid-selectablecells')>-1),			// are the individual cells selectable ?
				css : '',																// custom css class specified by the developer
				dataTypes : []															// column data types
			};

			this.cellHeight = 0;                                        // cache the cell height
			this.selectedRows = {};                                     // selected rows are stored as properties on an object (removes the need to search when rendering)
			this.sortedColIndex = -1;                                   // the index of the sorted column, -1 = unsorted
			this.sortDirection = 1;                                     // 1 ascending, -1 descending
			this.selectedCells = {};                                    // selected cells are stored as properties on an object (removes the need to search when rendering)
			this.startRowIndex = this.config.firstRowIsHeader ? 1 : 0;  // the starting row for data within the virtual grid
			this.startColIndex = this.config.firstCoIsHeader ? 1 : 0;

			// store reference to HTML elements
			this.container = el;		// cache the container for this table
			this.scrollerY = null;		// cache the scroll div that forces on the scrollbars
			this.table = null;			// html table element
			this.cols = [];				// array of cols in the col group
			this.selectedCell = null;	// the cell that is currently selected

			// assign methods
			this.updateCell = pureGrid._.updateCell;
			this.redraw = pureGrid._.redraw;
			this.selectCell = pureGrid._.selectCell;
			this.editCell = pureGrid._.editCell;
			this.selectRow = pureGrid._.selectRow;
			this.load = pureGrid._.load;
			this.clearRowSelection = pureGrid._.clearRowSelection;
			this.clearCellSelection = pureGrid._.clearCellSelection;
			this.clearEditCell = pureGrid._.clearEditCell;
			this.render = pureGrid._.render;
			this.isCellVisible = pureGrid._.isCellVisible;
			this.scrollTo = pureGrid._.scrollTo;

			// obtain the data url, add the id|rows|cols to the query string to allow the server to render a JsonP response
			var di = tools.getElementsByAttributeValue(el,'input','class','puregrid-data-url').first();
				
			// build the data url with query parameters
			this.dataUrl = (di) ? '{0}?id={1}'.format(di.value, el.id) : '';
				
			if (this.dataUrl!='')
			{
				tools.addCss(el, 'loading');
				this.load.delay(0, null, this.dataUrl);				
				tools.trace(this.dataUrl);
			}

		},
		
		// builds the html table based on the config passed to the pureGrid.bind method via a jsonP response
		render : function()
		{
			var el = this.container;
			
			el.innerHTML = "";

			this.rendering = true;								// set a flag to indicate we are in render state
			this.currentRowIndex = 0;							// the current data row position of the topmost element
			this.currentColIndex = 0;							// the current data column of the leftmost rendered element
			this.tableRowLength = this.config.rows;				// virtual row length
			this.tableColLength = this.config.cols;				// virtual col length		
			this.dataRowLength = Math.max(this.data.length, 0);									// holds the data row length
			this.dataColLength = (this.data && this.data.length > 0) ? this.data[0].length : 0;	// holds the data column length
			this.startRowIndex = this.config.firstRowIsHeader ? 1 : 0;
			this.startColIndex = this.config.firstCoIsHeader ? 1 : 0;
			this.selectedCells = {};
			this.selectedRows = {};

			// if set, assign user defined css class
			if (this.config.css != '') tools.addCss(el, this.config.css);

			// if caption set, apply css to allow the table to cater for the additional space required
			if (this.config.caption != '') tools.addCss(el, 'puregrid-show-caption');

			// wrapper table is used to assign right margin
			this.tableWrapper = tools.createElement(null, 'div', { 'class': 'puregrid-table-wrapper' });

			// create visual table (set width to width of container)
			this.table = tools.createElement(this.tableWrapper, 'table', { 'class': 'hidden', tabIndex: 0, 'cellpadding': '0', 'cellspacing': '0' });

			// if we have a caption, add the element
			if (this.config.caption != '') {
			    this.caption = tools.createElement(this.table, 'caption', null, this.config.caption);
			}

			var cgroup = tools.createElement(this.table, 'colgroup'),
			    thead = tools.createElement(this.table, 'thead'),
                tbody = tools.createElement(this.table, 'tbody'),
                tr = tools.createElement((this.config.firstRowIsHeader) ? thead : tbody, 'tr', {_tableid: this.id }),
                cell = null,
                rowIndex = 0,
                colIndex = 0;

			// build the table
			while (rowIndex < this.tableRowLength)
			{
				while (colIndex < this.tableColLength)
				{
					// if first tr, add cols
					if (rowIndex === 0)
					{
						var colCss = (colIndex === 0 && this.config.firstCoIsHeader) ? 'puregrid-rowheader' : 'puregrid-col' + (colIndex + 1);
					
						// add cols
						this.cols[colIndex] = tools.createElement(cgroup, 'col', { 'class': colCss });
					}

					if (rowIndex === 0 && this.config.firstRowIsHeader)
					{
						// add column headers
					    cell = tools.createElement(tr, 'th', { 'scope': 'col' }, this.data[0][colIndex]);
					}
					else if (colIndex === 0 && this.config.firstCoIsHeader)
					{
						// add row headers
					    cell = tools.createElement(tr, 'th', { 'scope': 'row' }, '\u00A0');
					}
					else
					{
						// add cells
					    cell = tools.createElement(tr, 'td', { tabIndex : 0 }, '\u00A0');
					}

					colIndex ++;
				}

			    // create a new row
				tr = tools.createElement(tbody, 'tr', {_tableid: this.id });

				colIndex = 0; // reset column counter
				rowIndex ++; // increase row counter
			}
			
			// add the table to the DOM
			el.appendChild(this.tableWrapper);
			
		    // use the last cell to calculate cell height
			this.cellHeight = (cell) ? cell.offsetHeight : 0;

			// calculate scroll height
			var scrollHeight = this.dataRowLength;
			scrollHeight += (this.config.caption) ? 1 : 0;
			scrollHeight *= this.cellHeight;
			
			tools.addCss(this.container, 'puregrid-scroll-y');
			this.scrollerY = tools.createElement(this.container, 'div', { 'class': 'scroll-y' }, '\u00A0');
			
			// only force a scroll bar if its needed
			if (this.dataRowLength > this.tableRowLength)
			{
				tools.createElement(this.scrollerY, 'div', { 'style': 'height:' + scrollHeight + 'px;' });
			}
			
			// hook the on scroll event
			this.scrollerY.onscroll = pureGrid._.eventDelegate;
			
			// draw the data at row 1
			this.redraw(0, 0);

			// render complete, reset flag
			this.rendering = false;
			
			// attach event handlers
			this.table.onclick = pureGrid._.eventDelegate;
			//this.table.onfocus = pureGrid._.eventDelegate;
			this.container.onkeyup = pureGrid._.eventDelegate;
			this.container.onkeydown = pureGrid._.eventDelegate;
			
			// show the table
			this.table.removeAttribute('class');
		},

		// requests the jsonP data using a dynamic script tag
		load : function(url)
		{
			url = url || this.dataUrl;
			
			//tools.trace('loading... ' + url);

			if (url != undefined && url !='')
			{
				url = url + '&nocache=' + (new Date()).getTime();
			
				if (this.scriptTag)
				{
					this.scriptTag.parentNode.removeChild(this.scriptTag);
					this.scriptTag = null;
				}
			
				this.scriptTag = tools.createElement(document.documentElement.firstChild, 'script', { 'type': 'text/javascript', 'src': url });
			}
		},

		// handles all table related events
		eventDelegate : function(e)
		{
			e = e || event;
			var el = e.target || e.srcElement,
				tag = el.tagName.toLowerCase(),
				type = e.type,
				btn = e.which || e.button,
				key = e.keyCode,
				rowIndex = el.parentNode.rowIndex || el.parentNode.parentNode.rowIndex || 0, // its either td>tr or input>td>tr
				colIndex = el.cellIndex || el.parentNode.cellIndex || 0; // its either td or input>td

			if (tag.anyOf('th', 'td', 'input', 'select', 'div')) {

				// resolve table object for event element (change this to getParent method call)
			    var tbl = pureGrid.getById(el.parentNode.id || el.parentNode._tableid || el.parentNode.parentNode._tableid);

                // get the current dataRowIndex
			    var dataRowIndex = tbl.currentRowIndex + rowIndex;

				switch (type)
			    {
				    case 'scroll':
				    {
				        if (!tbl.inEditMode) {

				            // calculate the current row position
				            var row = Math.ceil(this.scrollTop / tbl.cellHeight);

				            // if row number has changed, redraw
				            if (row != tbl.currentRowIndex && row < tbl.dataRowLength) {
				                tbl.redraw(row, tbl.currentColIndex);
				            }
				        }

				    } break;

					case 'click':
					{
					    var drRow = tbl.data[dataRowIndex] || null,
                            drCell = drRow && drRow[colIndex] || null,
                            isSelectedCell = (tag === 'td' && tbl.selectedCells[dataRowIndex + '_' + colIndex] != undefined);

					    if (!tbl.inEditMode && tbl.config.selectableRows && el.scope === 'row' && tag === 'th') // SELECT ROW (onrowclick)
						{
                            pureGrid._.fireEvent('onrowclick', tbl, drRow, dataRowIndex);
                            tbl.selectRow(dataRowIndex);
						}
						// if editable is enabled and the current select is selected then enter edit mode
					    else if (!tbl.inEditMode && tbl.config.editable && isSelectedCell && tag === 'td') // EDIT CELL
						{
					        tbl.editCell(dataRowIndex, colIndex);
						}
						else if (!tbl.inEditMode && tbl.config.selectableCells && !isSelectedCell && tag === 'td') // SELECT CELL (oncellclick)
						{
						    pureGrid._.fireEvent('oncellclick', tbl, drCell, colIndex);
						    tbl.selectCell(dataRowIndex, colIndex);
						}

					}break;

				    case 'keydown': {

				        if (tbl.config.editable && tbl.inEditMode && (tag === 'input' || tag === 'select')) {

				            if (key === 13)
				            {
                                // attempt to remove the cell editor and move selection down 1 row
				                if (tbl.clearEditCell()) {

				                    var toRowIndex = (rowIndex + 1 <= tbl.dataRowLength) ? rowIndex + 1 : tbl.dataRowLength;

				                    tbl.selectCell(toRowIndex, colIndex);
				                }
				            }
                            else if (key === 9) {

                                // attempt to remove the cell editor and move the selection right 1
                                if (tbl.clearEditCell()) {
                                    tbl.selectCell(rowIndex, colIndex);
                                }

				            }
				            else if (key === 27) {

				                // if escape(27) pressed, reset value
				                el.value = tbl.data[dataRowIndex][colIndex].constructor === Object ? tbl.data[dataRowIndex][colIndex].val : tbl.data[dataRowIndex][colIndex];

				                // remove invalid class if it exists
				                tools.removeCss(el.parentNode, 'invalid');

				                // attempt to remove the cell editor and move the selection right 1
				                if (tbl.clearEditCell()) {
				                    tbl.selectCell(dataRowIndex, colIndex);
				                }
				            }
				        }
				        if (tbl.config.editable && !tbl.inEditMode && tag === 'td' && key === 13) {

				            // place the current cell into edit mode
				            tbl.editCell(dataRowIndex, colIndex);

				            tools.cancelEvent(e);
				        }
				        else if (tag === 'td') {

				            if (key === 38) { // up

				                var toRowIndex = Math.max(dataRowIndex - 1, tbl.startRowIndex);

				                tbl.selectCell(toRowIndex, colIndex);

				                // if we are not at the top, cancel event
				                if (toRowIndex !== tbl.startRowIndex) tools.cancelEvent(e);
				            }
				            else if (key === 40) { // down

				                var toRowIndex = Math.min(dataRowIndex + 1, tbl.dataRowLength);

				                tbl.selectCell(toRowIndex, colIndex);

				                // if we are not at the bottom, cancel event
				                if (toRowIndex !== tbl.dataRowLength) tools.cancelEvent(e);
				            }
				            else if (key === 37) { // left
				                var toColIndex = Math.max(colIndex - 1, tbl.startColIndex);

				                tbl.selectCell(dataRowIndex, toColIndex);
				            }
				            else if (key === 39) { // right
				                var toColIndex = Math.min(colIndex + 1, tbl.dataColLength);

				                tbl.selectCell(dataRowIndex, toColIndex);
				            }
				            else if (key === 33) { // page up

				                var toRowIndex = Math.max(dataRowIndex - this.tableRowLength, this.startRowIndex);

				                tbl.selectCell(toRowIndex, colIndex);

				                tools.cancelEvent(e);
				            }
				            else if (key === 34) { // page down

				                var toRowIndex = Math.min(dataRowIndex + this.tableRowLength, this.dataRowLength);

				                tbl.selectCell(toRowIndex, colIndex);
				            }
				            else if (key === 36) { // home

				                tbl.selectCell(dataRowIndex, tbl.startColIndex);

				                tools.cancelEvent(e);
				            }
				            else if (key === 35) { // end

				                tbl.selectCell(dataRowIndex, tbl.dataColLength - 1);

				                tools.cancelEvent(e);
				            }
				        }

				    } break;

				    case 'keyup': {

				        console.log("key = {0}".format(key));

				        if (tag === 'td' && key === 9) { // tab

				            var toRowIndex = (rowIndex > tbl.dataRowLength) ? tbl.startRowIndex : rowIndex,
                                toColIndex = (colIndex <= tbl.dataColLength) ? colIndex : tbl.startColIndex;

				            tbl.selectCell(toRowIndex, toColIndex);
				        }

					} break;

					case 'blur':
					{
					    if (tbl.inEditMode) {
					        tbl.clearEditCell(rowIndex, colIndex);
					    }

					}break;
				};
				
			}

		},
		
		// repopulates the table with data on scroll using innerText 
		redraw : function(rowIndex)
		{
		    if (this.busy) return;

			// mark as busy whilst redrawing
			this.busy = true;

		    var colLength = Math.min(this.dataColLength, this.tableColLength),
                rowLength = Math.min(this.dataRowLength, this.tableRowLength),
				dataRowIndex = 0,
				dataColIndex = 0;

		    // ensure row starts at a valid position
		    rowIndex = (rowIndex > -1) ? rowIndex : this.currentRowIndex;

		    // ensure row rendering does not breach data row length
		    rowIndex = Math.min(rowIndex, (this.dataRowLength - this.tableRowLength));

		    // cache the current row position
			this.currentRowIndex = rowIndex;

			// loop through each of the virtual table cells (th & td)
			for (var rowPos = this.startRowIndex; rowPos < rowLength; rowPos++)
			{
				// work out the data row position
			    dataRowIndex = rowIndex + rowPos;

			    var isRowSelected = (this.selectedRows[dataRowIndex]);

			    //tools.trace('REDRAWING ROW {0} - data row {1}'.format(rowPos, dataRowIndex));

				// modify row selections
			    if (isRowSelected && !this.table.rows[rowPos]._selected)
				{
					tools.addCss(this.table.rows[rowPos], 'selected');
					this.table.rows[rowPos]._selected = true;
				}
				else if (this.table.rows[rowPos]._selected) // to avoid reflows, check the selected status first!
				{
					tools.removeCss(this.table.rows[rowPos], 'selected');
					this.table.rows[rowPos]._selected = false;
				}
				
				// populate cells
				for (var colPos = 0; colPos < colLength; colPos++)
				{
				    // calculate the data array position
				    dataColIndex = colPos;

				    var cell = this.table.rows[rowPos].cells[colPos],
                        isCellSelected = this.selectedCells[dataRowIndex + '_' + dataColIndex],
                        value = "",
                        css = "",
                        title = "";
					
				    // retrieve values from data array
				    if (this.data[dataRowIndex][dataColIndex].constructor === Object)
				    {
				        value = this.data[dataRowIndex][dataColIndex].val || '',
						css = this.data[dataRowIndex][dataColIndex].css || '',
						title = this.data[dataRowIndex][dataColIndex].tip || '';

				        // to reduce reflows, only update values that have changed - we cache values as expando objects on elements
				        if (cell._title != title) {
				            cell.title = title;
				            cell._title = title;
				        }
				        if (cell._css != css) {
				            cell.className = css;
				            cell._css = css;
				        }
				    }
				    else
				    {
				        value = this.data[dataRowIndex][dataColIndex] || '\u00A0';
				    }

                    // update the table cell innerText value
				    cell[pureGrid._.txtProp] = value;
					
                    // modify cell selection
				    if (isCellSelected && !cell._selected) {
				        tools.addCss(cell, 'selected');
				        cell._selected = true;
				        cell.focus();
				    }
				    else if (cell._selected) // to avoid reflows, check the selected status first!
				    {
				        tools.removeCss(cell, 'selected');
				        cell._selected = false;
				    }
                   
				    if (this.config.firstCoIsHeader && colPos !== 0 && cell._selected) {

				        var rowHeader = this.table.rows[rowPos].cells[0];

				        if (!rowHeader._selected) {
				            tools.addCss(rowHeader, 'selected');
				            rowHeader._selected = true;
				        }
				        /*else {
				            tools.removeCss(rowHeader, 'selected');
				            rowHeader._selected = false;
				        }*/
				    }
/*
				    if (this.config.firstRowIsHeader && rowPos !== 0 && colPos !== 0 && cell._selected) {

				        var colHeader = this.table.rows[0].cells[colPos];

				        if (!colHeader._selected) {
				            tools.addCss(colHeader, 'selected');
				            colHeader._selected = true;
				        }
				        else {
				            tools.removeCss(colHeader, 'selected');
				            colHeader._selected = false;
				        }

				    }
*/
					//tools.trace('redrawing col {0} - data col {1}'.format(colPos, dataColIndex));
				}

			}

			// redraw complete, reset busy flag
			this.busy = false;
		},

	    // moves the scroll bar to the desire position, triggering a redraw
		scrollTo: function (rowIndex, colIndex) {

            // take into account the header row if we have one
		    rowIndex = Math.max(0, rowIndex - this.startRowIndex);

		    // ensure row rendering does not breach data row length
		    rowIndex = Math.min(rowIndex, (this.dataRowLength - this.tableRowLength));

            // alter the scroll position of the scroll bar, forcing the onscroll event to fire
		    this.scrollerY.scrollTop = rowIndex * this.cellHeight;

		},

		// updates the data array at grid reference provided and executes a redraw to update the display
		updateCell: function (dataRowIndex, dataColIndex, value)
		{
		    dataRowIndex = Math.max(dataRowIndex, this.startRowIndex);

			// update value of object or string
		    if (this.data[dataRowIndex][dataColIndex].constructor === Object)
			{
		        this.data[dataRowIndex][dataColIndex].val = value;
			}
			else
			{
		        this.data[dataRowIndex][dataColIndex] = value;
			}
			
			// redraw the table
			this.redraw();
		},
		
		// selects a cell at row an col position, if the cell is not visible it is scrolled into view
		selectCell: function (dataRowIndex, dataColIndex)
		{
            // clear previous selections
		    this.selectedRows = {};
		    this.selectedCells = {};

            // ensure data row index is valid
		    dataRowIndex = Math.min(Math.max(this.startRowIndex, dataRowIndex), this.dataRowLength);

		    // ensure data col index is valid
		    dataColIndex = Math.min(Math.max(this.startColIndex, dataColIndex), this.dataColLength);

		    // create a unique id on an object of the selected data index (its faster to check if a variable exists than scan an array whilst for every cell)
		    this.selectedCells[dataRowIndex + '_' + dataColIndex] = true;

		    if (!this.isCellVisible(dataRowIndex, dataColIndex)) {

		        var toDataRowIndex = dataRowIndex,
                    toDataColIndex = dataColIndex

                // if we are scrolling down, keep the cell at the bottom of the table
		        if (dataRowIndex > this.currentRowIndex) {
		            toDataRowIndex -= (this.tableRowLength - this.startRowIndex - 1);
		        }

		        this.scrollTo(toDataRowIndex, toDataColIndex);
		    }

		    this.redraw();
		},
		
		selectRow : function(rowIndex)
		{
			// clear all cell selections
		    this.selectedCells = {};
		
			// get data row position
			var dataRowIndex = this.currentRowIndex + rowIndex;

			if (this.selectedRows[dataRowIndex] === undefined)
			{
			    this.selectedRows[dataRowIndex] = true;
			    this.redraw();
			}
		},
		
		clearCellSelection : function()
		{
		    this.selectedCells = {};
		    this.redraw();
		},
		
		clearRowSelection : function(rowIndex)
		{
		    this.selectedRows = {};
		    this.redraw();
		},

		// places a cell at row/column position into edit mode
		editCell: function (dataRowIndex, dataColIndex) {
			
		    if (!this.inEditMode) // if its not already editable
		    {
                // check if we have a data type for this column
		        var hasDataType = (this.config.dataTypes && typeof this.config.dataTypes[dataColIndex] !== 'undefined');

		        // if we do not have a data type this column can not be edited
		        if (!hasDataType) return;

		        var rowIndex = Math.max(dataRowIndex - this.currentRowIndex, this.startRowIndex),
                    colIndex = dataColIndex,
					el = this.table.rows[rowIndex].cells[colIndex],
                    value = this.data[dataRowIndex][colIndex].constructor === Object ? this.data[dataRowIndex][colIndex].val : this.data[dataRowIndex][colIndex],
					editor = null;
			
			    // clear all cell selections
			    this.clearCellSelection();

				// clear contents
				el[pureGrid._.txtProp] = '';

				// get the data type for this column (if not present, returns a string)
				var dataType = this.config.dataTypes[colIndex] || '';

				// built the editor (input or select)
				if (dataType.constructor === Array) 
				{
					// we have an array of values so insert a select box
				    editor = pureGrid._.arraytoSelectBox(dataType, el.id, value);

                    // set the dimensions of the select box to match the cell
					editor.style.cssText = 'width:' + el.offsetWidth + 'px;height:' + el.innerHeight + 'px;';
				}
				else
				{
					// insert input to allow value change
				    editor = tools.createElement(null, 'input', { 'type': 'text', 'value': value, 'style': 'width:' + el.offsetWidth + 'px;height:' + el.innerHeight + 'px;' });
				}
				editor.className = "puregrid-editor";

				// place the table into edit mode (locking all interaction)
				this.inEditMode = true;
				
				// setup edit complete hooks
				editor.onkeyup = editor.onblur = pureGrid._.eventDelegate;

				// add the editor to the current table cell
				el.appendChild(editor);

				// set focus to the editor
				editor.focus();

				// if the editor is an input, select the text
				if (editor.tagName.toLowerCase() == "input") editor.select();

				// visually mark this cell as in edit mode
				tools.addCss(el, 'editing');

		        // temporarily disable scrolling
				tools.addCss(this.scrollerY, 'puregrid-scroll-disabled');

		        // cache the editor object
				this.editor = editor;
			}
		},

	    // removes the editor from the cell, returns true if complete otherwise false (if validation failed)
		// edit can not be canceled if the value is invalid
		clearEditCell : function() {

		    if (this.inEditMode && this.editor) {

		        var editor = this.editor,
                    cell = editor.parentNode,
                    colIndex = cell.cellIndex,
                    rowIndex = cell.parentNode.rowIndex,
                    dataType = this.config.dataTypes[colIndex] || '',
                    dataRowIndex = this.currentRowIndex + rowIndex,
                    newValue = (editor.selectedIndex) ? editor.options[editor.selectedIndex].value : editor.value,
                    oldValue = (this.data[dataRowIndex][colIndex].constructor === Object) ? this.data[dataRowIndex][colIndex].val : this.data[dataRowIndex][colIndex];

		        if (pureGrid._.isValid(newValue, dataType)) {

		            // remove the editor event handlers
		            editor.onkeyup = editor.onblur = null;

		            // remove the input/select element
		            cell.removeChild(editor);

		            // remove the editing css class from the cell
		            tools.removeCss(cell, 'editing');

		            if (newValue !== oldValue) {
		                // the value has changed, update the data array and trigger a table redraw
		                this.updateCell(dataRowIndex, colIndex, newValue);
		            }
		            else {
		                this.redraw();
		            }

		            // enable scrolling
		            tools.removeCss(this.scrollerY, 'puregrid-scroll-disabled');

		            this.inEditMode = false;

		            this.editor = null;

		            return true;
		        }
		        else {

		            // mark the cell as invalid using CSS
		            if (cell.className.indexOf('invalid') <= -1) {

                        // add an invalid style to let the user know this cell needs attention
		                tools.addCss(cell, 'invalid');

                        // change the tooltip to reflect the issue
		                cell.title = 'Invalid value, please correct!';

		            }
		            editor.focus();
		        }
		    }

            // returning false lets the caller know it was not possible to remove the editor (invalid value)
		    return false;
		},
		
		// checks if a value is valid based on data type (array/regex)
		isValid : function(value, type)
		{
			switch (type.constructor)
			{		
				case Array:
				{
					return (type.indexOf(value)>-1);
				}break;
				
				case String:
				{
					// if the string is empty or it contains a regex that the value matches
					return ( type == '' || (type != null && value.matches(type)) );
				}break; 
			}
			
			return false;
		},

	    // checks if a row is visible
		isCellVisible: function (rowIndex, colIndex) {

		    if (this.data.length > 0) {
		        return (rowIndex > this.currentRowIndex && rowIndex < this.currentRowIndex + this.tableRowLength);
		    }

		    return false;
		},

	    // converts a single dimension array into a HTML select box
		arraytoSelectBox : function (array, id, selected) {
		    var select = tools.createElement(null,'select',{'id': id, 'name': id});
  
		    for (var i = 0, l = array.length; i < l; i++) {
		        tools.createElement(select, 'option', { 'value': array[i], 'selected': (array[i] == selected) }, array[i]);
		    }
  
		    return select;
		}
		
	}
}

// create the grid as soon as the document is ready
pureGrid.init.repeat(50);