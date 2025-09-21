const neo4j = require("neo4j-driver");

class Neo4jConnection {
  constructor() {
    this.driver = null;
  }

  async connect(retries = 5) {
    const uri = process.env.NEO4J_URI || "bolt://localhost:7687";
    const user = process.env.NEO4J_USER || "neo4j";
    const password = process.env.NEO4J_PASSWORD || "password";

    for (let i = 0; i < retries; i++) {
      try {
        this.driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

        const serverInfo = await this.driver.getServerInfo();
        console.log(`Connected to Neo4j: ${serverInfo.address}`);

        await this.createConstraints();
        return;
      } catch (error) {
        console.log(`Neo4j connection attempt ${i + 1}/${retries} failed`);
        
        if (i === retries - 1) {
          console.error("Failed to connect to Neo4j after all retries:", error);
          throw error;
        }
        
        console.log(`Retrying in 5 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  async createConstraints() {
    const session = this.driver.session();
    try {
      await session.run(`
                CREATE CONSTRAINT user_id_unique IF NOT EXISTS
                FOR (u:User) REQUIRE u.id IS UNIQUE
            `);
      console.log("Database constraints created successfully");
    } catch (error) {
      console.error("Error creating constraints:", error);
    } finally {
      await session.close();
    }
  }

  getDriver() {
    return this.driver;
  }

  async close() {
    if (this.driver) {
      await this.driver.close();
      console.log("Neo4j connection closed");
    }
  }
}

module.exports = new Neo4jConnection();
