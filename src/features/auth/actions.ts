import { createServerFn } from '@tanstack/react-start';
import { getCookie, setCookie } from '@tanstack/react-start/server';
import { users, verificationCodes, sessions } from '../../server/db/schema';
import { eq, and, gt, lt } from 'drizzle-orm';
import db from '@/server/db';
import { randomBytes } from 'crypto';

// Generate 5-digit verification code
function generateCode(): string {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

// Generate secure session token
function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

// Helper function to get current user from session
async function getCurrentUserFromSession() {
  const sessionToken = getCookie('sessionToken');

  if (!sessionToken) {
    return null;
  }

  // Get valid session with user data
  const [sessionWithUser] = await db
    .select({
      userId: sessions.userId,
      sessionId: sessions.id,
      user: users,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(
      and(
        eq(sessions.sessionToken, sessionToken),
        gt(sessions.expiresAt, new Date())
      )
    )
    .limit(1);

  return sessionWithUser || null;
}

// Clean up expired sessions
async function cleanupExpiredSessions() {
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
}

// Send verification code
export const sendVerificationCode = createServerFn({
  method: 'POST',
})
  .validator((data: { phoneNumber: string }) => data)
  .handler(async ({ data }) => {
    const { phoneNumber } = data;

    // Validate phone number format (basic validation)
    if (!phoneNumber || phoneNumber.length < 10) {
      throw new Error('شماره تلفن معتبر نیست');
    }

    // Generate code and set expiry (5 minutes)
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Clean up old unused codes for this phone number
    await db
      .delete(verificationCodes)
      .where(
        and(
          eq(verificationCodes.phoneNumber, phoneNumber),
          eq(verificationCodes.isUsed, false)
        )
      );

    // Store new code in database
    await db.insert(verificationCodes).values({
      phoneNumber,
      code,
      expiresAt,
    });

    return { success: true, code };
  });

// Verify code and create session
export const verifyCode = createServerFn({
  method: 'POST',
})
  .validator((data: { phoneNumber: string; code: string }) => data)
  .handler(async ({ data }) => {
    const { phoneNumber, code } = data;

    // Check if code is valid and not expired
    const [validCode] = await db
      .select()
      .from(verificationCodes)
      .where(
        and(
          eq(verificationCodes.phoneNumber, phoneNumber),
          eq(verificationCodes.code, code),
          eq(verificationCodes.isUsed, false)
        )
      )
      .limit(1);

    if (!validCode || validCode.expiresAt < new Date()) {
      throw new Error('کد تایید نامعتبر یا منقضی شده است');
    }

    // Mark code as used
    await db
      .update(verificationCodes)
      .set({ isUsed: true })
      .where(eq(verificationCodes.id, validCode.id));

    // Check if user exists
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.phoneNumber, phoneNumber))
      .limit(1);

    // Create new user if doesn't exist
    if (!user) {
      const [newUser] = await db
        .insert(users)
        .values({
          phoneNumber,
          isProfileComplete: false,
        })
        .returning();

      user = newUser;
    }

    // Clean up any existing sessions for this user
    await db.delete(sessions).where(eq(sessions.userId, user.id));

    // Create new session
    const sessionToken = generateSessionToken();
    const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await db.insert(sessions).values({
      userId: user.id,
      sessionToken,
      expiresAt: sessionExpiresAt,
    });

    // Set secure session cookie
    setCookie('sessionToken', sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    // Clean up expired sessions periodically
    cleanupExpiredSessions();

    return {
      success: true,
      needsProfile: !user.firstName || !user.lastName,
      redirectTo: user.firstName && user.lastName ? '/profile' : null,
    };
  });

// Complete user profile
export const completeProfile = createServerFn({
  method: 'POST',
})
  .validator((data: { firstName: string; lastName: string }) => data)
  .handler(async ({ data }) => {
    const sessionData = await getCurrentUserFromSession();

    if (!sessionData?.userId) {
      throw new Error('شما وارد نشده‌اید');
    }

    const { firstName, lastName } = data;

    // Validate input
    if (!firstName.trim() || !lastName.trim()) {
      throw new Error('نام و نام خانوادگی الزامی است');
    }

    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      throw new Error('نام و نام خانوادگی باید حداقل 2 کاراکتر باشد');
    }

    // Update user profile
    await db
      .update(users)
      .set({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        isProfileComplete: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, sessionData.userId));

    return { success: true };
  });

// Get current user
export const getCurrentUser = createServerFn({
  method: 'GET',
}).handler(async () => {
  const sessionData = await getCurrentUserFromSession();

  if (!sessionData) {
    return null;
  }

  // Return user data without sensitive information
  const { user } = sessionData;
  return {
    id: user.id,
    phoneNumber: user.phoneNumber,
    firstName: user.firstName,
    lastName: user.lastName,
    isProfileComplete: user.isProfileComplete,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
});

// Update user profile (additional function for profile updates)
export const updateProfile = createServerFn({
  method: 'POST',
})
  .validator((data: { firstName?: string; lastName?: string }) => data)
  .handler(async ({ data }) => {
    const sessionData = await getCurrentUserFromSession();

    if (!sessionData?.userId) {
      throw new Error('شما وارد نشده‌اید');
    }

    const { firstName, lastName } = data;
    const updateData: any = { updatedAt: new Date() };

    // Validate and prepare update data
    if (firstName !== undefined) {
      if (!firstName.trim() || firstName.trim().length < 2) {
        throw new Error('نام باید حداقل 2 کاراکتر باشد');
      }
      updateData.firstName = firstName.trim();
    }

    if (lastName !== undefined) {
      if (!lastName.trim() || lastName.trim().length < 2) {
        throw new Error('نام خانوادگی باید حداقل 2 کاراکتر باشد');
      }
      updateData.lastName = lastName.trim();
    }

    // Check if profile will be complete
    const currentUser = sessionData.user;
    const willBeComplete =
      (updateData.firstName || currentUser.firstName) &&
      (updateData.lastName || currentUser.lastName);

    if (willBeComplete) {
      updateData.isProfileComplete = true;
    }

    // Update user profile
    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, sessionData.userId));

    return { success: true };
  });

// Logout
export const logout = createServerFn({
  method: 'POST',
}).handler(async () => {
  const sessionToken = getCookie('sessionToken');

  if (sessionToken) {
    // Delete the session from database
    await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken));
  }

  // Clear the cookie
  setCookie('sessionToken', '', {
    maxAge: 0,
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
  });

  return { success: true };
});

// Logout from all devices
export const logoutAllDevices = createServerFn({
  method: 'POST',
}).handler(async () => {
  const sessionData = await getCurrentUserFromSession();

  if (sessionData?.userId) {
    // Delete all sessions for this user
    await db.delete(sessions).where(eq(sessions.userId, sessionData.userId));
  }

  // Clear the cookie
  setCookie('sessionToken', '', {
    maxAge: 0,
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
  });

  return { success: true };
});

// Check if session is valid (useful for middleware)
export const validateSession = createServerFn({
  method: 'GET',
}).handler(async () => {
  const sessionData = await getCurrentUserFromSession();
  return {
    isValid: !!sessionData,
    userId: sessionData?.userId || null,
  };
});
