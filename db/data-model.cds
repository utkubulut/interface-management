using {
      managed,
      cuid
} from '@sap/cds/common';

namespace ndbs.itfmanager;

@cds.persistence.journal
entity Interfaces : managed {
      key interfaceID   : String(32);
          externalID    : String(36);
          name          : String(120) not null;
          description   : String;
          status        : String(5) @assert.range enum {
                Draft;
                Ready
          };
          senderID      : String(120);
          receiver      : Association to many InterfaceReceivers
                                on receiver.interface = $self;
          dataProcessID : String(120);
          dataObjectID  : String(120);
          integration   : Association to many InterfaceIntegrations
                                on integration.interfaceID = $self;
}

@cds.persistence.journal
entity InterfaceReceivers : managed {
      key ID        : String(120);
          name      : String(120);
      key interface : Association to Interfaces;
}

@cds.persistence.journal
entity InterfaceIntegrations {
      key interfaceID   : Association to Interfaces;
      key integrationID : Association to DataCloudIntegrations;
}

@cds.persistence.journal
entity DataCloudIntegrations : managed {
      key integrationID   : String(120);
          sender          : String(120);
          artifactContent : String(120);
          description     : String;
          version         : String(120);
          receiver        : String(120);
          integrationName : String(120);
          status          : String(120);
          deployedOn      : DateTime;
          type            : String(20);
          deployedBy      : String(60);
          package         : String(120);
          flow            : String(120);
          integrationURL  : String(2048);
          interface       : Association to many InterfaceIntegrations
                                  on interface.integrationID = $self;
}

type IntegrationType    : {
      interfaceID_interfaceID     : String;
      integrationID_integrationID : String;
}


type InterfaceReceiverType {
      ID          : String;
      name        : String;
      interfaceID : String;
}

@cds.persistence.journal
entity MasterdataApplications : managed {
      key dataApplicationID   : String(40);
          externalID          : String(100);
          dataApplicationName : String(100);
          dataApplicationURL  : String(2048);
          lastModified        : DateTime;
          description         : String;
          timeClassification  : String(20);
          r6Classification    : String(20);
          businessCriticality : String(20);
          functionalFit       : String(20);
          technicalFit        : String(20);
}

@cds.persistence.journal
entity MasterdataObjects : managed {
      key dataObjectID   : String(40);
          dataObjectName : String(100);
          dataObjectURL  : String(2048);
          externalID     : String(100);
          lastModified   : DateTime;
          description    : String;
          classification : String(20);
}

@cds.persistence.journal
entity MasterdataProcesses : managed {
      key dataProcessID   : String(40);
          dataProcessURL  : String(2048);
          externalID      : String(100);
          dataProcessName : String(100);
          lastModified    : DateTime;
          description     : String;
          processMaturity : String(20);
}

type InterfaceType      : managed {
      interfaceID   :      String;
      name          :      String;
      description   :      String;
      status        :      String;
      senderID      :      String;
      dataProcessID :      String;
      dataObjectID  :      String;
      receivers     : many InterfaceReceiverType;
}

type InterfaceTableType : managed {
      isChanged     :      Boolean;
      interfaceID   :      String;
      name          :      String;
      description   :      String;
      status        :      String;
      senderID      :      String;
      dataProcessID :      String;
      dataObjectID  :      String;
      integrations  : many String;
      receivers     : many InterfaceReceiverType;
}

entity Languages {
      key code : String(2);
          text : String(40);
};

@cds.autoexpose
entity StatusValueHelp {
      key ID     : String(1);
          status : String(5) @ValueList.defaultValues: [
                'Ready',
                'Draft'
          ];
}
