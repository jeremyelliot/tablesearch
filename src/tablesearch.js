/* jq-tablesearch.js */
/* 
 * TableSearch.js
 * 
 * A jQuery plugin for searching for strings in a table and doing things
 * with the results
 * 
 * @param options object  {
 *      columnSelector: ".filter",
 *      rowSelector: "tbody tr",
 *      onMatchRow: function(row),
 *      onNoMatchRow: function(row),
 *      onMatchCell: function(cell, query),
 *      onStart: function(table),
 *      onCompleted: function(table)
 * }
 * 
 */

(function ($) {

    $.fn.tableSearch = function (options) {

        var self = $(this),
                /*
                 * Classes are copied to here so they are available for 
                 * callback functions.
                 */
                rowMatchClass = "",
                searchResultsClass = "",
                searchingClass = "",
                /*
                 * Keep references to search result rows and cells 
                 * to allow faster reset
                 */
                matchRows = [],
                noMatchRows = [],
                matchCells = [];

        var config = {
            /*
             * columnSelector is used to select which columns will be
             * included in the search.
             */
            columnSelector: ".searchable",
            /*
             * rowSelector is used to select which rows will be included
             * in the search.
             */
            rowSelector: "tbody > tr",
            /*
             * CSS class added to rows that contain the query text.
             */
            rowMatchClass: "tablesearch-match",
            /*
             * CSS class added to the table when results are displayed.
             */
            searchResultsClass: "tablesearch-results",
            /*
             * CSS class added when search starts and removed when it
             * is completed.
             */
            searchingClass: "tablesearch-searching",
            /**
             * Called for each cell (td) within a matching row. 
             * 
             * This function also receives the query string so it can
             * do things like highlighting instances of query string in text
             * content
             * 
             * @param {Element} cell
             * @param {String} query
             * @returns {void}
             */
            onMatchCell: function (cell, query) {
                highlightText(cell, query);
            },
            /**
             * Called by reset() for each cell that matched the previous query.
             * 
             * The default function removes highlights that were 
             * added by onMatchCell()
             * 
             * @param {Element} cell
             * @returns {void}
             */
            resetCell: function (cell) {
                highlightText(cell, '');
            },
            /**
             * Called for each row (tr) that contains the query string.
             * 
             * The default functions adds a class to indicate that 
             * the row contains a match.
             * 
             * @param {Element} row
             */
            onMatchRow: function (row) {
                row.addClass(rowMatchClass);
            },
            /**
             * Called for each row (tr) that does not contain the query string.
             * 
             * @param {Element} row
             */
            onNoMatchRow: null,
            /**
             * Called by reset() for each row that matched the previous query.
             * 
             * @param {Element} table
             */
            resetMatchRow: function (row) {
                row.removeClass(rowMatchClass);
            },
            /**
             * Called by reset() for each row that did not match 
             * the previous query.
             * 
             * @param {Element} table
             */
            resetNoMatchRow: null,
            /**
             * Called by searchFor() before search begins.
             * 
             * @param {Element} table
             * @returns {void}
             */
            onStart: function (table) {
                table.addClass(searchingClass);
            },
            /**
             * Called after searching is completed.
             * 
             * The default function adds a class to the table, to indicate
             * that it is showing search results.
             * 
             * @param {Element} table
             */
            onCompleted: function (table) {
                table.removeClass(searchingClass)
                        .addClass(searchResultsClass);
            },
            /**
             * Called by reset()
             * 
             * The default function removes the searchResultsClass that
             * was added by onCompleted(table).
             * 
             * @param {Element} table 
             */
            resetTable: function (table) {
                table.removeClass(searchResultsClass);
            }
        };

        $.extend(config, options);
        rowMatchClass = config.rowMatchClass;
        searchResultsClass = config.searchResultsClass;
        searchingClass = config.searchingClass;

        /**
         * 
         * @param {Element} element
         * @param {String} text
         */
        var highlightText = function (element, text) {

            // remove <mark> tags from existing cell HTML
            var newHtml = element.html().replace(/<\/?mark>/gi, "");

            // add new <mark> tags around occurences of query text
            // if the query is not empty
            if (text !== "") {
                newHtml = newHtml.replace(
                        new RegExp(
                                '(^|>)([^"<>]*)(' + text + ')([^"<>]*)(<|$)', "gi"
                                ), '$1$2<mark>$3</mark>$4$5');
            }
            element.html(newHtml);
        };


        /*
         * Checks function is not null before iterating over element array.
         * Much quicker than executing empty function on every element.
         * 
         * @param Function func
         * @param Array arr
         */
        var doReset = function (func, arr) {
            if (typeof func === 'function') {
                while (arr.length > 0) {
                    func($(arr.pop()));
                }
            }
            arr = [];
        };

        /*
         * Executes all reset methods in config object
         * 
         * @returns {undefined}
         */
        var reset = function () {
            doReset(config.resetCell, matchCells);
            doReset(config.resetMatchRow, matchRows);
            doReset(config.resetNoMatchRow, noMatchRows);
            config.resetTable(self);
        };

        /**
         * Starts search for query string.
         * 
         * @param {String} query
         */
        var searchFor = function (query) {
            reset();
            var q = $.trim(query).toLowerCase();
            if (q === "")
                return;
            if (typeof config.onStart === 'function') {
                config.onStart(self);
            }
            self.find(config.rowSelector).each(function () {
                var row = $(this);
                var cells = row.find(config.columnSelector);

                // Check if row text contains query string.
                if (cells.text().toLowerCase().indexOf(q) > -1) {

                    // call onMatchCell(cell) if it's a function
                    if (typeof config.onMatchCell === 'function') {
                        cells.each(function () {
                            var cell = $(this);
                            matchCells.push(cell);
                            config.onMatchCell(cell, q);
                        });
                    }

                    // call onMatchRow(row), if it's a function
                    if (typeof config.onMatchRow === 'function') {
                        matchRows.push(row);
                        config.onMatchRow(row);
                    }

                } else { // row text does not contain query string

                    // call onNoMatchRow(row), if it's a function
                    if (typeof config.onNoMatchRow === 'function')
                    {
                        noMatchRows.push(row);
                        config.onNoMatchRow(row);
                    }
                }
            });
            if (typeof config.onCompleted === 'function') {
                config.onCompleted(self);
            }
        };

        // return TableSearch object with public methods
        return {
            'searchFor': searchFor,
            'reset': reset
        };
    };

})(jQuery);
