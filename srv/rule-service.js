const cds = require("@sap/cds");
const { SELECT } = cds.ql;

class RuleService extends cds.ApplicationService {
  init() {
    const { Rules } = this.entities;

    this.before(["CREATE", "UPDATE"], Rules, this.executeRuleHandler);

    this.after("READ", Rules, async (data, req) => {
      console.log("READ event triggered"); // remove later
    });

    return super.init();
  }

  async executeRuleHandler(req) {
    console.log("running rule handler..."); // remove later

    const { targetEntity, fieldName, operator, value } = req.data || {};

    if (!targetEntity || !fieldName || !operator) {
      req.error(400, "Missing required rule parameters");
      return;
    }

    const target = this.entities[targetEntity] || cds.model.definitions[targetEntity];
    if (!target) {
      req.error(400, `Target entity '${targetEntity}' not found`);
      return;
    }

    //console.log(target.elements)

    if (!target.elements) {
      console.error(`Entity has no elements: ${targetEntity}`);
      return;
    }

    const entityName = target.name;

    let condition;
    switch (operator) {
      case "=":
      case ">":
      case "<":
        condition = cds.parse.expr(`${fieldName} ${operator} '${value}'`);
        break;
      case "contains":
        condition = cds.parse.expr(`contains(${fieldName}, '${value}')`);
        break;
      case "startswith":
        condition = cds.parse.expr(`startswith(${fieldName}, '${value}')`);
        break;
      default:
        req.error(400, `Unsupported operator '${operator}'`);
        return;
    }

    const result = await SELECT.from(entityName).where(condition);
    
    req.data.results = JSON.stringify(result);

    if (result.length === 0) {
      req.error(400, `Rule validation failed for ${targetEntity}`);
    }
  }
}

module.exports = RuleService;
