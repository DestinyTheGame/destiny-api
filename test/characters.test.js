import { XMLHttpRequest } from 'xmlhttprequest';
import { Characters } from '../models';
import auth from './bungie-auth';
import assume from 'assume';
import Destiny from '../';
import mock from './mock';

describe('characters', function () {
  const destiny = new Destiny(auth, {
    XHR: XMLHttpRequest
  });

  it('is a function', function () {
    assume(Characters).is.a('function');
  });

  describe('#refresh', function () {
    it('updates the internal dataset', function (next) {
      const characters = new Characters(destiny);

      characters.once('update', function () {
        next();
      });

      characters.refresh();
    });
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
