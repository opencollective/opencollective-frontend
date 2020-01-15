import React, { Fragment } from 'react';
import PropType from 'prop-types';
import fetch from 'node-fetch';
import { debounce } from 'lodash';
import AsyncSelect from 'react-select/async';

import { getEnvVar } from '../lib/utils';

const apiKey = getEnvVar('MAPTILER_MAPS_API_KEY');

const exportLocationData = data => ({
  name: data.text,
  address: data.place_name,
  bbox: data.bbox,
  lat: data.center[1],
  long: data.center[0],
});

const debounced = debounce(async (query, callback) => {
  let result = null;
  const url = `https://api.maptiler.com/geocoding/${query}.json?key=${apiKey}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    result = data.features.map(s => ({ label: s.place_name, value: s }));
  } catch (err) {
    result = null;
  } finally {
    callback(result);
  }
}, 500);

export default function Geosuggest({ onSuggestSelect, placeholder, defaultOptions }) {
  const getOption = (input, callback) => {
    if (!input) return Promise.resolve([]);
    debounced(input, callback);
  };

  return (
    <Fragment>
      <style jsx global>
        {`
          .geosuggest {
            z-index: 5;
          }
        `}
      </style>
      <AsyncSelect
        className="geosuggest"
        cacheOptions
        loadOptions={getOption}
        placeholder={placeholder}
        defaultOptions={defaultOptions}
        onChange={({ value }) => onSuggestSelect(exportLocationData(value))}
      />
    </Fragment>
  );
}

Geosuggest.propTypes = {
  placeholder: PropType.string,
  onSuggestSelect: PropType.func,
  defaultOptions: PropType.array,
};
