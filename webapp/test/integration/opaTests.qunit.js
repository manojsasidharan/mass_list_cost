/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"ingles/mass/cost/mass_cost/test/integration/AllJourneys"
	], function () {
		QUnit.start();
	});
});