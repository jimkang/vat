import { queue } from 'd3-queue';
import { range } from 'd3-array';
import request from 'basic-browser-request';
import bodyMover from 'request-body-mover';
import cloneDeep from 'lodash.clonedeep';

const w2vBaseURL = 'http://localhost:9666/';

var inertSubstrates = ['the', 'a', 'an', 'but', 'and'];

export function ferment({ generation, probable }, done) {
  var enzymes = probable.shuffle(generation.enzymes);
  var targetSubstrateIndexes = probable
    .shuffle(range(generation.substrates.length))
    .slice(0, enzymes.length);
  var q = queue(4);
  const limit =
    enzymes.length > targetSubstrateIndexes.length
      ? enzymes.length
      : targetSubstrateIndexes.length;

  for (let i = 0; i < limit; ++i) {
    const substIndex = targetSubstrateIndexes[i];
    q.defer(getSums, substIndex, generation.substrates[substIndex], enzymes[i]);
  }

  q.awaitAll(updateGeneration);

  function updateGeneration(error, newSubstrateChoices) {
    if (error) {
      done(error);
      return;
    }

    var substrates = cloneDeep(generation.substrates);
    newSubstrateChoices.forEach(updateFromResults);
    var nextGen = {
      substrates,
      enzymes,
      id: +generation.id + 1,
    };
    done(null, nextGen);

    function updateFromResults(pack) {
      var result = probable.pick(pack.results);
      if (result.word) {
        substrates[pack.substIndex] = result.word;
      }
    }
  }
}

function getSums(index, substrate, enzyme, done) {
  if (inertSubstrates.includes(substrate)) {
    setTimeout(done, 0, null, {
      substIndex: index,
      results: [{ word: substrate, distance: 0 }],
    });
    return;
  }

  const url = `${w2vBaseURL}/neighbors?words=${substrate},${enzyme}&quantity=10&operation=add`;
  request({ method: 'GET', url, json: true }, bodyMover(wrapResults));

  function wrapResults(error, results) {
    if (error) {
      done(error);
      return;
    }
    done(null, { substIndex: index, results });
  }
}
