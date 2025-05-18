import { client } from "@repo/trigger";
import { eventTrigger, type IO } from "@trigger.dev/sdk";

// Define types for our job payloads
interface UserCreatedPayload {
  email: string;
  name?: string;
  userId?: string;
}

interface UserDeletedPayload {
  userId: string;
  reason?: string;
}

/**
 * Job to send a welcome email when a user is created
 * This job is triggered by the "user.created" event
 */
export const sendWelcomeEmailJob = client.defineJob({
  id: "send-welcome-email",
  name: "Send Welcome Email",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "user.created",
  }),
  run: async (payload: UserCreatedPayload, io: IO) => {
    await io.logger.info(`Sending welcome email to ${payload.email}`);
    // Here you would typically integrate with an email service
    // Example: await emailService.sendWelcomeEmail(payload.email);
    
    return { success: true, email: payload.email };
  },
});

/**
 * Job to notify admins when a new user signs up
 * This job is triggered by the "user.created" event
 */
export const notifyAdminsJob = client.defineJob({
  id: "notify-admins-new-user",
  name: "Notify Admins of New User",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "user.created",
  }),
  run: async (payload: UserCreatedPayload, io: IO) => {
    await io.logger.info(`New user signed up: ${payload.email}`);
    // Here you would typically send notifications to admins
    // Example: await notificationService.notifyAdmins("New user", `${payload.email} just signed up`);
    
    return { success: true };
  },
});

/**
 * Job to process user deletion
 * This job is triggered by the "user.deleted" event
 */
export const processUserDeletionJob = client.defineJob({
  id: "process-user-deletion",
  name: "Process User Deletion",
  version: "1.0.0",
  trigger: eventTrigger({
    name: "user.deleted",
  }),
  run: async (payload: UserDeletedPayload, io: IO) => {
    await io.logger.info(`Processing deletion for user: ${payload.userId}`);
    // Here you would typically clean up user data
    // Example: await dataCleanupService.removeUserData(payload.userId);
    
    return { success: true };
  },
});
