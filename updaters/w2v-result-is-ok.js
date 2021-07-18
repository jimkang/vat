import IsCool from 'iscool';

var uppercaseRegex = /[A-Z]/g;

var badPhraseStarts = ['http', 'TO_', 'WHEN_', 'WITH_', 'IN_PART', 'WILL_'];

var badPhraseEnds = ['_OF', '_TO', '_THE'];
var iscool = IsCool();

export function w2vResultIsOk(s) {
  return (
    s.length > 0 &&
    !s.match(uppercaseRegex) &&
    !badPhraseStarts.some(startsWith) &&
    !badPhraseEnds.some(endsWith) &&
    iscool(s)
  );

  function startsWith(badStart) {
    return s.startsWith(badStart);
  }

  function endsWith(badEnd) {
    return s.endsWith(badEnd);
  }
}
