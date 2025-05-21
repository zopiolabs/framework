import { Command } from "commander";
import fs from "node:fs";
import path from "node:path";
import { logger } from "../utils/helpers.js";

/**
 * Available test types
 */
const TEST_TYPES = {
  "unit": {
    description: "Unit tests for models and business logic",
    frameworks: ["jest", "vitest", "mocha"]
  },
  "integration": {
    description: "Integration tests for API endpoints and data flow",
    frameworks: ["supertest", "jest", "vitest"]
  },
  "e2e": {
    description: "End-to-end tests for UI components and workflows",
    frameworks: ["cypress", "playwright", "puppeteer"]
  }
};

/**
 * Get the default test framework for a test type
 */
function getDefaultFramework(testType) {
  if (!TEST_TYPES[testType]) return null;
  return TEST_TYPES[testType].frameworks[0];
}

/**
 * Generate unit tests for a resource
 */
function generateUnitTests(resourceName, options) {
  const ResourceName = resourceName.charAt(0).toUpperCase() + resourceName.slice(1);
  const resourceNameLower = resourceName.toLowerCase();
  
  // Create test directory
  const testDir = path.join(process.cwd(), options.output, "unit", resourceNameLower);
  fs.mkdirSync(testDir, { recursive: true });
  
  // Generate model test
  const modelTestPath = path.join(testDir, `${resourceNameLower}.model.test.js`);
  const modelTestContent = `/**
 * Unit tests for ${ResourceName} model
 */
import { ${ResourceName}Model } from '../../resources/${resourceNameLower}s/model.js';

describe('${ResourceName} Model', () => {
  test('should have correct name', () => {
    expect(${ResourceName}Model.name).toBe('${ResourceName}');
  });

  test('should have required fields', () => {
    expect(${ResourceName}Model.fields).toHaveProperty('id');
    expect(${ResourceName}Model.fields).toHaveProperty('name');
    expect(${ResourceName}Model.fields).toHaveProperty('createdAt');
    expect(${ResourceName}Model.fields).toHaveProperty('updatedAt');
  });

  test('should have correct primary key', () => {
    expect(${ResourceName}Model.primaryKey).toBe('id');
  });

  test('should have timestamps enabled', () => {
    expect(${ResourceName}Model.timestamps).toBe(true);
  });
});
`;
  fs.writeFileSync(modelTestPath, modelTestContent);
  logger.info(`Created model test at ${modelTestPath}`);
  
  // Generate engine test
  const engineTestPath = path.join(testDir, `${resourceNameLower}.engine.test.js`);
  const engineTestContent = `/**
 * Unit tests for ${ResourceName} CRUD engine
 */
import { 
  get${ResourceName}s, 
  get${ResourceName}, 
  create${ResourceName}, 
  update${ResourceName}, 
  delete${ResourceName} 
} from '../../resources/${resourceNameLower}s/engine.js';

// Mock the data provider
jest.mock('../../resources/${resourceNameLower}s/provider.js', () => ({
  ${resourceNameLower}Provider: {
    getList: jest.fn().mockResolvedValue({ data: [], total: 0 }),
    getOne: jest.fn().mockResolvedValue({ data: {} }),
    create: jest.fn().mockResolvedValue({ data: {} }),
    update: jest.fn().mockResolvedValue({ data: {} }),
    delete: jest.fn().mockResolvedValue({ data: {} })
  }
}));

describe('${ResourceName} CRUD Engine', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('get${ResourceName}s should return a list of ${resourceNameLower}s', async () => {
    const result = await get${ResourceName}s({});
    expect(result).toEqual({ data: [], total: 0 });
  });

  test('get${ResourceName} should return a single ${resourceNameLower}', async () => {
    const result = await get${ResourceName}('123');
    expect(result).toEqual({ data: {} });
  });

  test('create${ResourceName} should create a new ${resourceNameLower}', async () => {
    const data = { name: 'Test ${ResourceName}' };
    const result = await create${ResourceName}(data);
    expect(result).toEqual({ data: {} });
  });

  test('update${ResourceName} should update an existing ${resourceNameLower}', async () => {
    const data = { name: 'Updated ${ResourceName}' };
    const result = await update${ResourceName}('123', data);
    expect(result).toEqual({ data: {} });
  });

  test('delete${ResourceName} should delete a ${resourceNameLower}', async () => {
    const result = await delete${ResourceName}('123');
    expect(result).toEqual({ data: {} });
  });
});
`;
  fs.writeFileSync(engineTestPath, engineTestContent);
  logger.info(`Created engine test at ${engineTestPath}`);
  
  // Generate validation test if applicable
  const validationTestPath = path.join(testDir, `${resourceNameLower}.validation.test.js`);
  const validationTestContent = `/**
 * Unit tests for ${ResourceName} validation
 */
describe('${ResourceName} Validation', () => {
  test('should validate required fields', () => {
    // TODO: Implement validation tests
    expect(true).toBe(true);
  });

  test('should validate field types', () => {
    // TODO: Implement validation tests
    expect(true).toBe(true);
  });

  test('should validate business rules', () => {
    // TODO: Implement validation tests
    expect(true).toBe(true);
  });
});
`;
  fs.writeFileSync(validationTestPath, validationTestContent);
  logger.info(`Created validation test at ${validationTestPath}`);
  
  return true;
}

/**
 * Generate integration tests for a resource
 */
function generateIntegrationTests(resourceName, options) {
  const ResourceName = resourceName.charAt(0).toUpperCase() + resourceName.slice(1);
  const resourceNameLower = resourceName.toLowerCase();
  
  // Create test directory
  const testDir = path.join(process.cwd(), options.output, "integration", resourceNameLower);
  fs.mkdirSync(testDir, { recursive: true });
  
  // Generate API test
  const apiTestPath = path.join(testDir, `${resourceNameLower}.api.test.js`);
  const apiTestContent = `/**
 * Integration tests for ${ResourceName} API endpoints
 */
import request from 'supertest';
import app from '../../app.js';

describe('${ResourceName} API', () => {
  let testId;

  // Test data
  const test${ResourceName} = {
    name: 'Test ${ResourceName}',
    description: 'Test description'
  };

  test('POST /${resourceNameLower}s should create a new ${resourceNameLower}', async () => {
    const response = await request(app)
      .post('/${resourceNameLower}s')
      .send(test${ResourceName})
      .expect(201);
    
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe(test${ResourceName}.name);
    
    // Save ID for later tests
    testId = response.body.id;
  });

  test('GET /${resourceNameLower}s should return a list of ${resourceNameLower}s', async () => {
    const response = await request(app)
      .get('/${resourceNameLower}s')
      .expect(200);
    
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body).toHaveProperty('total');
  });

  test('GET /${resourceNameLower}s/:id should return a single ${resourceNameLower}', async () => {
    const response = await request(app)
      .get(\`/${resourceNameLower}s/\${testId}\`)
      .expect(200);
    
    expect(response.body).toHaveProperty('id', testId);
    expect(response.body.name).toBe(test${ResourceName}.name);
  });

  test('PUT /${resourceNameLower}s/:id should update a ${resourceNameLower}', async () => {
    const updatedData = {
      name: 'Updated ${ResourceName}',
      description: 'Updated description'
    };

    const response = await request(app)
      .put(\`/${resourceNameLower}s/\${testId}\`)
      .send(updatedData)
      .expect(200);
    
    expect(response.body).toHaveProperty('id', testId);
    expect(response.body.name).toBe(updatedData.name);
  });

  test('DELETE /${resourceNameLower}s/:id should delete a ${resourceNameLower}', async () => {
    await request(app)
      .delete(\`/${resourceNameLower}s/\${testId}\`)
      .expect(204);
    
    // Verify it's deleted
    await request(app)
      .get(\`/${resourceNameLower}s/\${testId}\`)
      .expect(404);
  });
});
`;
  fs.writeFileSync(apiTestPath, apiTestContent);
  logger.info(`Created API integration test at ${apiTestPath}`);
  
  // Generate data flow test
  const dataFlowTestPath = path.join(testDir, `${resourceNameLower}.flow.test.js`);
  const dataFlowTestContent = `/**
 * Integration tests for ${ResourceName} data flow
 */
describe('${ResourceName} Data Flow', () => {
  test('should correctly flow data through the system', async () => {
    // TODO: Implement data flow tests
    expect(true).toBe(true);
  });

  test('should handle validation errors correctly', async () => {
    // TODO: Implement validation error tests
    expect(true).toBe(true);
  });

  test('should enforce permissions correctly', async () => {
    // TODO: Implement permission tests
    expect(true).toBe(true);
  });
});
`;
  fs.writeFileSync(dataFlowTestPath, dataFlowTestContent);
  logger.info(`Created data flow test at ${dataFlowTestPath}`);
  
  return true;
}

/**
 * Generate end-to-end tests for a resource
 */
function generateE2ETests(resourceName, options) {
  const ResourceName = resourceName.charAt(0).toUpperCase() + resourceName.slice(1);
  const resourceNameLower = resourceName.toLowerCase();
  
  // Create test directory
  const testDir = path.join(process.cwd(), options.output, "e2e", resourceNameLower);
  fs.mkdirSync(testDir, { recursive: true });
  
  // Generate E2E test based on framework
  const framework = options.framework || getDefaultFramework('e2e');
  
  if (framework === 'cypress') {
    const e2eTestPath = path.join(testDir, `${resourceNameLower}.cy.js`);
    const e2eTestContent = `/**
 * End-to-end tests for ${ResourceName} UI
 */
describe('${ResourceName} UI', () => {
  beforeEach(() => {
    // Visit the ${resourceNameLower}s page
    cy.visit('/${resourceNameLower}s');
  });

  it('should display the ${resourceNameLower}s list', () => {
    cy.get('h1').should('contain', '${ResourceName}s');
    cy.get('table').should('exist');
  });

  it('should navigate to create ${resourceNameLower} form', () => {
    cy.contains('Create').click();
    cy.url().should('include', '/${resourceNameLower}s/new');
    cy.get('form').should('exist');
  });

  it('should create a new ${resourceNameLower}', () => {
    cy.contains('Create').click();
    cy.get('input[name="name"]').type('E2E Test ${ResourceName}');
    cy.get('textarea[name="description"]').type('E2E test description');
    cy.contains('Save').click();
    cy.url().should('include', '/${resourceNameLower}s');
    cy.contains('E2E Test ${ResourceName}').should('exist');
  });

  it('should edit an existing ${resourceNameLower}', () => {
    cy.contains('E2E Test ${ResourceName}')
      .parent('tr')
      .contains('Edit')
      .click();
    
    cy.url().should('include', '/${resourceNameLower}s/edit');
    cy.get('input[name="name"]').clear().type('Updated E2E Test');
    cy.contains('Save').click();
    cy.url().should('include', '/${resourceNameLower}s');
    cy.contains('Updated E2E Test').should('exist');
  });

  it('should delete a ${resourceNameLower}', () => {
    cy.contains('Updated E2E Test')
      .parent('tr')
      .contains('Delete')
      .click();
    
    cy.get('.confirmation-modal').should('exist');
    cy.get('.confirmation-modal').contains('Confirm').click();
    cy.contains('Updated E2E Test').should('not.exist');
  });
});
`;
    fs.writeFileSync(e2eTestPath, e2eTestContent);
    logger.info(`Created Cypress E2E test at ${e2eTestPath}`);
  } else if (framework === 'playwright') {
    const e2eTestPath = path.join(testDir, `${resourceNameLower}.spec.js`);
    const e2eTestContent = `/**
 * End-to-end tests for ${ResourceName} UI using Playwright
 */
import { test, expect } from '@playwright/test';

test.describe('${ResourceName} UI', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the ${resourceNameLower}s page
    await page.goto('/${resourceNameLower}s');
  });

  test('should display the ${resourceNameLower}s list', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('${ResourceName}s');
    await expect(page.locator('table')).toBeVisible();
  });

  test('should navigate to create ${resourceNameLower} form', async ({ page }) => {
    await page.click('text=Create');
    await expect(page).toHaveURL(/.*\\/${resourceNameLower}s\\/new/);
    await expect(page.locator('form')).toBeVisible();
  });

  test('should create a new ${resourceNameLower}', async ({ page }) => {
    await page.click('text=Create');
    await page.fill('input[name="name"]', 'Playwright Test ${ResourceName}');
    await page.fill('textarea[name="description"]', 'Playwright test description');
    await page.click('text=Save');
    await expect(page).toHaveURL(/.*\\/${resourceNameLower}s/);
    await expect(page.locator('text=Playwright Test ${ResourceName}')).toBeVisible();
  });

  test('should edit an existing ${resourceNameLower}', async ({ page }) => {
    const row = page.locator('text=Playwright Test ${ResourceName}').locator('..');
    await row.locator('text=Edit').click();
    
    await expect(page).toHaveURL(/.*\\/${resourceNameLower}s\\/edit/);
    await page.fill('input[name="name"]', 'Updated Playwright Test');
    await page.click('text=Save');
    await expect(page).toHaveURL(/.*\\/${resourceNameLower}s/);
    await expect(page.locator('text=Updated Playwright Test')).toBeVisible();
  });

  test('should delete a ${resourceNameLower}', async ({ page }) => {
    const row = page.locator('text=Updated Playwright Test').locator('..');
    await row.locator('text=Delete').click();
    
    await expect(page.locator('.confirmation-modal')).toBeVisible();
    await page.locator('.confirmation-modal').locator('text=Confirm').click();
    await expect(page.locator('text=Updated Playwright Test')).not.toBeVisible();
  });
});
`;
    fs.writeFileSync(e2eTestPath, e2eTestContent);
    logger.info(`Created Playwright E2E test at ${e2eTestPath}`);
  } else {
    // Default to Puppeteer
    const e2eTestPath = path.join(testDir, `${resourceNameLower}.test.js`);
    const e2eTestContent = `/**
 * End-to-end tests for ${ResourceName} UI using Puppeteer
 */
import puppeteer from 'puppeteer';

describe('${ResourceName} UI', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch();
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should display the ${resourceNameLower}s list', async () => {
    await page.goto('/${resourceNameLower}s');
    const title = await page.$eval('h1', el => el.textContent);
    expect(title).toContain('${ResourceName}s');
    
    const tableExists = await page.$('table') !== null;
    expect(tableExists).toBe(true);
  });

  test('should create a new ${resourceNameLower}', async () => {
    await page.goto('/${resourceNameLower}s');
    await page.click('text=Create');
    
    await page.waitForSelector('form');
    await page.type('input[name="name"]', 'Puppeteer Test ${ResourceName}');
    await page.type('textarea[name="description"]', 'Puppeteer test description');
    await page.click('text=Save');
    
    await page.waitForSelector('table');
    const newItemExists = await page.evaluate(() => {
      return document.body.textContent.includes('Puppeteer Test ${ResourceName}');
    });
    expect(newItemExists).toBe(true);
  });

  // More tests would go here
});
`;
    fs.writeFileSync(e2eTestPath, e2eTestContent);
    logger.info(`Created Puppeteer E2E test at ${e2eTestPath}`);
  }
  
  return true;
}

/**
 * Generate a test configuration file
 */
function generateTestConfig(options) {
  const configDir = path.join(process.cwd(), options.output);
  fs.mkdirSync(configDir, { recursive: true });
  
  // Generate Jest config
  if (options.framework === 'jest' || !options.framework) {
    const jestConfigPath = path.join(configDir, 'jest.config.js');
    const jestConfigContent = `/**
 * Jest configuration for CRUD tests
 */
export default {
  testEnvironment: 'node',
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
  moduleFileExtensions: ['js', 'jsx', 'json', 'node'],
  testMatch: [
    '**/*.test.js',
    '**/*.spec.js'
  ],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'resources/**/*.js',
    '!resources/**/index.js'
  ],
  setupFilesAfterEnv: ['${options.output}/setup.js']
};
`;
    fs.writeFileSync(jestConfigPath, jestConfigContent);
    logger.info(`Created Jest config at ${jestConfigPath}`);
    
    // Create setup file
    const setupPath = path.join(configDir, 'setup.js');
    const setupContent = `/**
 * Jest setup file
 */
// Add any global setup code here
`;
    fs.writeFileSync(setupPath, setupContent);
    logger.info(`Created Jest setup file at ${setupPath}`);
  }
  
  // Generate E2E config if needed
  if (options.types.includes('e2e')) {
    if (options.framework === 'cypress' || (!options.framework && getDefaultFramework('e2e') === 'cypress')) {
      const cypressConfigPath = path.join(configDir, 'cypress.config.js');
      const cypressConfigContent = `/**
 * Cypress configuration for E2E tests
 */
export default {
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: '${options.output}/e2e/**/*.cy.js',
  },
};
`;
      fs.writeFileSync(cypressConfigPath, cypressConfigContent);
      logger.info(`Created Cypress config at ${cypressConfigPath}`);
    } else if (options.framework === 'playwright' || (!options.framework && getDefaultFramework('e2e') === 'playwright')) {
      const playwrightConfigPath = path.join(configDir, 'playwright.config.js');
      const playwrightConfigContent = `/**
 * Playwright configuration for E2E tests
 */
export default {
  testDir: '${options.output}/e2e',
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    viewport: { width: 1280, height: 720 },
    screenshot: 'only-on-failure',
  },
  reporter: 'html',
};
`;
      fs.writeFileSync(playwrightConfigPath, playwrightConfigContent);
      logger.info(`Created Playwright config at ${playwrightConfigPath}`);
    }
  }
  
  return true;
}

/**
 * Generate all test types for a resource
 */
function generateTests(resourceName, options) {
  // Parse test types
  const testTypes = options.types.split(',').map(type => type.trim().toLowerCase());
  
  // Generate test configuration
  generateTestConfig(options);
  
  // Generate tests for each type
  for (const testType of testTypes) {
    if (!TEST_TYPES[testType]) {
      logger.warning(`Unknown test type: ${testType}`);
      continue;
    }
    
    logger.info(`Generating ${testType} tests for ${resourceName}...`);
    
    switch (testType) {
      case 'unit':
        generateUnitTests(resourceName, options);
        break;
      case 'integration':
        generateIntegrationTests(resourceName, options);
        break;
      case 'e2e':
        generateE2ETests(resourceName, options);
        break;
    }
  }
  
  logger.success(`✅ Generated tests for '${resourceName}'`);
  return true;
}

/**
 * List available test types
 */
function listTestTypes() {
  logger.title("Available Test Types");
  
  for (const [type, info] of Object.entries(TEST_TYPES)) {
    logger.info(`- ${type}: ${info.description}`);
    logger.info(`  Frameworks: ${info.frameworks.join(", ")}`);
  }
}

const crudTestingCommand = new Command("crud-testing")
  .description("Generate tests for CRUD resources")
  .option("-r, --resource <name>", "Resource name")
  .option("-t, --types <types>", "Test types to generate (unit,integration,e2e)", "unit,integration")
  .option("-o, --output <path>", "Output directory", "tests")
  .option("-f, --framework <framework>", "Test framework to use")
  .option("-l, --list", "List available test types")
  .action((options) => {
    if (options.list) {
      listTestTypes();
      return;
    }
    
    if (!options.resource) {
      logger.error("Resource name is required");
      return;
    }
    
    generateTests(options.resource, options);
  });

export { crudTestingCommand, generateTests };
