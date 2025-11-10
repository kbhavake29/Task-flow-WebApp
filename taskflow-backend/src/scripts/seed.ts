import dotenv from 'dotenv';
dotenv.config();

import { pool } from '../config/database';
import { logger } from '../utils/logger';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { BCRYPT_ROUNDS } from '../utils/constants';

/**
 * Seed database with development data
 */

async function seed() {
  try {
    logger.info('Starting database seeding...');

    // Create admin user
    const adminId = uuidv4();
    const adminEmail = 'admin@taskflow.com';
    const adminPassword = 'AdminPass123!';
    const adminPasswordHash = await bcrypt.hash(adminPassword, BCRYPT_ROUNDS);

    const [existingAdmins] = await pool.query<any[]>(
      'SELECT id FROM users WHERE email = ?',
      [adminEmail]
    );

    if (existingAdmins.length > 0) {
      logger.info(`  ✓ Admin user already exists: ${adminEmail}`);
    } else {
      await pool.query(
        'INSERT INTO users (id, email, password_hash, email_verified, role) VALUES (?, ?, ?, ?, ?)',
        [adminId, adminEmail, adminPasswordHash, true, 'admin']
      );
      logger.info(`  ✓ Created admin user: ${adminEmail} / ${adminPassword}`);
    }

    // Create test user
    const userId = uuidv4();
    const email = 'test@taskflow.com';
    const password = 'TestPass123!';
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Check if user already exists
    const [existingUsers] = await pool.query<any[]>(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    let finalUserId: string;

    if (existingUsers.length > 0) {
      logger.info(`  ✓ Test user already exists: ${email}`);
      finalUserId = existingUsers[0].id;
    } else {
      await pool.query(
        'INSERT INTO users (id, email, password_hash, email_verified, role) VALUES (?, ?, ?, ?, ?)',
        [userId, email, passwordHash, true, 'user']
      );
      logger.info(`  ✓ Created test user: ${email} / ${password}`);
      finalUserId = userId;
    }

    // Create sample projects with realistic data
    const projects = [
      {
        id: uuidv4(),
        name: 'E-Commerce Platform Redesign',
        description: 'Complete overhaul of the online shopping experience with modern UI/UX',
        tasks: [
          { title: 'Conduct user research and gather requirements', dueDate: -5, status: 'completed' },
          { title: 'Create wireframes and prototypes', dueDate: -2, status: 'completed' },
          { title: 'Design high-fidelity mockups', dueDate: 3, status: 'pending' },
          { title: 'Implement responsive navigation system', dueDate: 7, status: 'pending' },
          { title: 'Build product catalog pages', dueDate: 10, status: 'pending' },
          { title: 'Integrate payment gateway', dueDate: 14, status: 'pending' },
          { title: 'Perform security audit', dueDate: 18, status: 'pending' },
          { title: 'Conduct user acceptance testing', dueDate: 21, status: 'pending' },
        ],
      },
      {
        id: uuidv4(),
        name: 'Mobile Banking App',
        description: 'Native mobile application for iOS and Android with secure banking features',
        tasks: [
          { title: 'Define app architecture and tech stack', dueDate: -10, status: 'completed' },
          { title: 'Set up development environment', dueDate: -8, status: 'completed' },
          { title: 'Implement authentication flow', dueDate: -3, status: 'completed' },
          { title: 'Build account dashboard', dueDate: 2, status: 'pending' },
          { title: 'Create transaction history view', dueDate: 5, status: 'pending' },
          { title: 'Implement fund transfer feature', dueDate: 8, status: 'pending' },
          { title: 'Add biometric authentication', dueDate: 12, status: 'pending' },
          { title: 'Integrate push notifications', dueDate: 15, status: 'pending' },
          { title: 'Write unit and integration tests', dueDate: 20, status: 'pending' },
        ],
      },
      {
        id: uuidv4(),
        name: 'Marketing Campaign Q1 2025',
        description: 'Multi-channel marketing campaign for product launch in Q1',
        tasks: [
          { title: 'Define campaign objectives and KPIs', dueDate: -7, status: 'completed' },
          { title: 'Create content calendar', dueDate: -3, status: 'completed' },
          { title: 'Design email templates', dueDate: 1, status: 'pending' },
          { title: 'Write blog posts and articles', dueDate: 4, status: 'pending' },
          { title: 'Create social media graphics', dueDate: 6, status: 'pending' },
          { title: 'Set up ad campaigns', dueDate: 9, status: 'pending' },
          { title: 'Monitor and optimize performance', dueDate: 30, status: 'pending' },
        ],
      },
      {
        id: uuidv4(),
        name: 'Customer Support Portal',
        description: 'Self-service portal for customers to manage tickets and find solutions',
        tasks: [
          { title: 'Gather requirements from support team', dueDate: -6, status: 'completed' },
          { title: 'Design user interface mockups', dueDate: -1, status: 'completed' },
          { title: 'Build ticket submission system', dueDate: 5, status: 'pending' },
          { title: 'Create knowledge base structure', dueDate: 8, status: 'pending' },
          { title: 'Implement search functionality', dueDate: 11, status: 'pending' },
          { title: 'Add live chat integration', dueDate: 14, status: 'pending' },
          { title: 'Set up email notifications', dueDate: 17, status: 'pending' },
          { title: 'Train support staff on new portal', dueDate: 25, status: 'pending' },
        ],
      },
      {
        id: uuidv4(),
        name: 'Data Analytics Dashboard',
        description: 'Real-time analytics dashboard for business intelligence and reporting',
        tasks: [
          { title: 'Define key metrics and data sources', dueDate: -4, status: 'completed' },
          { title: 'Set up data pipeline infrastructure', dueDate: 3, status: 'pending' },
          { title: 'Build ETL processes', dueDate: 7, status: 'pending' },
          { title: 'Create visualization components', dueDate: 10, status: 'pending' },
          { title: 'Implement real-time data updates', dueDate: 13, status: 'pending' },
          { title: 'Add export functionality', dueDate: 16, status: 'pending' },
          { title: 'Optimize query performance', dueDate: 19, status: 'pending' },
          { title: 'Create user documentation', dueDate: 22, status: 'pending' },
          { title: 'Deploy to production', dueDate: 28, status: 'pending' },
        ],
      },
      {
        id: uuidv4(),
        name: 'API Microservices Migration',
        description: 'Migrate monolithic application to microservices architecture',
        tasks: [
          { title: 'Analyze existing monolith structure', dueDate: -12, status: 'completed' },
          { title: 'Design microservices architecture', dueDate: -8, status: 'completed' },
          { title: 'Set up service mesh infrastructure', dueDate: -4, status: 'completed' },
          { title: 'Implement user service', dueDate: 2, status: 'pending' },
          { title: 'Implement order service', dueDate: 6, status: 'pending' },
          { title: 'Implement inventory service', dueDate: 10, status: 'pending' },
          { title: 'Set up API gateway', dueDate: 14, status: 'pending' },
          { title: 'Implement service discovery', dueDate: 18, status: 'pending' },
          { title: 'Add distributed tracing', dueDate: 22, status: 'pending' },
          { title: 'Perform load testing', dueDate: 26, status: 'pending' },
        ],
      },
      {
        id: uuidv4(),
        name: 'Security Compliance Audit',
        description: 'SOC 2 compliance audit and security improvements',
        tasks: [
          { title: 'Review current security policies', dueDate: -9, status: 'completed' },
          { title: 'Conduct vulnerability assessment', dueDate: -5, status: 'completed' },
          { title: 'Implement multi-factor authentication', dueDate: 1, status: 'pending' },
          { title: 'Set up encryption for data at rest', dueDate: 4, status: 'pending' },
          { title: 'Configure firewall rules', dueDate: 7, status: 'pending' },
          { title: 'Implement audit logging', dueDate: 10, status: 'pending' },
          { title: 'Prepare compliance documentation', dueDate: 15, status: 'pending' },
        ],
      },
      {
        id: uuidv4(),
        name: 'Content Management System',
        description: 'Custom CMS for managing website content and digital assets',
        tasks: [
          { title: 'Define content types and structure', dueDate: -7, status: 'completed' },
          { title: 'Design admin interface', dueDate: -3, status: 'completed' },
          { title: 'Build content editor', dueDate: 2, status: 'pending' },
          { title: 'Implement media library', dueDate: 5, status: 'pending' },
          { title: 'Add version control for content', dueDate: 9, status: 'pending' },
          { title: 'Create workflow approval system', dueDate: 13, status: 'pending' },
          { title: 'Add SEO optimization features', dueDate: 17, status: 'pending' },
          { title: 'Implement content scheduling', dueDate: 21, status: 'pending' },
        ],
      },
      {
        id: uuidv4(),
        name: 'DevOps Infrastructure Upgrade',
        description: 'Modernize CI/CD pipelines and infrastructure automation',
        tasks: [
          { title: 'Audit current infrastructure', dueDate: -11, status: 'completed' },
          { title: 'Set up Kubernetes cluster', dueDate: -6, status: 'completed' },
          { title: 'Configure CI/CD pipelines', dueDate: -2, status: 'completed' },
          { title: 'Implement infrastructure as code', dueDate: 3, status: 'pending' },
          { title: 'Set up monitoring and alerting', dueDate: 7, status: 'pending' },
          { title: 'Configure auto-scaling policies', dueDate: 11, status: 'pending' },
          { title: 'Implement disaster recovery plan', dueDate: 15, status: 'pending' },
          { title: 'Document deployment procedures', dueDate: 20, status: 'pending' },
          { title: 'Conduct team training sessions', dueDate: 25, status: 'pending' },
        ],
      },
      {
        id: uuidv4(),
        name: 'AI Chatbot Integration',
        description: 'Implement AI-powered chatbot for customer service automation',
        tasks: [
          { title: 'Research AI/ML platforms and tools', dueDate: -8, status: 'completed' },
          { title: 'Design conversation flows', dueDate: -4, status: 'completed' },
          { title: 'Train NLP model with customer data', dueDate: 1, status: 'pending' },
          { title: 'Build chatbot backend API', dueDate: 5, status: 'pending' },
          { title: 'Create chat widget UI', dueDate: 9, status: 'pending' },
          { title: 'Integrate with existing systems', dueDate: 13, status: 'pending' },
          { title: 'Implement analytics and reporting', dueDate: 17, status: 'pending' },
          { title: 'Beta test with select customers', dueDate: 22, status: 'pending' },
          { title: 'Refine based on feedback', dueDate: 27, status: 'pending' },
          { title: 'Launch to all customers', dueDate: 31, status: 'pending' },
        ],
      },
    ];

    let totalTasksCreated = 0;

    for (const project of projects) {
      const [existing] = await pool.query<any[]>(
        'SELECT id FROM projects WHERE user_id = ? AND name = ?',
        [finalUserId, project.name]
      );

      if (existing.length > 0) {
        logger.info(`  ✓ Project already exists: ${project.name}`);
      } else {
        await pool.query(
          'INSERT INTO projects (id, user_id, name, description) VALUES (?, ?, ?, ?)',
          [project.id, finalUserId, project.name, project.description]
        );
        logger.info(`  ✓ Created project: ${project.name}`);

        // Create tasks for this project
        for (const taskData of project.tasks) {
          const dueDate = new Date(Date.now() + taskData.dueDate * 24 * 60 * 60 * 1000);
          const taskId = uuidv4();

          await pool.query(
            'INSERT INTO tasks (id, project_id, user_id, title, due_date, status, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
              taskId,
              project.id,
              finalUserId,
              taskData.title,
              dueDate,
              taskData.status,
              taskData.status === 'completed' ? new Date() : null,
            ]
          );
        }

        totalTasksCreated += project.tasks.length;
        logger.info(`  ✓ Created ${project.tasks.length} tasks for ${project.name}`);
      }
    }

    logger.info(`\n✓ Total: Created ${projects.length} projects and ${totalTasksCreated} tasks`);

    logger.info('Seeding completed successfully!');
    logger.info('\n===========================================');
    logger.info('Admin Account:');
    logger.info(`  Email: ${adminEmail}`);
    logger.info(`  Password: ${adminPassword}`);
    logger.info('');
    logger.info('Test Account:');
    logger.info(`  Email: ${email}`);
    logger.info(`  Password: ${password}`);
    logger.info('===========================================\n');
  } catch (error) {
    logger.error('Seeding failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run seeding
seed()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Seeding failed:', error);
    process.exit(1);
  });
