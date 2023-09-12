sap.ui.define([
    // Dependencies (if any)
], function () {
    "use strict";

    const ExcelTemplateGenerator = {
        uploadTab: '', // You can set this dynamically as needed

        getFileName: function () {
            switch (this.uploadTab) {
                case "interfaces":
                    return "InterfaceTemplate.xlsx";
                case "applications":
                    return "ApplicationTemplate.xlsx";
                case "dataObjects":
                    return "ObjectsTemplate.xlsx";
                case "processes":
                    return "ProcessTemplate.xlsx";
                default:
                    return "UnknownTemplate.xlsx";
            }
        },

        getSheetData: function () {
            switch (this.uploadTab) {
                case "interfaces":
                    const interfaces = [
                        { Name: "", Description: "", Status: "", SenderID: "", DataProcessID: "", DataObjectID: "" }
                    ];
                    const receivers = [
                        { ID: "" }
                    ];
                    const integrations = [
                        { IntegrationID: "" }
                    ];

                    return {
                        Interfaces: interfaces,
                        Receivers: receivers,
                        Integrations: integrations
                    };
                case "applications":
                    return {
                        Applications: [
                            { DataApplicationID: "", ExternalID: "", DataApplicationName: "", DataApplicationURL: "", LastModified: "", Description: "", TimeClassification: "", R6Classification: "", BusinessCriticality: "", FunctionalFit: "", TechnicalFit: "" }
                        ]
                    };
                case "dataObjects":
                    return {
                        DataObjects: [
                            { DataObjectID: "", DataObjectName: "", DataObjectURL: "", ExternalID: "", LastModified: "", Description: "", Classification: "" }
                        ]
                    };
                case "processes":
                    return {
                        Processes: [
                            { DataProcessID: "", DataProcessURL: "", ExternalID: "", DataProcessName: "", LastModified: "", Description: "", ProcessMaturity: "" }
                        ]
                    };
                default:
                    return {};
            }
        },

        generateExcelTemplate: function () {
            const fileName = this.getFileName();
            const wb = XLSX.utils.book_new();
            const sheetData = this.getSheetData();

            // Add sheets dynamically based on the data
            for (const sheetName in sheetData) {
                if (sheetData.hasOwnProperty(sheetName)) {
                    const data = sheetData[sheetName];
                    const sheet = XLSX.utils.json_to_sheet(data);
                    XLSX.utils.book_append_sheet(wb, sheet, sheetName);
                }
            }

            // Save the workbook to a file and trigger download
            XLSX.writeFile(wb, fileName);
        },

    };

    return ExcelTemplateGenerator;
});
