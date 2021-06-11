sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device"
], function (JSONModel, Device) {
	"use strict";

	return {

		createDeviceModel: function () {
			var oModel = new JSONModel(Device);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},
		oViewModel: function () {
			var vModel = new JSONModel({
				"data": [{
					"row": "1"
				}]
			});
			vModel.setDefaultBindingMode("TwoWay");
			return vModel;
		},
		onewModel: function () {
			var queryData = {
				"PriceStrategy": "",
				"PriceType": "",
				"FromDate": ""
			};
			queryData.FromDate = this.getToday();
			var vModel = new JSONModel(queryData);
			vModel.setDefaultBindingMode("TwoWay");
			return vModel;
		},
		appControlModel: function () {
			var appData = {
				Currency: "USD",
				EditMode: false,
				ModeHideableColumns: [],
				AllHideableColumns: [{
					key: "Vendor",
					text: "Vendor"
				}, {
					key: "VItemNo",
					text: "Vend.Item #"
				}, {
					key: "VendDesc",
					text: "Vendor Name"
				}, {
					key: "Desc",
					text: "Description"
				}, {
					key: "Allowance",
					text: "Allowance"
				}, {
					key: "CasePack",
					text: "Case Pack"
				}, {
					key: "LastCaseCost",
					text: "Last Case Cost"
				}, {
					key: "LastCost",
					text: "Last Unit Cost"
				}, {
					key: "LastGM",
					text: "Last GM %."
				}, {
					key: "NewUnitCost",
					text: "New Unit Cost"
				}, {
					key: "NewGM",
					text: "New GM"
				}, {
					key: "NewGMAllow",
					text: "New GM with All."
				}],
				ColumnsHiddenInCreate: ["NewUnitCost", "LastCaseCost", "LastCost", "LastGM"],
				hiddenColumns: [],
				FilterInput: {
					Vendor: "",
					Mode: 0,
					Edit: false
				}
			};
			var appControl = new JSONModel(appData);
			appControl.setDefaultBindingMode("TwoWay");
			return appControl;
		},

		masterDataModel: function () {
			var sPath = jQuery.sap.getModulePath("ingles.mass.cost.mass_cost", "/test/data/masterData.json");
			var masterDataModel = new JSONModel(sPath);
			return masterDataModel;
		},
		getToday: function () {
			var d = new Date(),
				month = "" + (d.getMonth() + 1),
				day = "" + d.getDate(),
				year = d.getFullYear();

			if (month.length < 2) {
				month = "0" + month;
			}
			if (day.length < 2) {
				day = "0" + day;
			}

			return [month, day, year].join("/");
		}

	};
});