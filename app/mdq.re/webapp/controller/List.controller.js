sap.ui.define(
  ['sap/ui/core/mvc/Controller', 'sap/m/MessageToast'],
  function (Controller, MessageToast) {
    'use strict'

    return Controller.extend('mdq.re.controller.List', {
      onInit: function () {
        this.oModel = this.getOwnerComponent().getModel()

        // Add route matching for refresh
        var oRouter = sap.ui.core.UIComponent.getRouterFor(this)
        oRouter
          .getRoute('List')
          .attachPatternMatched(this._onRouteMatched, this) 
      },

      _onRouteMatched: function () {
        this._refreshList()
      },

      _refreshList: function () {
        // Option A: Refresh the entire model
        this.oModel.refresh()
      },

      onItemPress: function (oEvent) {
        var oCtx = oEvent.getSource().getBindingContext()
        if (oCtx) {
          var oRule = oCtx.getObject()
          var sRuleId = oRule.ID

          var oRouter = sap.ui.core.UIComponent.getRouterFor(this)
          oRouter.navTo('Rule', {
            ruleId: sRuleId
          })
        }
      },

      onAddRule: function () {
        var oRouter = sap.ui.core.UIComponent.getRouterFor(this)
        oRouter.navTo('Create')
      }
    })
  }
)
