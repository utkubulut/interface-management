const cds = require("@sap/cds"),
   crypto = require("crypto"),
   textBundle = require('./util/textBundle')


module.exports = async (srv) => {
   db = await cds.connect.to("db");
   const {
      InterfaceReceivers,
      Interfaces,
      InterfaceIntegrations,
      DataCloudIntegrations,
      MasterdataObjects,
      MasterdataProcesses,
      MasterdataApplications
   } = db.entities,
      messaging = await cds.connect.to('messaging');

   /* =========================================================== */
   /* Actions                                                     */
   /* =========================================================== */

   srv.on('editInterface', async (req) => {
      const locale = req.user.locale;
      const payload = req.data;
      const bundle = textBundle.getTextBundle(locale);
      let interfaceData = req.data.body
      Object.keys(interfaceData).forEach(key => interfaceData[key] === undefined ? delete interfaceData[key] : {});
      let interfaceID = interfaceData.interfaceID

      if (interfaceData.integrations) {
         let interfaceIntegrationsPairs = []
         interfaceData.integrations.forEach((integration) => {
            interfaceIntegrationsPairs.push(
               {
                  "INTEGRATIONID_INTEGRATIONID": integration,
                  "INTERFACEID_INTERFACEID": interfaceID
               }
            )
         })
         try {
            await DELETE.from(InterfaceIntegrations).where({ INTERFACEID_INTERFACEID: interfaceID });
            interfaceIntegrationsPairs.forEach(async (pair) => {
               await INSERT.into(InterfaceIntegrations).entries(pair);
            })
         }
         catch (error) {
            return req.error({
               message: error.message,
               status: 418,
               detail: interfaceID
            })
         }
         delete interfaceData.integrations
      }
      if (!(interfaceData.receivers === undefined || interfaceData.receivers.length < 1)) {
         let interfaceReceiversPair = []
         if (interfaceData.receivers.length > 0) {
            interfaceData.receivers.forEach(receiver => {
               interfaceReceiversPair.push(
                  {
                     "ID": receiver.ID,
                     "name": receiver.name,
                     "INTERFACE_INTERFACEID": receiver.interfaceID
                  }
               )
            })
         }
         try {
            await DELETE.from(InterfaceReceivers).where({ INTERFACE_INTERFACEID: interfaceID });
            if (interfaceReceiversPair.length > 0) {
               interfaceReceiversPair.forEach(async (pair) => {
                  await INSERT.into(InterfaceReceivers).entries(pair);
               })
            }
         } catch (error) {
            return req.error({
               message: error.message,
               status: 418,
               detail: bundle.getText("checkReceiversWithInterface") + interfaceID
            })
         }
         delete interfaceData.receivers
      }
      //Interface changes
      try {
         await UPDATE(Interfaces, interfaceID).with(interfaceData)
         if (interfaceData.status === "Ready") {
            produceReadyMessage(interfaceID)
         }
      }
      catch (error) {
         return req.error({
            message: error.message,
            status: 418,
            detail: bundle.getText("checkDefaultColumns") + interfaceData
         })
      }
      return req.notify({
         message: bundle.getText("interfaceEdited"),
         status: 200
      })
   }),
      srv.on('integrateInterface', async (req) => {
         const locale = req.user.locale,
            payload = req.data,
            bundle = textBundle.getTextBundle(locale),
            itf_ID = crypto.randomBytes(16).toString("hex").toUpperCase(),
            clone = Object.assign({}, req.data.body);
         let receiversColumns = req.data.body.receivers,
            interfaceColumns

         delete clone["receivers"];
         interfaceColumns = clone;
         interfaceColumns.interfaceid = itf_ID;


         try {
            await INSERT.into(Interfaces).entries(interfaceColumns);
         }
         catch (error) {
            req.warn({
               message: error.message,
               status: 418,
               detail: bundle.getText("checkInterface") + payload.interfaceID
            })
         }
         try {
            receiversColumns.forEach(async (receiver) => {
               receiver.INTERFACE_INTERFACEID = itf_ID;
               await INSERT.into(InterfaceReceivers).entries(receiver);

            });
         }
         catch (error) {
            req.warn({
               message: error.message,
               status: 418,
               detail: bundle.getText("checkReceivers") + receiversColumns.toString()
            })
         }

         if (payload.body.status === "Ready") {
            produceReadyMessage(itf_ID);
         }
         req.notify({
            message: req.data.body.name + " " + bundle.getText("interfaceCreated"),
            status: 200
         })
         return {
            messages: req.messages, interface_ID: itf_ID
         }

      });

   srv.on('addCloudIntegration', async (req) => {
      const locale = req.user.locale,
         bundle = textBundle.getTextBundle(locale);


      for (let i = 0; i < req.data.interfaceID_interfaceID.length; i++) {
         for (let j = 0; j < req.data.integrationID_integrationID.length; j++) {
            try {
               let aData = {
                  interfaceID_interfaceID: req.data.interfaceID_interfaceID[i],
                  integrationID_integrationID: req.data.integrationID_integrationID[j]
               };
               await INSERT.into(InterfaceIntegrations).entries(aData);
            }
            catch (error) {
               return req.error({
                  message: error.message,
                  description: itf_ID + error.message,
                  status: 418
               })
            }
         }
      }
      return req.notify({
         message: bundle.getText("integrationsAdded"),
         status: 200
      })
   });

   srv.on('deleteInterfaces', async (req) => {
      const locale = req.user.locale,
         bundle = textBundle.getTextBundle(locale),
         interfaceIDs = req.data.interfaceIDs;

      for (itf_ID of interfaceIDs) {
         try {
            await DELETE.from(Interfaces).where({ interfaceID: itf_ID });
            await DELETE.from(InterfaceReceivers).where({ interface_interfaceID: itf_ID });
            await DELETE.from(InterfaceIntegrations).where({ interfaceID_interfaceID: itf_ID });
            req.notify({
               message: bundle.getText("successfullDeletion"),
               status: 200
            });
         }
         catch (error) {
            req.warn({
               message: error.message,
               description: itf_ID + " " + bundle.getText("errorOccur"),
               status: 418
            })
         }
      }
      return req.messages
   });

   /* =========================================================== */
   /* Custom Handlers                                             */
   /* =========================================================== */


   srv.on("CREATE", "MasterdataApplications", async (req) => {
      return upsertEntities(MasterdataApplications, "dataApplicationID", req)
   });

   srv.on("CREATE", "MasterdataProcesses", async (req) => {
      return upsertEntities(MasterdataProcesses, "dataProcessID", req)
   });

   srv.on("CREATE", "MasterdataObjects", async (req) => {
      return upsertEntities(MasterdataObjects, "dataObjectID", req)
   });

   srv.on("CREATE", "DataCloudIntegrations", async (req) => {
      return upsertEntities(DataCloudIntegrations, "integrationID", req)
   });

   srv.after("UPDATE", "Interfaces", async (req, res) => {
      if (req.status === "Ready" && res._queryOptions.isEvent === 'true') {
         produceReadyMessage(req.interfaceID)
      }
   });


   async function produceReadyMessage(interfaceID) {
      await messaging.emit('ndbs/leanix/ems-imev/status-update', { 'interfaceID': interfaceID })
   };

   async function upsertEntities(entity, IDfield, req) {
      try {
         //Check the current ID exist
         let existingEntity = await SELECT.from(entity).where({ [IDfield]: req.data[IDfield] });
         if (existingEntity.length == 0) {
            await INSERT.into(entity, req.data)
         }
         else {
            await UPDATE(entity, req.data[IDfield]).with(req.data)
         }
         return req.data
      }
      catch {
         return req.reject(404, req.message)
      }
   }
   // srv.after("UPDATE", "Interfaces", async (req) => {
   //    const locale = req.user.locale;
   //    const bundle = textBundle.getTextBundle(locale);

   //    if (!req.status) {
   //       return req.data
   //    } else {
   //       return req.notify({
   //          message: bundle.getText("statusUpdate"),
   //          status: 200
   //       })
   //    }

   // });
}