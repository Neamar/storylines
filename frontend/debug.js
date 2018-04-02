'use strict';
/* global storyline, $ */

$(function() {
  function getStates() {
    return JSON.parse(window.localStorage.getItem('states') || '{}');
  }

  function debugState() {
    $('#debug-state').val(JSON.stringify(storyline.state, null, 4));
  }

  function moveToStoryTab() {
    $('#nav-story-tab').tab('show');
  }

  $('#nav-debug-tab[data-toggle="tab"]').on('shown.bs.tab', debugState);

  $('#debug-state').on('change', function() {
    storyline.state = JSON.parse(this.value);
    storyline.updateResourcesUI();
  });

  $('#debug-next-event').click(function(e) {
    e.preventDefault();
    storyline.nextEvent();
    moveToStoryTab();
  });

  let stateTitleInput = $('#debug-state-title');
  $('#debug-state-save').click(function(e) {
    e.preventDefault();
    let stateName = stateTitleInput.val();
    if (!stateName) {
      stateTitleInput.addClass('is-invalid');
      stateTitleInput.focus();
      return;
    }

    let states = getStates();
    states[stateName] = storyline.state;
    window.localStorage.setItem('states', JSON.stringify(states));
  });

  $('#debug-state-load').click(function(e) {
    e.preventDefault();
    let stateName = stateTitleInput.val();
    let states = getStates();
    if (!states[stateName]) {
      stateTitleInput.addClass('is-invalid');
      stateTitleInput.focus();
      return;
    }

    storyline.state = states[stateName];
    storyline.currentEvent = null;
    storyline.nextEvent();
    debugState();
    moveToStoryTab();
  });


  $('#debug-available-states').html(Object.keys(getStates()).map(s => `<option value="${s}" />`).join('\n'));
});
