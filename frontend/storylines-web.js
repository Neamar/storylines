"use strict";


// Display an event in the Jumbotron
window.displayEvent = function displayEvent(event, respondToEventCb) {
  let eventHTML = `
<div class="jumbotron">
  <p>${event.description}</p>
  <p class="lead">
`;

  Object.keys(event.actions || []).forEach(a => {
    eventHTML += `<a class="btn btn-primary btn-lg" href="#${a}" role="button">${a}</a> `;
  });

  eventHTML += `</p>
</div>
`;

  document.getElementById('event').innerHTML = eventHTML;

  document.querySelectorAll('#event a.btn').forEach((item) => {
    item.addEventListener("click", function() {
      respondToEventCb(this.innerHTML);
    });
  });
};


// Update the resources values
window.displayResources = function displayResources(resourcesDefinition, resourcesValues) {
  let resourcesHTML = Object.keys(resourcesDefinition).map(r => {
    let resourceDefinition = resourcesDefinition[r];
    return `<span class="resource-holder"><span class="resource-name">${resourceDefinition.display_name}</span>: ${resourceDefinition.format.replace('%s', resourcesValues[r])}</span>`;
  }).join(" ");

  document.getElementById('resources').innerHTML = resourcesHTML;
};
