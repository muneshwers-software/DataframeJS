# DataframeJS

DataframeJS is a JavaScript library designed for in-memory manipulation of data within Google Sheets using Google Apps Script. Inspired by the functionality of Python's pandas library, DataframeJS simplifies data manipulation tasks, such as sorting, filtering, appending, and renaming columns and rows. Additionally, it allows users to create and write pivot tables and search for data within the pivot table.

## Features

- **Read and Write Google Sheets**: Easily read and write data to and from Google Sheets.
  
- **In-Memory Data Manipulation**: Perform various data manipulation tasks in-memory, similar to Python's pandas library.

- **Sorting**: Sort the data based on one or more columns.

- **Filtering**: Filter the data based on specified conditions.

- **Appending**: Append new data to the existing data in the dataframe.

- **Column and Row Manipulation**: Rename columns and rows to customize the structure of the dataframe.

- **Pivot Tables**: Create and write pivot tables for summarizing and analyzing data.

- **Search within Pivot Table**: Search for specific data within the pivot table.

## Getting Started

To use DataframeJS in your Google Apps Script, follow these steps:

1. **Include DataframeJS Library**: Copy the `DataframeJS.js` file from this repository and include it in your Google Apps Script project.

2. **Initialize Dataframe**: Create a new Dataframe object by passing your Google Sheet data.

    ```javascript
    // Example: Initialize a new Dataframe
    const data = [
    ['Names', 'Joe', 'Timmy', 'Joe', 'Guy', 'Bob', 'Bob'], 
    ['Points', 1, 2, 3, 4, 5, 6],
    ['Season', 'Winter', 'Summer', 'Winter', 'Summer', 'Winter', 'Summer'],
    ['House', 'Rock', 'Rock', 'Rock', 'Water', 'Water', 'Water']
    ]
    const df = new Dataframe(data);
    ```

3. **Perform Data Manipulation**: Use the provided methods to manipulate your data.

    ```javascript
    // Example: Sort data based on a column
    df.sortByColumn('columnName');

    // Example: Filter rows based on a callback
    df.filterRows(callback);

    // Example: Append new row
    df.pushRow(row);

    // Example: Rename column headers
    df.renameHeader(map);

    // Example: Create a pivot table
    const pivotTable = df.createPivot()

    ```

4. **Write Data Back to Google Sheets**: After manipulating the data, write it back to the Google Sheet.

    ```javascript
    // Example: Write the modified dataframe back to Google Sheets using the spreadsheet id
    df.toSheet('134diA7aG1kh_F43a4Xw_CzITbqkTC23s6M6czMXrKU');
    ```

## Example

```javascript

// Sample data from Google Sheets
const data = [
  ['Name', 'Age', 'City'],
  ['John', 25, 'New York'],
  ['Jane', 30, 'San Francisco'],
  ['Bob', 22, 'Los Angeles'],
  ['Timmy', 19, 'New York'],
];

// Initialize a new Dataframe
const df = new Dataframe(data, true, 'rows');

// Sort data based on the 'Age' column
df.sortByColumn('Age');

// Filter data for individuals aged 25 or older
df.filterRow(row => row.getValue('Age') >= 25) ;

// Append new data to the dataframe
df.pushRow(new Row(['Alice', 28, 'Chicago'], ['Name', 'Age', 'City']));

// Rename the 'City' column to 'Location'
df.renameColumn(new Map().set('City', 'Location'));

// Create a pivot table
const pivot = df.createPivot();

//add row, column, and value
pivot.addRowGroup('City').addValue('counta', 'Age')
pivot.toSheet('134diA7aG1kh_F43a4Xw_CzITbqkTC23s6M6czMXrKU', 'Person Count')

// Write the modified dataframe back to Google Sheets
df.toSheet('134diA7aG1kh_F43a4Xw_CzITbqkTC23s6M6czMXrKU');


