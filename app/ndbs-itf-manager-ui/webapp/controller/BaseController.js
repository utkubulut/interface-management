sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    "sap/m/MessageBox",
    'sap/ui/core/Fragment',
    "sap/ui/core/message/Message",
    "sap/ui/core/library"
], function (Controller, History, MessageBox, Fragment, Message, coreLibrary) {
    "use strict";

    return Controller.extend("ndbsitfmanagerui.BaseController", {
        /**
         * Convenience method for accessing the router in every controller of the application.
         * @public
         * @returns {sap.ui.core.routing.Router} the router for this component
         */
        getRouter: function () {
            return this.getOwnerComponent().getRouter();
        },

        /**
         * Convenience method for getting the view model by name in every controller of the application.
         * @public
         * @param {string} sName the model name
         * @returns {sap.ui.model.Model} the model instance
         */
        getModel: function (sName) {
            return this.getView().getModel(sName);
        },
        /**
         * Convenience method for setting the view model in every controller of the application.
         * @public
         * @param {sap.ui.model.Model} oModel the model instance
         * @param {string} sName the model name
         * @returns {sap.ui.mvc.View} the view instance
         */
        setModel: function (oModel, sName) {
            return this.getView().setModel(oModel, sName);
        },

        /**
         * Convenience method for getting the resource bundle.
         * @public
         * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
         */
        getResourceBundle: function () {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },
        getErrorHandler: function () {
            return this.getOwnerComponent().getErrorHandler();
        },

        resetMessageModel: function () {
            sap.ui.getCore().getMessageManager().removeAllMessages();
        },

        //Receiver field is the only multiCB and should not be empty
        onInputValidationMCB: function (oEvent) {
            const oSource = oEvent.getSource()
            if (!oSource.getSelectedItems().length) {
                if (!oEvent.getParameter("newValue")) {
                    oSource.setValueState("Error");
                } else {
                    oSource.setValueState("None");
                }
            }
            else {
                oSource.setValueState("None");
            }
        },
        //Data & Process could be empty, but Sender is a mandatory field
        //The input should be in the value list of cb
        onInputValidationCB: function (oEvent) {
            const oSource = oEvent.getSource(),
                sValue = oSource.getValue(),
                sId = oSource.getId()

            if (oSource.getSelectedKey) {
                let sSelectedKey = oSource.getSelectedKey()
                if ((sId.includes("Sender") && (!sSelectedKey && !sValue)) || (!sSelectedKey && (sValue && sValue.length > 0))) {
                    oSource.setValueState("Error");
                }
                else {
                    oSource.setValueState("None");
                }
            }
        },

        //Input and Description is mandatory and should not be empty but any value is fine
        onInputValidationInput: function (oEvent) {
            const oSource = oEvent.getSource();

            if (oSource.getValue()) {
                oSource.setValueState("None");
            }
            else {
                oSource.setValueState("Error");
            }
        },
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
        },
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
        },
        onMessageButtonPress: function (oEvent) {
            let oMessagesButton = oEvent.getSource();
            if (!this._oMessagePopover) {
                this._oMessagePopover = new sap.m.MessagePopover({
                    items: [
                        new sap.m.MessagePopoverItem({
                            description: "{viewModel>/message/description}",
                            type: "{viewModel>/message/type}",
                            title: "{viewModel>/message/title}"
                        }),
                        new sap.m.MessagePopoverItem({
                            description: "{viewModel>/message/description}",
                            type: "{viewModel>/message/type}",
                            title: "{viewModel>/message/title}"
                        })
                    ]

                });
                oMessagesButton.addDependent(this._oMessagePopover);
            }
            this._oMessagePopover.toggle(oMessagesButton);
        },
        openDialog: function (sDialogId, sFragmentName) {
            return new Promise((fnResolve, fnReject) => {
                let oView = this.getView(),
                    oDialog = this.byId(sDialogId),
                    sContentDensityClass = this.getOwnerComponent().getContentDensityClass();
                if (!oDialog) {
                    Fragment.load({
                        id: oView.getId(),
                        name: sFragmentName,
                        controller: this
                    }).then((oFragment) => {
                        jQuery.sap.syncStyleClass(sContentDensityClass, oView, oFragment);
                        oView.addDependent(oFragment);
                        oFragment.open();
                        fnResolve(oFragment);
                    });
                } else {
                    oDialog.open();
                    fnResolve(oDialog);
                }
            });
        },
        closeDialog: function (oEvent) {
            oEvent.getSource().getParent().close();
        },
        onMessagePopoverPress: function (oEvent) {
            let oSourceControl = !oEvent ? this.getView().byId("bMessagePopover") : oEvent.getSource()

            this.getView().byId("bMessagePopover");
            this._getMessagePopover().then(function (oMessagePopover) {
                oMessagePopover.openBy(oSourceControl);
            });

        },
        openMessagePopover: function () {
            setTimeout(() => {
                this.onMessagePopoverPress()
            }, 100);
        },
        onClearMessagePopover: function () {
            this._clearAllMessages();
        },
        onNavToHomepage: function () {
            this.getRouter().navTo("RouteHomePage");
        },

        /* =========================================================== */
        /*  Internal methods                                           */
        /* =========================================================== */

        _clearAllMessages: function () {
            sap.ui.getCore().getMessageManager().removeAllMessages();
        },
        _getMessagePopover: function () {
            let oView = this.getView();

            // create popover lazily (singleton)
            if (!this._pMessagePopover) {
                this._pMessagePopover = Fragment.load({
                    id: oView.getId(),
                    name: "ndbsitfmanagerui.fragments.MessagePopover"
                }).then(function (oMessagePopover) {
                    oView.addDependent(oMessagePopover);
                    return oMessagePopover;
                });
            }
            return this._pMessagePopover;
        },
        _showMessageBox: function (sText, oMsgBoxContent) {
            MessageBox.show(sText, oMsgBoxContent);
        },

        _isValidFieldValues: function (aSmartFields) {

            let isValid = aSmartFields.every((oSmartField) => {
                return oSmartField.getValueState() !== "Error"
            });

            if (!isValid) {
                const oMessageManager = sap.ui.getCore().getMessageManager();

                let oMessage = new Message({
                    message: this.getResourceBundle().getText("validationInput"),
                    type: coreLibrary.MessageType.Warning,
                })
                oMessageManager.addMessages(oMessage);
                this.openMessagePopover();
            }

            return isValid;
        },

        _validateEmptyMandatoryFields: function (aFields) {
            aFields.forEach(field => {
                //combo box value is selected or just a string that is not existing in the list
                if (field.getSelectedKey && field.getPickerType) {
                    !field.getSelectedKey() ? field.setValueState("Error") : field.setValueState("None");
                }
                // multi combo box has any selected item
                else if (field.getSelectedKeys) {
                    field.getSelectedKeys().length > 0 ? field.setValueState("None") : field.setValueState("Error");
                }
                // input field is empty
                else {
                    !field.getValue() ? field.setValueState("Error") : field.setValueState("None");
                }
            })
        }
    });
});