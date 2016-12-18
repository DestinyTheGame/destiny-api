import { Characters } from '../models';
import assume from 'assume';

describe('characters', function () {
  const destiny = { /* Fake Destiny class instance */ };

  it('is a function', function () {
    assume(Characters).is.a('function');
  });

  describe('#set', function () {
    it('creates new characters');
    it('updates existing characters');
    it('sorts characters');
  });

  describe('#find', function () {
    it('finds characters based on id');
  });

  describe('#forEach', function () {
    it('passes everything to our internal characters.forEach method');
  });

  describe('#get', function () {
    it('returns a character for the given index');
  });

  describe('#active', function () {
    it('returns the last used character');
  });
});
