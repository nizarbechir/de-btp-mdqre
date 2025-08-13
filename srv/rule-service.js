const cds = require("@sap/cds");
const { SELECT } = cds.ql;

class RuleService extends cds.ApplicationService {
  init() {
    const { Rules } = this.entities;

    this.before(["CREATE", "UPDATE"], Rules, this.executeRuleHandler);

    // TODO: fix this
    /*
    this.after("READ", Rules, async (data, req) => {
      console.log("READ event triggered"); // remove later
    });
    */

    return super.init();
  }

  async executeRuleHandler(req) {
    console.log("running rule handler..."); // remove later

    const { targetEntity, conditions } = req.data || {};

    if (!targetEntity) {
      req.error(400, "Missing required target entity");
      return;
    }

    // there should be at least one condition
    if (!Array.isArray(conditions) || conditions.length === 0) {
      req.error(400, "A rule must have at least one condition");
      return;
    }

    // look for the entity in the serives else globally
    const target =
      this.entities[targetEntity] || cds.model.definitions[targetEntity];
    if (!target) {
      req.error(400, `Target entity '${targetEntity}' not found`);
      return;
    }

    if (!target.elements) {
      console.error(`Entity has no elements: ${targetEntity}`);
      return;
    }

    let combinedExpr = "";
    for (let i = 0; i < conditions.length; i++) {
      const { fieldName, operator, value, binaryAnd } = conditions[i];
      if (!fieldName || !operator) {
        req.error(400, `Missing parameters in condition ${i + 1}`);
        return;
      }

      const condStr = this.buildConditionString(operator, fieldName, value);

      combinedExpr += condStr;
      // concat after only if not the last condition
      if (i < conditions.length - 1) {
        combinedExpr += binaryAnd ? " AND " : " OR ";
      }
    }

    // Parse the final combined expression
    const combinedCondition = cds.parse.expr(combinedExpr);

    // Execute query
    const result = await SELECT.from(target.name).where(combinedCondition);

    // put the result in the result field
    req.data.results = JSON.stringify(result);

    if (result.length === 0) {
      req.error(400, `Rule validation failed for ${targetEntity}`);
    } else {
      console.log(
        `Rule validation succeeded: ${result.length} matching record(s)`
      );
    }
  }

  buildConditionString(operator, fieldName, value) {
    switch (operator) {
      case "=":
      case ">":
      case "<":
        return `${fieldName} ${operator} '${value}'`;
      case "contains":
        return `contains(${fieldName}, '${value}')`;
      case "startswith":
        return `startswith(${fieldName}, '${value}')`;
      default:
        throw new Error(`Unsupported operator '${operator}'`);
    }
  }
}

module.exports = RuleService;
