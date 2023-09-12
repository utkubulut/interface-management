sap.ui.define([
    "./BaseController",
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/core/Fragment',
    "sap/m/MessageBox",
    'sap/ui/table/Column',
    "sap/m/Token",
    "sap/ui/core/library",
    "sap/ui/core/message/Message",
    "sap/ui/export/library",
    "../utils/ExcelUpload"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (BaseController, Filter, FilterOperator, Fragment, MessageBox, UIColumn, Token, coreLibrary, Message, exportLibrary, excelUploadHandler) {
        "use strict";
        let EdmType = exportLibrary.EdmType,
            isDelete = false;
        return BaseController.extend("ndbsitfmanagerui.controller.HomePage", {


            /* =========================================================== */
            /*  Lifecycle methods                                          */
            /* =========================================================== */

            onInit: function () {
                this._clearAllMessages();
                this.getRouter().getRoute("RouteHomePage").attachMatched(this._onRouteMatched, this);
                let oMessageManager = sap.ui.getCore().getMessageManager();
                this.getView().setModel(oMessageManager.getMessageModel(), "message");
                oMessageManager.registerObject(this.getView(), true);
                /*
                sap.ui.getCore().attachLocalizationChanged(function (oEvent) {
                    var oChanges = oEvent.getParameter("changes");
                    if (oChanges && oChanges.language) {
                        window.location.search = "?sap-language=" + oChanges.language;
                    }
                }.bind(this));
                */
                this._oView = this.getView();

                this.openUploadDialog = function () {
                    excelUploadHandler.onUploadDialog(this);
                };

            },

            /* =========================================================== */
            /*  Event handlers                                             */
            /* =========================================================== */

            onNavToEdit: function (oEvent) {
                let interfaceID = oEvent.getSource().getBindingContext().getObject().interfaceID
                this._clearAllMessages();
                this.getRouter().navTo('EditPage', {
                    interface_id: interfaceID
                });
            },
            onClearMessagePopover: function () {
                this._clearAllMessages();
            },

            onBeforeRebindTable: async function (oEvent) {
                this._applyCustomFilters(oEvent);
                this.getView().getModel().refresh();
            },
            onAddCloud: function (oEvent) {
                let oTable = this.getView().byId("tInterfaces"),
                    aSelectedItems = oTable.getSelectedItems(),
                    oMessageManager = sap.ui.getCore().getMessageManager(),
                    oView = this.getView(),
                    bTokenFlag = false,
                    nullControl = (element) => !element.integrationIds,
                    oToken,
                    aTrimmedToken = [],
                    aSelectedRows = aSelectedItems.map((oItem) => {
                        return oItem.getBindingContext().getObject();
                    });
                this._clearAllMessages();
                if (aSelectedRows.length) {
                    //Check if multiple selections has any integration
                    if (!(aSelectedRows.length > 1 && !aSelectedRows.every(nullControl))) {
                        if (!this._pDialog) {
                            //load fragment
                            this._pDialog = Fragment.load({
                                id: oView.getId(),
                                name: "ndbsitfmanagerui.fragments.CloudIntegrationSelection",
                                controller: this
                            }).then(oDialog => {
                                //inherit view methods to fragment
                                oView.addDependent(oDialog);
                                return oDialog;
                            })
                        }
                        this._pDialog.then((oDialog) => {
                            // Initialise the dialog with model only the first time. Then only open it
                            this._oVHD = oDialog;
                            aSelectedRows.forEach((oItem) => {
                                if (oItem.integrationIds != null) {
                                    oToken = oItem.integrationIds.split(",");
                                    bTokenFlag = true;
                                }
                                else {
                                    oDialog.setTokens([]);
                                }
                            });
                            this._bindAddIntegrationTable(oDialog);

                            if (bTokenFlag) {
                                aTrimmedToken = oToken.map(token => { let trimmed = token.trim(); if (trimmed !== '') return trimmed })

                                this._aIntegrationIDs = aTrimmedToken;
                                if (aTrimmedToken.length > 0) {
                                    oDialog.setTokens([]);
                                    aTrimmedToken.forEach((oItem) => {
                                        oDialog.setTokens([new Token({ key: oItem, text: oItem })]);
                                    });
                                    oDialog.update();
                                    oDialog.open();
                                    return;
                                }
                            }
                            this.getView().addDependent(oDialog);
                            oDialog.open();
                        });
                    }
                    else {

                        let oMessage = new Message({
                            message: this.getResourceBundle().getText("editInterface"),
                            type: coreLibrary.MessageType.Warning,
                        })
                        oMessageManager.addMessages(oMessage);
                    }
                }
                else {
                    let oMessage = new Message({
                        message: this.getResourceBundle().getText("selectLine"),
                        type: coreLibrary.MessageType.Warning,
                    })
                    oMessageManager.addMessages(oMessage);
                }
                this.openMessagePopover();
            },

            onStatusReady: async function (oEvent) {
                let oTable = this.getView().byId("tInterfaces"),
                    oMessageManager = sap.ui.getCore().getMessageManager(),
                    aSelectedItems = oTable.getSelectedItems(),
                    aIDs = [],
                    bIsReady = false,
                    aSelectedRows = [];
                aSelectedItems.forEach((oItem) => {
                    let oContext = oItem.getBindingContext(),
                        oRowData = oContext.getObject();
                    aSelectedRows.push(oRowData);
                });
                this._clearAllMessages();

                if (aSelectedRows.length) {
                    aIDs = aSelectedRows.map(oRows => {
                        return oRows.interfaceID;
                    });

                    bIsReady = aSelectedRows.some(row => {
                        return row.status == "Ready"
                    })

                    if (bIsReady) {
                        let sText = this.getResourceBundle().getText("approveSetReady"),
                            oMsgBoxContent = {
                                icon: MessageBox.Icon.CONFIRMATION,
                                title: this.getResourceBundle().getText("confirmationTitle"),
                                actions: [MessageBox.Action.OK, MessageBox.Action.NO, MessageBox.Action.CANCEL],
                                emphasizedAction: MessageBox.Action.OK,
                                onClose: (oAction) => this._setReadyConfirmation(oAction, aIDs)
                            };
                        this._showMessageBox(sText, oMsgBoxContent);
                    }
                    else {
                        this._setInterfacesReady(aIDs, true);
                        this.getView().byId("stInterfaces").rebindTable();
                    }
                }
                else {
                    let oMessage = new Message({
                        message: this.getResourceBundle().getText("selectLine"),
                        type: coreLibrary.MessageType.Warning,
                    })
                    oMessageManager.addMessages(oMessage);
                    this.openMessagePopover();
                }
            },
            onSaveInterface: async function () {
                let oRequest = {}, isCompleted = false, isValidation = true,
                    oMessageManager = sap.ui.getCore().getMessageManager(),
                    aSmartFields = [
                        this.getView().byId("cbSender"),
                        this.getView().byId("mcbReceiver"),
                        this.getView().byId("cbObject"),
                        this.getView().byId("cbProcess"),
                        this.getView().byId("iName"),
                        this.getView().byId("iDescription")
                    ],
                    aMandatoryFields = [
                        this.getView().byId("cbSender"),
                        this.getView().byId("mcbReceiver"),
                        this.getView().byId("iName"),
                        this.getView().byId("iDescription")
                    ]
                this._clearAllMessages();
                isValidation = this._isValidFieldValues(aSmartFields);
                this._validateEmptyMandatoryFields(aMandatoryFields);
                if (isValidation) {
                    oRequest.body = this._getCreateInterfaceValues();
                    if (!oRequest.body.name
                        || !oRequest.body.senderID
                        || !oRequest.body.receivers[0]) {

                        let oMessage = new Message({
                            message: this.getResourceBundle().getText("mandatoryFields"),
                            type: coreLibrary.MessageType.Warning,
                        })
                        oMessageManager.addMessages(oMessage);
                        this.openMessagePopover();
                        return
                    }
                    const oModel = this.getView().getModel();
                    isCompleted = oModel.create("/integrateInterface", oRequest, {
                        success: (oData, response) => {
                            this.openMessagePopover();
                            oModel.refresh();
                        },
                        error: (oError) => {
                            this.openMessagePopover();
                        }
                    });
                    if (isCompleted) {
                        this.getView().byId("stInterfaces").rebindTable();
                        this._clearIntegrationForm();
                    };
                }
            },
            onUpdateFinished: function (oEvent) {
                const oSmartFilterBar = this.getView().byId("sfbInterfaces"),
                    oSmartTable = this.getView().byId("stInterfaces")

                if (!oSmartTable.getTable().getItems().length && this.isDelete) {
                    oSmartFilterBar._resetFilterFields();
                    oSmartTable.rebindTable();
                    this.isDelete = false;
                }
            },
            handleSearch: function (oEvent) {
                let sValue = oEvent.getParameter("value"),
                    oFilter = new Filter("Name", FilterOperator.Contains, sValue),
                    oBinding = oEvent.getSource().getBinding("items");
                oBinding.filter([oFilter]);
            },
            handleSearch: function (oEvent) {
                let sValue = oEvent.getParameter("value"),
                    oFilter = new Filter("Name", FilterOperator.Contains, sValue),
                    oBinding = oEvent.getSource().getBinding("items");
                oBinding.filter([oFilter]);
            },
            onDelete: function (oEvent) {
                const oModel = this.getView().getModel();
                let oTable = this.getView().byId("tInterfaces"),
                    aSelectedItems = oTable.getSelectedItems(),
                    oMessageManager = sap.ui.getCore().getMessageManager(),
                    aSelectedRows = [];
                this._clearAllMessages();

                aSelectedRows = aSelectedItems.map((oItem) => {
                    return oItem.getBindingContext().getObject().interfaceID;
                });

                if (aSelectedRows.length == 0) {
                    let oMessage = new Message({
                        message: this.getResourceBundle().getText("selectLine"),
                        type: coreLibrary.MessageType.Warning,
                    })
                    oMessageManager.addMessages(oMessage);
                    this.openMessagePopover();
                }
                else {
                    let sText = this.getResourceBundle().getText("approveDeletion"),
                        oMsgBoxContent = {
                            icon: MessageBox.Icon.CONFIRMATION,
                            title: this.getResourceBundle().getText("confirmationTitle"),
                            actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                            emphasizedAction: MessageBox.Action.OK,
                            onClose: (oAction) => this._deleteInterfaceConfirmation(oAction, aSelectedRows)
                        };
                    this._showMessageBox(sText, oMsgBoxContent);
                }
            },

            handleClose: function (oEvent) {
                this._clearAllMessages();
                //var aTokens = oEvent.getParameter("tokens");
                if (oEvent.getId() == "cancel") {
                    this._oVHD.close();
                }
                else {
                    let tokenKeys = [];
                    let aIDs = [],
                        oTable = this.getView().byId("tInterfaces"),
                        aSelectedItems = oTable.getSelectedItems(),
                        aSelectedRows = [],
                        aIntegrationIDs = [],
                        oModel = this.getView().getModel(),
                        oIntegrationData,
                        tokens = oEvent.getParameter("tokens");

                    tokens.forEach((token) => {
                        const key = token.getKey();
                        tokenKeys.push(key);
                    });

                    aSelectedItems.forEach((oItem) => {
                        let oContext = oItem.getBindingContext(),
                            oRowData = oContext.getObject();
                        aSelectedRows.push(oRowData);
                    });
                    aSelectedRows.forEach(element => {
                        aIDs.push(element.interfaceID)
                    });
                    this._aInterfaceIDs = aIDs;

                    if (this._aIntegrationIDs) {
                        this._aIntegrationIDs.forEach((oContext) => {
                            let sID = oContext;
                            if (!(tokenKeys.includes(sID))) {
                                oModel.remove(`/InterfaceIntegrations(interfaceID_interfaceID='${this._aInterfaceIDs}',integrationID_integrationID='${sID}')`, {
                                    success: (oData, response) => {
                                        this.getView().byId("stInterfaces").rebindTable();
                                    },
                                    error: (oError) => {
                                        return;
                                    }
                                });
                            }
                        });
                    }
                    tokenKeys.forEach((oContext) => {
                        let sID = oContext;
                        if (!this._aIntegrationIDs || !this._aIntegrationIDs.includes(sID)) {
                            aIntegrationIDs.push(sID);
                        }
                    });
                    oIntegrationData = {
                        interfaceID_interfaceID: aIDs,
                        integrationID_integrationID: aIntegrationIDs
                    };
                    //Control for deleting all integrations
                    if (oIntegrationData.integrationID_integrationID.length > 0) {
                        oModel.create("/addCloudIntegration", oIntegrationData, {
                            success: (oData) => {
                                this.openMessagePopover();
                                this.getView().byId("stInterfaces").rebindTable();
                            },
                            error: (oError) => {
                                this.openMessagePopover();
                                return;
                            }
                        });
                    }
                    this._oVHD.close();
                    this._aIntegrationIDs = [];
                }
            },
            onUploadDialog: function () {
                let that = this;
                excelUploadHandler.onUploadDialog(that);

            },
            /* =========================================================== */
            /*  Internal methods                                           */
            /* =========================================================== */
            _onRouteMatched: function (oEvent) {
                let oView = this.getView();
                let oMessageManager = sap.ui.getCore().getMessageManager();
                oView.byId("tInterfaces").getModel().refresh();
                if (oMessageManager.getMessageModel().getData().length) {
                    this.openMessagePopover();
                }
            },
            _clearIntegrationForm: function () {
                this.getView().byId("iName").setValue("");
                this.getView().byId("cbSender").setSelectedKey("");
                this.getView().byId("mcbReceiver").setSelectedKeys("");
                this.getView().byId("iDescription").setValue("");
                this.getView().byId("cbObject").setSelectedKey("");
                this.getView().byId("cbProcess").setSelectedKey("");
            },
            _validateEmptyMandotaryFields: function () {
                let aFields = [
                    this.getView().byId("iName"),
                    this.getView().byId("cbSender"),
                    this.getView().byId("mcbReceiver"),
                    this.getView().byId("iDescription")]
                aFields.forEach(field => {
                    if (!field.getSelectedKeys) {

                        if (!field.getValue()) {
                            field.setValueState("Error")
                        }
                        else {
                            field.setValueState("None")
                        }
                    }
                    else {
                        if (!field.getSelectedItems().length) {
                            field.setValueState("Error")
                        }
                        else {
                            field.setValueState("None")
                        }
                    }
                })
            },
            _setInterfacesReady: function (aInterfaces, isPublishEvent) {
                const oModel = this.getView().getModel()
                let urlParameter = { "isEvent": isPublishEvent },
                    oMessageManager = sap.ui.getCore().getMessageManager(),
                    oIntegrationData = {
                        status: "Ready"
                    };

                aInterfaces.forEach(status => oModel.update(`/Interfaces('${status}')`, oIntegrationData, {
                    urlParameters: urlParameter,
                    success: (oData, response) => {
                        let oMessage = new Message({
                            message: this.getResourceBundle().getText("statusUpdate"),
                            type: coreLibrary.MessageType.Success,
                            description: oData.name
                        })
                        oMessageManager.addMessages(oMessage);
                        this.openMessagePopover();
                        return oData;
                    },
                    error: (oError) => {
                        this.openMessagePopover();
                        return oError;
                    }
                })
                );
                oModel.aUrlParams = []
            },
            _setReadyConfirmation: function (oAction, aIDs) {
                switch (oAction) {
                    case "OK":
                        this._setInterfacesReady(aIDs, true);
                        this.getView().byId("stInterfaces").rebindTable();
                        break;
                    case "NO":
                        this._setInterfacesReady(aIDs, false);
                        this.getView().byId("stInterfaces").rebindTable();
                        break;
                    default:
                        return
                }
            },
            _deleteInterfaceConfirmation: function (oAction, aSelectedRows) {
                switch (oAction) {
                    case "OK":
                        this._deleteInterfaces(aSelectedRows)
                        break;
                    case "CANCEL":
                        return
                }
            },

            _getCreateInterfaceValues: function () {
                let oEntry = {}

                oEntry.name = this.getView().byId("iName").getValue();
                oEntry.description = this.getView().byId("iDescription").getValue();
                oEntry.senderID = this.getView().byId("cbSender").getSelectedKey()
                oEntry.receivers = []
                this.getView().byId("mcbReceiver").getSelectedItems().forEach(receiver => {
                    oEntry.receivers.push({ ID: receiver.getKey(), name: receiver.getText() })
                })
                oEntry.dataObjectID = this.getView().byId("cbObject").getSelectedKey();
                oEntry.dataProcessID = this.getView().byId("cbProcess").getSelectedKey();

                oEntry.status = "Draft";

                return oEntry
            },
            _bindAddIntegrationTable: function (oDialog) {
                oDialog.getTableAsync().then((oTable) => {
                    oTable.setModel(this.getView().getModel());
                    // For Desktop and tabled the default table is sap.ui.table.Table
                    if (oTable.bindRows) {
                        // Bind rows to the ODataModel and add columns
                        oTable.bindAggregation("rows", {
                            path: "/DataCloudIntegrations",
                            events: {
                                dataReceived: () => {
                                    oDialog.update();
                                }
                            }
                        });
                        if (oTable.getColumns().length == 0) {
                            oTable.addColumn(new UIColumn({ label: "Integration ID", template: "integrationID" }));
                            oTable.addColumn(new UIColumn({ label: "Name", template: "integrationName" }));
                        }
                        oDialog.update();
                    }
                });
            },

            _deleteInterfaces: function (aSelectedRows) {
                let oModel = this.getView().getModel(),
                    oTable = this.getView().byId("tInterfaces"),
                    oSmartFilterBar = this.getView().byId("sfbInterfaces")
                oModel.create("/deleteInterfaces", { interfaceIDs: aSelectedRows }, {
                    success: (oData, response) => {
                        oTable.getSelectedItems([]);
                        this.isDelete = true
                        this.openMessagePopover();
                        this.getView().byId("stInterfaces").rebindTable();
                    },
                    error: (oError) => {
                        this.openMessagePopover();
                    }
                });
            },
            _generateCustomFilter: function (controllerId, entityPath) {
                let oSmartFilterBar = this.byId("sfbInterfaces"),
                    aFilters = oSmartFilterBar.getControlByKey(controllerId).getSelectedItems().map((sSelectedKey) => {
                        return new sap.ui.model.Filter({
                            path: entityPath,
                            operator: "Contains",
                            value1: sSelectedKey.getProperty("text")
                        });
                    });

                return aFilters;
            },
            _applyCustomFilters: function (oEvent) {
                let oSmartFilterBar = this.byId("sfbInterfaces"),
                    oBindingParams = oEvent.getParameter("bindingParams"),
                    aCustomIntegrationFilters = this._generateCustomFilter("customReceiver", "receiverNames"),
                    aCustomReceiverFilters = this._generateCustomFilter("customIntegration", "integrationNames"),
                    aCustomFlowFilters = this._generateCustomFilter("customFlow", "flows"),
                    aFilters = oSmartFilterBar.getFilters().concat(aCustomIntegrationFilters, aCustomReceiverFilters, aCustomFlowFilters)
                oBindingParams.filters = aFilters
            },
            /*
            onOpenLanguageSelection: function (oEvent) {
         
                let oButton = oEvent.getSource(),
                    oView = this.getView();
         
                if (!this._pLDialog) {
                    this._pLDialog = Fragment.load({
                        id: oView.getId(),
                        name: "ndbsitfmanagerui.fragments.LanguageSelection",
                        controller: this
                    }).then(function (oDialog) {
                        oDialog.setModel(oView.getModel());
                        return oDialog;
                    });
                }
         
                this._pLDialog.then(function (oDialog) {
                    oDialog.open();
                }.bind(this));
            }
            ,
            onOpenLanguageConfirm: function (oEvent) {
                var selectedItem = oEvent.getParameter("selectedItem");
         
                if (selectedItem) {
                    var selectedLanguage = selectedItem.getDescription();
                    sap.ui.getCore().getConfiguration().setLanguage(selectedLanguage);
                    // Trigger localization change event
                    sap.ui.getCore().fireLocalizationChanged({
                        changes: {
                            language: selectedLanguage
                        }
                    });
                }
            },
            onLanguageSearch: function (oEvent) {
                let sValue = oEvent.getParameter("value"),
                    oFilter = new Filter("text", FilterOperator.Contains, sValue),
                    oBinding = oEvent.getParameter("itemsBinding");
                oBinding.filter([oFilter]);
            }
         
            */
            // onRandomInterface: function () {

            //     this.getView().byId("iName").setValue("test" + Math.floor(Math.random() * 10000));

            //     this.getView().byId("iDescription").setValue("desc" + Math.floor(Math.random() * 100000));

            //     let aSender = this.getView().byId("cbSender").getItems()
            //     let sender = aSender[Math.floor(Math.random() * aSender.length)]
            //     let aReceiver = this.getView().byId("mcbReceiver").getItems()
            //     let rec = aReceiver[Math.floor(Math.random() * aReceiver.length)]

            //     let aObject = this.getView().byId("cbObject").getItems()
            //     let obj = aObject[Math.floor(Math.random() * aObject.length)]
            //     let aProcess = this.getView().byId("cbProcess").getItems()
            //     let pro = aProcess[Math.floor(Math.random() * aProcess.length)]

            //     this.getView().byId("cbSender").setSelectedItem(sender);
            //     this.getView().byId("mcbReceiver").setSelectedItems([rec]);
            //     this.getView().byId("cbObject").setSelectedItem(obj);
            //     this.getView().byId("cbProcess").setSelectedItem(pro);

            //     this.onSaveInterface();
            // }
        });
    });