const { v4: uuid } = require("uuid");
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

    return super.init();
  }
  async handleGetViolations(req) {
    const { ruleID } = req.data;
    const { Rules, Violations, PrimaryKeys, Elements } = this.entities;
    await DELETE.from(Violations);
    const rule = await SELECT.one.from(Rules).where({ ID: ruleID });
    if (rule == undefined) {
      return req.error(`Rule_Not_Found`);
    }
    const service = rule.entity_service_name;
    const remoteService = await cds.connect.to(service);

    const keys = await SELECT.from(PrimaryKeys).where({
      entity_name: rule.entity_name,
      entity_service_name: rule.entity_service_name,
    }).columns`elementName`;
    const violations = await this.generateConditionsQueries(
      rule,
      remoteService,
      keys
    );
    console.log(violations);
    for (const v of violations) {
      const newID = uuid();
      await INSERT.into(Violations).entries({ ID: newID, rule_ID: ruleID });
      for (const [key, value] of Object.entries(v)) {
        await INSERT.into(Elements).entries({
          value,
          attribute_name: key,
          attribute_entity_name: rule.entity_name,
          attribute_entity_service_name: rule.entity_service_name,
          violation_ID: newID,
        });
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
    const { type: AttributeType } = await SELECT.one.from(Attributes).where({
      name: attribute_name,
      entity_name: attribute_entity_name,
      entity_service_name: attribute_entity_service_name,
    }).columns`type`;
    return AttributeType === "number";
  }
  async generateAndWhere(queries, query, type) {
    for (let i = 0; i < queries.length; i++) {
      const querie = queries[i];
      const isNumeric = await this.isNumericAttribute(
        querie.attribute_name,
        querie.attribute_entity_name,
        querie.attribute_entity_service_name
      );

      let value;
      if (isNumeric) {
        value = Number(querie.value);
      } else {
        value = querie.value;
      }

      const whereCondition = this.generateSelectQuery(
        value,
        querie.operator,
        type === "condition",
        querie.attribute_name
      );
      query.where(whereCondition);
    }
  }

  async generateConditionsQueries(rule, remoteService, keys) {
    const { Conditions, Actions } = this.entities;
    const keyColumns = keys.map((k) => k.elementName);
    const actions = await SELECT.from(Actions).where({
      rule_ID: rule.ID,
    });
    if (actions.length === 0) {
      return [];
    }
    const conditions = await SELECT.from(Conditions).where({
      rule_ID: rule.ID,
    });

    const query = SELECT.from(rule.entity_name);
    await this.generateAndWhere(actions, query, "action");
    if (rule.andBinaryOperator) {
      await this.generateAndWhere(conditions, query, "condition");

      query.columns(keyColumns);
      console.log("Preparing to send query to remote service:", {
        service: remoteService.name,
        query: JSON.stringify(query),
      });
      return await remoteService.run(query);
    } else {
      const subSet = [];
      const seenKeys = new Set();

      for (let i = 0; i < conditions.length; i++) {
        const querie = conditions[i];

        try {
          const isNumeric = await this.isNumericAttribute(
            querie.attribute_name,
            querie.attribute_entity_name,
            querie.attribute_entity_service_name
          );

          let value;
          if (isNumeric) {
            value = Number(querie.value);
          } else {
            value = querie.value;
          }

          const whereCondition = this.generateSelectQuery(
            value,
            querie.operator,
            true,
            querie.attribute_name
          );

          query.where(whereCondition).columns(keyColumns);

          const res = await remoteService.run(query);

          if (Array.isArray(res)) {
            for (const record of res) {
              const recordKey = JSON.stringify(record);
              if (!seenKeys.has(recordKey)) {
                seenKeys.add(recordKey);
                subSet.push(record);
              }
            }
          }
        } catch (error) {
          console.warn(`Error in OR condition ${i + 1}:`, error.message);
        }
      }
      return subSet;
    }
  }

  /**
   * Generates a SELECT query with the opposite operator
   * @param {any} value1 - First value for comparison
   * @param {string} operator - The original operator
   * @param {boolean} condition - if condition or Action
   * @param {boolean} isNumeric - if the value should be treated as numeric (optional)
   * @param {boolean} field - filed ro compare with
   * @returns {Object} CDS SELECT query object or raw expression string for numeric comparisons
   */
  generateSelectQuery(value1, operator, condition, field) {
    let operation = operator;
    if (!condition) {
      operation = this.getOppositeOperator(operator);
    }

    let sanitizedValue = value1;
    if (typeof value1 === "string") {
      sanitizedValue = value1.trim();
    }
    console.log("condition");

    let whereCondition = {};

    switch (operation) {
      case "!=":
      case "<>":
        whereCondition[field] = { "!=": sanitizedValue };
        break;
      case "=":
        whereCondition[field] = sanitizedValue;
        break;
      case ">=":
        whereCondition[field] = { ">=": sanitizedValue };
        break;
      case "<=":
        whereCondition[field] = { "<=": sanitizedValue };
        break;
      case ">":
        whereCondition[field] = { ">": sanitizedValue };
        break;
      case "<":
        whereCondition[field] = { "<": sanitizedValue };
        break;

      // ✅ OData-friendly string ops
      case "LIKE":
        if (sanitizedValue.startsWith("%") && sanitizedValue.endsWith("%")) {
          whereCondition = {
            func: "substringof",
            args: [sanitizedValue.slice(1, -1), { ref: [field] }],
          };
        } else if (sanitizedValue.startsWith("%")) {
          whereCondition = {
            func: "endswith",
            args: [{ ref: [field] }, sanitizedValue.slice(1)],
          };
        } else if (sanitizedValue.endsWith("%")) {
          whereCondition = {
            func: "startswith",
            args: [{ ref: [field] }, sanitizedValue.slice(0, -1)],
          };
        } else {
          // no wildcards → plain equals
          whereCondition[field] = sanitizedValue;
        }
        break;

      case "NOT LIKE":
        throw new Error(
          "NOT LIKE not directly supported in OData — handle manually with NOT(...) wrapper"
        );

      case "IN":
        whereCondition[field] = {
          in: Array.isArray(sanitizedValue) ? sanitizedValue : [sanitizedValue],
        };
        break;
      case "NOT IN":
        whereCondition[field] = {
          "not in": Array.isArray(sanitizedValue)
            ? sanitizedValue
            : [sanitizedValue],
        };
        break;

      case "IS NOT NULL":
        whereCondition[field] = { "!=": null };
        break;
      case "IS NULL":
        whereCondition[field] = null;
        break;

      case "STARTS WITH":
        whereCondition = {
          func: "startswith",
          args: [{ ref: [field] }, `'${sanitizedValue}'`],
        };
        break;
      case "NOT STARTS WITH":
        whereCondition = [
          "not",
          {
            func: "startswith",
            args: [{ ref: [field] }, `'${sanitizedValue}'`],
          },
        ];
        break;
      case "ENDS WITH":
        whereCondition = {
          func: "endswith",
          args: [{ ref: [field] }, `'${sanitizedValue}'`],
        };
        break;
      case "NOT ENDS WITH":
        whereCondition = [
          "not",
          {
            func: "endswith",
            args: [{ ref: [field] }, `'${sanitizedValue}'`],
          },
        ];
        break;
      case "CONTAINS":
        whereCondition = {
          func: "substringof",
          args: [{ val: sanitizedValue }, `'${sanitizedValue}'`],
        };
        break;
      case "NOT CONTAINS":
        whereCondition = [
          "not",
          {
            func: "substringof",
            args: [{ val: sanitizedValue }, `'${sanitizedValue}'`],
          },
        ];
        break;

      default:
        throw new Error(`Unsupported operator: ${operation}`);
    }

    return whereCondition;
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

  /**
   * @param {string} operator - The operator to check
   * @returns {boolean} True if operator is numeric
   */
  isNumericOperator(operator) {
    const numericOperators = ["=", "!=", "<>", ">", "<", ">=", "<="];
    return numericOperators.includes(operator);
  }

  async querieConfig(req, entity) {
    let {
      attribute_name,
      value,
      attribute_entity_name,
      attribute_entity_service_name,
      operator,
      rule_ID,
    } = req.data;
    const entityName = entity || req.target.name.split(".").pop();
    console.log("this entity=" + entityName);

    const { Attributes, Rules, Actions, Conditions } = this.entities;
    const ID = req.params[0];
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
      if (rule) {
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

        req.data.description = description ?? existingRule.description;
        req.data.andBinaryOperator =
          andBinaryOperator ?? existingRule.andBinaryOperator;

        if (entity_name === undefined && entity_service_name === undefined) {
          req.data.entity_name = existingRule.entity_name;
          req.data.entity_service_name = existingRule.entity_service_name;
        } else {
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
    }

    if (req.event === "CREATE") {
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
            `Service '${entity_service_name}' does not match entity '${entity_name}'`,
          ]);
        }
      } catch (error) {
        return req.error("Create_Validation_Failed", [
          `Failed to validate create data: ${error.message}`,
        ]);
      }
    }

    await this.processNestedItems(req.data.Conditions, "Conditions");
    await this.processNestedItems(req.data.Actions, "Actions");
  }
  async processNestedItems(nestedItems, entityType) {
    if (!Array.isArray(nestedItems) || nestedItems.length === 0) {
      return;
    }

    for (let i = 0; i < nestedItems.length; i++) {
      const item = nestedItems[i];

      const mockReq = {
        event: "CREATE",
        target: { name: `RuleService.${entityType}` },
        data: { ...item },
        params: [],
        error: (code, details) => {
          throw new Error(
            `${entityType} validation failed: ${code} - ${details}`
          );
        },
      };

      await this.querieConfig(mockReq);

      // Update the nested item with processed data
      nestedItems[i] = mockReq.data;
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
