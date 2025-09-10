sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/odata/v4/ODataModel",
  ],
  function (
    Controller,
    MessageToast,
    MessageBox,
    Fragment,
    Filter,
    FilterOperator,
    ODataModel
  ) {
    "use strict";

    return Controller.extend("mdq.re.controller.Rule", {
      onInit: function () {
        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        oRouter
          .getRoute("Rule")
          .attachPatternMatched(this._onRouteMatched, this);

        var oViewModel = new sap.ui.model.json.JSONModel({
          editMode: false,
          originalData: {},
        });
        this.getView().setModel(oViewModel, "viewState");
      },

      _onRouteMatched: function (oEvent) {
        var sRuleId = oEvent.getParameter("arguments").ruleId;
        var oModel = this.getView().getModel();
        console.log("this is the rule id", sRuleId);
        console.log("this is the oModel: ", oModel);

        var sPath = "/Rules(" + sRuleId + ")";
        var oContextBinding = oModel.bindContext(sPath, null, {
          $expand: "Conditions,Actions",
          $select: "*",
        });

        oContextBinding
          .requestObject()
          .then(
            function (oData) {
              console.log("Rule object loaded:", oData);
              // Optionally bind the view to this context
              this.getView().setBindingContext(
                oContextBinding.getBoundContext()
              );
            }.bind(this)
          )
          .catch(function (err) {
            console.error("Error loading rule:", err);
          });
      },

      onDelete: function () {
        var oBindingContext = this.getView().getBindingContext();

        if (!oBindingContext) {
          MessageBox.error("Cannot delete rule.");
          return;
        }

        MessageBox.confirm(
          "Are you sure you want to delete this rule? All associated conditions will also be deleted.",
          {
            title: "Confirm Delete",
            onClose: function (sAction) {
              if (sAction === MessageBox.Action.OK) {
                oBindingContext
                  .delete()
                  .then(
                    function () {
                      MessageToast.show("Rule deleted successfully");
                      this._navToList();
                    }.bind(this)
                  )
                  .catch(
                    function (oError) {
                      MessageBox.error(
                        "Error deleting rule: " +
                          (oError.message || "Unknown error")
                      );
                    }.bind(this)
                  );
              }
            }.bind(this),
          }
        );
      },

      onEdit: function () {
        var oContext = this.getView().getBindingContext();
        var oData = Object.assign({}, oContext.getObject());
        console.log("data: ", oData);

        var oViewModel = this.getView().getModel("viewState");
        oViewModel.setProperty("/originalData", oData);
        oViewModel.setProperty("/editMode", true);
      },

      onCancel: function () {
        var oViewModel = this.getView().getModel("viewState");
        var oContext = this.getView().getBindingContext();
        var oModel = oContext.getModel();
        var oOriginal = oViewModel.getProperty("/originalData");

        if (oOriginal) {
          // Overwrite current entity with the original snapshot
          Object.keys(oOriginal).forEach(function (key) {
            // Only set primitive values (backend won’t accept objects directly)
            if (typeof oOriginal[key] !== "object") {
              oContext.setProperty(key, oOriginal[key]);
            }
          });

          oModel
            .submitBatch("updateGroup")
            .then(() => {
              sap.m.MessageToast.show("Changes reverted");
              oViewModel.setProperty("/editMode", false);
            })
            .catch((err) => {
              sap.m.MessageBox.error("Cancel failed: " + err.message);
            });
        } else {
          oViewModel.setProperty("/editMode", false);
        }
      },

      onSave: function () {
        var oModel = this.getView().getModel();
        var oViewModel = this.getView().getModel("viewState");

        if (oModel.hasPendingChanges()) {
          oModel
            .submitBatch("updateGroup")
            .then(() => {
              sap.m.MessageToast.show("Changes saved");
              oViewModel.setProperty("/editMode", false);
            })
            .catch((err) => {
              sap.m.MessageBox.error("Save failed: " + err.message);
            });
        } else {
          oViewModel.setProperty("/editMode", false);
        }
      },

      onAddCondition: function () {
        var oTable = this.byId("conditionsTable");
        var oListBinding = oTable.getBinding("items");

        if (!oListBinding) {
          sap.m.MessageBox.error("Conditions binding not found.");
          return;
        }

        var oContext = oListBinding.create({
          attribute_name: "",
          operator: "=",
          value: "",
        });

        oContext
          .created()
          .then(() => sap.m.MessageToast.show("Empty condition added."))
          .catch((err) =>
            sap.m.MessageBox.error("Error adding condition: " + err.message)
          );
      },

      onDeleteCondition: function (oEvent) {
        var oContext = oEvent.getParameter("listItem").getBindingContext();

        if (!oContext) {
          sap.m.MessageBox.error("No condition selected.");
          return;
        }

        sap.m.MessageBox.confirm(
          "Are you sure you want to delete this condition?",
          {
            title: "Confirm Delete",
            actions: [
              sap.m.MessageBox.Action.OK,
              sap.m.MessageBox.Action.CANCEL,
            ],
            onClose: function (sAction) {
              if (sAction === sap.m.MessageBox.Action.OK) {
                oContext
                  .delete()
                  .then(() => sap.m.MessageToast.show("Condition deleted"))
                  .catch((err) =>
                    sap.m.MessageBox.error(
                      "Error deleting condition: " + err.message
                    )
                  );
              }
            },
          }
        );
      },

      _navToList: function () {
        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        oRouter.navTo("List");
      },

      onNavBack: function () {
        this._navToList();
      },

      handleValueHelp: function () {
        var oView = this.getView();

        // Create dialog if it doesn't exist
        if (!this._entityDialog) {
          this._entityDialog = Fragment.load({
            id: oView.getId(),
            name: "mdq.re.view.fragment.Dialog",
            controller: this,
          }).then(function (oDialog) {
            oView.addDependent(oDialog);
            return oDialog;
          });
        }

        //var bpModel = this.getView().getModel('bpModel')
        //console.log(bpModel)

        // Create JSONModel for service document
        var oJsonModel = new sap.ui.model.json.JSONModel();
        oJsonModel.loadData("/odata/v4/api-business-partner"); // loads { value: [...] }

        this._entityDialog.then(
          function (oDialog) {
            oDialog.setModel(oJsonModel, "bpServiceDoc");

            // Open the dialog
            oDialog.open();
          }.bind(this)
        );
      },

      onEntityDialogConfirm: function (oEvent) {
        var oSelectedItem =
          oEvent.getParameter("selectedItem") || oEvent.getSource().getParent();

        if (oSelectedItem) {
          var sSelectedText = oSelectedItem.getTitle();
          // Update the input field
          this.byId("targetEntityInput").setValue(sSelectedText);
          // Update your model with the selected entity
          //var oModel = this.getView().getModel()
          //oModel.setProperty('/targetEntity', sSelectedText)
        }

        // Close the dialog
        oEvent.getSource().close();
      },

      onEntitySearch: function (oEvent) {
        var sValue =
          oEvent.getParameter("value") || oEvent.getParameter("newValue");

        var aFilters = [];
        if (sValue) {
          aFilters = [
            new sap.ui.model.Filter(
              "name",
              sap.ui.model.FilterOperator.Contains,
              sValue
            ),
            new sap.ui.model.Filter(
              "url",
              sap.ui.model.FilterOperator.Contains,
              sValue
            ),
          ];

          aFilters = [
            new sap.ui.model.Filter({
              filters: aFilters,
              and: false,
            }),
          ];
        }
        var oBinding = oEvent.getSource().getBinding("items");
        oBinding.filter(aFilters);
      },

      handleFieldValueHelp: function () {
        var oView = this.getView();

        if (!this._fieldDialog) {
          this._fieldDialog = Fragment.load({
            id: oView.getId(),
            name: "mdq.re.view.fragment.Field",
            controller: this,
          }).then(function (oDialog) {
            oView.addDependent(oDialog);
            return oDialog;
          });
        }

        // 🔹 Get the target entity from the rule object
        var oContext = this.getView().getBindingContext();
        var oData = oContext.getObject();
        var sEntity = oData.targetEntity; // e.g. "A_BusinessPartner"

        // Load metadata and extract only fields of that entity
        fetch("/odata/v4/api-business-partner/$metadata")
          .then(function (response) {
            return response.text();
          })
          .then(
            function (xmlText) {
              var oParser = new DOMParser();
              var oXml = oParser.parseFromString(xmlText, "application/xml");

              var aFields = [];
              var oEntityType = oXml.querySelector(
                "EntityType[Name='" + sEntity + "']"
              );

              if (oEntityType) {
                oEntityType
                  .querySelectorAll("Property")
                  .forEach(function (oProp) {
                    aFields.push({
                      name: oProp.getAttribute("Name"),
                      type: oProp.getAttribute("Type"),
                    });
                  });
              } else {
                console.warn("Entity not found in metadata:", sEntity);
              }

              var oFieldModel = new sap.ui.model.json.JSONModel({
                value: aFields,
              });

              this._fieldDialog.then(function (oDialog) {
                oDialog.setModel(oFieldModel, "fieldModel");
                oDialog.open();
              });
            }.bind(this)
          )
          .catch(function (err) {
            console.error("Error loading metadata:", err);
          });
      },

      // TODO: fix the bugs
      onFieldDialogConfirm: function (oEvent) {
        var oSelectedItem = oEvent.getParameter("selectedItem");

        if (oSelectedItem) {
          var sFieldName = oSelectedItem.getTitle();
          // Update the input
          this.byId("fieldInput").setValue(sFieldName);
          // Update the model
          var oModel = this.getView().getModel();
          oModel.setProperty("/fieldName", sFieldName);
        }

        oEvent.getSource().close();
      },

      onFieldSearch: function (oEvent) {
        var sValue =
          oEvent.getParameter("value") || oEvent.getParameter("newValue");
        var oFilter = new sap.ui.model.Filter(
          "name",
          sap.ui.model.FilterOperator.Contains,
          sValue
        );
        var oBinding = oEvent.getSource().getBinding("items");
        oBinding.filter([oFilter]);
      },
    });
  }
);
