import RouteState from 'route-state';
import handleError from 'handle-error-web';
import { renderGens } from './dom/render-gens';
import { version } from './package.json';
import { ferment } from './updaters/ferment';
import { createProbable } from 'probable';
import ep from 'errorback-promise';
import seedrandom from 'seedrandom';
import RandomId from '@jimkang/randomid';

var randomid = RandomId();

var routeState;

var generations = [
  {
    id: 0,
    substrates: [
      { word: 'the', pos: [10, 10] },
      { word: 'quick', pos: [30, 10] },
      { word: 'brown', pos: [50, 10] },
      { word: 'fox', pos: [70, 10] },
      { word: 'jumps', pos: [90, 10] },
      { word: 'over', pos: [10, 30] },
      { word: 'the', pos: [30, 30] },
      { word: 'lazy', pos: [50, 30] },
      { word: 'brown', pos: [70, 30] },
      { word: 'dog', pos: [90, 30] },
    ],
    enzymes: [
      { desc: 'Enzyme: Break down', action: 'break', pos: [33, 5] },
      {
        desc: 'Enyzme: Add "cozy"',
        action: 'add',
        supplement: 'cozy',
        pos: [66, 5],
      },
      { desc: 'Enzyme: Break down', action: 'break', pos: [33, 40] },
      {
        desc: 'Enzyme: Add "future"',
        action: 'add',
        supplement: 'future',
        pos: [66, 40],
      },
    ],
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
    seed = randomid(8);
    routeState.updateEphemeralState({ seed }, false);
  }
  console.log('Seed:', seed);
  var probable = createProbable({ random: seedrandom(seed) });

  renderGens({ generations, onFerment });

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
