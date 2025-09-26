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

    console.log("Available services:", Object.keys(services));
    console.log("Environment services:", envServices);

    console.log("🧹🧹🧹 Cleaning existing metadata... 🧹🧹🧹");
    await tx.run(DELETE.from(Elements));
    await tx.run(DELETE.from(Entities));
    await tx.run(DELETE.from(Services));

    for (const service in services) {
      if (
        services[service].options?.kind === "app-service" &&
        !["RuleService", "PreprocessingService"].includes(service)
      ) {
        console.log(`Processing service: ${service}`);

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

  await tx.run(
    INSERT.into(Services).entries({
      name: srv.name,
    })
  );

  await preProcessEntities(tx, srv, remoteService);
}

async function preProcessEntities(tx, srv, remoteService) {
  const { Entities, PrimaryKeys } = cds.entities;

  const entityBatch = [];
  const attributeBatch = [];
  let keyElements = [];

  for (const entity in srv.entities) {
    if (!entity) continue;

    const entityData = srv.entities[entity];
    entityBatch.push({
      name: entity,
      service_name: srv.name,
    });

    for (const element in entityData.elements) {
      try {
        const elementData = entityData.elements[element];
        if (elementData.key) {
          keyElements.push({
            elementName: element,
            entity_name: entity,
            entity_service_name: srv.name,
          });
        }
        const type = normalizeCdsType(elementData.type);

        attributeBatch.push({
          service_name: srv.name,
          name: element,
          entity_name: entity,
          entity_service_name: srv.name,
          type: type,
        });
      } catch (err) {
        console.error(`Error processing attribute ${element}:`, err);
      }
    }
  }

  if (keyElements.length > 0) {
    await tx.run(INSERT.into(PrimaryKeys).entries(keyElements));
  }
  if (entityBatch.length > 0) {
    await tx.run(INSERT.into(Entities).entries(entityBatch));
    console.log(`📝 Inserted ${entityBatch.length} entities`);
  }

  if (attributeBatch.length > 0) {
    await tx.run(INSERT.into(cds.entities.Attributes).entries(attributeBatch));
    console.log(`📝 Inserted ${attributeBatch.length} attributes`);
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
