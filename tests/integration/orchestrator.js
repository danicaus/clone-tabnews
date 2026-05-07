import retry from "async-retry";
import { faker } from "@faker-js/faker";

import database from "infra/database.js";
import migrator from "models/migrator.js";
import user from "models/user.js";
import session from "models/session";
import activation from "models/activation";

const EMAIL_HTTP_URL = `http://${process.env.EMAIL_HTTP_HOST}:${process.env.EMAIL_HTTP_PORT}`;

async function waitForAllServices() {
  await waitForWebServer();
  await waitForEmailServer();

  async function waitForWebServer() {
    return retry(fetchStatusPage, {
      retries: 100,
      maxTimeout: 5000,
      onRetry: (error, attempt) => {
        console.log(
          `Attempt ${attempt} = Failed to fetch status page: ${error.message}`,
        );
      },
    });

    async function fetchStatusPage() {
      const response = await fetch("http://localhost:3000/api/v1/status");
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
    }
  }

  async function waitForEmailServer() {
    return retry(fetchEmailPage, {
      retries: 100,
      maxTimeout: 5000,
      onRetry: (error, attempt) => {
        console.log(
          `Attempt ${attempt} = Failed to fetch status page: ${error.message}`,
        );
      },
    });

    async function fetchEmailPage() {
      const response = await fetch(EMAIL_HTTP_URL);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
    }
  }
}

async function clearDatabase() {
  await database.query("drop schema public cascade; create schema public;");
}

async function runPendingMigrations() {
  await migrator.runPendingMigrations();
}

async function clearUserTable() {
  await database.query("truncate table users");
}

async function clearSessionTable() {
  await database.query("truncate table sessions");
}

async function createUser(userObject) {
  const newUser = await user.create({
    username:
      userObject?.username || faker.internet.username().replace(/[_.-]/g, ""),
    email: userObject?.email || faker.internet.email(),
    password: userObject?.password || "validPassword",
  });

  return newUser;
}

async function setUserFeatures(userId, features) {
  return await user.setFeatures(userId, features);
}

async function activateUser(user) {
  return await activation.activateUserByUserId(user.id);
}

async function createActivationToken(user) {
  return await activation.create(user.id);
}

async function activateToken(token) {
  return await activation.activateToken(token);
}

async function createSession(userId) {
  return await session.create(userId);
}

async function deleteAllEmails() {
  await fetch(`${EMAIL_HTTP_URL}/messages`, {
    method: "DELETE",
  });
}

async function getLastEmail() {
  const emailListResponse = await fetch(`${EMAIL_HTTP_URL}/messages`);
  const emailListBody = await emailListResponse.json();
  const lastEmailItem = emailListBody.pop();

  if (!lastEmailItem) {
    return null;
  }

  const emailTextResponse = await fetch(
    `${EMAIL_HTTP_URL}/messages/${lastEmailItem.id}.plain`,
  );
  const emailTextBody = await emailTextResponse.text();

  return {
    ...lastEmailItem,
    text: emailTextBody.trim(),
  };
}

function extractUUID(text) {
  const match = text.match(/[0-9a-fA-F-]{36}/);
  return match ? match[0] : null;
}

const orchestrator = {
  waitForAllServices,
  clearDatabase,
  runPendingMigrations,
  clearUserTable,
  createUser,
  clearSessionTable,
  createSession,
  deleteAllEmails,
  getLastEmail,
  extractUUID,
  activateUser,
  createActivationToken,
  activateToken,
  setUserFeatures,
};

export default orchestrator;
