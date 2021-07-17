import { select } from 'd3-selection';
import accessor from 'accessor';

export function renderGens({ generations, onFerment }) {
  var allGensSel = select('.generations')
    .selectAll('.generation')
    .data(generations, accessor());
  allGensSel.exit().remove();
  var newGens = allGensSel.enter().append('li').classed('generation', true);
  newGens.append('ul').classed('substrates', true);
  newGens.append('ul').classed('enzymes', true);
  newGens
    .append('button')
    .text('Ferment next generation')
    .on('click', onClickFerment);
  var gens = allGensSel.merge(newGens);
  gens
    .select('.substrates')
    .selectAll('.substrate')
    .data(accessor('substrates'), accessor('identity'))
    .join('li')
    .text(accessor('identity'));
  gens
    .select('.enzymes')
    .selectAll('.enzyme')
    .data(accessor('enzymes'), accessor('identity'))
    .join('li')
    .text(accessor('identity'));

  function onClickFerment(generation) {
    onFerment(generation);
  }
}
