using ndbs.itfmanager as ndbs from '../db/data-model';

service CatalogService {
    /* =========================================================== */
    /* Entity Projections                                          */
    /* =========================================================== */
    entity Interfaces                      as projection on ndbs.Interfaces;

    @cds.redirection.target
    entity DataCloudIntegrations           as projection on ndbs.DataCloudIntegrations;

    @cds.redirection.target
    entity InterfaceIntegrations           as projection on ndbs.InterfaceIntegrations;

    entity MasterdataProcesses             as projection on ndbs.MasterdataProcesses;
    entity MasterdataObjects               as projection on ndbs.MasterdataObjects;
    entity MasterdataApplications          as projection on ndbs.MasterdataApplications;
    entity InterfaceReceivers              as projection on ndbs.InterfaceReceivers;
    entity StatusValueHelp                 as projection on ndbs.StatusValueHelp;
    entity Languages                       as projection on ndbs.Languages;
    /* =========================================================== */
    /* Actions                                                     */
    /* =========================================================== */

    action integrateInterface(body : ndbs.InterfaceType)                                                                 returns String;
    action addCloudIntegration(interfaceID_interfaceID : array of String, integrationID_integrationID : array of String) returns String;
    action deleteInterfaces(interfaceIDs : array of String)                                                              returns String;
    action editInterface(body : ndbs.InterfaceTableType)                                                                 returns String;

    /* =========================================================== */
    /* Joins                                                       */
    /* =========================================================== */

    entity InterfaceTableData              as
        select from ndbs.Interfaces as inter

        left join (
            select
                dataObjectID,
                dataObjectName
            from MasterdataObjects
        ) as objects
            on inter.dataObjectID = objects.dataObjectID

        left join (
            select
                dataProcessID,
                dataProcessName
            from MasterdataProcesses
        ) as proceses
            on inter.dataProcessID = proceses.dataProcessID

        left join (
            select
                dataApplicationID,
                dataApplicationName
            from MasterdataApplications
        ) as apps
            on inter.senderID = apps.dataApplicationID

        left join (
            select
                intrec.interface.interfaceID,
                STRING_AGG(
                    intrec.name, ', ' order by intrec.name
                ) as receiverNames,
                STRING_AGG(
                    intrec.ID, ', ' order by intrec.name
                ) as receiverIDs
            from ndbs.InterfaceReceivers as intrec
            group by
                intrec.interface.interfaceID
        ) as reclist

            on reclist.interfaceID = inter.interfaceID

        left join (
            select
                interfaces.interfaceID,
                interfaces.externalID,
                interfaces.name,
                interfaces.description,
                interfaces.status,
                interfaces.senderID,
                interfaces.createdAt,
                interfaces.createdBy,
                interfaces.dataObjectID,
                interfaces.modifiedAt,
                interfaces.modifiedBy,
                interfaces.dataProcessID,
                STRING_AGG(
                    cloud.flow, ', ' order by cloud.integrationName
                ) as flows,
                STRING_AGG(
                    cloud.integrationName, ', ' order by cloud.integrationName
                ) as integrationNames,
                STRING_AGG(
                    cloud.integrationID, ', ' order by cloud.integrationName
                ) as integrationIds

            from ndbs.Interfaces as interfaces

            left join ndbs.InterfaceIntegrations as ii
                on interfaces.interfaceID = ii.interfaceID.interfaceID

            left join ndbs.DataCloudIntegrations as cloud
                on ii.integrationID.integrationID = cloud.integrationID

            group by
                interfaces.interfaceID,
                interfaces.externalID,
                interfaces.name,
                interfaces.description,
                interfaces.status,
                interfaces.senderID,
                interfaces.createdAt,
                interfaces.createdBy,
                interfaces.dataObjectID,
                interfaces.modifiedAt,
                interfaces.modifiedBy,
                interfaces.dataProcessID
        ) as interfaceWithIntegrations
            on reclist.interfaceID = interfaceWithIntegrations.interfaceID

        {
            key inter.interfaceID,
                inter.externalID,
                inter.name,
                inter.description,
                apps.dataApplicationName as senderName,
                inter.senderID,
                inter.createdAt,
                inter.createdBy,
                objects.dataObjectName,
                inter.dataObjectID,
                proceses.dataProcessName,
                inter.dataProcessID,
                inter.modifiedAt,
                inter.modifiedBy,
                inter.status,
                reclist.receiverNames                      : String,
                reclist.receiverIDs                        : String,
                interfaceWithIntegrations.flows            : String,
                interfaceWithIntegrations.integrationNames : String,
                interfaceWithIntegrations.integrationIds   : String,
        };

    //**********************************************
    //            VH Dialogs
    //**********************************************

    entity DataCloudIntegrationsSenderVH   as
        select from ndbs.DataCloudIntegrations distinct {
            key sender
        }
        where
                sender is not null
            and sender !=     '';

    entity DataCloudIntegrationsReceiverVH as
        select from ndbs.DataCloudIntegrations distinct {
            key receiver
        }
        where
                receiver is not null
            and receiver !=     '';

    entity DataCloudIntegrationsPackageVH  as
        select from ndbs.DataCloudIntegrations distinct {
            key package
        }
        where
                package is not null
            and package !=     '';

    entity DataCloudIntegrationsFlowVH     as
        select from ndbs.DataCloudIntegrations distinct {
            key flow
        }
        where
                flow is not null
            and flow !=     '';

    entity MasterDataProcessesVH           as
        select from ndbs.MasterdataProcesses distinct {
            key dataProcessID,
                dataProcessName,
        }
        where
                dataProcessName is not null
            and dataProcessName !=     '';

    entity MasterdataObjectsVH             as
        select from ndbs.MasterdataObjects distinct {
            key dataObjectID,
                dataObjectName,
        }
        where
                dataObjectName is not null
            and dataObjectName !=     '';

    entity MasterdataApplicationsVH        as
        select from ndbs.MasterdataApplications distinct {
            key dataApplicationID,
                dataApplicationName,
        }
        where
                dataApplicationName is not null
            and dataApplicationName !=     '';

    entity InterfaceTableSenderVH          as
        select from InterfaceTableData distinct {
            key senderID,
                senderName
        }
        where
                senderName is not null
            and senderName !=     ''
        order by
            senderName;

    entity InterfaceTableProcessVH         as
        select from InterfaceTableData distinct {
            key dataProcessID,
                dataProcessName
        }
        where
                dataProcessName is not null
            and dataProcessName !=     ''
        order by
            dataProcessName;

    entity InterfaceTableDataObjectVH      as
        select from InterfaceTableData distinct {
            key dataObjectID,
                dataObjectName
        }
        where
                dataObjectName is not null
            and dataObjectName !=     ''
        order by
            dataObjectName;

    entity InterfaceTableDataReceiverVH    as
        select from InterfaceTableData distinct {
            interfaceID,
            name,
            receiverNames
        }
        where
                receiverNames is not null
            and receiverNames !=     '';


    entity InterfaceTableDataFlowsVH                   as
        select from InterfaceIntegrations

        left join DataCloudIntegrations
            on InterfaceIntegrations.integrationID.integrationID = DataCloudIntegrations.integrationID
        distinct {
            key DataCloudIntegrations.flow as flow
        }
        where
                InterfaceIntegrations.integrationID.integrationID is not null
            and DataCloudIntegrations.integrationName             is not null
            and flow is not null;
            
    entity IntegrationVH                   as
        select from InterfaceIntegrations

        left join DataCloudIntegrations
            on InterfaceIntegrations.integrationID.integrationID = DataCloudIntegrations.integrationID
        distinct {
            key InterfaceIntegrations.integrationID.integrationID as integrationID,
                DataCloudIntegrations.integrationName             as integrationName
        }
        where
                InterfaceIntegrations.integrationID.integrationID is not null
            and DataCloudIntegrations.integrationName             is not null;

    entity ReceiverVH                      as
        select from InterfaceReceivers distinct {
            key ID,
                name
        }
        where
            name is not null;

}
