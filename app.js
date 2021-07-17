import RouteState from 'route-state';
import wireControls from './dom/wire-controls';
import handleError from 'handle-error-web';
import { renderGens } from './dom/render-gens';
import { version } from './package.json';
import { ferment } from './updaters/ferment';
import { createProbable } from 'probable';
import ep from 'errorback-promise';
import seedrandom from 'seedrandom';

var routeState;
var controlsWired = false;

var generations = [
  {
    id: 'a',
    substrates: [
      'the',
      'quick',
      'brown',
      'fox',
      'jumps',
      'over',
      'the',
      'lazy',
      'brown',
      'dog',
    ],
    enzymes: ['future', 'massive', 'cozy'],
  },
];

(async function go() {
  window.onerror = reportTopLevelError;
  renderVersion();

  routeState = RouteState({
    followRoute,
    windowObject: window,
    propsToCoerceToBool: ['localMode'],
  });
  routeState.routeFromHash();
})();

function followRoute({ seed }) {
  if (!seed) {
    //seed = randomid(8);
    routeState.updateEphemeralState({ seed }, false);
  }
  console.log('Seed:', seed);
  var probable = createProbable({ random: seedrandom(seed) });

  renderGens({ generations, onFerment });

  if (controlsWired) {
    onStart();
  } else {
    wireControls({ onStart });
    controlsWired = true;
  }

  function onStart() {
    console.log('Hey');
  }

  async function onFerment(generation) {
    var { error, values } = await ep(ferment, { generation, probable });
    if (error) {
      handleError(error);
      return;
    }
    generations.push(values[0]);
    renderGens({ generations, onFerment });
  }
}

function reportTopLevelError(msg, url, lineNo, columnNo, error) {
  handleError(error);
}

function renderVersion() {
  var versionInfo = document.getElementById('version-info');
  versionInfo.textContent = version;
}
