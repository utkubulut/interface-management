using {CatalogService as service} from './cat-service';

//-------------------------------------------------------------------------------------------------------------
// Annotation LineItem-Filter Section
//-------------------------------------------------------------------------------------------------------------

annotate CatalogService.Interfaces with @(UI: {
    SelectionFields: [
        senderID,
        status
    ],
    LineItem       : [
        {
            $Type: 'UI.DataField',
            Value: interfaceID,
        },
        {
            $Type: 'UI.DataField',
            Value: senderID,
        },
        {
            $Type: 'UI.DataField',
            Value: status,
        },
        {
            $Type: 'UI.DataField',
            Value: description,
        }
    ]
});

annotate CatalogService.DataCloudIntegrations with @(UI: {
    SelectionFields: [
        integrationName,
        sender,
        receiver,
        package,
        flow
    ],
    LineItem       : [
        {
            $Type: 'UI.DataField',
            Value: integrationID,
        },
        {
            $Type: 'UI.DataField',
            Value: sender,
        },
        {
            $Type: 'UI.DataField',
            Value: receiver,
        },
        {
            $Type: 'UI.DataField',
            Value: description,
        },
        {
            $Type: 'UI.DataField',
            Value: integrationName

        },
        {
            $Type: 'UI.DataField',
            Value: type,
        },
        {
            $Type: 'UI.DataField',
            Value: version,
        },
        {
            $Type: 'UI.DataField',
            Value: package,
        },
        {
            $Type: 'UI.DataField',
            Value: flow,
        }
    ]
});

annotate CatalogService.InterfaceTableData with @(UI.PresentationVariant: {RequestAtLeast: ['integrationIds','externalID']});


annotate CatalogService.InterfaceTableData with @(UI: {
    SelectionFields: [
        interfaceID,
        senderID,
        dataProcessName,
        dataObjectName
    ],
    LineItem       : [
        {
            $Type: 'UI.DataField',
            Value: name,
        },
        {
            $Type: 'UI.DataField',
            Value: description,
        },
        {
            $Type: 'UI.DataField',
            Value: status,
        },
        {
            $Type: 'UI.DataField',
            Value: senderName,
        },
        {
            $Type: 'UI.DataField',
            Value: dataProcessName,
        },
        {
            $Type: 'UI.DataField',
            Value: dataObjectName,
        },
        {
            $Type: 'UI.DataField',
            Value: receiverNames,
        },
        {
            $Type: 'UI.DataField',
            Value: integrationNames,
        },
        {
            $Type: 'UI.DataField',
            Value: flows,
        },
        {
            $Type: 'UI.DataField',
            Value: integrationIds
        }

    ]

});

annotate CatalogService.InterfaceTableData with {
    integrationIds @UI: {Hidden: true}
};
annotate CatalogService.InterfaceTableData with {
    externalID @UI: {Hidden: true}
};

annotate CatalogService.MasterdataApplications with @(UI: {
    SelectionFields: [dataApplicationName],
    LineItem       : [
        {
            $Type: 'UI.DataField',
            Value: dataApplicationName

        },
        {
            $Type: 'UI.DataField',
            Value: businessCriticality,
        },
        {
            $Type: 'UI.DataField',
            Value: description,

        },
        {
            $Type: 'UI.DataField',
            Value: functionalFit,
        },
        {
            $Type: 'UI.DataField',
            Value: lastModified,
        },
        {
            $Type: 'UI.DataField',
            Value: r6Classification,
        },
        {
            $Type: 'UI.DataField',
            Value: technicalFit,
        },
        {
            $Type: 'UI.DataField',
            Value: timeClassification,
        }
    ]

});

annotate CatalogService.MasterdataObjects with @(UI: {
    SelectionFields: [dataObjectName],
    LineItem       : [
        {
            $Type: 'UI.DataField',
            Value: dataObjectName

        },
        {
            $Type: 'UI.DataField',
            Value: classification,
        },
        {
            $Type: 'UI.DataField',
            Value: description,
        },
        {
            $Type: 'UI.DataField',
            Value: lastModified,
        }
    ]
});

annotate CatalogService.MasterdataProcesses with @(UI: {
    SelectionFields: [dataProcessName],
    LineItem       : [
        {
            $Type: 'UI.DataField',
            Value: dataProcessName

        },
        {
            $Type: 'UI.DataField',
            Value: description,
        },
        {
            $Type: 'UI.DataField',
            Value: lastModified,
        },
        {
            $Type: 'UI.DataField',
            Value: processMaturity,
        },
    ]
});


//-------------------------------------------------------------------------------------------------------------
// Annotation Value Lists
//-------------------------------------------------------------------------------------------------------------


annotate CatalogService.Interfaces with {
    status   @(Common: {
        TextArrangement: #TextOnly,
        Text           : status,
        ValueListWithFixedValues,
        ValueList      : {
            SearchSupported: false,
            $Type          : 'Common.ValueListType',
            CollectionPath : 'StatusValueHelp',
            Parameters     : [{
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: status,
                ValueListProperty: 'status',
            }]
        }
    });
    senderID @(Common: {
        TextArrangement: #TextOnly,
        Text           : senderID,
        ValueListWithFixedValues,
        ValueList      : {
            SearchSupported: false,
            $Type          : 'Common.ValueListType',
            CollectionPath : 'Interfaces',
            Parameters     : [{
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: senderID,
                ValueListProperty: 'senderID',
            }]
        }
    });
};


annotate CatalogService.InterfaceTableData with {
    interfaceID      @(Common: {
        TextArrangement: #TextOnly,
        Text           : {$value: name},
        ValueListWithFixedValues,
        ValueList      : {
            SearchSupported: false,
            $Type          : 'Common.ValueListType',
            CollectionPath : 'InterfaceTableData',
            Parameters     : [{
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: interfaceID,
                ValueListProperty: 'interfaceID',
            }]
        }
    });


    senderName       @(Common: {
        TextArrangement: #TextOnly,
        Text           : {$value: senderName},
        ValueListWithFixedValues,
        ValueList      : {
            SearchSupported: false,
            $Type          : 'Common.ValueListType',
            CollectionPath : 'InterfaceTableSenderVH',
            Parameters     : [{
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: senderName,
                ValueListProperty: 'senderName',
            }]
        }
    });

    senderID         @(Common: {
        TextArrangement: #TextOnly,
        Text           : {$value: senderName},
        ValueListWithFixedValues,
        ValueList      : {
            SearchSupported: false,
            $Type          : 'Common.ValueListType',
            CollectionPath : 'InterfaceTableSenderVH',
            Parameters     : [{
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: senderID,
                ValueListProperty: 'senderID',
            }]
        }
    });
    receiverNames    @(Common: {
        TextArrangement: #TextOnly,
        Text           : receiverNames,
        ValueListWithFixedValues,
        ValueList      : {
            SearchSupported: false,
            $Type          : 'Common.ValueListType',
            CollectionPath : 'InterfaceTableDataReceiverVH',
            Parameters     : [{
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: receiverNames,
                ValueListProperty: 'receiverNames',
            }]
        }
    });
    receiverIDs      @(Common: {
        TextArrangement: #TextOnly,
        Text           : receiverIDs,
        ValueListWithFixedValues,
        ValueList      : {
            SearchSupported: false,
            $Type          : 'Common.ValueListType',
            CollectionPath : 'InterfaceTableData',
            Parameters     : [{
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: receiverIDs,
                ValueListProperty: 'receiverIDs',
            }]
        }
    });
    dataObjectName   @(Common: {
        TextArrangement: #TextOnly,
        Text           : dataObjectName,
        ValueListWithFixedValues,
        ValueList      : {
            SearchSupported: false,
            $Type          : 'Common.ValueListType',
            CollectionPath : 'InterfaceTableDataObjectVH',
            Parameters     : [{
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: dataObjectName,
                ValueListProperty: 'dataObjectName',
            }]
        }
    });

    dataProcessName  @(Common: {
        TextArrangement: #TextOnly,
        Text           : dataProcessName,
        ValueListWithFixedValues,
        ValueList      : {
            SearchSupported: false,
            $Type          : 'Common.ValueListType',
            CollectionPath : 'InterfaceTableProcessVH',
            Parameters     : [{
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: dataProcessName,
                ValueListProperty: 'dataProcessName',
            }]
        }
    });

    dataObjectID     @(Common: {
        TextArrangement: #TextOnly,
        Text           : {$value: dataObjectName},
        ValueListWithFixedValues,
        ValueList      : {
            SearchSupported: false,
            $Type          : 'Common.ValueListType',
            CollectionPath : 'InterfaceTableDataObjectVH',
            Parameters     : [{
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: dataObjectID,
                ValueListProperty: 'dataObjectID',
            }]
        }
    });
    flows           @(Common: {
        TextArrangement: #TextOnly,
        Text           : flows,
        ValueListWithFixedValues,
        ValueList      : {
            SearchSupported: false,
            $Type          : 'Common.ValueListType',
            CollectionPath : 'InterfaceTableDataFlowsVH',
            Parameters     : [{
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: flows,
                ValueListProperty: 'flow',
            }]
        }
    });

    integrationNames @(Common: {
        TextArrangement: #TextOnly,
        Text           : {$value: integrationNames},
        ValueListWithFixedValues,
        ValueList      : {
            SearchSupported: false,
            $Type          : 'Common.ValueListType',
            CollectionPath : 'InterfaceTableData',
            Parameters     : [{
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: integrationIds,
                ValueListProperty: 'integrationIds',
            }]
        }
    });
    status           @(Common: {
        TextArrangement: #TextOnly,
        Text           : status,
        ValueListWithFixedValues,
        ValueList      : {
            SearchSupported: false,
            $Type          : 'Common.ValueListType',
            CollectionPath : 'StatusValueHelp',
            Parameters     : [{
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: status,
                ValueListProperty: 'status',
            }]
        }
    });
    dataProcessID    @(Common: {
        TextArrangement: #TextOnly,
        Text           : dataProcessID,
        ValueListWithFixedValues,
        ValueList      : {
            SearchSupported: false,
            $Type          : 'Common.ValueListType',
            CollectionPath : 'MasterdataProcesses',
            Parameters     : [{
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: dataProcessID,
                ValueListProperty: 'dataProcessName',
            }]
        }
    });

};


annotate CatalogService.DataCloudIntegrations with {
    integrationID   @(Common: {
        TextArrangement: #TextOnly,
        Text           : {$value: integrationID},
        ValueListWithFixedValues,
        ValueList      : {
            SearchSupported: false,
            $Type          : 'Common.ValueListType',
            CollectionPath : 'DataCloudIntegrations',
            Parameters     : [{
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: integrationID,
                ValueListProperty: 'integrationID',
            }]
        }
    });
    integrationName @(Common: {
        TextArrangement: #TextOnly,
        Text           : integrationName,
        ValueListWithFixedValues,
        ValueList      : {
            SearchSupported: false,
            $Type          : 'Common.ValueListType',
            CollectionPath : 'DataCloudIntegrations',
            Parameters     : [{
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: integrationName,
                ValueListProperty: 'integrationName',
            }]
        }
    });
    receiver        @(Common: {
        TextArrangement: #TextOnly,
        Text           : receiver,
        ValueListWithFixedValues,
        ValueList      : {
            SearchSupported: false,
            $Type          : 'Common.ValueListType',
            CollectionPath : 'DataCloudIntegrationsReceiverVH',
            Parameters     : [{
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: receiver,
                ValueListProperty: 'receiver',
            }]
        }
    });
    sender          @(Common: {
        TextArrangement: #TextOnly,
        Text           : sender,
        ValueListWithFixedValues,
        ValueList      : {
            SearchSupported: false,
            $Type          : 'Common.ValueListType',
            CollectionPath : 'DataCloudIntegrationsSenderVH',
            Parameters     : [{
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: sender,
                ValueListProperty: 'sender',
            }]
        }
    });
    flow            @(Common: {
        TextArrangement: #TextOnly,
        Text           : flow,
        ValueListWithFixedValues,
        ValueList      : {
            SearchSupported: false,
            $Type          : 'Common.ValueListType',
            CollectionPath : 'DataCloudIntegrationsFlowVH',
            Parameters     : [{
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: flow,
                ValueListProperty: 'flow',
            }]
        }
    });
    package         @(Common: {
        TextArrangement: #TextOnly,
        Text           : package,
        ValueListWithFixedValues,
        ValueList      : {
            SearchSupported: false,
            $Type          : 'Common.ValueListType',
            CollectionPath : 'DataCloudIntegrationsPackageVH',
            Parameters     : [{
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: package,
                ValueListProperty: 'package',
            }]
        }
    });
};

annotate CatalogService.MasterdataApplications with {
    dataApplicationName @(Common: {
        TextArrangement: #TextSeparate,
        Text           : dataApplicationName,
        ValueListWithFixedValues,
        ValueList      : {
            SearchSupported: false,
            $Type          : 'Common.ValueListType',
            CollectionPath : 'MasterdataApplicationsVH',
            Parameters     : [{
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: dataApplicationName,
                ValueListProperty: 'dataApplicationName',
            }]
        }
    });
    dataApplicationID   @(Common: {
        TextArrangement: #TextOnly,
        Text           : {$value: dataApplicationName},
        ValueListWithFixedValues,
        ValueList      : {
            SearchSupported: false,
            $Type          : 'Common.ValueListType',
            CollectionPath : 'MasterdataApplications',
            Parameters     : [{
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: dataApplicationID,
                ValueListProperty: 'dataApplicationID',
            }]
        }
    });
};


annotate CatalogService.MasterdataObjects with {
    dataObjectName @(Common: {
        TextArrangement: #TextOnly,
        Text           : dataObjectName,
        ValueListWithFixedValues,
        ValueList      : {
            SearchSupported: false,
            $Type          : 'Common.ValueListType',
            CollectionPath : 'MasterdataObjectsVH',
            Parameters     : [{
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: dataObjectName,
                ValueListProperty: 'dataObjectName',
            }]
        }
    });
    dataObjectID   @(Common: {
        TextArrangement: #TextOnly,
        Text           : {$value: dataObjectName},
        ValueListWithFixedValues,
        ValueList      : {
            SearchSupported: false,
            $Type          : 'Common.ValueListType',
            CollectionPath : 'MasterdataObjects',
            Parameters     : [{
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: dataObjectID,
                ValueListProperty: 'dataObjectID',
            }]
        }
    });
};

annotate CatalogService.MasterdataProcesses with {
    dataProcessName @(Common: {
        TextArrangement: #TextOnly,
        Text           : dataProcessName,
        ValueListWithFixedValues,
        ValueList      : {
            SearchSupported: false,
            $Type          : 'Common.ValueListType',
            CollectionPath : 'MasterDataProcessesVH',
            Parameters     : [{
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: dataProcessName,
                ValueListProperty: 'dataProcessName',
            }]
        }
    });
    dataProcessID   @(Common: {
        TextArrangement: #TextOnly,
        Text           : {$value: dataProcessName},
        ValueListWithFixedValues,
        ValueList      : {
            SearchSupported: false,
            $Type          : 'Common.ValueListType',
            CollectionPath : 'MasterdataProcesses',
            Parameters     : [{
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: dataProcessID,
                ValueListProperty: 'dataProcessID',
            }]
        }
    });
};

annotate CatalogService.StatusValueHelp with {
    ID @(Common: {
        TextArrangement: #TextOnly,
        Text           : {$value: status},
        ValueListWithFixedValues,
        ValueList      : {
            $Type         : 'Common.ValueListType',
            CollectionPath: 'StatusValueHelp',
            Parameters    : [{
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: ID,
                ValueListProperty: 'ID',
            }]
        }
    });
}

//-------------------------------------------------------------------------------------------------------------
// Annotation Label Section
//-------------------------------------------------------------------------------------------------------------

annotate CatalogService.Interfaces with {
    interfaceID @Common.Label: '{i18n>interfaceId}';
    senderID    @Common.Label: '{i18n>sender}';
    status      @Common.Label: '{i18n>status}';
    description @Common.Label: '{i18n>description}';
};

annotate CatalogService.InterfaceTableData with {
    interfaceID      @Common.Label: '{i18n>interfaceId}';
    name             @Common.Label: '{i18n>name}';
    description      @Common.Label: '{i18n>description}';
    status           @Common.Label: '{i18n>status}';
    senderID         @Common.Label: '{i18n>sender}';
    senderName       @Common.Label: '{i18n>sender}';
    dataProcessName  @Common.Label: '{i18n>process}';
    dataObjectName   @Common.Label: '{i18n>dataObject}';
    receiverNames    @Common.Label: '{i18n>receiverNames}';
    integrationNames @Common.Label: '{i18n>integrationNames}';
    flows            @Common.Label: '{i18n>flows}';
    dataObjectID     @Common.Label: '{i18n>dataObjectID}';
    dataProcessID    @Common.Label: '{i18n>dataProcessID}';
    receiverIDs      @Common.Label: '{i18n>receiverIDs}';
};


annotate CatalogService.DataCloudIntegrations with {
    integrationID   @Common.Label: '{i18n>integrationId}';
    sender          @Common.Label: '{i18n>sender}';
    receiver        @Common.Label: '{i18n>receiver}';
    description     @Common.Label: '{i18n>description}';
    integrationName @Common.Label: '{i18n>integrationName}';
    type            @Common.Label: '{i18n>type}';
    version         @Common.Label: '{i18n>version}';
    package         @Common.Label: '{i18n>package}';
    flow            @Common.Label: '{i18n>flow}';
    artifactContent @Common.Label: '{i18n>artifactContent}';
    createdAt       @Common.Label: '{i18n>createdAt}';
    createdBy       @Common.Label: '{i18n>createdBy}';
    deployedBy      @Common.Label: '{i18n>deployedBy}';
    deployedOn      @Common.Label: '{i18n>deployedOn}';
    modifiedAt      @Common.Label: '{i18n>modifiedAt}';
    modifiedBy      @Common.Label: '{i18n>modifiedBy}';
    status          @Common.Label: '{i18n>status}';
    integrationURL  @Common.Label: '{i18n>integrationURL}';
};

annotate CatalogService.MasterdataApplications with {
    dataApplicationName @Common.Label: '{i18n>name}';
    businessCriticality @Common.Label: '{i18n>businessCriticality}';
    description         @Common.Label: '{i18n>description}';
    functionalFit       @Common.Label: '{i18n>functionalFit}';
    lastModified        @Common.Label: '{i18n>lastModified}';
    r6Classification    @Common.Label: '{i18n>r6Classification}';
    technicalFit        @Common.Label: '{i18n>technicalFit}';
    timeClassification  @Common.Label: '{i18n>timeClassification}';
    dataApplicationID   @Common.Label: '{i18n>dataApplicationID}';
    externalID          @Common.Label: '{i18n>externalID}';
    dataApplicationURL  @Common.Label: '{i18n>dataApplicationURL}';
};

annotate CatalogService.MasterdataObjects with {
    dataObjectName @Common.Label: '{i18n>name}';
    description    @Common.Label: '{i18n>description}';
    lastModified   @Common.Label: '{i18n>lastModified}';
    classification @Common.Label: '{i18n>classification}';
    dataObjectID   @Common.Label: '{i18n>dataObjectID}';
    externalID     @Common.Label: '{i18n>externalID}';
    dataObjectURL  @Common.Label: '{i18n>dataObjectURL}';
};

annotate CatalogService.MasterdataProcesses with {
    dataProcessName @Common.Label: '{i18n>name}';
    description     @Common.Label: '{i18n>description}';
    processMaturity @Common.Label: '{i18n>processMaturity}';
    lastModified    @Common.Label: '{i18n>lastModified}';
    dataProcessID   @Common.Label: '{i18n>dataProcessID}';
    externalID      @Common.Label: '{i18n>externalID}';
    dataProcessURL  @Common.Label: '{i18n>dataProcessURL}';
};
