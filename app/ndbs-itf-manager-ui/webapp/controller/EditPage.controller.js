sap.ui.define([
    "./BaseController",
    "sap/m/MessageBox",
    "sap/ui/core/message/Message",
    "sap/ui/core/library"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (BaseController, MessageBox, Message, coreLibrary) {
        "use strict";

        return BaseController.extend("ndbsitfmanagerui.controller.EditPage", {

            /* =========================================================== */
            /* Lifecycle methods                                           */
            /* =========================================================== */

            onInit: function (oEvent) {
                let oMessageManager = sap.ui.getCore().getMessageManager();
                this._oInterfaceData = {};
                this._sInterfaceID = "";
                this._isChanged = false;
                this.getRouter().getRoute("EditPage").attachMatched(this._onRouteMatched, this);
                this.getView().setModel(oMessageManager.getMessageModel(), "message");
                oMessageManager.registerObject(this.getView(), true);
                this._oView = this.getView();
                // Reset changes to avoid smart table smart field interaction
                this._oView.addEventDelegate({
                    onBeforeHide: function (oEvent) {
                        const oName = this.getView().byId('sfName'),
                            oDescription = this.getView().byId('sfDescription'),
                            oModel = this.getView().getModel();
                        //Smart fields needs leave focus to follow changes,    
                        //while in input box If you try to use browser back button,
                        //current input will not be included the saved changes but will affect the table.
                        oName.focus();
                        oDescription.focus();
                        oModel.resetChanges();
                        this.getView().byId("sfEdit").unbindElement();

                    }
                }, this)
            },


            /* =========================================================== */
            /* Event handlers                                              */
            /* =========================================================== */

            onChangeModel: function (oEvent) {
                oEvent.mParameters["valueChanged"] = false
            },
            handleSelectionChange: function (oEvent) {
                if (oEvent.getParameters().changedItems && oEvent.getParameters().selected) {
                    this._isChanged = true;
                }
                else {
                    this._isChanged = false
                }
            },
            onSaveInterface: async function () {
                let pendingChanges = this._getChangedSmartFields(),
                    oMessageManager = sap.ui.getCore().getMessageManager(),
                    request = {}, isValidation = true,
                    oView = this.getView(),
                    bIsInterfaceReady = this.getView().byId("sfStatus").getValue() === "Ready"


                const aSmartFields = [
                    oView.byId("cbSender"),
                    oView.byId("cbReceiver"),
                    oView.byId("cbObject"),
                    oView.byId("cbProcess"),
                    oView.byId("sfStatus"),
                    oView.byId("sfName"),
                    oView.byId("sfDescription"),
                ],
                    aMandatoryFields = [
                        oView.byId("cbSender"),
                        oView.byId("cbReceiver"),
                        oView.byId("sfStatus"),
                        oView.byId("sfName"),
                        oView.byId("sfDescription"),
                    ];
                this._validateEmptyMandatoryFields(aMandatoryFields);
                isValidation = this._isValidFieldValues(aSmartFields);

                if (isValidation) {
                    request.body = this._fillRequestBody(pendingChanges);

                    if (!this.getView().byId("sfName").getValue()
                        || !this.getView().byId("cbSender").getSelectedKey()
                        || !this.getView().byId("cbReceiver").getSelectedItems().length) {

                        let oMessage = new Message({
                            message: this.getResourceBundle().getText("mandatoryFields"),
                            type: coreLibrary.MessageType.Warning,
                        })
                        oMessageManager.addMessages(oMessage);
                        this.openMessagePopover();
                        return
                    }
                    this._clearAllMessages();
                    if (bIsInterfaceReady && !pendingChanges.includes('status')) {
                        let sText = this.getResourceBundle().getText("approveEditPageEvent"),
                            oMsgContent = {
                                icon: MessageBox.Icon.CONFIRMATION,
                                title: this.getResourceBundle().getText("confirmationTitle"),
                                actions: [MessageBox.Action.OK, MessageBox.Action.NO, MessageBox.Action.CANCEL],
                                emphasizedAction: MessageBox.Action.OK,
                                onClose: (oAction) => this._publishEventConfirmation(oAction, request)
                            };
                        this._showMessageBox(sText, oMsgContent);
                    }
                    else {
                        this._sendEditRequest(request)
                    }
                }
            },

            /* =========================================================== */
            /* Internal methods                                            */
            /* =========================================================== */

            _onRouteMatched: async function (oEvent) {
                const interfaceID = oEvent.getParameter("arguments").interface_id;
                let oView = this.getView()
                this._sInterfaceID = interfaceID;
                this._setAllValueStatesNone();
                this.getView().byId("sfEdit").bindElement({
                    path: `/InterfaceTableData/${interfaceID}`,
                    events: {
                        dataReceived: (oData) => {
                            if (oData.getParameters().data) {
                                this._oInterfaceData = oData.getParameters().data
                                let sIntIds = this._oInterfaceData.integrationIds,
                                    sRecIds = this._oInterfaceData.receiverIDs,
                                    sSenderId = this._oInterfaceData.senderID,
                                    sDataObjectID = this._oInterfaceData.dataObjectID,
                                    sDataProcessID = this._oInterfaceData.dataProcessID     

                                oView.byId("cbSender").setSelectedKey("");
                                oView.byId("cbSender").setSelectedKey(sSenderId);

                                oView.byId("cbObject").setSelectedKey("");
                                oView.byId("cbObject").setSelectedKey(sDataObjectID);

                                oView.byId("cbProcess").setSelectedKey("");
                                oView.byId("cbProcess").setSelectedKey(sDataProcessID);
                                oView.byId("cbSender").setSelectedKey("");
                                oView.byId("cbSender").setSelectedKey(sSenderId);

                                oView.byId("cbIntegration").setSelectedKeys([]);
                                if (sIntIds !== null) {
                                    oView.byId("cbIntegration").setSelectedKeys(sIntIds.split(", "))
                                }

                                oView.byId("cbReceiver").setSelectedKeys([]);
                                if (sRecIds !== null) {
                                    oView.byId("cbReceiver").setSelectedKeys(sRecIds.split(", "))
                                }
                            }
                        }
                    }
                });
            },
            _setAllValueStatesNone: function () {
                this.getView().byId("sfName").setValueState("None")
                this.getView().byId("sfDescription").setValueState("None")
                this.getView().byId("cbSender").setValueState("None")
                this.getView().byId("cbReceiver").setValueState("None")
                this.getView().byId("sfStatus").setValueState("None")
                this.getView().byId("cbProcess").setValueState("None")
                this.getView().byId("cbObject").setValueState("None")

            },
            _sendEditRequest: function (request) {
                let oModel = this.getView().getModel()
                oModel.create("/editInterface", request, {
                    success: function (oData, response) {
                        this.getView().byId("sfEdit").unbindElement();
                        oModel.refresh(true);
                        this.onNavToHomepage();
                        return true;
                    }.bind(this),
                    error: function (oError) {
                        return false;
                    }
                });
            },
            _getInterfaceData: async function () {
                let oModel = this.getView().getModel(),
                    sPath = `/InterfaceTableData/${this._sInterfaceID}`,
                    mParameters = {
                        success: (oData) => {
                            return oData
                        },
                        error: (oData, oResponse) => {
                            return oResponse
                        }
                    };
                oModel.read(sPath, mParameters);
            },
            _compareArrays: function (a, b) {
                return a.length === b.length &&
                    a.every((element, index) => element === b[index]);
            },

            _getChangedSmartFields: function () {
                let pendingChanges = this.getView().byId("sfEdit").getBindingContext().getModel().getPendingChanges()
                let changedFields = [];
                for (const interfacedata in pendingChanges) {
                    for (const change in pendingChanges[interfacedata]) {
                        if (change !== "__metadata") {
                            changedFields.push(change)
                        }
                    }
                }
                return changedFields
            },
            _publishEventConfirmation: function (oAction, request) {
                switch (oAction) {
                    case "OK":
                        request.body.status = "Ready"
                        this._sendEditRequest(request)
                        break;
                    case "NO":
                        this._sendEditRequest(request)
                        break;
                    case "CANCEL":
                        return
                }
            },
            _fillRequestBody: function (pendingChanges) {
                let interfaceData = this._oInterfaceData,
                    oEntry = {
                        interfaceID: this._sInterfaceID
                    };

                const oView = this.getView(),
                    selectedObjectKey = oView.byId("cbObject").getSelectedKey(),
                    selectedProcessKey = oView.byId("cbProcess").getSelectedKey(),
                    selectedSenderKey = oView.byId("cbSender").getSelectedKey(),
                    selectedIntegrationKeys = oView.byId("cbIntegration").getSelectedKeys(),
                    selectedReceiverKeys = oView.byId("cbReceiver").getSelectedKeys()

                if (pendingChanges.includes('name')) {
                    oEntry.name = oView.byId("sfName").getValue()
                }
                if (pendingChanges.includes('description')) {
                    oEntry.description = oView.byId("sfDescription").getValue()
                }
                if (selectedObjectKey !== interfaceData.dataObjectID) {
                    oEntry.dataObjectID = oView.byId("cbObject").getSelectedKey()
                }
                if (selectedProcessKey !== interfaceData.dataProcessID) {
                    oEntry.dataProcessID = oView.byId("cbProcess").getSelectedKey()
                }
                if (pendingChanges.includes('status')) {
                    oEntry.status = oView.byId("sfStatus").getValue()
                }
                if (selectedSenderKey !== interfaceData.senderID) {
                    oEntry.senderID = oView.byId("cbSender").getSelectedKey()
                }
                if (!interfaceData.integrationIds) {
                    oEntry.integrations = selectedIntegrationKeys;
                }
                else if (!this._compareArrays(selectedIntegrationKeys, interfaceData.integrationIds.split(", "))) {
                    oEntry.integrations = selectedIntegrationKeys;
                }
                if (!interfaceData.receiverIDs || !this._compareArrays(selectedReceiverKeys, interfaceData.receiverIDs.split(", "))) {
                    oEntry.receivers = oView.byId("cbReceiver").getSelectedItems().map(item => {
                        return {
                            ID: item.getProperty("key"),
                            interfaceID: oEntry.interfaceID,
                            name: item.getProperty("text")
                        }
                    })
                }
                Object.keys(oEntry).forEach(key => oEntry[key] === undefined ? delete oEntry[key] : {});

                return oEntry;
            }
        })
    });