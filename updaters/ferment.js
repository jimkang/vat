import { queue } from 'd3-queue';
import request from 'basic-browser-request';
import bodyMover from 'request-body-mover';
import cloneDeep from 'lodash.clonedeep';
import math from 'basic-2d-math';

const w2vBaseURL = 'http://localhost:9666/';

var inertSubstrates = ['the', 'a', 'an', 'but', 'and'];

export function ferment({ generation, probable }, done) {
  var substrates = cloneDeep(generation.substrates);
  var nextGen = {
    substrates,
    enzymes: generation.enzymes,
    id: +generation.id + 1,
  };
  var splicePacks = [];

  var q = queue();
  generation.enzymes.forEach((enzyme) => q.defer(runEnzyme, enzyme));
  q.awaitAll(passNextGen);

  function passNextGen(error) {
    splicePacks
      .sort(compareFirstDesc)
      .forEach((spliceArgs) => substrates.splice.apply(substrates, spliceArgs));
    done(error, nextGen);
  }

  function runEnzyme(enzyme, enzymeDone) {
    var targetSubstrateIndexes = getIndexesOfSubstratesInRange(enzyme.pos);
    var addQ = queue(4);

    for (let i = 0; i < targetSubstrateIndexes.length; ++i) {
      const substIndex = targetSubstrateIndexes[i];
      addQ.defer(
        getSums,
        substIndex,
        generation.substrates[substIndex].word,
        enzyme.action === 'add' ? enzyme.supplement : null
      );
    }

    addQ.awaitAll(updateGeneration);

    function updateGeneration(error, newSubstrateChoices) {
      if (error) {
        enzymeDone(error);
        return;
      }

      for (let j = newSubstrateChoices.length - 1; j > -1; --j) {
        let pack = newSubstrateChoices[j];

        if (enzyme.action === 'add') {
          var result = probable.pick(pack.results);
          if (result.word) {
            substrates[pack.substIndex].word = result.word;
          }
        } else if (enzyme.action === 'break') {
          let spliceArgs = [pack.substIndex, 1];
          let results = probable.shuffle(pack.results).slice(0, 2);
          if (results.length > 0 && results[0].word) {
            let newSubA = cloneDeep(substrates[pack.substIndex]);
            newSubA.pos[1] -= 3;
            newSubA.word = results[0].word;
            spliceArgs.push(newSubA);
            if (results.length > 1 && results[1].word) {
              let newSubB = cloneDeep(substrates[pack.substIndex]);
              newSubB.pos[1] += 3;
              newSubB.word = results[1].word;
              spliceArgs.push(newSubB);
            }
            splicePacks.push(spliceArgs);
          }
        }
      }

      enzymeDone();
    }
  }

  function getIndexesOfSubstratesInRange(pos) {
    var indexes = [];
    for (let i = 0; i < substrates.length; ++i) {
      if (
        math.getVectorMagnitude(math.subtractPairs(pos, substrates[i].pos)) <=
        10
      ) {
        indexes.push(i);
      }
    }
    return indexes;
  }
}

function getSums(index, wordA, wordB, done) {
  if (inertSubstrates.includes(wordA)) {
    setTimeout(done, 0, null, {
      substIndex: index,
      results: [{ word: wordA, distance: 0 }],
    });
    return;
  }

  const url = `${w2vBaseURL}/neighbors?words=${wordA}${
    wordB ? ',' + wordB : ''
  }&quantity=10&operation=add`;
  request({ method: 'GET', url, json: true }, bodyMover(wrapResults));

  function wrapResults(error, results) {
    if (error) {
      done(error);
      return;
    }
    done(null, { substIndex: index, results });
  }
}

function compareFirstDesc(a, b) {
  return a[0] < b[0] ? 1 : -1;
}
