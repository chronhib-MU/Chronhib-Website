import React from 'react';
export const tableHeaders = {
  textHeaders: ['Text ID', 'Revised Title'],
  sentencesHeaders: ['Text ID', 'Textual Unit ID', 'Textual Unit', ' Locus'],
  morphologyHeaders: [
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
  textBodies: ['Text_ID', 'Revised_title'],
  sentencesBodies: ['TextID', 'Textual_Unit_ID', 'Textual_Unit', 'Locus1'],
  morphologyBodies: [
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
export let tables = ['text', 'lemmata', 'morphology', 'sentences'];
export const renderLemmata = ({ ID_unique_number: id, Meaning: meaning }) => {
  return (
    <div key={id}>
      {id}: {meaning},
    </div>
  );
};
export const renderMorphology = ({ ID_unique_number: id, Morph: morph }) => {
  return (
    <div key={id}>
      {id}: {morph}
    </div>
  );
};
export const renderSentences = ({ ID_unique_number: id, Textual_Unit: TU }) => {
  return (
    <div key={id}>
      {id}: {TU}
    </div>
  );
};
// export const renderText = () => {
//   data = fetchData(path);
//   return (
//     <tr key={data.Text_ID}>
//       <th scope="row"></th>
//       <td>{data.Text_ID}</td>
//       <td>{data.Revised_title}</td>
//       <td className="text-right">
//         <UncontrolledDropdown>
//           <DropdownToggle
//             className="btn-icon-only text-light"
//             href="#"
//             role="button"
//             size="sm"
//             color=""
//             onClick={e => e.preventDefault()}
//           >
//             <i className="fas fa-ellipsis-v" />
//           </DropdownToggle>
//           <DropdownMenu className="dropdown-menu-arrow" right>
//             <DropdownItem href="#" onClick={e => e.preventDefault()}>
//               Action
//             </DropdownItem>
//             <DropdownItem href="#" onClick={e => e.preventDefault()}>
//               Another action
//             </DropdownItem>
//             <DropdownItem href="#" onClick={e => e.preventDefault()}></DropdownItem>
//           </DropdownMenu>
//         </UncontrolledDropdown>
//       </td>
//     </tr>
//   );
// };

// <div className="morphology">Morphology: {morphology.map(renderMorphology)}</div>
