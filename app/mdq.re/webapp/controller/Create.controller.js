sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
  ],
  function (
    Controller,
    Fragment,
    JSONModel,
    Filter,
    FilterOperator,
    MessageToast,
    MessageBox
  ) {
    "use strict";

    return Controller.extend("mdq.re.controller.Create", {
      onInit: function () {
        // Initialize the view model with default values
        var oViewModel = new JSONModel({
          name: "",
          description: "",
          entity_service_name: "BusinessPartnerService",
          entity_name: "",
          andBinaryOperator: true,
          priority: "Medium",
          conditions: [],
          actions: [],
        });
        this.getView().setModel(oViewModel);

        var oODataModel = this.getOwnerComponent().getModel();
        this.getView().setModel(oODataModel, "odata");

        // Get the router for navigation
        this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
      },

      /**
       * Creates a new rule with conditions
       */
      onCreate: function () {
        var oODataModel = this.getView().getModel("odata");
        var oViewModel = this.getView().getModel();
        console.log("data: ", oODataModel);
        //console.log("view: ", oViewModel);
        console.log("ViewModel data: ", oViewModel.getData());

        // Validate required fields
        if (!this._validateRequiredFields()) {
          MessageToast.show("Please fill in all required fields");
          return;
        }

        var oData = oViewModel.getData();

        var oCreateData = {
          name: oData.name,
          description: oData.description,
          entity_name: oData.entity_name,
          entity_service_name: oData.entity_service_name,
          andBinaryOperator: oData.andBinaryOperator === 'And' ? true : false,
          priority: oData.priority,

          // Capitalized keys to match OData
          Conditions: (oData.conditions || []).map(function (condition) {
            return {
              attribute_name: condition.attribute_name,
              operator: condition.operator,
              value: condition.value,
              attribute_entity_name: oData.entity_name,
              attribute_entity_service_name: oData.entity_service_name,
            };
          }),
          Actions: (oData.actions || []).map(function (action) {
            return {
              attribute_name: action.attribute_name,
              operator: action.operator,
              value: action.value,
              attribute_entity_name: oData.entity_name,
              attribute_entity_service_name: oData.entity_service_name,
            };
          }),
        };

        // Create entity in OData V4 model
        var oBinding = oODataModel.bindList("/Rules");
        var oContext = oBinding.create(oCreateData);

        // Handle creation
        oContext
          .created()
          .then(
            function () {
              MessageToast.show("Rule created successfully");
              this._resetForm();
              this._navigateBack();
            }.bind(this)
          )
          .catch(function (oError) {
            MessageBox.error(
              "Error creating rule: " + (oError.message || "Unknown error")
            );
            console.error("Creation error:", oError);
          });
      },

      _validateRequiredFields: function () {
        var oData = this.getView().getModel().getData();

        // Basic validation for name and target entity
        if (!oData.name || !oData.targetEntity) {
          return false;
        }

        // Validate conditions
        if (oData.conditions && oData.conditions.length > 0) {
          for (var i = 0; i < oData.conditions.length; i++) {
            var oCondition = oData.conditions[i];
            if (
              !oCondition.attribute_name ||
              !oCondition.operator ||
              !oCondition.value
            ) {
              return false;
            }
          }
        }

        return true;
      },

      /**
       * Cancels the creation and navigates back
       */
      onCancel: function () {
        var oModel = this.getView().getModel();
        var oData = oModel.getData();

        // Check if there are unsaved changes
        if (oData.name || oData.description || oData.entity_name) {
          MessageBox.confirm(
            "You have unsaved changes. Do you want to leave without saving?",
            {
              onClose: function (sAction) {
                if (sAction === MessageBox.Action.OK) {
                  this._resetForm();
                  this._navigateBack();
                }
              }.bind(this),
            }
          );
        } else {
          this._navigateBack();
        }
      },

      /**
       * Adds a new condition row to the table
       */
      onAddCondition: function () {
        var oModel = this.getView().getModel();
        var aConditions = oModel.getProperty("/conditions") || [];

        // Add new empty condition
        aConditions.push({
          attribute_name: "",
          operator: "=",
          value: "",
        });

        oModel.setProperty("/conditions", aConditions);
        MessageToast.show("New condition added");
      },

      /**
       * Deletes a condition from the table
       */
      onDeleteCondition: function (oEvent) {
        var oModel = this.getView().getModel();
        var aConditions = oModel.getProperty("/conditions");
        var oBindingContext = oEvent
          .getParameter("listItem")
          .getBindingContext();
        var iIndex = oBindingContext.getPath().split("/").pop();

        // Remove the condition
        aConditions.splice(parseInt(iIndex), 1);
        oModel.setProperty("/conditions", aConditions);
        MessageToast.show("Condition deleted");
      },

      onAddAction: function () {
        var oModel = this.getView().getModel();
        var aActions = oModel.getProperty("/actions") || [];

        // Add new empty condition
        aActions.push({
          attribute_name: "",
          operator: "=",
          value: "",
        });

        oModel.setProperty("/Actions", aActions);
        MessageToast.show("New action added");
      },

      /**
       * Deletes a actions from the table
       */
      onDeleteAction: function (oEvent) {
        var oModel = this.getView().getModel();
        var aActions = oModel.getProperty("/Actions");
        var oBindingContext = oEvent
          .getParameter("listItem")
          .getBindingContext();
        var iIndex = oBindingContext.getPath().split("/").pop();

        // Remove the condition
        aActions.splice(parseInt(iIndex), 1);
        oModel.setProperty("/Actions", aActions);
        MessageToast.show("Action deleted");
      },

      /**
       * Handle value help for target entity selection
       */
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

        // Create JSONModel for service document
        var oJsonModel = new JSONModel();
        oJsonModel.loadData("/odata/v4/business-partner"); // loads { value: [...] }

        this._entityDialog.then(
          function (oDialog) {
            oDialog.setModel(oJsonModel, "bpServiceDoc");
            // Open the dialog
            oDialog.open();
          }.bind(this)
        );
      },

      /**
       * Handles entity dialog confirmation
       */
      onEntityDialogConfirm: function (oEvent) {
        var oSelectedItem =
          oEvent.getParameter("selectedItem") || oEvent.getSource().getParent();

        if (oSelectedItem) {
          var sSelectedText = oSelectedItem.getTitle();
          // Update the input field
          this.byId("createTargetEntityInput").setValue(sSelectedText);
          // Update the model
          var oModel = this.getView().getModel();
          oModel.setProperty("/targetEntity", sSelectedText);
        }
      },

      /**
       * Handles entity search in dialog
       */
      onEntitySearch: function (oEvent) {
        var sValue =
          oEvent.getParameter("value") || oEvent.getParameter("newValue");

        var aFilters = [];
        if (sValue) {
          aFilters = [
            new Filter("name", FilterOperator.Contains, sValue),
            new Filter("url", FilterOperator.Contains, sValue),
          ];

          aFilters = [
            new Filter({
              filters: aFilters,
              and: false,
            }),
          ];
        }
        var oBinding = oEvent.getSource().getBinding("items");
        oBinding.filter(aFilters);
      },

      /**
       * Handle value help for field selection
       */
      handleFieldValueHelp: function (oEvent) {
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

        // Get the target entity from the model
        var oModel = this.getView().getModel();
        var sEntity = oModel.getProperty("/entity_name");

        if (!sEntity) {
          MessageToast.show("Please select a target entity first");
          return;
        }

        // Store the source control for later reference
        this._oFieldHelpSource = oEvent.getSource();

        // Load metadata and extract only fields of that entity
        fetch("/odata/v4/business-partner/$metadata")
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

              var oFieldModel = new JSONModel({
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
            MessageToast.show("Error loading field metadata");
          });
      },

      /**
       * Handles field dialog confirmation
       */
      onFieldDialogConfirm: function (oEvent) {
        var oSelectedItem = oEvent.getParameter("selectedItem");

        if (oSelectedItem && this._oFieldHelpSource) {
          var sFieldName = oSelectedItem.getTitle();
          // Update the source input field
          this._oFieldHelpSource.setValue(sFieldName);

          // Update the model - get the binding context of the source
          var oBindingContext = this._oFieldHelpSource.getBindingContext();
          if (oBindingContext) {
            var oModel = this.getView().getModel();
            oModel.setProperty(
              oBindingContext.getPath() + "/fieldName",
              sFieldName
            );
          }
        }

        // Clear the source reference
        this._oFieldHelpSource = null;
      },

      /**
       * Handles field search in dialog
       */
      onFieldSearch: function (oEvent) {
        var sValue =
          oEvent.getParameter("value") || oEvent.getParameter("newValue");
        var oFilter = new Filter("name", FilterOperator.Contains, sValue);
        var oBinding = oEvent.getSource().getBinding("items");
        oBinding.filter([oFilter]);
      },

      /**
       * Resets the form to initial state
       * @private
       */
      _resetForm: function () {
        var oModel = this.getView().getModel();
        oModel.setData({
          name: "",
          description: "",
          entity_service_name: "BusinessPartnerService",
          entity_name: "",
          andBinaryOperator: true,
          priority: "Medium",
          conditions: [],
          actions: [],
        });
      },

      /**
       * Navigates back to the previous view
       * @private
       */
      _navigateBack: function () {
        if (this.oRouter) {
          this.oRouter.navTo("List");
        } else {
          window.history.go(-1);
        }
      },
    });
  }
);
