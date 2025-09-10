import neo4j, { Driver, Session } from 'neo4j-driver';

let driver: Driver | null = null;

export const connectToNeo4j = async (): Promise<void> => {
  try {
    const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
    const user = process.env.NEO4J_USER || 'neo4j';
    const password = process.env.NEO4J_PASSWORD || 'password123';

    driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

    await driver.verifyConnectivity();
    
    const session = driver.session();
    await session.run(`
      CREATE CONSTRAINT user_unique IF NOT EXISTS
      FOR (u:User) REQUIRE u.id IS UNIQUE
    `);
    await session.close();
    
    console.log('Neo4j connection established and constraints created');
  } catch (error) {
    console.error('Failed to connect to Neo4j:', error);
    throw error;
  }
};

export const getSession = (): Session => {
  if (!driver) {
    throw new Error('Neo4j driver not initialized');
  }
  return driver.session();
};

export const closeNeo4jConnection = async (): Promise<void> => {
  if (driver) {
    await driver.close();
    driver = null;
    console.log('Neo4j connection closed');
  }
};