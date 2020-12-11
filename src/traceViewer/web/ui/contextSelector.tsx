/*
  Copyright (c) Microsoft Corporation.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import * as React from 'react';
import { ContextEntry } from '../../traceModel';
import './contextSelector.css';

export const ContextSelector: React.FunctionComponent<{
  contexts: ContextEntry[],
  onChange: (contextEntry: ContextEntry) => void,
}> = ({ contexts, onChange }) => {
  const [index, setIndex] = React.useState<number>(0);
  return (
    <select
      className='context-selector'
      style={{
        visibility: contexts.length <= 1 ? 'hidden' : 'visible',
      }}
      value={index}
      onChange={e => {
        const newIndex = +e.target.value;
        setIndex(newIndex);
        onChange(contexts[newIndex]);
      }}
    >
      {contexts.map((entry, index) => <option value={index} key={entry.name}>{entry.name}</option>)}
    </select>
  );
};
