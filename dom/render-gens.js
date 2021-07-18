import { select } from 'd3-selection';
import { zoom } from 'd3-zoom';
import { drag } from 'd3-drag';
import accessor from 'accessor';

export function renderGens({ generations, onFerment }) {
  var allGensSel = select('.generations')
    .selectAll('.generation')
    .data(generations, accessor());
  allGensSel.exit().remove();
  var newGens = allGensSel.enter().append('li').classed('generation', true);
  var boards = newGens.append('svg').attr('viewBox', '0 0 100 50');
  var zoomRoot = boards.append('g');
  var zoomer = zoom().on('zoom', onZoom);
  boards.call(zoomer);

  zoomRoot.append('g').classed('substrates', true);
  zoomRoot.append('g').classed('enzymes', true);
  newGens
    .append('button')
    .text('Ferment next generation')
    .on('click', onClickFerment);

  var gens = allGensSel.merge(newGens);

  var subSel = gens
    .select('.substrates')
    .selectAll('.substrate')
    .data(accessor('substrates'));
  subSel.exit().remove();
  var newSubSel = subSel
    .enter()
    .append('g')
    .classed('substrate', true)
    .call(drag().on('drag', onDrag));
  //newSubSel.append('circle').attr('r', 5);
  newSubSel.append('text').attr('dy', 0.5);
  newSubSel
    .merge(subSel)
    .attr('transform', getTransform)
    .select('text')
    .text(getWord);

  var enzSel = gens
    .select('.enzymes')
    .selectAll('.enzyme')
    .data(accessor('enzymes'));
  enzSel.exit().remove();
  var newEnzSel = enzSel
    .enter()
    .append('g')
    .classed('enzyme', true)
    .call(drag().on('drag', onDrag));
  newEnzSel.append('circle').attr('r', 10);
  newEnzSel.append('text').attr('dy', 1);
  newEnzSel
    .merge(enzSel)
    .attr('transform', getTransform)
    .select('text')
    .text(accessor('desc'));

  function onClickFerment(e, generation) {
    onFerment(generation);
  }

  function onZoom(event) {
    zoomRoot.attr('transform', event.transform);
  }
}

function onDrag(event, d) {
  d.pos = [event.x, event.y];
  select(this).attr('transform', getTransform(d));
}

function getTransform(d) {
  return `translate(${d.pos[0]}, ${d.pos[1]})`;
}

function getWord(result) {
  return result.word.replace(/_/g, ' ');
}
