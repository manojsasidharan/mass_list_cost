sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageItem",
	"sap/m/MessagePopover",
	"sap/ui/core/message/Message",
	"sap/ui/core/Core",
	"sap/m/Button",
	"sap/ui/core/IconPool",
	"sap/m/MessageView",
	"sap/m/Dialog",
	"sap/m/Bar",
	"sap/m/Text",
	"sap/m/UploadCollectionParameter",
	"sap/m/MessageToast"

], function (JSONModel, Controller, MessageItem, MessagePopover, Message, Core, Button, IconPool, MessageView, Dialog, Bar, Text,
	UploadCollectionParameter, MessageToast) {
	"use strict";

	return Controller.extend("Ingles.Mock.MassListCost.controller.Detail", {
		onInit: function () {

			var oExitButton = this.getView().byId("exitFullScreenBtn"),
				oEnterButton = this.getView().byId("enterFullScreenBtn");

			this.oRouter = this.getOwnerComponent().getRouter();
			this.oModel = this.getOwnerComponent().getModel();

			this.oRouter.getRoute("master").attachPatternMatched(this._onProductMatched, this);
			this.oRouter.getRoute("detail").attachPatternMatched(this._onProductMatched, this);
			this._messageManager = Core.getMessageManager();
			this._messageManager.registerObject(this.getView(), true);
			this.oView.setModel(this._messageManager.getMessageModel(), "message");

			//this.oRouter.getRoute("detailDetail").attachPatternMatched(this._onProductMatched, this);

			[oExitButton, oEnterButton].forEach(function (oButton) {
				oButton.addEventDelegate({
					onAfterRendering: function () {
						if (this.bFocusFullScreenButton) {
							this.bFocusFullScreenButton = false;
							oButton.focus();
						}
					}.bind(this)
				});
			}, this);
		},

		_onProductMatched: function (oEvent) {
			var appModel = this.getView().getModel("appControl");
			var queryModel = this.getOwnerComponent().getModel("query");

			if (queryModel.getProperty("/PriceFamily") != undefined) {
				var selection = queryModel.getProperty("/PriceFamily").getKey();
			}
			var mode = this.getOwnerComponent().getModel("query").getProperty("/Mode");

			var file = "FamilyData.json"; //this.getOwnerComponent().getModel("query").getProperty("/filename");
			if (mode === "02") {
				appModel.setProperty("/FilterInput/Edit", false);
				var conditionTable = this.getView().byId("Table");
				var sPath = jQuery.sap.getModulePath("Ingles.Mock.MassListCost", "/test/data/" + file);
				var fileModel = new JSONModel(sPath);
				fileModel.attachRequestCompleted(function () {
					var vendorid = appModel.getProperty("/vendorid");
					var aRecords = fileModel.getData().Data;
					var sRecords = aRecords.filter(function (obj) {
						return obj.Vendor === vendorid;
					});
					this.getView().setModel(new JSONModel({
						Data: sRecords
					}));
					conditionTable.bindRows("/Data");
					this.getView().byId("Ttitle").setText("Cost Maintenance (" + sRecords.length + ")");
					this.onfirstdisplay();
				}.bind(this));

			} else {
				appModel.setProperty("/FilterInput/Edit", true);
				conditionTable = this.getView().byId("Table");
				sPath = jQuery.sap.getModulePath("Ingles.Mock.MassListCost", "/test/data/createdata.json");
				var attModel = new JSONModel(sPath);
				this.getView().setModel(attModel);
				conditionTable.bindRows("/Data");
				attModel.refresh();
				this.getView().byId("Ttitle").setText("Cost Maintenance (" + 0 + ")");
				this.getView().byId("Table").setVisibleRowCount(9);
				this.geteditrows(0, 9);
			}

			this.setHideableColumns();

		},
		onfirstdisplay: function (oEvent) {
			this.onEditAction();
			var that = this;
			setTimeout(function () {
				that.firstcalculate();
			}, 1000);
		},
		onEditAction: function (oEvent) {
			this.getView().byId("RB1").setEnabled(true);
			this.getView().byId("RB2").setEnabled(true);
			this.getView().byId("Bactive").setVisible(true);
			this.getView().byId("Bsave").setVisible(true);
			this.getView().byId("UploadCollection").setUploadButtonInvisible(false);
			this.getView().byId("UploadCollection").setUploadEnabled(true);
		},

		firstcalculate: function () {
			var oModel = this.getView().getModel();
			for (var i = 0; i < oModel.getData().Data.length; i++) {
				this.calculateRow(oModel, true, "", "/Data/" + i);
			}
		},

		calculateRow: function (oModel, DefaultNewCaseCost, NewCaseCost, rowPath) {
			var tableData = oModel.getProperty(rowPath);
			var lRetailPrice = 0;
			var lNewCaseCost = 0;
			var lCasePack = 0;
			var lAllowance = 0;
			var lGM = 0,
				lGMallow = 0;

			if (NewCaseCost !== "") {
				tableData.NewCaseCost = NewCaseCost;
				tableData.NewUnitCost = NewCaseCost / tableData.CasePack;
			} else if (DefaultNewCaseCost) {
				tableData.NewUnitCost = tableData.UnitCost;
				tableData.NewCaseCost = tableData.UnitCost * tableData.CasePack;
				tableData.NewCaseCost = tableData.NewCaseCost.toFixed(2);
				tableData.CaseCost = tableData.UnitCost * tableData.CasePack;
				tableData.CaseCost = tableData.CaseCost.toFixed(2);
				lGM = ((parseFloat(tableData.RetailPrice, 2) - parseFloat(tableData.UnitCost)) / parseFloat(tableData.RetailPrice, 2)) * 100;
				tableData.Margin = isNaN(lGM) ? 0 : lGM.toFixed(2);
			}

			lRetailPrice = tableData.RetailPrice;
			lNewCaseCost = tableData.NewCaseCost;
			lCasePack = tableData.CasePack;
			lAllowance = tableData.Allowance;

			lGM = ((parseFloat(lRetailPrice, 2) - (parseFloat(lNewCaseCost, 2) / parseFloat(lCasePack, 2))) / parseFloat(lRetailPrice, 2)) *
				100;
			tableData.newgm = isNaN(lGM) ? 0 : lGM.toFixed(2);

			lGMallow = ((parseFloat(lRetailPrice, 2) - (parseFloat(lNewCaseCost, 2) / parseFloat(lCasePack, 2)) + parseFloat(lAllowance, 2)) /
				parseFloat(lRetailPrice, 2)) * 100;
			tableData.newgmallow = isNaN(lGMallow) ? 0 : lGMallow.toFixed(2);

			oModel.setProperty(rowPath, tableData);

		},

		onApplyMassUpdate: function (oEvent) {
			var oModel = this.getView().getModel();
			var oTable = this.getView().byId("Table");
			var selectedIndices = oTable.getSelectedIndices();
			var value = this.getView().byId("case").getValue();
			if (value === "") {
				MessageToast.show("Enter valid Case Cost");
				return;
			}
			if (selectedIndices.length === 0) {
				MessageToast.show("Select rows to mass apply case cost ");
				return;
			}

			selectedIndices.forEach(function (index) {
				this.calculateRow(oModel, false, value, "/Data/" + index);
			}.bind(this));

			selectedIndices.forEach(function (index) {
				oTable.removeSelectionInterval(index, 1);
			});
		},

		calculate: function (row, oTable) {

			var oModel = this.getView().getModel(),
				sPath = "/Data/" + row;
			var cost = oModel.getProperty(sPath + "/New_Cost");
			var allow = oModel.getProperty(sPath + "/Allowance");
			var retailprice = oModel.getProperty(sPath + "/RetailPrice");

			var GM = ((parseFloat(retailprice, 2) - parseFloat(cost, 2)) / parseFloat(retailprice, 2)) * 100;
			var finalGM = isNaN(GM) ? 0 : GM.toFixed(2);

			var GMwithAllow = ((parseFloat(retailprice, 2) - parseFloat(cost, 2) + parseFloat(allow, 2)) / parseFloat(retailprice, 2)) * 100;
			var finalGMwithAllow = isNaN(GMwithAllow) ? 0 : GMwithAllow.toFixed(2);

			if (oTable.getRows()[0].getCells()[0].getItems()[1].getValue() !== "") {
				// oTable.getRows()[row].getCells()[8].setText(finalGM);
				// oTable.getRows()[row].getCells()[9].setText(finalGMwithAllow);
				oModel.setProperty(sPath + "/gm", finalGM);
				oModel.setProperty(sPath + "/gmallow", finalGMwithAllow);
			}

		},

		// calculate: function (NewCost) { //from Cost Assoc
		// 	var oTable = this.getView().byId("Table");
		// 	var model = oTable.getModel();
		// 	var rowPath = "";
		// 	var tableData = model.getProperty("/Data");
		// 	var RetailPrice = 0,
		// 		CaseCost = 0,
		// 		CasePack = 1,
		// 		Allowance = 0,
		// 		GM = 0,
		// 		GMallow = 0;
		// 	for (var i = 0; i < tableData.length; i++) {

		// 		if (NewCost !== "")
		// 			tableData[i].New_Cost = NewCost;

		// 		RetailPrice = tableData[i].RetailPrice;
		// 		CaseCost = tableData[i].New_Cost;
		// 		CasePack = tableData[i].Case_Pack;
		// 		Allowance = tableData[i].Allowance;

		// 		GM = ((parseFloat(RetailPrice, 2) - (parseFloat(CaseCost, 2) / parseFloat(CasePack, 2))) / parseFloat(RetailPrice, 2)) * 100;
		// 		tableData[i].gm = isNaN(GM) ? 0 : GM.toFixed(2);

		// 		GMallow = ((parseFloat(RetailPrice, 2) - (parseFloat(CaseCost, 2) / parseFloat(CasePack, 2)) + parseFloat(Allowance, 2)) /
		// 			parseFloat(RetailPrice, 2)) * 100;
		// 		tableData[i].gmallow = isNaN(GMallow) ? 0 : GMallow.toFixed(2);

		// 		rowPath = "/Data/" + i;
		// 		model.setProperty(rowPath, tableData[i]);
		// 	}
		// 	model.refresh();

		// },

		handleItemPress: function (oEvent) {
			var oNextUIState = this.getOwnerComponent().getHelper().getNextUIState(2),
				supplierPath = oEvent.getSource().getBindingContext("products").getPath(),
				supplier = supplierPath.split("/").slice(-1).pop();

			this.oRouter.navTo("detailDetail", {
				layout: oNextUIState.layout,
				product: "1",
				supplier: supplier
			}, true);
		},
		handleFullScreen: function () {
			this.bFocusFullScreenButton = true;
			var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/midColumn/fullScreen");

			this.oRouter.navTo("detail", {
				layout: "MidColumnFullScreen",
				product: "1"
			}, true);
		},
		handleExitFullScreen: function () {
			this.bFocusFullScreenButton = true;
			var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/midColumn/exitFullScreen");
			this.oRouter.navTo("detail", {
				layout: "OneColumn",
				product: "1"
			}, true);
		},
		handleClose: function () {
			var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/midColumn/closeColumn");
			this.oRouter.navTo("master", {
				layout: sNextLayout
			}, true);
		},
		clearAllFilters: function (oEvent) {
			var conditionTable = this.getView().byId("Table");
			var aColumns = conditionTable.getColumns();

			for (var i = 0; i < aColumns.length; i++) {
				conditionTable.filter(aColumns[i], null);
			}
			var filters = [];
			conditionTable.getBinding("rows").filter(filters, sap.ui.model.FilterType.Application);

		},
		onSync: function (oEvent) {

			var oModel = this.getView().getModel();
			for (var i = 0; i < oModel.getData().Data.length; i++) {
				this.calculateRow(oModel, true, "", "/Data/" + i);
			}

			// if (this.getOwnerComponent().getModel("query").getProperty("/PriceFamily") != undefined) {
			// 	var selection = this.getOwnerComponent().getModel("query").getProperty("/PriceFamily").getKey();
			// }

			// var mode = this.getOwnerComponent().getModel("query").getProperty("/Mode");
			// var file = this.getOwnerComponent().getModel("query").getProperty("/filename");
			// if (mode === "02") {
			// 	var conditionTable = this.getView().byId("Table");
			// 	var sPath = jQuery.sap.getModulePath("Ingles.Mock.MassListCost", "/test/data/" + file);
			// 	var attModel = new JSONModel(sPath);
			// 	attModel.setDefaultBindingMode("OneWay");
			// 	this.getView().setModel(attModel);
			// 	conditionTable.bindRows("/Data");
			// 	this.getView().byId("Ttitle").setText("Cost Maintenance ( 9 )");
			// 	this.getView().getModel().refresh();
			// 	conditionTable.rerender();
			// 	conditionTable.setVisibleRowCount(9);
			// } else {

			// 	conditionTable = this.getView().byId("Table");
			// 	sPath = jQuery.sap.getModulePath("Ingles.Mock.MassListCost", "/test/data/createdata.json");
			// 	attModel = new JSONModel(sPath);
			// 	attModel.setDefaultBindingMode("OneWay");
			// 	this.getView().setModel(attModel);
			// 	conditionTable.bindRows("/Data");
			// 	attModel.refresh();
			// 	this.getView().byId("Table").rerender();
			// 	this.getView().byId("Ttitle").setText("Cost Maintenance (" + 0 + ")");
			// 	this.getView().byId("Table").setVisibleRowCount(9);
			// 	this.geteditrows(0, 9);
			// }
			// var that = this;
			// setTimeout(function () {
			// 	that.firstcalculate();
			// }, 1000);

		},

		onPress: function () {

			var oTable = this.getView().byId("Table");
			var itemModel = this.getView().getModel();
			oTable.getColumns()[0].getAggregation("template").setEditable(false);
			oTable.getColumns()[1].getAggregation("template").setEditable(false);
			// oTable.getColumns()[2].getAggregation("template").setEditable(false);
			// oTable.getColumns()[4].getAggregation("template").setEditable(false);
			// oTable.getColumns()[5].getAggregation("template").setEditable(false);
			oTable.getColumns()[4].getAggregation("template").getItems()[0].setEditable(false);
			this.getView().byId("UploadCollection").setUploadButtonInvisible(true);
			this.getView().byId("UploadCollection").setUploadEnabled(false);
			itemModel.refresh();
			oTable.rerender();

		},

		colorCode: function (isParent, Family, Material) {
			if (Family !== "") {
				if (isParent) return "#0d6733"; //Dark Green
				else return "#16ab54"; //Light Green
			} else if (Material !== "" && Material !== undefined)
				return "#72b5f8"; //Blue
			else return "";
		},

		editability: function (editMode, IsNewRow) {
			if (!editMode)
				return false;
			else if (IsNewRow)
				return true;
			else return false;
		},

		onEdit: function (oEvent) {

			if (this.getOwnerComponent().getModel("query").getProperty("/PriceFamily") != undefined) {
				var selection = this.getOwnerComponent().getModel("query").getProperty("/PriceFamily").getKey();
			}

			// var oTable = this.getView().byId("Table");
			// var oRows = oTable.getRows();
			// for (var i = 0; i < oRows.length; i++) {
			// 	// var oCell = oRows[i].getCells()[4];
			// 	// oCell.setProperty("editable", true);
			// 	// oCell = oRows[i].getCells()[5];
			// 	// var oCell.setProperty("editable", true);
			// 	if (selection !== "0000") {
			// 		var oCell = oRows[i].getCells()[0].getItems()[1];
			// 		oCell.setProperty("editable", false);
			// 		oCell = oRows[i].getCells()[1];
			// 		oCell.setProperty("editable", false);
			// 	} else {
			// 		oCell = oRows[i].getCells()[0].getItems()[1];
			// 		oCell.setProperty("editable", true);
			// 		oCell = oRows[i].getCells()[1];
			// 		oCell.setProperty("editable", true);
			// 	}
			// 	// oCell = oRows[i].getCells()[4];
			// 	// oCell.setProperty("editable", false);
			// 	oCell = oRows[i].getCells()[7];
			// 	oCell.getItems()[0].setProperty("editable", true);
			// }

			this.getView().getModel("appControl").setProperty("/FilterInput/Edit", true);

			this.onEditAction();
		},
		seteditrowsdisble: function () {
			// var oTable = this.getView().byId("Table");
			// var oRows = oTable.getRows();
			// for (var i = 0; i < oRows.length; i++) {
			// 	// var oCell = oRows[i].getCells()[4];
			// 	// oCell.setProperty("editable", true);
			// 	// oCell = oRows[i].getCells()[5];
			// 	// oCell.setProperty("editable", true);
			// 	var oCell = oRows[i].getCells()[0].getItems()[1];
			// 	oCell.setProperty("editable", false);
			// 	oCell = oRows[i].getCells()[1];
			// 	oCell.setProperty("editable", false);
			// 	// oCell = oRows[i].getCells()[4];
			// 	// oCell.setProperty("editable", false);
			// 	oCell = oRows[i].getCells()[7];
			// 	oCell.getItems()[0].setProperty("editable", true);
			// }
		},
		seteditcreate: function () {
			// var oTable = this.getView().byId("Table");
			// var oRows = oTable.getRows();
			// for (var i = 0; i < oRows.length; i++) {
			// 	// var oCell = oRows[i].getCells()[4];
			// 	// oCell.setProperty("editable", true);
			// 	// oCell = oRows[i].getCells()[5];
			// 	// oCell.setProperty("editable", true);
			// 	var oCell = oRows[i].getCells()[0].getItems()[1];
			// 	oCell.setProperty("editable", true);
			// 	oCell = oRows[i].getCells()[1];
			// 	oCell.setProperty("editable", true);
			// 	// oCell = oRows[i].getCells()[4];
			// 	// oCell.setProperty("editable", true);
			// 	oCell = oRows[i].getCells()[7];
			// 	oCell.getItems()[0].setProperty("editable", true);
			// }
			this.onEditAction();
		},
		geteditrows: function (start, end) {
			// var oTable = this.getView().byId("Table");
			// var oRows = oTable.getRows();
			// for (var i = start; i < end; i++) {
			// 	// var oCell = oRows[i].getCells()[4];
			// 	// oCell.setProperty("editable", true);
			// 	// oCell = oRows[i].getCells()[5];
			// 	// oCell.setProperty("editable", true);
			// 	var oCell = oRows[i].getCells()[0].getItems()[1];
			// 	oCell.setProperty("editable", true);
			// 	oCell = oRows[i].getCells()[1];
			// 	oCell.setProperty("editable", true);
			// 	// oCell = oRows[i].getCells()[4];
			// 	// oCell.setProperty("editable", true);
			// 	oCell = oRows[i].getCells()[7];
			// 	oCell.getItems()[0].setProperty("editable", true);
			// }
			this.onEditAction();
		},
		onResetCaseCost: function (oEvent) {
			var table = this.getView().byId("Table");
			var oModel = this.getView().getModel();
			var oRow = oEvent.getSource().getParent().getParent().getBindingContext().getPath().slice(6);
			var rowPath = oEvent.getSource().getParent().getParent().getBindingContext().getPath();
			this.calculateRow(oModel, true, "", rowPath);
			table.removeSelectionInterval(oRow, oRow);
		},

		onEditCaseCost: function (oEvent) {
			var oTable = this.getView().byId("Table");
			var row = oEvent.getSource().getParent().getParent().getBindingContext().getPath().slice(6);
			var oModel = this.getView().getModel();
			var sPath = oEvent.getSource().getBindingContext().getPath();
			var casecost = oEvent.getSource().getValue();
			this.calculateRow(oModel, false, casecost, sPath);
			oTable.addSelectionInterval(row, row);
		},

		onDeletePress: function (oEvent) {
			var itemModel = this.getView().byId("Table").getModel();
			var oTable = this.getView().byId("Table");
			var indices = oTable.getSelectedIndices();
			if (indices.length === 0) {
				MessageToast.show("Select atleast one row");
				return;
			}
			indices.sort(function (a, b) {
				return b - a;
			});
			for (var i = 0; i < indices.length; i++) {
				itemModel.getData().Data.splice(indices[i], 1);
			}
			itemModel.refresh();

			this.getView().byId("Ttitle").setText("Retail Pricing (" + itemModel.getData().Data.length + ")");
		},

		onAddDialogSubmit: function (oEvent) {
			this.addRowsDialog.close();
			this.addRowsDialog.destroy();
			var value = this.addRowsDialog.getModel().getData().data.row,
				i;
			var initialcheck = 0,
				initialdata;
			var itemModel = this.getView().getModel();

			if (itemModel.getData().Data === undefined) {
				var exist = itemModel.getData();
				exist.Data = [];
				itemModel.setData(exist);
				initialcheck = 1;
				initialdata = 0;
			} else {
				initialdata = itemModel.getData().Data.length;
			}

			for (i = 0; i < value; i++) {
				itemModel.getData().Data.push({
					"IsNew": true,
					"Family": "",
					"IsParent": false,
					"LocationCode": "",
					"Material": "",
					"Vendor": "",
					"Description": "",
					"valid_from": "",
					"valid_to": "12/31/9999",
					"effcost": "",
					"RetailPrice": "",
					"New_Cost": "",
					"gm": "",
					"gmallow": "",
					"Margin": "",
					"Unit_sell": "",
					"Multiplier": ""
				});
			}
			if (initialcheck === 1) {
				this.getView().byId("Table").bindRows("/Data");
			}
			this.getView().byId("Ttitle").setText("Cost Maintenance (" + itemModel.getData().Data.length + ")");
			this.getView().byId("Table").setVisibleRowCount(itemModel.getData().Data.length);
			itemModel.refresh();
			this.getView().byId("Table").rerender();
			this.geteditrows(initialdata, initialdata + parseInt(value, 0));

		},
		onAddRows: function (oEvent) {
			this.addRowsDialog = sap.ui.xmlfragment("Ingles.Mock.MassListCost.fragments.AddRows", this);

			//this.getOwnerComponent().getModel("addrow").setData("");
			this.addRowsDialog.setModel(this.getOwnerComponent().getModel("addrow"));
			this.getView().addDependent(this.addRowsDialog);
			this.addRowsDialog.open();
		},
		onAddDialogCancel: function () {
			this.addRowsDialog.close();
			this.addRowsDialog.destroy();
		},
		onUploadSelectedButton: function (oEvent) {
			//var item = oEvent.getSource().getParent().getParent().getItems();
			//	if (item.length > 0) {
			// oEvent.getSource().getParent().getParent().getItems()[0].getAggregation("content")[1].getProperty("item").getAggregation(
			// 	"dependents")[1].getAggregation("items")[0].setPercentValue(100);

			// oEvent.getSource().getParent().getParent().getItems()[0].getAggregation("content")[1].getProperty("item").getAggregation(
			// 	"dependents")[1].getAggregation("items")[1].getAggregation("items")[0].setText("Complete");

			// oEvent.getSource().getParent().getParent().getItems()[0].getAggregation("content")[1].getProperty("item").getAggregation(
			// 	"dependents")[1].getAggregation("items")[1].getAggregation("items")[1].setText("100%");

			this.getView().byId("ObjectPageLayout").setSelectedSection(this.getView().byId("massmaint").getId());

			//	}

		},
		handleMessagePopoverPress: function (oEvent) {
			if (!this.oMP) {
				this.createMessagePopover(this.oView);
			}
			this.oMP.toggle(oEvent.getSource());
		},
		onsave: function (oEvent) {
			sap.ui.getCore().getMessageManager().removeAllMessages();
			this.addMessageToTarget("", "", "SAP Price document number 45789 created successfully!!", "Success",
				"",
				"S", "");

			//this.addMessageToTarget("", "", "Please enter valid Price", "Error", "Please check the Price at Row 2", "E", "");

			this.createdialog();
		},

		createdialog: function () {
			var that = this;
			var oBackButton = new Button({
				icon: IconPool.getIconURI("nav-back"),
				visible: false,
				press: function () {
					that.oMessageView.navigateBack();
					this.setVisible(false);
				}
			});

			this.oMessageView = new MessageView({
				showDetailsPageHeader: false,
				itemSelect: function () {
					oBackButton.setVisible(true);
				},
				items: {
					path: "message>/",
					template: new MessageItem({
						title: "{message>message}",
						subtitle: "{message>additionalText}",
						activeTitle: true,
						description: "{message>description}",
						type: "{message>type}"
					})
				},
				groupItems: true
			});

			this.getView().addDependent(this.oMessageView);
			this.oDialog = new Dialog({
				content: this.oMessageView,
				contentHeight: "50%",
				contentWidth: "50%",
				endButton: new Button({
					text: "Close",
					press: function () {
						this.getParent().close();
					}
				}),
				customHeader: new Bar({
					contentMiddle: [
						new Text({
							text: "Message Manager"
						})
					],
					contentLeft: [oBackButton]
				}),

				verticalScrolling: false
			});
			this.oMessageView.navigateBack();
			this.oDialog.open();
		},
		createMessagePopover: function () {
			this.oMP = new MessagePopover({
				items: {
					path: "message>/",
					template: new MessageItem({
						title: "{message>message}",
						subtitle: "{message>additionalText}",
						activeTitle: true,
						description: "{message>description}",
						type: "{message>type}"
					})
				}
			});
			this.oMP._oMessageView.setGroupItems(true);
			this.oMP._oPopover.setContentWidth("600px");
			this.oView.addDependent(this.oMP);
		},
		addMessageToTarget: function (sTarget, controlId, errorMessage, errorTitle, errorDescription, msgType, groupName) {
			var oMessage = new Message({
				message: errorMessage,
				type: this.getMessageType(msgType),
				additionalText: errorTitle,
				description: errorDescription,
				target: sTarget,
				processor: this._mainModel,
				code: groupName
			});

			if (controlId !== "") {
				oMessage.addControlId(controlId);
			}

			this._messageManager.addMessages(oMessage);
		},
		getMessageType: function (msgType) {
			var rtnType;
			switch (msgType) {
			case "E":
				rtnType = sap.ui.core.MessageType.Error;
				break;
			case "S":
				rtnType = sap.ui.core.MessageType.Success;
				break;
			case "I":
				rtnType = sap.ui.core.MessageType.Information;
				break;
			case "W":
				rtnType = sap.ui.core.MessageType.Warning;
				break;
			default:
				rtnType = sap.ui.core.MessageType.None;
				break;
			}
			return rtnType;
		},
		onBeforeUploadStarts: function (oEvent) {
			// Header Slug
			var oCustomerHeaderSlug = new UploadCollectionParameter({
				name: "slug",
				value: oEvent.getParameter("fileName")
			});
			oEvent.getParameters().addHeaderParameter(oCustomerHeaderSlug);

		},
		onUploadComplete: function (oEvent) {
			var process = this.byId("RB").getSelectedButton().getText();
			if (process === "Online") {
				this.onSync();
				var oUploadCollection = this.byId("UploadCollection");
				var oData = oUploadCollection.getModel().getData();
				if (oData.items === undefined) {
					oData = {
						"items": []
					};
				}

				oData.items.unshift({
					"documentId": Date.now().toString(), // generate Id,
					"fileName": oEvent.getParameter("files")[0].fileName,
					"mimeType": "",
					"thumbnailUrl": "",
					"url": "",
					"attributes": [{
						"title": "Uploaded By",
						"text": "You",
						"active": false
					}, {
						"title": "Uploaded On",
						"text": new Date().toLocaleDateString(),
						"active": false
					}, {
						"title": "File Size",
						"text": "505000",
						"active": false
					}],
					"statuses": [{
						"title": "",
						"text": "",
						"state": "None"
					}],
					"markers": [{}],
					"selected": false
				});
				this.getView().byId("Table").setVisibleRowCount(9);
				this.getView().byId("Table").rerender();
				this.getView().getModel().refresh();
				oUploadCollection.rerender();

				// Sets the text to the label
				this.byId("attachmentTitle").setText(this.getAttachmentTitleText());
				this.seteditrowsdisble();
				// delay the success message for to notice onChange message
				this.onUploadSelectedButton();

			} else {
				this.onsave();
			}
		},
		getAttachmentTitleText: function () {
			var aItems = this.byId("UploadCollection").getItems();
			return "Uploaded (" + aItems.length + ")";
		},
		onChange: function (oEvent) {
			var oUploadCollection = oEvent.getSource();
			// Header Token
			var oCustomerHeaderToken = new UploadCollectionParameter({
				name: "x-csrf-token",
				value: "securityTokenFromModel"
			});
			oUploadCollection.addHeaderParameter(oCustomerHeaderToken);
		},
		onFileDeleted: function (oEvent) {
			this.deleteItemById(oEvent.getParameter("documentId"));
		},

		deleteItemById: function (sItemToDeleteId) {
			var oData = this.byId("UploadCollection").getModel().getData();
			var aItems = oData.items;
			jQuery.each(aItems, function (index) {
				if (aItems[index] && aItems[index].documentId === sItemToDeleteId) {
					aItems.splice(index, 1);
				}
			});
			this.byId("UploadCollection").getModel().setData({
				"items": aItems
			});
			this.byId("attachmentTitle").setText(this.getAttachmentTitleText());
		},
		onMaterialInput: function (oEvent) {
			var matnr = oEvent.getSource().getValue();
			var rowPath = oEvent.getSource().getBindingContext().getPath();
			var filePath = jQuery.sap.getModulePath("Ingles.Mock.MassListCost", "/test/data/NewData.json");
			var attModel = new JSONModel(filePath);
			attModel.attachRequestCompleted(function () {
				var dataArray = attModel.getData().Data;
				var selected = dataArray.filter(function (obj) {
					return obj.Material.toString() === matnr;
				});
				if (selected.length > 0) {
					if (selected[0].Family !== "") {
						var family = dataArray.filter(function (obj) {
							return obj.Family === selected[0].Family;
						});
						this.openFamilyPopup("INPUT", selected[0], family, rowPath);
					} else {
						selected[0] = this.setMargins(selected[0]);
						this.getView().getModel().setProperty(rowPath, selected[0]);
					}
				}
			}.bind(this));
		},

		setMargins: function (object) {
			var cost = object.New_Cost,
				allow = object.Allowance,
				retailprice = object.RetailPrice;
			var GM = ((parseFloat(retailprice, 2) - parseFloat(cost, 2)) / parseFloat(retailprice, 2)) * 100;
			object.gm = isNaN(GM) ? 0 : GM.toFixed(2);
			var GMwithAllow = ((parseFloat(retailprice, 2) - parseFloat(cost, 2) + parseFloat(allow, 2)) / parseFloat(retailprice, 2)) * 100;
			object.gmallow = isNaN(GMwithAllow) ? 0 : GMwithAllow.toFixed(2);
			return object;
		},

		openFamilyPopup: function (action, selected, family, rowPath) {
			this.FamilyDialog = sap.ui.xmlfragment("Ingles.Mock.MassListCost.fragments.Family", this);
			var title = "";
			var message = "";
			var showContinue = true;
			if (action === "INPUT") {
				if (selected.IsParent) {
					title = "Parent item of Cost Family entered";
					message = "Click Continue to insert parent item";
					showContinue = true;
				} else {
					title = "Child item of Cost Family entered";
					message = "Click Replace to replace with parent item";
					showContinue = false;
				}
			} else if (action === "DISPLAY") {
				title = "Cost Family Details";
				message = "You have selected a " + (selected.IsParent ? "Parent" : "Child") + " item";
				showContinue = true;
			}

			var popupinfo = new JSONModel({
				title: title,
				message: message,
				selected: selected,
				familyID: selected.Family,
				familyinfo: family,
				rowPath: rowPath,
				action: action,
				showContinue: showContinue
			});
			this.getView().setModel(popupinfo, "family");
			this.getView().addDependent(this.FamilyDialog);
			this.FamilyDialog.open();
		},
		closeFamilyPopup: function () {
			var popupinfo = this.getView().getModel("family").getData();
			if (popupinfo.action === "INPUT") {
				if (popupinfo.selected.IsParent) {
					popupinfo.selected = this.setMargins(popupinfo.selected);
					this.getView().getModel().setProperty(popupinfo.rowPath, popupinfo.selected);
				} else {
					var selected = popupinfo.familyinfo.filter(function (obj) {
						return obj.IsParent;
					});
					if (selected.length > 0) {
						selected[0] = this.setMargins(selected[0]);
						this.getView().getModel().setProperty(popupinfo.rowPath, selected[0]);
					}
				}
			}
			this.cancelFamilyPopup();
		},
		cancelFamilyPopup: function () {
			this.FamilyDialog.close();
			this.FamilyDialog.destroy();
		},

		showFamilyInfo: function (oEvent) {

			var itemModel = this.getView().byId("Table").getModel();
			var sPath = oEvent.getSource().getParent().getBindingContext().sPath;
			var selected = itemModel.getProperty(sPath);
			// var oTable = this.getView().byId("Table");
			// var indices = oTable.getSelectedIndices();
			// if (indices.length === 0) {
			// 	MessageToast.show("Select a row");
			// 	return;
			// }
			// else if (indices.length > 1)
			// {
			// 	MessageToast.show("Select only one row");
			// 	return;
			// }
			// var selected = itemModel.getData().Data[indices[0]];
			if (selected.Family !== "") {
				var filePath = jQuery.sap.getModulePath("Ingles.Mock.MassListCost", "/test/data/AllFamily.json");
				var attModel = new JSONModel(filePath);
				attModel.attachRequestCompleted(function () {
					var dataArray = attModel.getData().Data;
					var familyinfo = dataArray.filter(function (obj) {
						return obj.Family.toString() === selected.Family.toString();
					});
					if (familyinfo.length > 1)
						this.openFamilyPopup("DISPLAY", selected, familyinfo, -1);
					else MessageToast.show("Selected item is not part of a Cost Family");
				}.bind(this));
			}
		},

		setHideableColumns: function () {
			var add = true;
			var mode = this.getView().getModel("query").getProperty("/Mode");
			var appControlData = this.getOwnerComponent().getModel("appControl").getData();
			appControlData.ModeHideableColumns = [];
			appControlData.hiddenColumns = [];
			for (var i = 0; i < appControlData.AllHideableColumns.length; i++) {
				add = true;
				if (mode === "01" && appControlData.ColumnsHiddenInCreate.indexOf(appControlData.AllHideableColumns[i].key) >= 0)
					add = false;
				if (add) appControlData.ModeHideableColumns.push(appControlData.AllHideableColumns[i]);
			}
			this.getOwnerComponent().getModel("appControl").setData(appControlData);
		},

		showColumn: function (mode, columnKey) {
			if (mode === "01") {
				var ColumnsHiddenInCreate = this.getOwnerComponent().getModel("appControl").getProperty("/ColumnsHiddenInCreate");
				if (ColumnsHiddenInCreate.indexOf(columnKey) > -1)
					return false;
			}

			// var aHiddenColumns = this.getOwnerComponent().getModel("appControl").getProperty("/hiddenColumns");

			// var sHiddenColumn = aHiddenColumns.filter(function (obj) {
			// 	return obj.getKey() === columnKey;
			// });
			// if (sHiddenColumn.length > 0) {
			// 	return false;
			// } else return true;

		},

		onHideColumnsChange: function (oEvent) {
			var mode = this.getView().getModel("query").getProperty("/Mode");
			var appControlData = this.getOwnerComponent().getModel("appControl").getData();
			var aColumnsSelected = appControlData.hiddenColumns;

			var aTableColumns = this.getView().byId("Table").getColumns();
			var toHide = false;
			for (var i = 0; i < aTableColumns.length; i++) {
				toHide = false;
				if (mode === "01" && appControlData.ColumnsHiddenInCreate.indexOf(aTableColumns[i].getName()) >= 0)
					toHide = true;
				else {
					for (var j = 0; j < aColumnsSelected.length; j++) {
						if (aTableColumns[i].getName() === aColumnsSelected[j]) {
							toHide = true;
							break;
						}
					}
				}
				if (toHide)
					aTableColumns[i].setVisible(false);
				else
					aTableColumns[i].setVisible(true);
			}
		}

	});
});