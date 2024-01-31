class Dataframe {
  /**
  * Creates a new DataFrame instance.
  *
  * @constructor
  * @param {Array<Array<any>>} arrays - An array of arrays containing headers and values.
  * @param {boolean=} headers - Indicates whether the input array contains headers. Default is true.
  * @param {string=} orientation - The orientation of the arrays: "column" or "row". Default is "column".
  */
  constructor(arrays, headers=true, orientation='column'){
    if (!Array.isArray(arrays)) {
      throw new Error("Expected Input Array[][]")
    }
    if (arrays.length == 0) {
      throw new Error("input array cannot be empty")
    }
    for (let array of arrays){
      if (!Array.isArray(array)){
        throw new Error("Expected Input Array[][]")
      }
    }
    const orientations = ['column', 'row']
    if (!orientations.includes(orientation)){
      throw new Error("Orientation input can only be 'row' or 'column'")
    }
    if (orientation == 'column'){
      this.largestArrayLength = arrays.
      reduce(
        (previousLargestLength, currArray) => (previousLargestLength >= currArray.length) ? previousLargestLength : currArray.length, 
      0)

      const tempHeaders = (headers) ? arrays.map((array) => array[0]) : arrays.map((_, index) => index.toString())
      const tempArrays = arrays.
      map((array) => array.concat(Array.from({"length": this.largestArrayLength - array.length}, ()=>null)))

      /**
      * A map that maps each header to its corresponding value.
      * @type {Map<string, Array<any>>}
      */
      this.valueMap = new Map()
      for (let i = 0; i < tempArrays.length; i++) {
        let amounttoslice = (headers) ? 1 : 0
        this.valueMap.set(tempHeaders[i], tempArrays[i].slice(amounttoslice))
      }

    }
    else{
      const tempHeaders = (headers) ? arrays[0] : arrays[0].map((_, index) => index.toString())
      const headersLength = tempHeaders.length
      for (let array of arrays){
        if (array.length > headersLength){
          throw new Error("Data arrays larger than headers")
        }
      }

      this.largestArrayLength = arrays.length

      let tempRowArrays = arrays.map((array) => array.concat(Array.from({"length": headersLength - array.length}, () => null)))
      if (headers){
        tempRowArrays = tempRowArrays.slice(1)
      }

      const tempArrays = []
      for(let i = 0; i < headersLength; i++){
        tempArrays.push(tempRowArrays.map((array) => array[i]))
      }
      /**
      * A map that maps each header to its corresponding value.
      * @type {Map<string, Array<any>>}
      */
      this.valueMap = new Map()
      for (let i = 0; i < tempArrays.length; i++){
        this.valueMap.set(tempHeaders[i], tempArrays[i])
      }

    }
  }


  /**
   * reads a google sheet and creates a Dataframe
   * 
   * @param {string} spreadsheetId - the id of the spreadsheet to read
   * @param {string=} sheetName - the name of the sheet to read
   * @param {boolean=} headers - true if the spreadsheet columns have header. true by default.
   * @param {Array<string>=} placeholder -  the placeholder headers if the sheet does not exist
   * @return {Dataframe} The corresponding Dataframe
   */
  static readSheet(spreadsheetId, sheetName=null, headers=true, placeholder=null) {
    try{
      const arrays = sheetToCsv(spreadsheetId, sheetName)
      if (arrays){
        return new Dataframe(arrays, headers, "row")
      }
      return new Dataframe([placeholder], true, "row")
    }catch (error){
      Logger.log(error)
      const spreadsheet = SpreadsheetApp.openById(spreadsheetId)
      const sheet = spreadsheet.getSheetByName(sheetName)
      if (!sheet){return new Dataframe([placeholder], true, "row")}
      const values = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues()
      return new Dataframe(values, headers, "row")
    }
    
  }

  /**
   * reads a csv and creates a Dataframe
   * 
   * @param {string} csv - the csv to read
   * @return {Dataframe}
   */
  static readCSV(csv, headers=true){
    const arrays = Utilities.parseCsv(csv)
    return new Dataframe(arrays, headers, "row")
  }

  /**
   * writes the Dataframe to a google sheet
   * 
   * @param {string} spreadsheetId - the id of the spreadsheet to write to.
   * @param {string} sheetName - the name of the sheet to write to.
   * 
   * @return {void}
   */

  /**
  * Gets the headers of the DataFrame.
  *
  * @return {string[]} An array of strings representing the headers of the DataFrame.
  */
  get headers(){
    return Array.from(this.valueMap.keys())
  }

  /**
  * Gets the values of the DataFrame.
  *
  * @return {any[][]} An array of arrays containing the values of the DataFrame.
  */
  get values(){
    return Array.from(this.valueMap.values())
  }
  
  /**
   * Get a row representation of the values
   * 
   * @return {any[][]} An array of rows for the values of the array
   */
  get arrows(){
    const values = this.values
    const rows =[]
    const length = values[0].length
    for (let i = 0; i < length; i++){
      const row = values.map((array) => array[i])
      rows.push(row)
    }
    return rows
  }


  /**
   * Sets the values in a google sheet to the Dataframe
   * 
   * @param {string} spreadsheetId - Id of the spreadsheet to set Dataframe
   * @param {string=} sheetName - name of sheet to set Dataframe
   * @param {boolean=} clearSheet
   * @return {void}
   */
  toSheet(spreadsheetId, sheetName='Dataframe sheet', clearSheet=false){

    const headers = this.headers
    const valuerows = this.arrows
    const allrows = [headers].concat(valuerows)

    const spreadsheet = SpreadsheetApp.openById(spreadsheetId)
    let sheet = spreadsheet.getSheetByName(sheetName)
    
    if (clearSheet){
      if(sheet){
        spreadsheet.deleteSheet(sheet)
      }
      spreadsheet.insertSheet()
      sheet = spreadsheet.getActiveSheet().setName(sheetName)
      sheet.getRange
      sheet.getRange(1, 1, allrows.length, allrows[0].length).setValues(allrows)
      return
    }
    else {
      if(!sheet){
        spreadsheet.insertSheet()
        sheet = spreadsheet.getActiveSheet().setName(sheetName)
      }
      sheet.getRange(1, 1, allrows.length, allrows[0].length).setValues(allrows)
      return 
    }
  }

  /**
   * returns the Dataframe as a csv
   * 
   * @return {string} 
   */
  toCsv(){
    const headers = this.headers
    const valuerows = this.arrows
    const allrows = [headers].concat(valuerows)
    const csv = allrows.map(row => row.join(",")).join('\n')
    return csv
  }

  /**
  * Gets the column of the Dataframe under a header
  *
  * @param {string} header - the header name for the column
  *
  * @return {Column} The column under the header of the Dataframe
  *
  */
  getColumn(header){
    const values = this.valueMap.get(header)
    if (!values){
      throw new Error(`Column ${header} does not exist`)
    }
    return new Column(values, header)
  }

  /**
   * returns all columns in the Dataframe
   * @return {Array<Column>}
   */
  getColumns(){
    const columns = []
    this.valueMap.forEach((column, header) => columns.push(new Column(column, header)))
    return columns
  }

  /**
  * Sets a column in the DataFrame.
  *
  * @method
  * @memberof Dataframe
  * @instance
  * @param {Column|Array} column - A Column object or an array to set as a column in the DataFrame.
  * @return {Dataframe}
  */
  setColumn(column){
    if (column instanceof Column){
      this.valueMap.set(column.header, column.values)
    }
    else if (Array.isArray(column)){
      const [header, ...values] = column
      this.valueMap.set(header, values)
    }
    else{
      throw new Error("Column | Array Input Expected")
    }
    return this
  }

  /**
  * Returns a row of the dataframe from a specific position
  *
  * @method
  * @memberof Dataframe
  * @instance
  * @param {number} position - the position of the row in the Dataframe
  * @return {Row} The row at the position
  */
  getRow(position){
    return new Row(this.values.map((array) => array[position]), this.headers)
  }

  /**
   * Returns all the rows in the dataframe as a Row object
   * 
   * @method
   * @memberof Dataframe
   * @instance
   * @return {Array<Row>}
   */
  getRows(){
    let headers = this.headers
    return this.arrows.map(r => new Row(r,headers))
  }

  /**
  * Sets a row in the dataframe at a specific position
  *
  * @method
  * @memberof Dataframe
  * @instance
  * @param {number} position - the position that the row is being inserted
  * @param {Row} - the row being inserted
  * @return {void}
  */
  setRow(position, row){
    if (!(row instanceof Row)){
      throw new Error("Row Expected as Input")
    }
    const headers = this.headers
    if (row.values.length != headers.length){
      const lengthError = (row.values.length > headers.length) ? "greater" : "less"
      throw new Error(`Input Row length ${lengthError} than Dataframe columns`)
    }
    const rowheaders = row.headers
    for(let i = 0; i< rowheaders.length; i++){
      if(headers[i] != rowheaders[i]){
        throw new Error("row headers are mismatched")
      }
    }
    const newvalues = this.values.
    map((array, index) => {
      array[position] = row.getValue(headers[index])
      return array
    })
    for (let j = 0; j < headers.length; j++){
      this.valueMap.set(headers[j], newvalues[j])
    }
  }

  /**
   * appends a row to the end of the Dataframe
   * 
   * @param {Row} row - the row to append at the end of the Dataframe
   * @return {Dataframe}
   */
  pushRow(row) {
    const headers = this.headers
    const rowheaders = row.headers
    if (rowheaders.length !== headers.length){
      throw new Error("Headers are not of the same length")
    }
    const headerset = new Set(headers)
    for (let rowheader of rowheaders){
      if (!headerset.has(rowheader)){
        throw new Error(`The row header ${rowheader} is not in the Dataframe`)
      }
    }
    for (let header of headers){
      let column = this.getColumn(header)
      column.push(row.getValue(header))
    }
    return this
  }

  /**
  * Filters the dataframe rows based on the callback function 
  *
  * @method
  * @memberof Dataframe
  * @instance
  * @param {function(Row, number): any} callbackfn - A function that takes a value and its index as parameters.
  * @return {Dataframe} The new filtered Dataframe
  */
  filterRows(callbackfn){
    let headers = this.headers
    let values = this.values
    let newArray = this.headers.map((header) => [header])

    for (let i = 0; i < values[0].length; i++){
      let row = new Row(values.map((array) => array[i]), headers)
      let bool = callbackfn(row)
      if (bool === true){
        for (let j = 0; j < values.length; j++){
          newArray[j].push(values[j][i])
        }
      }
    }
    return new Dataframe(newArray)

  }

  /**
  * Filters the dataframe columns based on the callback function 
  *
  * @method
  * @memberof Dataframe
  * @instance
  * @param {function(Column, number): any} callbackfn - A function that takes a value and its index as parameters.
  * @return {Dataframe} The new filtered Dataframe
  */
  filterColumns(callbackfn) {
    let headers = this.headers
    let values = this.values
    let newArray = []

    for (let i = 0; i < values.length; i++){
      let column = new Column(values[i], headers[i])
      let bool = callbackfn(column)
      if (bool === true){
        newArray.push([headers[i], ...values[i]])
      }
    }
    return new Dataframe(newArray)

  }

  /**
  * Sorts the dataframe rows based on the callback function 
  *
  * @method
  * @memberof Dataframe
  * @instance
  * @param {function(Row, Row): any} callbackfn - A function that takes two rows for comparison.
  * @return {Dataframe} The new sorted Dataframe
  */
  sortRows(callbackfn) {
    const headers = this.headers
    const valuerows = this.arrows
    const rows = valuerows.map(row => new Row(row, headers))
    const sortedValues = rows.sort(callbackfn).map(row => row.values)
    const sortedArray = [headers].concat(sortedValues)
    return new Dataframe(sortedArray, true, 'row')
  }

  /**
   * Sorts the dataframe by a column
   * 
   * @param {string} header
   * @return {Dataframe} The new sorted Dataframe
   */
  sortByColumn(header){
    /**
    * Sorts the dataframe by a column
    * 
    * @param {string} header
    * @return {function(Row, Row): number} The new sorted Dataframe
    */
    const customSort = function(header) {
      return function(row1, row2){
        let a = row1.getValue(header)
        a = isNaN(Number(a)) ? a : Number(a)

        let b = row2.getValue(header)
        b = isNaN(Number(b)) ? b : Number(b)

        if (typeof a === 'number' && typeof b === 'number') {
          return a - b;
        }

        if (typeof a === 'number') {
          return -1;
        } else if (typeof b === 'number') {
          return 1;
        }

        return String(a).localeCompare(String(b));
      }
    }
    return this.sortRows(customSort(header))
  }

  /**
  * Reduces the Dataframe based on the callback function 
  *
  * @method
  * @memberof Dataframe
  * @instance
  * @param {function(any, Row): any} callbackfn - A function that takes a value and its index as parameters.
  * @param {any} initialValue - The initial value for the callback function
  * @return {any} The final value from the reduction
  */ 
  reduce(callbackfn, initialValue) {
    const valuerows = this.arrows
    const headers = this.headers
    const rows = valuerows.map(row => new Row(row, headers))
    return rows.reduce(callbackfn, initialValue)
  }

  /**
   * Rename the headers of the Dataframe
   * 
   * @method
   * @memberof Dataframe
   * @instance
   * @param {Map<string,string>} map - the map or object key: current header, value: new header
   * @return {void}
   * 
   */
  renameHeader(map){
    const headerset = new Set(this.headers)
    if (map.size > headerset.size){
      throw new Error("map has more headers than current number of headers")
    }
    const mapheaders = map.keys()
    for (let mheader of mapheaders){
      if (!headerset.has(mheader)){
        throw new Error("the map contains headers that does not exist in the current headers")
      }
    }
    /**
    * A map that maps each header to its corresponding value  
    * @type {Map<string, Array<any>>}
    */
    const newValMap = new Map()
    this.valueMap.forEach((value, key) => {
      const newKey = map.get(key) ?? key
      newValMap.set(newKey, value)
    })
    this.valueMap = newValMap
  }

  /**
   * Create a pivot tree from the Dataframe
   */
  createPivot(){
    return new PivotTree(this)
  }

}

class Row {
  /**
  * Creates a new Row instance.
  *
  * @constructor
  * @param {any[]} values - An array of values corresponding to the headers.
  * @param {string[]} headers - An array of strings representing the headers.
  */
  constructor(values, headers) {
    if (!Array.isArray(values) || !Array.isArray(headers)){
      throw new Error("Expected Input []Array")
    }
    if (values.length == 0 || headers.length == 0){
      throw new Error("Input cannot be empty")
    }
    if (values.length != headers.length) {
      throw new Error("headers and values dimensions not similar")
    }
    /**
    * A map that maps each header to its corresponding value.
    * @type {Map<string, any>}
    */
    this.map = new Map()
    for (let i = 0; i < values.length; i++){
      this.map.set(headers[i], values[i])
    }
  }
  /**
  * Gets the value under a specified header.
  *
  * @param {string} header - The header for which to retrieve the value.
  * @return {any} The value corresponding to the specified header.
  */
  getValue(header){
    const value = this.map.get(header)
    if (value == null || value == undefined){
      throw new Error(`Column ${header} does not exist`)
    }
    return value
  }
  /**
  * Sets a value under a specified header.
  *
  * @param {string} header - The header under which to set the value.
  * @param {any} value - The value to set under the specified header.
  * @return {void} This function does not return anything.
  */
  setValue(header, value) {
    if (header == null || header == undefined){
      throw new Error("Header must have not be null nor undefined")
    }
    this.map.set(header, value)
  }

  /**
  * Gets the headers of the DataFrame.
  *
  * @return {string[]} An array of strings representing the headers of the DataFrame.
  */
  get headers() {
    return Array.from(this.map.keys())
  }

  /**
  * Gets the values of the DataFrame.
  *
  * @return {any[][]} An array of arrays containing the values of the DataFrame.
  */
  get values() {
    return Array.from(this.map.values())
  }

}

class Column {
  /**
  * Creates a new Column instance.
  *
  * @constructor
  * @param {any[]} values - An array of values for the column.
  * @param {string=} header - An optional string representing the header of the column.
  */
  constructor(values, header=null,) {
    if (!Array.isArray(values)){
      throw new Error("Expected Input []Array")
    }
    /**
    * An optional string representing the header of the column.
    * @type {string}
    */
    this.header = header ?? values[0]
    /**
    * An array of values for the column.
    * @type {any[]}
    */
    this.values = (header) ? values : values.slice(1)
  }
  /**
  * Maps each element of the column using a provided callback function.
  *
  * @method
  * @memberof Column
  * @instance
  * @param {function(any, number): any} callbackfn - A function that takes a value and its index as parameters.
  * @param {string=} header - The header of the returned column
  * @return {Column} A new column with the results of applying the callback function to each element.
  */
  map(callbackfn, header=this.header) {
    return new Column(this.values.map(callbackfn), header)
  }

  /**
  * Filters the column based on the callback function 
  *
  * @method
  * @memberof Column
  * @instance
  * @param {function(any, number): any} callbackfn - A function that takes a value and its index as parameters.
  * @param {string=} header = The header of the returned column
  * @return {Column} A new column with the results of applying the callback function to each element.
  */
  filter(callbackfn, header=this.header) {
    return new Column(this.values.filter(callbackfn), header)
  }
  /**
  * Reduces the column based on the reduce callback function 
  *
  * @method
  * @memberof Column
  * @instance
  * @param {function(any, any): any} callbackfn - A function that takes a value and its index as parameters.
  * @param {any} initialValue - The initial value for the callback function
  * @return {any} The final value from the reduction
  */ 
  reduce(callbackfn, initialValue) {
    return this.values.reduce(callbackfn, initialValue)
  }

  /**
   * Appends a value to the end of the Column
   * 
   * @method
   * @memberof Column
   * @instance
   * @param {any} value - the value to append to the end of the Column
   * @return {void}
   */
  push(value){
    this.values.push(value)
  }

}

class PivotTree {

  /**
   * @constructor
   * @param {Dataframe} dataFrame - the Dataframe that the PivotTree references
   */
  constructor(dataFrame){
    if (!(dataFrame instanceof Dataframe)){
      throw new Error("Expected Input Dataframe")
    }
    /**
     * @type {Dataframe} the Dataframe that the PivotTree references
     */
    this.dataFrame = dataFrame

    /**
     * @type {Node} the root node of the PivotTree
     */
    this.root = new Node("root", "root")

    /**
     * @type {string} the name of the column that is the row of the PivotTree
     */
    this.row = ""

    /**
     * @type {Array<string>} the name of the columns of the PivotTree
     */
    this.columns = []

  }

  /**
   * creates the rows for the pivot tree
   * 
   * @method
   * @mememberof PivotTree
   * @param {string} columnName - the name of the column to make the row group
   * @return {PivotTree} - This PivotTree for chaining
   */
  addRowGroup(columnName){
    if ( !(typeof columnName === 'string') ){
      throw new TypeError("column name must be String")
    }
    const column = this.dataFrame.getColumn(columnName)
    for (let value of new Set(column.values) ){
      this.root.add(new Node(value, columnName))
    } 
    this.row = columnName
    return this
  }

  /**
   * creates a column for the pivot tree
   * 
   * @method
   * @mememberof PivotTree
   * @param {string} header - the name of the column to make the row group
   * @return {PivotTree} - This PivotTree for chaining
   */
  addColumnGroup(header){
    if (this.row.length < 1){
      throw new Error("Cannot add column until row added")
    }
    if ( !(typeof header === 'string') ) {
      throw new TypeError("column name must be a string")
    }
    const column = this.dataFrame.getColumn(header)
    const children = Array.from(new Set(column.values))
    this.addChildren(this.root, children, header)
    this.columns.push(header)
    return this
  }

  /**
   * Adds new nodes to the end of the tree
   * 
   * @param {Node} parent - a parent node
   * @param {Array<any>} children - the children to add
   * @param {string} header - the name of the header the node belongs to
   * @return {void}
   */
  addChildren(parent, children, header){
    if ( !(parent instanceof Node) || !(children instanceof Array) || !(typeof header === "string") ){
      throw new TypeError("Input parameter are of incorrect type")
    }
    const pchildren = parent.children
    if (pchildren.size === 0){
      for (let child of children){
        parent.add(new Node(child, header) )
      }
      return
    }
    for (let pchild of pchildren.values()){
      this.addChildren(pchild, children, header)
    }
    return
  }
  

  /**
   * finds the value for each node in the PivotTree
   * 
   * @param {string} summary - 'sum', 'count', and 'counta' only accepted values
   * @param {string} columnName - the name of the target column
   * @return {PivotTree}
   */
  addPivotValue(summary, columnName) {
    if (this.row.length == 0){
      throw new Error("add the row group  to the pivot tree before setting value")
    }
    if (!(new Set(['count', 'counta', 'sum']).has(summary))) {
      throw new Error("incorrect summary value")
    }
    /**
     * @type {Map<string, function(any, Row):any>}
     */
    const funcmap = new Map()
    funcmap.set('count', (acc, row) => {if(row.getValue(columnName) !== null) return acc + 1} )
    funcmap.set('counta', (acc, _) => ++acc)
    funcmap.set('sum', (acc, row) => row.getValue(columnName) + acc)

    /**
     * @type {Map<string, number>}
     */
    const initialmap = new Map()
    initialmap.set('count', 0)
    initialmap.set('counta', 0)
    initialmap.set('sum', 0)

    let callbackfn = funcmap.get(summary)
    let initialValue = initialmap.get(summary)

    for (let child of this.root.children.values()){
      this.filterDataframe(child, this.dataFrame, callbackfn, initialValue)
    }

    return this

  }

  /**
   * recurvisely filters the Dataframe and applies the callback function
   * 
   * @param {Node} node 
   * @param {Dataframe} dataframe - the Dataframe to apply the filter on and the callback function
   * @param {function(any, Row)} callbackfn - the function called on every filtered Dataframe
   * @param {any} initialValue - the initial value for the callback function
   * @return {void}
   */
  filterDataframe(node, dataframe, callbackfn, initialValue) {
    const columnheader = node.header
    const name = node.name
    let newdataframe = dataframe.filterRows((row) => row.getValue(columnheader) === name)
    node.value = newdataframe.reduce(callbackfn, initialValue)

    const children = node.children
    if (children.size === 0) return

    for (let child of children.values()){
      this.filterDataframe(child, newdataframe, callbackfn, initialValue)
    }
    return
  }

  /**
   * Creates a pivot table
   * @param {string} spreadsheetId
   * @param {string=} sheetName
   * @param {boolean=} clearSheet - bool whether to delete clear the sheet then insert
   * @return {PivotTree}
   */
  toSheet(spreadsheetId, sheetName="Pivot Table", clearSheet=false ){
    const repTree = new RepTree(this)
    const headers = repTree.createHeader()
    const rows = repTree.createRows()
    const pivotRows = headers.concat(rows)
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId)
    let sheet = spreadsheet.getSheetByName(sheetName)

    if (clearSheet){
      if (sheet){
        spreadsheet.deleteSheet(sheet)
      }
      spreadsheet.insertSheet()
      sheet = spreadsheet.getActiveSheet().setName(sheetName)
      sheet.getRange(1, 1, pivotRows.length, pivotRows[0].length).setValues(pivotRows)
      return this
    }
    else{
      if (!sheet){
        spreadsheet.insertSheet()
        sheet = spreadsheet.getActiveSheet().setName(sheetName)
      }
      sheet.getRange(1, 1, pivotRows.length, pivotRows[0].length).setValues(pivotRows)
      return  this
    }

  }

  /**
   * finds a value within the pivot tree
   * 
   * @param {string} row - the row to start search
   * @param {Array<string>} columns - the columns to search
   * @return {any} [value=null]
   */
  find(row, ...columns){
    let currentnode = this.root.child(row)
    for (let column of columns){
      currentnode = currentnode.child(column)
      if (!currentnode){
        return null
      }   
    }
    return currentnode?.value
  }

}

class Node {
  /**
   * @constructor
   * @param {string} name - the name of node
   * @param {string} header - the header that the node falls under
   * @param {Map<string, Node>} children the children nodes
   * @param {any=} value
   */
  constructor(name, header, children=new Map(), value=null){
    if ( !(typeof name === 'string') || !(children instanceof Map)  ){
      Logger.log(`name:${name}`)
      Logger.log(`children:${Array.from(children.values()).map(child => child.name)}`)
      throw new TypeError("Arguments are of incorrect type")
    }
    /**
     * @type {string}
     */
    this.name = name

    /**
     * @type {string}
     */
    this.header = header

    /**
     * @type {Map<string, Node>}
     */
    this.children = children
    /**
     * @type {any}
     */
    this.value = value
  }

  /**
   * 
   * add child Node
   * @method
   * @memberof Node
   * 
   * @param {Node} child - the child node to add
   * @return {void}
   */
  add(child){
    if ( !(child instanceof Node) ){
      throw new TypeError("Input should be instance of Node")
    }
    this.children.set(child.name, child)
  }
  /**
   * remove child Node
   * @method
   * @memberof Node
   * 
   * @param {string} name - the name of the child node to remove
   * @return {void}
   */
  remove(name){
    if ( !(typeof name === 'string') ){
      throw new TypeError("Input should be instance of name of Node")
    }
    this.children.delete(name)
  }

  /**
   * gets child node with input name
   * 
   * @method
   * @memmberof Node
   * 
   * @param {string} name - the name of the child node
   * @return {?Node}
   */
  child(name){
    return this.children.get(name)
  }

}

class RepTree{
  /**
   * @constructor
   * 
   * @param {PivotTree} pivotTree - the pivot tree to build the representational tree on
   */
  constructor(pivotTree){
    /**
     * @type {PivotTree}
     */
    this.pivotTree = pivotTree

    const firstRowNode = Array.from(this.pivotTree.root.children.values())[0]
    /**
     * @type {Node}
     */
    this.root = firstRowNode 


  }

  /**
   * create the headers for the pivot table
   * @return {Array<Array<any>>}
   */
  createHeader(){
    let headers = []
    let columns = [...this.pivotTree.columns]
    for (let header of columns){
      let curheaders = [header]
      let name = [null]
      this.appendHeader(this.root, curheaders, name, header)
      headers.push(curheaders)
    }
    const grandRow = Array(headers[0].length -1).fill(null)
    grandRow.push('Grand')
    headers = [grandRow].concat(headers)
    const rowheader = [this.pivotTree.row]
    headers.push(
      rowheader.concat(Array(headers[0].length -1).fill(null))
    )
    return headers
  }

  /**
   * rec function to append appropriate header
   * @param {Node} node - the current node
   * @param {Array<string>} headers - the headers array being built
   * @param {Array<string>} name - the current name to put in header; as array to pass as reference
   * @param {string} header - the name of the column that the header is built for
   * @return {void}
   */
  appendHeader(node, headers, name, header){
    if (node.header === header){
      name[0] = node.name
    }
    const children = new Set(node.children.values())
    if (children.size > 0){
      for (let child of children){
        this.appendHeader(child, headers, name, header)
      }
    }
    headers.push(name[0])
    if (node.header === header){
      name[0] = null
    }
    return
  }

  /**
   * creates the rows for the pivot table
   * 
   * @return {Array<Array<any>>}
   */
  createRows(){
    const rownodes = new Set(this.pivotTree.root.children.values())
    const rows = []

    for (let node of rownodes){
      let array = [node.name]
      this.insertNodeValue(node, array)
      rows.push(array)
    }
    const dataframe = new Dataframe(rows, false, 'row') 
    const columns = dataframe.getColumns()
    const totalRow = ["Totals"]
    for (let i = totalRow.length; i < columns.length; i++){
      //skip the first column because it is just the names of the row
      let column = columns[i]
      totalRow.push(
        column.reduce((acc, value) => acc + value, 0)
      )
    }
    rows.push(totalRow)
    return rows
  }

  /**
   * inserts the value of the after inserting its children's value
   * @param {Node} node
   * @param {Array<any>} array
   */
  insertNodeValue(node, array){
    const rchildren = new Set(node.children.values())

    if (rchildren.size === 0){
      array.push(node.value)
      return
    }

    for (let rchild of rchildren){
      this.insertNodeValue(rchild, array)
    }
    array.push(node.value)
    return

  }

}


/**
 * @param {string} spreadsheetId - the id of the spreadsheet
 * @param {string=} sheetName - the name of the sheet name to parse
 */
function sheetToCsv(spreadsheetId, sheetName=null){

  let ssID = spreadsheetId;
  let requestData = {"method": "GET", "headers":{"Authorization":"Bearer "+ScriptApp.getOAuthToken()}};

  let spreadsheet = SpreadsheetApp.openById(spreadsheetId)
  if (!sheetName){
    sheetName = spreadsheet.getSheets()[0].getSheetName()
  }
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet){
    return null
  }
  let sheetNameId = sheet.getSheetId().toString();

  params= ssID+"/export?gid="+sheetNameId +"&format=csv"
  let url = "https://docs.google.com/spreadsheets/d/"+ params
  let result = UrlFetchApp.fetch(url, requestData);  
  const arrays = Utilities.parseCsv(result)
  return arrays

} 



/**
* Checks if two arrays are equal.
*
* @param {Array} arr1 - The first array to compare.
* @param {Array} arr2 - The second array to compare.
* @return {boolean} True if the arrays are equal, false otherwise.
*/
function areArraysEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) {
    return false;
  }

  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] instanceof Array && arr2[i] instanceof Array){
      if (!areArraysEqual(arr1[i], arr2[i])){
        return false
      }
    }
    else if (arr1[i] !== arr2[i]) {
      return false;
    }
  }

  return true;

}


/**
 * Prints all the values from a pivot tree
 * 
 * @param {PivotTree} pivotTree the pivot tree to print all values
 * @return {void}
 */
function printTreeValue(pivotTree){
  printNodValueRec(pivotTree.root)
}

/**
 * Recursive function to print the value in a node
 * 
 * @param {Node} node
 * @return {void}
 */
function printNodValueRec(node){
  Logger.log(`${node.name}: ${node.value}`)

  if (node.children.size === 0) return
  for (let child of node.children.values()){
    printNodValueRec(child)
  }
  return
}

function dataFrameUnitTests(){
  const dataFrame = Dataframe.readSheet('134diA7aG1kh_F43a4Xw_CzITbqkTC23s6M6czMXrfKU', 'Sheet1')
  const headers = dataFrame.headers
  const dfValues = dataFrame.values.slice(0)
  const colA = dataFrame.getColumn('A')
  const colD = colA.map((value) => value * 2, 'D')
  const colDHeader = colD.header
  const colDValues = colD.values
  dataFrame.setColumn(colD)
  const setColD = dataFrame.getColumn('D')
  const row1 = dataFrame.getRow(0)
  row1.setValue('A', 0)
  dataFrame.setRow(0, row1)
  const newColA = dataFrame.getColumn('A')
  const newColAValues = newColA.values
  const oddDataframe = dataFrame.filterRows((row) => row.getValue('A') % 2 == 1)
  const oddColC = oddDataframe.getColumn('C')
  const oddColCValues = oddColC.values
  const twoColDataframe = dataFrame.filterColumns((column) => ['A', 'B'].includes(column.header))
  const twoColDataframeHeaders = twoColDataframe.headers
  twoColDataframe.pushRow(new Row([21, 68], ['A', 'B']))
  twoColDataframe.renameHeader(new Map().set("A","C"))
  twoColDataframe.toSheet('134diA7aG1kh_F43a4Xw_CzITbqkTC23s6M6czMXrfKU', 'TwoColSheet')

  const df = new Dataframe([['A', 3, 2, 1],['B', 4],['C', 5, 6, 7]])
  const sorteddf = df.sortRows((row1, row2) => row1.getValue('A') - row2.getValue('A'))

  Logger.log("Passed: Dataframe creation")
  Logger.log("Passed: Column creation")
  Logger.log("Passed: Row creation")

  let status =  (areArraysEqual(['A', 'B', 'C'], headers))  ? "Passed" : "Failed"
  Logger.log(`${status}: Dataframe headers`)

  status = (colDHeader === 'D') ? "Passed" : "Failed"
  Logger.log(`${status}: Column headers`)

  status = (areArraysEqual([2, 4, 6], colDValues)) ? "Passed" : "Failed"
  Logger.log(`${status}: Column values map`)

  status = (colD.values === setColD.values) ? "Passed" : "Failed"
  Logger.log(`${status}: Dataframe set column`)

  status = (areArraysEqual([0, 2, 3], newColAValues)) ? "Passed" : "Failed"
  Logger.log(`${status}: Dataframe get rows`)
  Logger.log(`${status}: Dataframe set rows`)

  status = (areArraysEqual([7], oddColCValues)) ? "Passed" : "Failed"
  Logger.log(`${status}: Dataframe Row Filter`)

  status = (areArraysEqual(['A', 'B'], twoColDataframeHeaders)) ? "Passed" : "Failed"
  Logger.log(`${status}: Dataframe Column Filter`)

  status = (areArraysEqual(sorteddf.values, [[1,2,3],[null, null, 4], [7, 6, 5]])) ? "Passed" : "Failed"
  Logger.log(`${status}: Dataframe Sorting`)
  Logger.log(`${status}: Dataframe creation via row`)

}

function pivotTreeUnitTest(){
  const dataFrame = new Dataframe([
    ['Names', 'Joe', 'Timmy', 'Joe', 'Guy', 'Bob', 'Bob'], 
    ['Points', 1, 2, 3, 4, 5, 6],
    ['Season', 'Winter', 'Summer', 'Winter', 'Summer', 'Winter', 'Summer'],
    ['House', 'Rock', 'Rock', 'Rock', 'Water', 'Water', 'Water']
    ])
  let  pivotTree = dataFrame.createPivot()
  const value = pivotTree.
  addRowGroup('Names').
  addColumnGroup('House').
  addColumnGroup('Season').
  addPivotValue('sum', 'Points').
  toSheet('134diA7aG1kh_F43a4Xw_CzITbqkTC23s6M6czMXrfKU', 'Pivot Test').find('Joe', 'Rock', 'Summer')
  Logger.log(value)

}

//TODO
//be able to write styles
//merge two dataframe
//sql function?
//fill nulls
//drop rows with null
//








