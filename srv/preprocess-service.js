const cds = require("@sap/cds");

const { SELECT, INSERT, DELETE } = cds.ql;
require("dotenv").config();

cds.once("serving", async () => {
  console.log("🚀🚀🚀 All services are served and app started 🚀🚀🚀");

  const tx = cds.transaction();

  try {
    const services = cds.services;
    const envServices = JSON.parse(process.env.remoteServer);
    const { Elements, Entities, Services } = cds.entities;

    // Validate environment configuration
    console.log("Available services:", Object.keys(services));
    console.log("Environment services:", envServices);

    console.log("🧹🧹🧹 Cleaning existing metadata... 🧹🧹🧹");
    await tx.run(DELETE.from(Elements));
    await tx.run(DELETE.from(Entities));
    await tx.run(DELETE.from(Services));

    // Process services with validation
    for (const service in services) {
      if (
        services[service].options?.kind === "app-service" &&
        !["RuleService", "PreprocessingService"].includes(service)
      ) {
        console.log(`Processing service: ${service}`);

        // Validate service exists in environment configuration
        const remoteServiceName = envServices[service];
        if (!remoteServiceName) {
          console.warn(
            `⚠️  No remote service configured for '${service}'. Available: ${Object.keys(
              envServices
            ).join(", ")}`
          );
          continue;
        }

        try {
          console.log(`Connecting to: ${remoteServiceName}`);
          const remoteService = await cds.connect.to(remoteServiceName);
          await preProcessServices(tx, services[service], remoteService);
          console.log(`✅ Successfully processed ${service}`);
        } catch (error) {
          console.error(`❌ Failed to process ${service}:`, error.message);
          // Continue with other services instead of failing completely
        }
      }
    }

    await tx.commit();
    console.log("✅✅✅ All external services processed successfully!✅✅✅");
  } catch (err) {
    await tx.rollback();
    console.error("Error during service processing:", err);
  }
});

async function preProcessServices(tx, srv, remoteService) {
  const { Services } = cds.entities;

  // Insert service record
  await tx.run(
    INSERT.into(Services).entries({
      name: srv.name,
    })
  );

  // Process entities
  await preProcessEntities(tx, srv, remoteService);
}

async function preProcessEntities(tx, srv, remoteService) {
  const { Entities } = cds.entities;

  const entityBatch = [];
  const attributeBatch = [];

  for (const entity in srv.entities) {
    if (!entity) continue;

    entityBatch.push({
      name: entity,
      service_name: srv.name,
    });

    const entityData = srv.entities[entity];

    for (const element in entityData.elements) {
      try {
        const elementData = entityData.elements[element];
        const type = normalizeCdsType(elementData.type);
        attributeBatch.push({
          service_name: srv.name,
          name: element,
          entity_name: entity,
          entity_service_name: srv.name,
          type,
        });
      } catch (err) {
        console.error(`Error processing attribute ${element}:`, err);
      }
    }
  }

  if (entityBatch.length > 0) {
    await tx.run(INSERT.into(Entities).entries(entityBatch));
    console.log(`📝 Inserted ${entityBatch.length} entities`);
  }

  if (attributeBatch.length > 0) {
    await tx.run(INSERT.into(cds.entities.Attributes).entries(attributeBatch));
    console.log(`📝 Inserted ${attributeBatch.length} attributes`);
  }

  // Process entity data
  for (const entity in srv.entities) {
    if (!entity) continue;
    const entityData = srv.entities[entity];
    await preProcessingElement(tx, entityData, entity, srv.name, remoteService);
  }
}

async function preProcessingElement(
  tx,
  entityData,
  entity,
  serviceName,
  remoteService
) {
  const { Elements, Records } = cds.entities;

  try {
    console.log(`🔄 Fetching data for entity: ${entity}`);

    const result = await remoteService.run(
      SELECT.from(entity).limit(1000) // Configurable limit
    );

    if (!result || result.length === 0) {
      console.log(`📭 No data found for entity ${entity}`);
      return;
    }

    const recordBatch = [];
    const elementsBatch = [];

    for (const record of result) {
      const recordEntry = {
        entity_name: entity,
        entity_service_name: serviceName,
      };
      recordBatch.push(recordEntry);
    }

    // Insert records in batch
    const insertedRecords = await tx.run(
      INSERT.into(Records).entries(recordBatch)
    );

    let recordIndex = 0;
    for (const record of result) {
      const recordID = [...insertedRecords][recordIndex]?.ID;

      if (recordID) {
        for (const element in entityData.elements) {
          const elementData = entityData.elements[element];
          const type = normalizeCdsType(elementData.type);

          try {
            const value = convertor(record[element], type);
            elementsBatch.push({
              attribute_name: element,
              value: String(value),
              attribute_entity_name: entity,
              attribute_entity_service_name: serviceName,
              record_ID: recordID,
            });
          } catch (err) {
            console.error(
              `Error converting element ${element} for record ${recordID}:`,
              err.message
            );
          }
        }
      }
      recordIndex++;
    }

    if (elementsBatch.length > 0) {
      const chunkSize = 1000;
      for (let i = 0; i < elementsBatch.length; i += chunkSize) {
        const chunk = elementsBatch.slice(i, i + chunkSize);
        await tx.run(INSERT.into(Elements).entries(chunk));
      }
    }

    console.log(
      `✅ Processed ${result.length} records and ${elementsBatch.length} elements for entity ${entity}`
    );
  } catch (err) {
    console.error(`❌ Error processing entity ${entity}:`, err.message);

    // Log specific error details for debugging
    if (err.code === "ERR_BAD_REQUEST") {
      console.error(
        `🔍 Entity '${entity}' not found in remote service. Available entities might be different.`
      );
    }
  }
}

function normalizeCdsType(cdsType) {
  if (!cdsType) return "string"; // Default to string instead of unknown

  const typeName = cdsType.name || cdsType.toString();

  switch (typeName) {
    case "cds.Integer":
    case "cds.Int32":
    case "cds.Double":
    case "cds.Decimal":
      return "number";
    case "cds.String":
    case "cds.LargeString":
      return "string";
    case "cds.Timestamp":
    case "cds.Time":
      return "time";
    case "cds.DateTime":
    case "cds.Date":
      return "date";
    case "cds.Boolean":
      return "boolean";
    case "cds.Association":
    case "cds.Composition":
      return "object";
    case "cds.UUID":
      return "uuid";
    default:
      console.warn(`Unknown CDS type '${typeName}', defaulting to string`);
      return "string";
  }
}

/**
 * Optimized type converter with better error handling
 */
function convertor(value, targetType) {
  // Handle null, undefined cases early
  if (value === null || value === undefined) {
    return targetType.toLowerCase() === "array" ? [] : null;
  }

  // Handle objects and arrays directly
  if (typeof value === "object") {
    if (targetType.toLowerCase() === "object") return value;
    if (Array.isArray(value) && targetType.toLowerCase() === "array")
      return value;
  }

  const str = String(value).trim();
  const lowerTargetType = targetType.toLowerCase();

  // Handle empty strings
  if (str === "") {
    return lowerTargetType === "array" ? [] : null;
  }

  try {
    switch (lowerTargetType) {
      case "number":
        if (typeof value === "number") return value;
        if (str === "null" || str === "undefined") return null;
        const num = Number(str);
        if (isNaN(num)) throw new Error(`Cannot convert "${str}" to number`);
        return num;

      case "string":
      case "text":
        return str;

      case "boolean":
      case "bool":
        if (str === "null" || str === "undefined") return null;
        const lowerStr = str.toLowerCase();
        if (["true", "1", "yes", "on"].includes(lowerStr)) return true;
        if (["false", "0", "no", "off"].includes(lowerStr)) return false;
        throw new Error(`Cannot convert "${str}" to boolean`);

      case "date":
        if (value instanceof Date) return value.toISOString();
        if (str === "null" || str === "undefined") return null;
        const date = new Date(str);
        if (isNaN(date.getTime()))
          throw new Error(`Cannot convert "${str}" to date`);
        return date.toISOString();

      case "object":
        if (typeof value === "object") return value;
        if (str === "null" || str === "undefined") return null;
        return JSON.parse(str);

      case "array":
        if (Array.isArray(value)) return value;
        if (str === "null" || str === "undefined") return [];
        try {
          const parsed = JSON.parse(str);
          return Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          return [str];
        }

      case "uuid":
      case "guid":
        if (str === "null" || str === "undefined") return null;
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(str))
          throw new Error(`"${str}" is not a valid UUID`);
        return str;

      default:
        return str;
    }
  } catch (error) {
    console.warn(
      `Conversion error for value "${value}" to type "${targetType}": ${error.message}`
    );
    return str; // Fallback to string representation
  }
}
