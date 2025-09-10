class RuleService extends cds.ApplicationService {
  init() {
    const { Queries, Rules } = this.entities;
    this.before(["CREATE", "UPDATE"], "Rules", this.ruleConfig);
    this.before(
      ["CREATE", "UPDATE"],
      ["Actions", "Conditions"],
      this.querieConfig
    );
    this.on("getViolations", this.handleGetViolations);
    this.on("getSelects", this.handleSelect);
    return super.init();
  }
  async handleSelect(req) {
    const { ruleID } = req.data;
    const { Elements, Rules } = this.entities;
    const rule = await SELECT.one.from(Rules).where({ ID: ruleID });
    const subSet = await this.generateSubSet(rule, Elements);
    return subSet;
  }
  async handleGetViolations(req) {
    const { ruleID } = req.data;
    const { Rules, Actions, Violations, Elements } = this.entities;
    await DELETE.from(Violations);
    const rule = await SELECT.one.from(Rules).where({ ID: ruleID });
    if (rule == undefined) {
      return req.error(`Rule_Not_Found`);
    }
    const queries = await SELECT.from(Actions).where({ rule_ID: rule.ID });

    const subSet = await this.generateSubSet(rule, Elements);
    let violations = [];
    for (const querie of queries) {
      let records = subSet.map((rec) => rec.record_ID);
      const whereCondition = this.generateSelectQuery(
        querie.value,
        querie.operator,
        false
      );
      const elements = await SELECT.from(Elements).where({
        record_ID: { in: records },
        attribute_name: querie.attribute_name,
        ...whereCondition,
      }).columns`record_ID`;
      for (const e of elements) {
        if (!violations.includes(e)) {
          await INSERT.into(Violations).entries({
            rule_ID: ruleID,
            record_ID: e.record_ID,
          });
          violations.push(e);
        }
      }
    }
    return SELECT.from(Violations);
  }

  async isNumericAttribute(
    attribute_name,
    attribute_entity_name,
    attribute_entity_service_name
  ) {
    const { Attributes } = this.entities;
    console.log(
      attribute_name,
      attribute_entity_name,
      attribute_entity_service_name
    );
    const { type: AttributeType } = await SELECT.one.from(Attributes).where({
      name: attribute_name,
      entity_name: attribute_entity_name,
      entity_service_name: attribute_entity_service_name,
    }).columns`type`;
    if (!AttributeType) {
      return false;
    }

    return AttributeType === "number";
  }

  async generateSubSet(rule, Elements) {
    const { Conditions } = this.entities;
    const conditions = await SELECT.from(Conditions).where({
      rule_ID: rule.ID,
    });

    if (conditions.length === 0) return [];

    let subSet = [];

    if (rule.andBinaryOperator) {
      for (let i = 0; i < conditions.length; i++) {
        const querie = conditions[i];
        const isNumeric = await this.isNumericAttribute(
          querie.attribute_name,
          querie.attribute_entity_name,
          querie.attribute_entity_service_name
        );

        const whereCondition = this.generateSelectQuery(
          querie.value,
          querie.operator,
          true,
          isNumeric
        );

        let elements;

        if (isNumeric && typeof whereCondition === "string") {
          elements = await SELECT.from(Elements).where(
            cds.parse.expr(`
            attribute_name = '${querie.attribute_name}' AND 
            attribute_entity_name = '${querie.attribute_entity_name}' AND 
            attribute_entity_service_name = '${querie.attribute_entity_service_name}' AND 
            ${whereCondition}
          `)
          ).columns`record_ID`;
        } else {
          elements = await SELECT.from(Elements).where({
            attribute_name: querie.attribute_name,
            attribute_entity_name: querie.attribute_entity_name,
            attribute_entity_service_name: querie.attribute_entity_service_name,
            ...whereCondition,
          }).columns`record_ID`;
        }

        if (i === 0) {
          subSet = [...elements];
        } else {
          const elementIds = new Set(elements.map((e) => e.record_ID));
          subSet = subSet.filter((record) => elementIds.has(record.record_ID));
        }
        if (subSet.length === 0) break;
      }
    } else {
      for (const querie of conditions) {
        const isNumeric = await this.isNumericAttribute(
          querie.attribute_name,
          querie.attribute_entity_name,
          querie.attribute_entity_service_name
        );
        console.log(isNumeric);
        const whereCondition = this.generateSelectQuery(
          querie.value,
          querie.operator,
          true,
          isNumeric
        );
        let elements;
        if (isNumeric && typeof whereCondition === "string") {
          elements = await SELECT.from(Elements).where(
            cds.parse.expr(`
            attribute_name = '${querie.attribute_name}' AND 
            attribute_entity_name = '${querie.attribute_entity_name}' AND 
            attribute_entity_service_name = '${querie.attribute_entity_service_name}' AND 
            ${whereCondition}
          `)
          ).columns`record_ID`;
        } else {
          elements = await SELECT.from(Elements).where({
            attribute_name: querie.attribute_name,
            attribute_entity_name: querie.attribute_entity_name,
            attribute_entity_service_name: querie.attribute_entity_service_name,
            ...whereCondition,
          }).columns`record_ID`;
        }

        elements.forEach((element) => {
          if (!subSet.includes(element.record_ID)) {
            subSet.push(element);
          }
        });
      }
    }

    return subSet;
  }

  /**
   * Generates a SELECT query with the opposite operator
   * @param {any} value1 - First value for comparison
   * @param {string} operator - The original operator
   * @param {boolean} condition - if condition or Action
   * @param {boolean} isNumeric - if the value should be treated as numeric (optional)
   * @returns {Object} CDS SELECT query object or raw expression string for numeric comparisons
   */
  generateSelectQuery(value1, operator, condition, isNumeric = false) {
    let operation = operator;
    if (!condition) {
      operation = this.getOppositeOperator(operator);
    }
    console.log(isNumeric);
    if (isNumeric && this.isNumericOperator(operation)) {
      return this.generateNumericCondition(value1, operation);
    }

    let whereCondition = {};
    const field = "value";

    switch (operation) {
      case "!=":
      case "<>":
        whereCondition[field] = { "!=": value1 };
        break;
      case "=":
        whereCondition[field] = value1;
        break;
      case ">=":
        whereCondition[field] = { ">=": value1 };
        break;
      case "<=":
        whereCondition[field] = { "<=": value1 };
        break;
      case ">":
        whereCondition[field] = { ">": value1 };
        break;
      case "<":
        whereCondition[field] = { "<": value1 };
        break;
      case "NOT LIKE":
        whereCondition[field] = { "not like": value1 };
        break;
      case "LIKE":
        whereCondition[field] = { like: value1 };
        break;
      case "NOT IN":
        whereCondition[field] = {
          "not in": Array.isArray(value1) ? value1 : [value1],
        };
        break;
      case "IN":
        whereCondition[field] = {
          in: Array.isArray(value1) ? value1 : [value1],
        };
        break;
      case "IS NOT NULL":
        whereCondition[field] = { "!=": null };
        break;
      case "IS NULL":
        whereCondition[field] = null;
        break;
      case "STARTS WITH":
        whereCondition[field] = { like: `${value1}%` };
        break;
      case "NOT STARTS WITH":
        whereCondition[field] = { "not like": `${value1}%` };
        break;
      case "ENDS WITH":
        whereCondition[field] = { like: `%${value1}` };
        break;
      case "NOT ENDS WITH":
        whereCondition[field] = { "not like": `%${value1}` };
        break;
      case "CONTAINS":
        whereCondition[field] = { like: `%${value1}%` };
        break;
      case "NOT CONTAINS":
        whereCondition[field] = { "not like": `%${value1}%` };
        break;
      default:
        throw new Error(`Unsupported operator: ${operation}`);
    }
    return whereCondition;
  }

  /**
   * @param {string} operator - The operator to check
   * @returns {boolean} True if operator is numeric
   */
  isNumericOperator(operator) {
    const numericOperators = ["=", "!=", "<>", ">", "<", ">=", "<="];
    return numericOperators.includes(operator);
  }

  /**
   * Generates numeric condition using database casting
   * @param {any} value1 - The value to compare
   * @param {string} operation - The operator
   * @returns {string} Raw SQL expression for numeric comparison
   */
  generateNumericCondition(value1, operation) {
    const numericValue = parseInt(value1);
    if (isNaN(numericValue)) {
      throw new Error(`Invalid numeric value: ${value1}`);
    }

    switch (operation) {
      case "=":
        return `CAST(value AS cds.Integer) = ${numericValue}`;
      case "!=":
      case "<>":
        return `CAST(value AS cds.Integer) != ${numericValue}`;
      case ">":
        return `CAST(value AS cds.Integer) > ${numericValue}`;
      case "<":
        return `CAST(value AS cds.Integer) < ${numericValue}`;
      case ">=":
        return `CAST(value AS cds.Integer) >= ${numericValue}`;
      case "<=":
        return `CAST(value AS cds.Integer) <= ${numericValue}`;
      default:
        throw new Error(`Unsupported numeric operator: ${operation}`);
    }
  }

  /**
   * Returns the opposite operator for a given operator
   * @param {string} operator - The original operator
   * @returns {string} The opposite operator
   */
  getOppositeOperator(operator) {
    const operatorMap = {
      "=": "!=",
      "!=": "=",
      "<>": "=",
      ">": "<=",
      "<": ">=",
      ">=": "<",
      "<=": ">",
      LIKE: "NOT LIKE",
      "NOT LIKE": "LIKE",
      IN: "NOT IN",
      "NOT IN": "IN",
      "IS NULL": "IS NOT NULL",
      "IS NOT NULL": "IS NULL",
      BETWEEN: "NOT BETWEEN",
      "NOT BETWEEN": "BETWEEN",
      "STARTS WITH": "NOT STARTS WITH",
      "NOT STARTS WITH": "STARTS WITH",
      "ENDS WITH": "NOT ENDS WITH",
      "NOT ENDS WITH": "ENDS WITH",
      CONTAINS: "NOT CONTAINS",
      "NOT CONTAINS": "CONTAINS",
    };

    const normalizedOperator = operator.toUpperCase();
    const opposite = operatorMap[normalizedOperator];

    if (!opposite) {
      throw new Error(`No opposite operator defined for: ${operator}`);
    }

    return opposite;
  }

  async querieConfig(req) {
    let {
      attribute_name,
      value,
      attribute_entity_name,
      attribute_entity_service_name,
      operator,
      rule_ID,
    } = req.data;
    const entityName = req.target.name.split(".").pop();
    const { Attributes, Rules, Actions, Conditions } = this.entities;
    const ID = req.params[0];
    console.log(operator);
    const querie = entityName === "Conditions" ? Conditions : Actions;
    if (req.event === "UPDATE" && ID) {
      try {
        const existingQuerie = await this.read(querie, ID);
        if (!existingQuerie) {
          return req.error(`INEXISTING_ELEMENT_TO_UPDATE`);
        }
        if (value === undefined || value === null) {
          req.data.value = existingQuerie.value;
        }
        if (operator === undefined || operator === null) {
          req.data.operator = existingQuerie.operator;
        }
        if (rule_ID == undefined || rule_ID === null) {
          req.data.rule_ID = existingQuerie.rule_ID;
        }
        const rule = await SELECT.one
          .from(Rules)
          .where({ ID: req.data.rule_ID });
        if (
          attribute_entity_service_name === undefined ||
          attribute_entity_service_name === null
        ) {
          req.data.attribute_entity_service_name =
            existingQuerie.attribute_entity_service_name;
        }
        if (
          req.data.attribute_entity_service_name !== rule.entity_service_name
        ) {
          return req.error(`Missmatching_data`);
        }

        if (
          attribute_entity_name === undefined ||
          attribute_entity_name === null
        ) {
          req.data.attribute_entity_name = existingQuerie.attribute_entity_name;
        }
        if (req.data.attribute_entity_name !== rule.entity_name) {
          return req.error(`Missmatching_data`);
        }
        if (attribute_name == undefined || attribute_name === null) {
          req.data.attribute_name = existingQuerie.attribute_name;
        }
        const attribute = await SELECT.one.from(Attributes).where({
          name: req.data.attribute_name,
          entity_name: req.data.attribute_entity_name,
          entity_service_name: req.data.attribute_entity_service_name,
        });
        if (!attribute) {
          return req.error(`Missmatching_data`);
        }
      } catch (err) {
        console.log(err);
      }
    } else if (req.event === "CREATE") {
      const rule = await SELECT.one.from(Rules).where({
        ID: rule_ID,
      });
      if (
        attribute_entity_name === null ||
        attribute_entity_name === undefined
      ) {
        attribute_entity_name = rule.entity_name;
        req.data.attribute_entity_name = rule.entity_name;
      } else if (attribute_entity_name !== rule.entity_name) {
        return req.error(`Invalid_Inserted_Data`);
      }

      if (
        attribute_entity_service_name === null ||
        attribute_entity_service_name === undefined
      ) {
        attribute_entity_service_name = rule.entity_service_name;
        req.data.attribute_entity_service_name = rule.entity_service_name;
      } else if (attribute_entity_service_name !== rule.entity_service_name) {
        return req.error(`Invalid_Inserted_Data`);
      }
      const attributeResult = await SELECT.one.from(Attributes).where({
        name: attribute_name,
        entity_name: attribute_entity_name,
        entity_service_name: attribute_entity_service_name,
      }).columns`type`;

      if (!attributeResult) {
        return req.error("Attribute_Not_Found", [
          `Attribute '${attribute_name}' not found in entity '${attribute_entity_name}' of service '${attribute_entity_service_name}'`,
        ]);
      }

      const AttributeType = attributeResult.type;

      try {
        const checked = this.checkthOperation(AttributeType, operator);
        if (!checked) {
          return req.error("Invalid_Operation", [
            `Operator '${operator}' is not valid for attribute type '${AttributeType}'`,
          ]);
        }
      } catch (error) {
        return req.error("Operation_Check_Failed", [error.message]);
      }

      let queryValue;
      try {
        queryValue = convertor(value, AttributeType);
      } catch (error) {
        return req.error(error.message, [value, AttributeType]);
      }
    }
  }

  /**
   * Checks if an operation can be performed on a given attribute type
   * @param {string} attributeType - The attribute type (string, number, boolean, etc.)
   * @param {string} operator - The operator to check
   * @returns {boolean} True if operation is valid, false otherwise
   * @throws {Error} If attribute type is unsupported
   */
  checkthOperation(attributeType, operator) {
    console.log(
      "Checking operation for type:",
      attributeType,
      "operator:",
      operator
    );

    if (!attributeType || !operator) {
      return false;
    }

    const normalizedType = attributeType.toLowerCase().trim();
    const normalizedOperator = operator.toUpperCase().trim();

    // Define valid operators for each type
    const typeOperators = {
      string: [
        "=",
        "!=",
        "<>",
        "LIKE",
        "NOT LIKE",
        "IN",
        "NOT IN",
        "IS NULL",
        "IS NOT NULL",
        "STARTS WITH",
        "NOT STARTS WITH",
        "ENDS WITH",
        "NOT ENDS WITH",
        "CONTAINS",
        "NOT CONTAINS",
      ],
      number: [
        "=",
        "!=",
        "<>",
        ">",
        "<",
        ">=",
        "<=",
        "IN",
        "NOT IN",
        "IS NULL",
        "IS NOT NULL",
        "BETWEEN",
        "NOT BETWEEN",
      ],
      integer: [
        "=",
        "!=",
        "<>",
        ">",
        "<",
        ">=",
        "<=",
        "IN",
        "NOT IN",
        "IS NULL",
        "IS NOT NULL",
        "BETWEEN",
        "NOT BETWEEN",
      ],
      decimal: [
        "=",
        "!=",
        "<>",
        ">",
        "<",
        ">=",
        "<=",
        "IN",
        "NOT IN",
        "IS NULL",
        "IS NOT NULL",
        "BETWEEN",
        "NOT BETWEEN",
      ],
      double: [
        "=",
        "!=",
        "<>",
        ">",
        "<",
        ">=",
        "<=",
        "IN",
        "NOT IN",
        "IS NULL",
        "IS NOT NULL",
        "BETWEEN",
        "NOT BETWEEN",
      ],
      boolean: ["=", "!=", "<>", "IS NULL", "IS NOT NULL"],
      date: [
        "=",
        "!=",
        "<>",
        ">",
        "<",
        ">=",
        "<=",
        "IN",
        "NOT IN",
        "IS NULL",
        "IS NOT NULL",
        "BETWEEN",
        "NOT BETWEEN",
      ],
      datetime: [
        "=",
        "!=",
        "<>",
        ">",
        "<",
        ">=",
        "<=",
        "IN",
        "NOT IN",
        "IS NULL",
        "IS NOT NULL",
        "BETWEEN",
        "NOT BETWEEN",
      ],
      timestamp: [
        "=",
        "!=",
        "<>",
        ">",
        "<",
        ">=",
        "<=",
        "IN",
        "NOT IN",
        "IS NULL",
        "IS NOT NULL",
        "BETWEEN",
        "NOT BETWEEN",
      ],
      uuid: ["=", "!=", "<>", "IN", "NOT IN", "IS NULL", "IS NOT NULL"],
      guid: ["=", "!=", "<>", "IN", "NOT IN", "IS NULL", "IS NOT NULL"],
      binary: ["=", "!=", "<>", "IS NULL", "IS NOT NULL"],
      object: ["=", "!=", "<>", "IS NULL", "IS NOT NULL"],
      array: ["=", "!=", "<>", "IS NULL", "IS NOT NULL"],
    };

    // Check if the type is supported
    if (!typeOperators[normalizedType]) {
      throw new Error(`Unsupported_Attribute_Type: ${attributeType}`);
    }

    // Check if the operator is valid for this type
    const validOperators = typeOperators[normalizedType];
    return validOperators.includes(normalizedOperator);
  }
  // Register the handler properl

  async ruleConfig(req) {
    const ID = req.params[0];
    const { entity_service_name, entity_name, description, andBinaryOperator } =
      req.data;
    const { Entities, Rules } = this.entities;

    if (req.event === "UPDATE" && ID) {
      try {
        const existingRule = await this.read(Rules, ID);
        if (!existingRule) {
          return req.error("Rule_Not_Found", [`Rule with ID ${ID} not found`]);
        }

        // Set defaults for undefined values (preserve existing data)
        if (description === undefined) {
          req.data.description = existingRule.description;
        }
        if (andBinaryOperator === undefined) {
          req.data.andBinaryOperator = existingRule.andBinaryOperator;
        }

        if (entity_name === undefined && entity_service_name === undefined) {
          req.data.entity_name = existingRule.entity_name;
          req.data.entity_service_name = existingRule.entity_service_name;
        } else if (
          entity_name !== undefined ||
          entity_service_name !== undefined
        ) {
          req.data.entity_name = entity_name || existingRule.entity_name;
          req.data.entity_service_name =
            entity_service_name || existingRule.entity_service_name;
          const entityInfo = await SELECT.one
            .from(Entities)
            .where({
              name: req.data.entity_name,
              entity_service_name: req.data.entity_service_name,
            })
            .columns(["service_name"]);

          if (!entityInfo) {
            return req.error("Entity_Not_Found", [
              `Entity '${entity_name}' not found`,
            ]);
          }
        }
      } catch (error) {
        return req.error("Update_Validation_Failed", [
          `Failed to validate update data: ${error.message}`,
        ]);
      }
    } else if (req.event === "CREATE") {
      try {
        if (!entity_name) {
          return req.error("Missing_Required_Field", [
            "entity_name is required for rule creation",
          ]);
        }

        const entityInfo = await SELECT.one
          .from(Entities)
          .where({ name: entity_name, service_name: entity_service_name })
          .columns(["service_name"]);

        if (!entityInfo) {
          return req.error("Service_Mismatch", [
            `Service '${entity_service_name}' does not match entity '${entity_name}' service '${entityInfo.service_name}'`,
          ]);
        }
      } catch (error) {
        return req.error("Create_Validation_Failed", [
          `Failed to validate create data: ${error.message}`,
        ]);
      }
    }
  }
}
/**
 * Converts a string value to its corresponding type
 * @param {string} stringValue - The string value to convert
 * @param {string} targetType - The target type
 */
function convertor(stringValue, targetType) {
  if (stringValue === null || stringValue === undefined || stringValue === "") {
    return null;
  }

  const str = String(stringValue).trim();

  switch (targetType.toLowerCase()) {
    case "number":
      if (str === "" || str === "null" || str === "undefined") return null;
      const num = Number(str);
      if (isNaN(num)) throw new Error(`Invalid_Operation`);
      return num;

    case "string":
    case "text":
      return str;

    case "boolean":
    case "bool":
      const lowerStr = str.toLowerCase();
      if (["true", "1", "yes", "on", "enabled"].includes(lowerStr)) return true;
      if (["false", "0", "no", "off", "disabled"].includes(lowerStr))
        return false;
      throw new Error(`Invalid_Operation`);

    case "date":
      if (str === "" || str === "null" || str === "undefined") return null;
      try {
        const date = new Date(str);
        return isNaN(date.getTime()) ? null : date.toISOString();
      } catch (error) {
        throw new Error(`Invalid_Operation`);
      }

    case "object":
      if (str === "" || str === "null" || str === "undefined") return null;
      try {
        return JSON.parse(str);
      } catch (error) {
        throw new Error(`Invalid_Operation`);
      }

    case "array":
      if (str === "" || str === "null" || str === "undefined") return [];
      try {
        const parsed = JSON.parse(str);
        return Array.isArray(parsed) ? parsed : [str];
      } catch (error) {
        throw new Error(`Invalid_Operation`);
      }

    case "binary":
      return str;

    case "uuid":
    case "guid":
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuidRegex.test(str) ? str : null;

    default:
      console.warn(`Unknown type '${targetType}', returning as string`);
      return str;
  }
}

module.exports = RuleService;
