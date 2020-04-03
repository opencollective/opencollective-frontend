'use strict';

/* eslint-disable */

var internals = {};

internals.w = window.innerWidth;
internals.h = window.innerHeight;
internals.budgetGraph = document.querySelector('.budget-graph');
internals.balanceGoalProgress = document.querySelector('.budget-graph-progress');
internals.balanceGoalTooltip = document.querySelector('.budget-graph-tooltip');

internals.startBudgetAnimation = function () {

  window.removeEventListener('resize', internals.onResize);
  window.removeEventListener('scroll', internals.onScroll);

  internals.balanceGoalProgress.addEventListener('transitionend', function () {

    internals.balanceGoalTooltip.classList.add('animate');
  });

  internals.balanceGoalProgress.classList.add('animate');
};

internals.onResize = function () {

  internals.w = window.innerWidth;
  internals.h = window.innerHeight;
};

internals.onScroll = function () {

  var el = document.elementFromPoint(internals.w / 2, internals.h / 2);

  if (el === internals.budgetGraph) {
    internals.startBudgetAnimation();
  }
};

window.addEventListener('resize', internals.onResize);
window.addEventListener('scroll', internals.onScroll);
