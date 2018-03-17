'use strict';

const conditions = require('../conditions.js');


describe('conditions', () => {
  describe('parseCondition()', () => {
    it('should parse valid atomic condition', () => {
      expect(conditions.parseCondition('global.something == true')).toEqual({
        _type: 'atomic_condition',
        lhs: {'_type': 'state', 'data': ['global', 'something']},
        operator: '==',
        rhs: true
      });
    });

    it('should parse valid propositional condition', () => {
      expect(conditions.parseCondition({OR: ['global.something == true', 'resources.something_else == false']})).toEqual({
        _type: 'propositional_condition',
        boolean_operator: 'OR',
        conditions: [
          {
            _type: 'atomic_condition',
            lhs: {'_type': 'state', 'data': ['global', 'something']},
            operator: '==',
            rhs: true
          },
          {
            _type: 'atomic_condition',
            lhs: {'_type': 'state', 'data': ['resources', 'something_else']},
            operator: '==',
            rhs: false
          }
        ]
      });
    });

    it('should require a valid comparison operator', () => {
      expect(() => conditions.parseCondition('global.something += true')).toThrow(/Invalid operator: \+=/i);
    });
  });
});
