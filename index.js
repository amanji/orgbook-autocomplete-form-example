'use strict';

// Import stylesheets
import './style.css';
import types from './entity_types';

var fields = {
  _inputs: {},
  get defined() {
    return Object.keys(this._inputs)
      .filter(
        function (k) {
          return this._inputs[k];
        }.bind(this)
      )
      .map(
        function (k) {
          return this._inputs[k];
        }.bind(this)
      );
  },
  set defined(_inputs) {
    this._inputs = _inputs;
  },
  find: function (k) {
    return this._inputs[k];
  },
};

load(); // Simulates a window onload event

function load() {
  fields.defined = {
    name: document.querySelector('#name'),
    type: document.querySelector('#type'),
    registryNumber: document.querySelector('#registryNumber'),
  };
  init();
}

function init() {
  try {
    const orgNameInput = fields.find('name');
    if (!orgNameInput) return;
    $(orgNameInput).autocomplete({
      source: function (request, response) {
        $.ajax({
          url: 'https://orgbook.gov.bc.ca/api/v3/search/autocomplete',
          data: {
            q: request.term,
            inactive: 'false',
            revoked: 'false',
            latest: 'true',
          },
          success: function (data) {
            var results = data.total ? data.results : [];
            response(results);
          },
        });
      },
      minLength: 2,
      select: function (event, ui) {
        clearFields();
        getOrgData(ui.item);
      },
    });
  } catch (e) {
    console.error('Unable to initialize autocomplete', e);
  }
}

function getOrgData(selected) {
  $.ajax({
    url: 'https://orgbook.gov.bc.ca/api/v4/search/topic',
    data: {
      q: selected.topic_source_id,
    },
    beforeSend: function () {
      disableFields();
    },
  })
    .done(function (response) {
      var topic =
        response.total &&
        response.results.find(function (_topic) {
          return _topic.source_id === selected.topic_source_id;
        });
      populateFields(topic);
    })
    .fail(function (e) {
      console.error('Unable to get organization data', e);
    })
    .always(function () {
      enableFields();
    });
}

function populateFields(topic) {
  if (!topic) return;

  const orgTypeInput = fields.find('type');
  const orgRegistryNumberInput = fields.find('registryNumber');

  if (orgTypeInput) {
    var orgTypeAttribute = topic.attributes.find(function (attribute) {
      return attribute.type === 'entity_type';
    });
    orgTypeInput.value = types[orgTypeAttribute.value];
  }

  if (orgRegistryNumberInput) {
    orgRegistryNumberInput.value = topic.source_id;
  }
}

function clearFields() {
  fields.defined.forEach(function (field) {
    field.value = '';
  });
}

function disableFields() {
  fields.defined.forEach(function (field) {
    field.setAttribute('disabled', 'true');
  });
}

function enableFields() {
  fields.defined.forEach(function (field) {
    field.removeAttribute('disabled');
  });
}
