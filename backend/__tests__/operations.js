'use strict';

const operations = require('../operations.js');


describe('operations', () => {
  describe('parseOperation()', () => {
    it('should parse valid operation', () => {
      expect(operations.parseOperation('global.something = true')).toEqual({
        lhs: {'_type': 'state', 'data': ['global', 'something']},
        operator: '=',
        rhs: true
      });
    });

    it('should require a valid assignment operator', () => {
      expect(() => operations.parseOperation('global.something == true')).toThrow(/Invalid operator: ==/i);
    });

    it('should require lhs to be a state access', () => {
      expect(() => operations.parseOperation('true += true')).toThrow(/Left-hand side in operations must be a state access./i);
    });
  });
});
