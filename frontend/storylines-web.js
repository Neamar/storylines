"use strict";

window.displayEvent = function displayEvent(event) {
  let eventHTML = `
<div class="jumbotron">
  <p>${event.description}</p>
  <p class="lead">
`;

  Object.keys(event.actions).forEach(a => {
    eventHTML += `<a class="btn btn-primary btn-lg" href="#" role="button">${a}</a>`;
  });

  eventHTML += `</p>
</div>
`;

  document.getElementById('event').innerHTML = eventHTML;
};

