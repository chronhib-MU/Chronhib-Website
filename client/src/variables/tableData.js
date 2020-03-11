import { createContext, useContext } from 'react';

export let data = {
  text: [],
  sentences: [],
  lemmata: [],
  morphology: []
};

export const tableHeaders = {
  textHeaders: ['ID', 'Text ID', 'Revised Title'],
  sentencesHeaders: ['ID', 'Text ID', 'Textual Unit ID', 'Textual Unit', ' Locus'],
  morphologyHeaders: [
    'ID',
    'Text ID',
    'Textual Unit ID',
    'Stressed Unit',
    'Morph',
    'Lemma',
    'Part of Speech',
    'Classification',
    'Analysis'
  ],
  lemmataHeaders: [
    'ID',
    'Text ID',
    'Textual Unit ID',
    'Lemma',
    'Meaning',
    'Part of Speech',
    'Classification',
    'Gender',
    'Etymology'
  ]
};
export const tableBodies = {
  textBodies: ['ID_unique_number', 'Text_ID', 'Revised_title'],
  sentencesBodies: ['ID_unique_number', 'TextID', 'Textual_Unit_ID', 'Textual_Unit', 'Locus1'],
  morphologyBodies: [
    'ID_unique_number',
    'TextID',
    'Textual_Unit_ID',
    'Stressed_Unit',
    'Morph',
    'Lemma',
    'Part_Of_Speech',
    'Classification',
    'Analysis'
  ],
  lemmataBodies: []
};
export let tables = ['text', 'sentences', 'lemmata', 'morphology'];
export const updateData = updatedData => (data = updatedData);
export const DataTableContext = createContext(null);

// Goes through all the tableBody keys and returns data for those keys in as an array of objects

// export const columns = [
//   { key: 'id', name: 'ID', editable: true },
//   { key: 'title', name: 'Title', editable: true },
//   { key: 'complete', name: 'Complete', editable: true }
// ];
// export const rows = [
//   { id: 0, title: 'Task 1', complete: 20 },
//   { id: 1, title: 'Task 2', complete: 40 },
//   { id: 2, title: 'Task 3', complete: 60 }
// ];

// {
//   /* Table */
// }
// <Table className="table-flush" responsive hover>
//   <thead className="thead-light">
//     <tr>
//       {tableHeaders[table + 'Headers'].map((header, i) => {
//         return (
//           <th key={i} scope="col">
//             {header}
//           </th>
//         );
//       })}
//       <th scope="col" />
//     </tr>
//   </thead>
//   <tbody>
//     {dataTables[table].length ? (
//       dataTables[table]
//         .filter((res, i) => i < currentPage * 30)
//         .map((rows, i) => {
//           return (
//             <tr key={i}>
//               {tableBodies[table + 'Bodies'].map((column, i) => {
//                 return <td key={i}>{rows[column]}</td>;
//               })}
//               <td />
//             </tr>
//           );
//         })
//     ) : (
//       <tr></tr>
//     )}
//   </tbody>
// </Table>;
