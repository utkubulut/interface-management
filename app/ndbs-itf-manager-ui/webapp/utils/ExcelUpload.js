sap.ui.define([
    "sap/ui/core/Fragment",
    "./ExcelTemplateGenerator",
    "sap/ui/core/message/Message"
], function (Fragment, ExcelTemplateGenerator, Message) {
    "use strict";
    let globalThat;
    const excelUploadHandler = {

        onUploadDialog: async function (that) {
            globalThat = that;
            let oView = that.getView();
            if (!this._xlsxDialog) {
                this._xlsxDialog = Fragment.load({
                    id: oView.getId(),
                    name: "ndbsitfmanagerui.fragments.UploadExcel",
                    controller: this
                }).then(function (oDialog) {
                    oDialog.setModel(oView.getModel());
                    return oDialog;
                });
            }
            this.sUploadTab = that.getView().byId("idITB").getSelectedKey();
            this._xlsxDialog.then(function (oDialog) {
                oDialog.open();
            }.bind(this));

        },
        onDownloadExcelTemplate: function () {

            // Set the uploadTab as needed
            ExcelTemplateGenerator.uploadTab = this.sUploadTab; // Use the current tab
            // Call the onDownloadExcelTemplate method to generate and trigger the download
            ExcelTemplateGenerator.generateExcelTemplate();

        },
        onCloseExcelDialog: function (oEvent) {
            const oDialog = oEvent.getSource().getParent();
            // Close the dialog
            oDialog.close();
        },
        onExcelUpload: async function (oEvent) {
            const oDialog = oEvent.getSource().getParent();
            const oUploadSet = globalThat.getView().byId("usExcelAttachments");
            const aIncompleteItems = oUploadSet.getIncompleteItems();
            const tabMappings = {
                "interfaces": { viewId: "stInterfaces", integrationFn: this._integrateInterface },
                "applications": { viewId: "stApplications", integrationFn: this._integrateMasterData },
                "dataObjects": { viewId: "stObject", integrationFn: this._integrateMasterData },
                "processes": { viewId: "idSTProcesses", integrationFn: this._integrateMasterData }
            };

            if (this.sUploadTab in tabMappings) {
                try {
                    const { viewId, integrationFn } = tabMappings[this.sUploadTab];
                    const aPromises = aIncompleteItems.map(async (attachment) => {
                        const oExcelData = await this._readExcelData(attachment);
                        let oIntegrationData;
                        // Check if the uploadTab is "interfaces" and call _readIntegrationData if true
                        if (this.sUploadTab === "interfaces") {
                            oIntegrationData = await this._readIntegrationData(attachment);
                        }
                        const result = await integrationFn.call(this, oExcelData);
                        // Check if the uploadTab is "interfaces" and call _integrateIntegration if true
                        if (this.sUploadTab === "interfaces") {
                            await this._integrateIntegration(oIntegrationData, result);
                        }

                        return { result, oIntegrationData };
                    });
                    oDialog.close();
                    const view = globalThat.getView().byId(viewId);
                    view.rebindTable(true);
                } catch (error) {
                    let oMessage = new Message({
                        message: this.getResourceBundle().getText("editInterface"),
                        type: library.MessageType.Error,
                    })
                    oMessageManager.addMessages(oMessage + error);
                    // Handle error if needed
                }
            }

            oDialog.close();
        },
        onCheckFileCount: function (oEvent) {
            if (oEvent.getSource().getIncompleteItems().length == 1) {
                let oMessageManager = sap.ui.getCore().getMessageManager();
                let oMessage = new Message({
                    message: "Only one file can be uploaded!",
                    type: library.MessageType.Warning,
                })
                oMessageManager.addMessages(oMessage);
                setTimeout(() => {
                    this.onMessagePopoverPress()
                }, 100);
                oEvent.preventDefault();
            }
        },
        onFileTypeMismatch: function () {
            let oMessageManager = sap.ui.getCore().getMessageManager();
            let oMessage = new Message({
                message: "Only .xlsx files are allowed.",
                type: library.MessageType.Warning,
            })
            oMessageManager.addMessages(oMessage);
            setTimeout(() => {
                this.onMessagePopoverPress()
            }, 100);
        },
        _integrateInterface: async function (oExcelData) {
            const oModel = globalThat.getView().getModel();
            const oMessageManager = sap.ui.getCore().getMessageManager();
            let dataMatcher = false;

            oModel.setUseBatch(true);

            if (!oExcelData.body || !Array.isArray(oExcelData.body)) {
                return;
            }

            try {
                const results = await Promise.all(oExcelData.body.map(async (element) => {
                    const receiverIDs = element.receivers.map(receiver => receiver.ID);

                    // Fetch data for dataObject, dataProcess, and sender in parallel
                    const [dataObject, dataProcess, sender] = await Promise.all([
                        this.readModelData(oModel, `/MasterdataObjects('${element.dataObjectID}')`),
                        this.readModelData(oModel, `/MasterdataProcesses('${element.dataProcessID}')`),
                        this.readModelData(oModel, `/MasterdataApplications('${element.senderID}')`)
                    ]);

                    // Check if all the dataObject, dataProcess, and sender IDs match
                    if (
                        dataObject.dataObjectID === element.dataObjectID &&
                        dataProcess.dataProcessID === element.dataProcessID &&
                        sender.dataApplicationID === element.senderID
                    ) {
                        dataMatcher = true;
                    } else {
                        oMessageManager.addMessages(new Message({
                            message: globalThat.getResourceBundle().getText("masterData.invalid"),
                            type: sap.ui.core.MessageType.Warning,
                        }));
                    }

                    const receiverReadPromises = receiverIDs.map(async (receiverID) => {
                        try {
                            const receiverData = await this.readModelData(oModel, `/MasterdataApplications('${receiverID}')`);

                            if (receiverData.dataApplicationID === receiverID) {
                                return { ID: receiverData.dataApplicationID, name: receiverData.dataApplicationName };
                            } else {
                                oMessageManager.addMessages(new Message({
                                    message: globalThat.getResourceBundle().getText("receiverID.invalid"),
                                    type: sap.ui.core.MessageType.Warning,
                                }));
                                return { ID: receiverID, name: "Unknown Receiver" };
                            }
                        } catch (error) {
                            return { ID: receiverID, name: "Unknown Receiver" };
                        }
                    });

                    element.receivers = await Promise.all(receiverReadPromises);

                    if (dataMatcher) {
                        return this.createModelData(oModel, "/integrateInterface", { body: element }, "interface");
                    } else {
                        oMessageManager.addMessages(new Message({
                            message: globalThat.getResourceBundle().getText("InterfaceIntegration"),
                            type: sap.ui.core.MessageType.Warning,
                        }));
                    }
                }));

                oModel.setDeferredGroups([...oModel.getDeferredGroups(), "interface"]);
                oModel.submitChanges();
                oModel.refresh(true);

                const aItf = results.map((oData) => oData?.integrateInterface?.interface_ID);

                globalThat.getView().byId("stInterfaces").rebindTable();

                setTimeout(() => {
                    globalThat.onMessagePopoverPress();
                }, 100);

                return aItf;
            } catch (error) {
                throw error;
            }
        },
        readModelData: function (model, path) {
            return new Promise((resolve, reject) => {
                model.read(path, {
                    success: function (data) {
                        resolve(data);
                    },
                    error: function (error) {
                        reject(error);
                    }
                });
            });
        },
        createModelData: function (oModel, path, data, groupId) {
            return new Promise((resolve, reject) => {
                oModel.create(path, data, {
                    groupId: groupId,
                    success: function (oData, resp) {
                        resolve(oData);
                    },
                    error: function (odata, resp) {
                        reject(odata.message);
                    }
                });
            });
        },
        _integrateIntegration: async function (oIntegrationData, aResults) {
            const oModel = globalThat.getView().getModel();
            oModel.setUseBatch(true);
            oModel.setDeferredGroups(["integration"]);

            const aItf = aResults ? aResults.slice() : [];
            const aIntegrationIDs = oIntegrationData?.body?.map(item => item.integrationID_integrationID.toString()) || [];

            const oIntegrationObj = {
                interfaceID_interfaceID: aItf,
                integrationID_integrationID: aIntegrationIDs
            };

            let integrationMatcher = false;

            await Promise.all(aIntegrationIDs.map(dataIntegrationID => {
                return new Promise((resolve, reject) => {
                    oModel.read(`/DataCloudIntegrations('${dataIntegrationID}')`, {
                        success: function (data) {
                            if (dataIntegrationID === data.integrationID) {
                                integrationMatcher = true;
                            }
                            resolve();
                        },
                        error: function (error) {
                            reject(error);
                        }
                    });
                });
            }));

            if (oIntegrationData && aResults && integrationMatcher) {
                oModel.create("/addCloudIntegration", oIntegrationObj, {
                    groupId: "integration",
                    success: function (oData, resp) {
                        globalThat.getView().byId("stInterfaces").rebindTable();
                        setTimeout(() => {
                            globalThat.onMessagePopoverPress();
                        }, 100);
                    }.bind(this),
                    error: function (odata, resp) {
                        // Handle error if needed
                    }
                });
                oModel.submitChanges({ groupId: "integration" });
                oModel.refresh(true);
            }
        },
        _integrateMasterData: async function (oExcelData) {
            const uploadConfig = {
                applications: {
                    entityName: `/MasterdataApplications`,
                    tableId: "stApplications",
                    properties: [
                        "dataApplicationID",
                        "externalID",
                        "dataApplicationName",
                        "dataApplicationURL",
                        "description",
                        "timeClassification",
                        "r6Classification",
                        "businessCriticality",
                        "functionalFit",
                        "technicalFit",
                    ],
                },
                dataObjects: {
                    entityName: `/MasterdataObjects`,
                    tableId: "stObject",
                    properties: [
                        "dataObjectID",
                        "dataObjectName",
                        "dataObjectURL",
                        "externalID",
                        "description",
                        "classification",
                    ],
                },
                processes: {
                    entityName: `/MasterdataProcesses`,
                    tableId: "idSTProcesses",
                    properties: [
                        "dataProcessID",
                        "dataProcessURL",
                        "externalID",
                        "dataProcessName",
                        "description",
                        "processMaturity",
                    ],
                },
            };
        
            const config = uploadConfig[this.sUploadTab];
        
            if (!config) return;
        
            const oModel = globalThat.getView().getModel();
            const oMessageManager = sap.ui.getCore().getMessageManager();
            oModel.setUseBatch(true);
        
            // Dictionary to store groupId for each unique ID
            const groupIdDictionary = {};
        
            if (oExcelData.body && Array.isArray(oExcelData.body)) {
                try {
                    const createPromises = oExcelData.body.map(async (element) => {
                        try {
                            const data = {};
                            config.properties.forEach((prop) => {
                                data[prop] = element[prop];
                            });
        
                            const ID = element[config.properties[0]]; // Assuming the first property is the ID
                            let groupId = groupIdDictionary[ID];
        
                            // If groupId doesn't exist for this ID, generate a new one
                            if (!groupId) {
                                groupId = `${this.sUploadTab}-${ID}-${Date.now()}`;
                                groupIdDictionary[ID] = groupId;
                            }
        
                            await new Promise((resolve, reject) => {
                                oModel.create(config.entityName, {
                                    ...data,
                                    lastModified: new Date(), // Set the appropriate date
                                }, {
                                    groupId: groupId, // Use the groupId associated with this ID
                                    success: (responseData) => {
                                        resolve(responseData);
                                        let oMessage = new sap.ui.core.message.Message({
                                            message: globalThat.getResourceBundle().getText("excelUpload"),
                                            type: sap.ui.core.MessageType.Success,
                                        });
                                        oMessageManager.addMessages(oMessage);
                                    },
                                    error: (error) => {
                                        reject(error);
                                    },
                                });
                            });
                        } catch (error) {
                            let oMessage = new sap.ui.core.message.Message({
                                message: globalThat.getResourceBundle().getText("ExcelData"),
                                type: sap.ui.core.MessageType.Warning,
                            });
                            oMessageManager.addMessages(oMessage);
                        }
                    });
        
                    await Promise.all(createPromises);
        
                    // Refresh tables and handle messages as before
                    let aDeferredGroups = oModel.getDeferredGroups();
                    aDeferredGroups = aDeferredGroups.concat(Object.values(groupIdDictionary)); // Use all unique groupIds
                    oModel.setDeferredGroups(aDeferredGroups);
                    oModel.submitChanges();
                    oModel.refresh(true);
                    globalThat.getView().byId(config.tableId).rebindTable();
                    setTimeout(() => {
                        globalThat.onMessagePopoverPress();
                    }, 100);
                } catch (error) {
                    throw error;
                }
            }
        },
        _readExcelData: function (attachment) {
            switch (this.sUploadTab) {
                case "interfaces":
                    return this._readInterfacesData(attachment);
                case "applications":
                    return this._readApplicationsData(attachment);
                case "dataObjects":
                    return this._readDataObjectsData(attachment);
                case "processes":
                    return this._readProcessesData(attachment);
                default:
                    return Promise.reject(new Error("Invalid upload tab."));
            }
        },
        
        _readInterfacesData: function (attachment) {
            const that = this;
            const oEntries = [];
        
            return new Promise(function (resolve, reject) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: "array" });
                    const excelData = {};
        
                    workbook.SheetNames.forEach(function (sheetName) {
                        const worksheet = workbook.Sheets[sheetName];
                        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                        excelData[sheetName] = jsonData;
                    });
        
                    const values = [];
                    const receivers = [];
                    const oRequest = {};
        
                    for (let index = 1; index < excelData.Interfaces.length; index++) {
                        let oObject = {};
                        excelData.Interfaces[index].forEach((data, dataIndex) => {
                            oObject[excelData.Interfaces[0][dataIndex]] = data;
                        });
                        values.push(oObject);
                    }
        
                    for (let index = 1; index < excelData.Receivers.length; index++) {
                        let oObject = {};
                        excelData.Receivers[index].forEach((data, dataIndex) => {
                            oObject[excelData.Receivers[0][dataIndex]] = data;
                        });
                        receivers.push(oObject);
                    }
        
                    values.forEach(element => {
                        let oEntry = {
                            receivers: [],
                        };
                        oEntry.name = element.Name;
                        oEntry.description = element.Description;
                        oEntry.senderID = element.SenderID;
                        oEntry.dataObjectID = element.DataObjectID;
                        oEntry.dataProcessID = element.DataProcessID;
                        oEntry.status = element.Status;
        
                        receivers.forEach(receiver => {
                            oEntry.receivers.push({ ID: receiver.ID, name: receiver.Name });
                        });
        
                        oEntries.push(oEntry);
                    });
        
                    oRequest.body = oEntries;
        
                    if (!oRequest.body || !Array.isArray(oRequest.body) || oRequest.body.length === 0 ||
                        !oRequest.body[0].name || !oRequest.body[0].senderID || !oRequest.body[0].receivers[0]) {
                        let oMessageManager = sap.ui.getCore().getMessageManager();
                        let oMessage = new Message({
                            message: globalThat.getResourceBundle().getText("mandatoryFields"),
                            type: sap.ui.core.MessageType.Warning,
                        });
                        oMessageManager.addMessages(oMessage);
                        reject(new Error("Mandatory fields are missing."));
                        return;
                    }
        
                    resolve(oRequest);
                };
        
                reader.onerror = function () {
                    reject(new Error("Failed to read the Excel file."));
                };
        
                reader.readAsArrayBuffer(attachment.getFileObject());
            });
        },
        _readApplicationsData: function (attachment) {
            const sheetName = "Applications";
            const fieldNames = [
                "DataApplicationID", "ExternalID", "DataApplicationName", "DataApplicationURL", "LastModified",
                "Description", "TimeClassification", "R6Classification", "BusinessCriticality", "FunctionalFit", "TechnicalFit"
            ];
            return this._readData(attachment, sheetName,fieldNames);
        },
        
        _readDataObjectsData: function (attachment) {
            const sheetName = "DataObjects";
            const fieldNames = ["DataObjectID", "DataObjectName", "DataObjectURL", "ExternalID", "LastModified", "Description", "Classification"];
            return this._readData(attachment, sheetName,fieldNames);
        },
        
        _readProcessesData: function (attachment) {
            const sheetName = "Processes";
            const fieldNames = ["DataProcessID", "DataProcessURL", "ExternalID", "DataProcessName", "LastModified", "Description", "ProcessMaturity"];
            return this._readData(attachment, sheetName,fieldNames);
        },
        
        _readData: function (attachment, sheetName, fieldNames) {
            const that = this;
            const oEntries = [];
        
            return new Promise(function (resolve, reject) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: "array" });
                    const excelData = {};
        
                    workbook.SheetNames.forEach(function (name) {
                        const worksheet = workbook.Sheets[name];
                        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                        excelData[name] = jsonData;
                    });
        
                    const values = [],
                    oRequest = {};
        
                    for (let index = 1; index < excelData[sheetName].length; index++) {
                        const oObject = {};
                        excelData[sheetName][index].forEach((data, dataIndex) => {
                            oObject[excelData[sheetName][0][dataIndex]] = data;
                        });
                        values.push(oObject);
                    }
                    if(sheetName=="Applications"){
                        const fieldMappingsForApplications = [
                            { sourceField: 'DataApplicationID', targetField: 'dataApplicationID' },
                            { sourceField: 'ExternalID', targetField: 'externalID' },
                            { sourceField: 'DataApplicationName', targetField: 'dataApplicationName' },
                            { sourceField: 'DataApplicationURL', targetField: 'dataApplicationURL' },
                            { sourceField: 'LastModified', targetField: 'lastModified' },
                            { sourceField: 'Description', targetField: 'description' },
                            { sourceField: 'TimeClassification', targetField: 'timeClassification' },
                            { sourceField: 'R6Classification', targetField: 'r6Classification' },
                            { sourceField: 'BusinessCriticality', targetField: 'businessCriticality' },
                            { sourceField: 'FunctionalFit', targetField: 'functionalFit' },
                            { sourceField: 'TechnicalFit', targetField: 'technicalFit' }
                        ];
                        
                        const oEntriesForApplications = that.mapValuesToEntry(values, fieldMappingsForApplications);
                        oRequest.body = oEntriesForApplications;
                    }
                    else if (sheetName=="DataObjects"){
                        const fieldMappingsForDataObjects = [
                            { sourceField: 'DataObjectID', targetField: 'dataObjectID' },
                            { sourceField: 'DataObjectName', targetField: 'dataObjectName' },
                            { sourceField: 'DataObjectURL', targetField: 'dataObjectURL' },
                            { sourceField: 'ExternalID', targetField: 'externalID' },
                            { sourceField: 'LastModified', targetField: 'lastModified' },
                            { sourceField: 'Description', targetField: 'description' },
                            { sourceField: 'Classification', targetField: 'classification' }
                        ];
                        
                        const oEntriesForDataObjects = that.mapValuesToEntry(values, fieldMappingsForDataObjects);
                        oRequest.body = oEntriesForDataObjects;
                        
                    }
                    else if(sheetName=="Processes"){
                        const fieldMappingsForProcesses = [
                            { sourceField: 'DataProcessID', targetField: 'dataProcessID' },
                            { sourceField: 'DataProcessURL', targetField: 'dataProcessURL' },
                            { sourceField: 'ExternalID', targetField: 'externalID' },
                            { sourceField: 'DataProcessName', targetField: 'dataProcessName' },
                            { sourceField: 'LastModified', targetField: 'lastModified' },
                            { sourceField: 'Description', targetField: 'description' },
                            { sourceField: 'ProcessMaturity', targetField: 'processMaturity' }
                        ];
                        
                        const oEntriesForProcesses = that.mapValuesToEntry(values, fieldMappingsForProcesses);
                        oRequest.body = oEntriesForProcesses;                        
                    }
                    
                    if (!oRequest.body || !Array.isArray(oRequest.body) ||(sheetName =="Applications"&& oRequest.body[0].dataApplicationID.length===0) || (sheetName =="DataObjects" &&oRequest.body[0].dataObjectID.length===0)||(sheetName =="Processes"&&oRequest.body[0].dataProcessID.length===0)||oRequest.body.length === 0) {
                        const oMessageManager = sap.ui.getCore().getMessageManager();
                        const oMessage = new Message({
                            message: globalThat.getResourceBundle().getText("mandatoryFields"),
                            type: sap.ui.core.MessageType.Warning,
                        });
                        oMessageManager.addMessages(oMessage);
                        reject(new Error("Mandatory fields are missing."));
                        return;
                    }
        
                    resolve(oRequest);
                };
        
                reader.onerror = function () {
                    reject(new Error("Failed to read the Excel file."));
                };
        
                reader.readAsArrayBuffer(attachment.getFileObject());
            });
        },
         mapValuesToEntry: function(values, fieldMappings) {
            const oEntries = [];
        
            values.forEach(element => {
                let oEntry = {};
                fieldMappings.forEach(fieldMapping => {
                    oEntry[fieldMapping.targetField] = element[fieldMapping.sourceField];
                });
                oEntries.push(oEntry);
            });
        
            return oEntries;
        },      
        _readIntegrationData: function (attachment) {
            let that = this,
                oEntries = [];
            return new Promise(function (resolve, reject) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: "array" });

                    const sheetNames = workbook.SheetNames;
                    const excelData = {};

                    sheetNames.forEach(function (sheetName) {
                        const worksheet = workbook.Sheets[sheetName];
                        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                        excelData[sheetName] = jsonData;
                    });

                    let integrations = [],
                        oRequest = {};
                    for (let index = 1; index < excelData.Integrations.length; index++) {
                        let oObject = {};
                        excelData.Integrations[index].forEach((data, dataIndex) => {
                            oObject[excelData.Integrations[0][dataIndex]] = data;
                        });
                        integrations.push(oObject);
                    }

                    integrations.forEach(element => {
                        let oEntry = {};
                        oEntry.integrationID_integrationID = element.IntegrationID;
                        oEntries.push(oEntry); // Push each oEntry into the oEntries array
                    });

                    oRequest.body = oEntries;
                    resolve(oRequest);
                };

                reader.onerror = function () {
                    reject(new Error("Failed to read the Excel file."));
                };

                reader.readAsArrayBuffer(attachment.getFileObject());
            });
        }
    };
    return excelUploadHandler;
});
