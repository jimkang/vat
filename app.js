import RouteState from 'route-state';
import handleError from 'handle-error-web';
import { renderGens } from './dom/render-gens';
import { version } from './package.json';
import { ferment } from './updaters/ferment';
import { createProbable } from 'probable';
import ep from 'errorback-promise';
import seedrandom from 'seedrandom';
import RandomId from '@jimkang/randomid';
import { select } from 'd3-selection';
import splitToWords from 'split-to-words';

var randomid = RandomId();

var routeState;

var generations = [
  {
    id: 0,
    substrates: [
      //{ word: 'the', pos: [10, 10] },
      //{ word: 'quick', pos: [30, 10] },
      //{ word: 'brown', pos: [50, 10] },
      //{ word: 'fox', pos: [70, 10] },
      //{ word: 'jumps', pos: [90, 10] },
      //{ word: 'over', pos: [10, 30] },
      //{ word: 'the', pos: [30, 30] },
      //{ word: 'lazy', pos: [50, 30] },
      //{ word: 'brown', pos: [70, 30] },
      //{ word: 'dog', pos: [90, 30] },
    ],
    enzymes: [
      { desc: 'Enzyme: Break down', action: 'break', pos: [33, 5] },
      {
        desc: 'Enyzme: Add "cozy"',
        action: 'add',
        supplement: 'cozy',
        pos: [80, 5],
      },
      { desc: 'Enzyme: Break down', action: 'break', pos: [20, 40] },
      {
        desc: 'Enzyme: Add "future"',
        action: 'add',
        supplement: 'future',
        pos: [50, 40],
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

  select('#start-button').on('click', setUpFirstGen);

  async function onFerment(generation) {
    var { error, values } = await ep(ferment, { generation, probable });
    if (error) {
      handleError(error);
      return;
    }
    generations.push(values[0]);
    renderGens({ generations, onFerment });
  }

  function setUpFirstGen() {
    var words = splitToWords(select('#start-words').node().value);
    generations[0].substrates = words.map(substrateFromWord);
    renderGens({ generations, onFerment });
  }
}

function substrateFromWord(word, i) {
  const n = i * 20 + 10;
  return { word, pos: [n % 100, Math.floor(n / 100) * 20 + 10] };
}

function reportTopLevelError(msg, url, lineNo, columnNo, error) {
  handleError(error);
}

function renderVersion() {
  var versionInfo = document.getElementById('version-info');
  versionInfo.textContent = version;
}
