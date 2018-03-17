"use strict";
const state = require('../state.js');


describe("State", () => {
  function getDefaultResources() {
    return {
      R1: {
        default: 100
      },
    };
  }

  describe("generateDefaultState()", () => {
    it("should generate a default state from valid resources values",() => {
      expect(state.generateDefaultState(getDefaultResources(), [])).toEqual({
        global: {
          current_turn: 0,
        },
        resources: {
          R1: 100
        },
        storylines: {}
      });
    });

    it("should generate a default state from storylines",() => {
      expect(state.generateDefaultState({}, ['sl1', 'sl2'])).toEqual({
        global: {
          current_turn: 0,
        },
        resources: {},
        storylines: {
          sl1: {},
          sl2: {}
        }
      });
    });
  });
});
