import { AppUser, AuditLogEntry, UserRole } from '../types';
import { CLINICIAN_USER, GUEST_USER, INITIAL_AUDIT_LOGS } from '../data/mockUsers';

export const RESEARCHER_USER: AppUser = {
  id: 'usr_researcher_01',
  name: 'Sarah Chen',
  email: 'sarah.chen@stanford-derm.org',
  role: 'clinician',
  avatar: '👩‍⚕️',
  title: 'Associate Professor of Dermatology & AI Pathology',
  institution: 'Stanford University Medical Center',
  department: 'Multimodal Computational Dermatology',
  specialty: 'Computer Vision in Dermato-Oncology',
  phone: '+1 (555) 749-3321',
  officeLocation: 'Beckman Center for Molecular and Genetic Medicine, Rm 210',
  licenseNumber: 'MD-CA-948102',
  npiNumber: '1739201942',
  bio: 'Investigator exploring multi-modal tabular fusion with cross-attention for rare pigmented lesion phenotypes and ethnic skin variability.',
  joinedDate: 'Mar 2024',
  twoFactorEnabled: true,
  lastLogin: 'Yesterday at 04:30 PM',
  preferences: {
    defaultSensitivityTarget: 96.0,
    heatmapPalette: 'viridis',
    autoGenerateSaliency: true,
    autoFillPriorRisks: true,
    highRiskAlertThreshold: 80,
    reportHeaderClinic: 'Stanford Medicine — Computational Dermatology Unit',
    reportDoctorSignature: 'Sarah Chen (FAAD)',
    enableAudioNotifications: false,
    themePreference: 'dark',
  },
  stats: {
    casesEvaluated: 218,
    malignanciesFlagged: 47,
    reportsExported: 135,
    calibrationsPerformed: 19,
    averageConfidence: 93.2,
  },
  permissions: {
    canRunDiagnostics: true,
    canExportReports: true,
    canTuneLossParameters: false,
    canRecalibrateThresholds: false,
    canManageUsers: false,
    canViewAuditLogs: false,
  },
};

const DEFAULT_USERS: AppUser[] = [
  CLINICIAN_USER,
  RESEARCHER_USER,
  GUEST_USER,
];

const DEFAULT_PASSWORDS: Record<string, string> = {
  'alex.taylor@dermacare-hospital.org': 'ClinicianPass123!',
  'sarah.chen@stanford-derm.org': 'StanfordDerm2026!',
  'guest.evaluator@dermafusion.local': 'GuestAccess123!',
};

const USERS_STORAGE_KEY = 'dermafusion_registered_users';
const PASSWORDS_STORAGE_KEY = 'dermafusion_user_passwords';
const SESSION_STORAGE_KEY = 'dermafusion_current_session';
const AUDIT_LOGS_STORAGE_KEY = 'dermafusion_audit_logs';

/**
 * Get all registered users (combines defaults with any newly registered accounts)
 */
export function getRegisteredUsers(): AppUser[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    const parsed: AppUser[] = JSON.parse(raw);
    // Ensure all default users exist and legacy doctor names are cleansed
    const map = new Map<string, AppUser>();
    DEFAULT_USERS.forEach((u) => map.set(u.email.toLowerCase(), u));
    parsed.forEach((u) => {
      // Exclude any legacy admin/system administrator account
      if (
        (u.role as string) === 'admin' ||
        u.email.toLowerCase().includes('admin') ||
        u.name.toLowerCase().includes('administrator') ||
        u.name.includes('Marcus Vance')
      ) {
        return;
      }
      let cleaned = { ...u };
      if (cleaned.name.includes('Alex Taylor')) {
        cleaned.name = 'Alex Taylor';
      } else if (cleaned.name.includes('Sarah Chen')) {
        cleaned.name = 'Sarah Chen';
      }
      map.set(cleaned.email.toLowerCase(), cleaned);
    });
    return Array.from(map.values());
  } catch (err) {
    console.error('Failed to load registered users from storage', err);
    return DEFAULT_USERS;
  }
}

/**
 * Save user list to storage
 */
export function saveRegisteredUsers(users: AppUser[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save users to storage', err);
  }
}

/**
 * Get passwords mapping
 */
function getPasswordMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(PASSWORDS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PASSWORDS_STORAGE_KEY, JSON.stringify(DEFAULT_PASSWORDS));
      return DEFAULT_PASSWORDS;
    }
    return { ...DEFAULT_PASSWORDS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PASSWORDS;
  }
}

/**
 * Save passwords mapping
 */
function savePasswordMap(map: Record<string, string>): void {
  try {
    localStorage.setItem(PASSWORDS_STORAGE_KEY, JSON.stringify(map));
  } catch (err) {
    console.error('Failed to save passwords', err);
  }
}

/**
 * Get current session user
 */
export function getCurrentSession(): AppUser {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      const user: AppUser = JSON.parse(raw);
      if (user && user.id && user.email) {
        // If current session was an administrator, purge and revert to Clinician
        if (
          (user.role as string) === 'admin' ||
          user.email.toLowerCase().includes('admin') ||
          user.name.toLowerCase().includes('administrator') ||
          user.name.includes('Marcus Vance')
        ) {
          saveCurrentSession(CLINICIAN_USER);
          return CLINICIAN_USER;
        }
        if (user.name && user.name.includes('Alex Taylor')) {
          return { ...user, name: 'Alex Taylor' };
        }
        if (user.name && user.name.includes('Sarah Chen')) {
          return { ...user, name: 'Sarah Chen' };
        }
        return user;
      }
    }
  } catch (err) {
    console.error('Failed to read session user', err);
  }
  return CLINICIAN_USER;
}

/**
 * Save current session user
 */
export function saveCurrentSession(user: AppUser): void {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
  } catch (err) {
    console.error('Failed to save session user', err);
  }
}

/**
 * Clear session
 */
export function clearCurrentSession(): void {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(GUEST_USER));
  } catch (err) {
    console.error('Failed to clear session', err);
  }
}

/**
 * Register a new user account
 */
export interface RegistrationInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  title: string;
  institution: string;
  department: string;
  licenseNumber?: string;
  avatar: string;
}

export function registerNewUser(input: RegistrationInput): { success: boolean; error?: string; user?: AppUser } {
  const emailLower = input.email.trim().toLowerCase();
  if (!emailLower || !emailLower.includes('@')) {
    return { success: false, error: 'Please enter a valid institutional email address.' };
  }
  if (!input.name.trim()) {
    return { success: false, error: 'Full name is required.' };
  }
  if (!input.password || input.password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' };
  }

  const users = getRegisteredUsers();
  const existing = users.find((u) => u.email.toLowerCase() === emailLower);
  if (existing) {
    return {
      success: false,
      error: `An account with ${emailLower} already exists. Please sign in or use a different email.`,
    };
  }

  const newUser: AppUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    name: input.name.trim(),
    email: emailLower,
    role: input.role,
    avatar: input.avatar || '👨‍⚕️',
    title: input.title.trim() || 'Clinical Dermatologist & Screening Specialist',
    institution: input.institution.trim() || 'Medical Center / Health Network',
    department: input.department.trim() || 'Dermatology & Cutaneous Oncology',
    licenseNumber: input.licenseNumber?.trim() || `MED-${Math.floor(100000 + Math.random() * 900000)}`,
    lastLogin: 'Just registered',
    permissions: {
      canRunDiagnostics: true,
      canExportReports: true,
      canTuneLossParameters: input.role === 'clinician',
      canRecalibrateThresholds: input.role === 'clinician',
      canManageUsers: false,
      canViewAuditLogs: input.role === 'clinician',
    },
  };

  // Save user
  const updatedUsers = [newUser, ...users];
  saveRegisteredUsers(updatedUsers);

  // Save password
  const passMap = getPasswordMap();
  passMap[emailLower] = input.password;
  savePasswordMap(passMap);

  // Save session
  saveCurrentSession(newUser);

  // Add audit log
  appendAuditLog({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    userId: newUser.id,
    userName: newUser.name,
    userRole: newUser.role,
    action: 'New User Registered',
    category: 'auth',
    details: `Registered account for ${newUser.name} (${newUser.email}) with role [${newUser.role.toUpperCase()}] at ${newUser.institution}.`,
    status: 'success',
  });

  return { success: true, user: newUser };
}

/**
 * Authenticate user with email and password
 */
export function authenticateWithPassword(
  email: string,
  password?: string
): { success: boolean; error?: string; user?: AppUser } {
  const emailLower = email.trim().toLowerCase();
  if (!emailLower) {
    return { success: false, error: 'Please enter your institutional email address.' };
  }

  const users = getRegisteredUsers();
  const user = users.find((u) => u.email.toLowerCase() === emailLower);

  if (!user) {
    return {
      success: false,
      error: `No account found with email "${emailLower}". Please check your email or create a new account via the Register tab.`,
    };
  }

  // Check password if provided (allow bypass for 1-click presets)
  if (password !== undefined) {
    const passMap = getPasswordMap();
    const storedPass = passMap[emailLower];
    // If password exists in storage and doesn't match
    if (storedPass && password && storedPass !== password) {
      return { success: false, error: 'Invalid password. Please verify your credentials or reset your password.' };
    }
  }

  const updatedUser: AppUser = {
    ...user,
    lastLogin: `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
  };

  // Update in user list
  const updatedUsers = users.map((u) => (u.id === user.id ? updatedUser : u));
  saveRegisteredUsers(updatedUsers);
  saveCurrentSession(updatedUser);

  // Add audit log
  appendAuditLog({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    userId: updatedUser.id,
    userName: updatedUser.name,
    userRole: updatedUser.role,
    action: 'User Authentication Successful',
    category: 'auth',
    details: `Signed in as ${updatedUser.name} (${updatedUser.email}) [${updatedUser.role.toUpperCase()}].`,
    status: 'success',
  });

  return { success: true, user: updatedUser };
}

/**
 * Reset password for an email
 */
export function resetUserPassword(
  email: string,
  newPassword: string
): { success: boolean; error?: string } {
  const emailLower = email.trim().toLowerCase();
  const users = getRegisteredUsers();
  const user = users.find((u) => u.email.toLowerCase() === emailLower);

  if (!user) {
    return { success: false, error: `No registered account found with email "${emailLower}".` };
  }

  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'New password must be at least 6 characters long.' };
  }

  const passMap = getPasswordMap();
  passMap[emailLower] = newPassword;
  savePasswordMap(passMap);

  appendAuditLog({
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    action: 'Password Reset Completed',
    category: 'auth',
    details: `Password was successfully updated for ${user.name} (${user.email}).`,
    status: 'info',
  });

  return { success: true };
}

/**
 * Delete a user (admin tool)
 */
export function deleteRegisteredUser(userId: string): boolean {
  try {
    const users = getRegisteredUsers();
    const filtered = users.filter((u) => u.id !== userId);
    saveRegisteredUsers(filtered);
    return true;
  } catch {
    return false;
  }
}

/**
 * Audit logs storage management
 */
export function getStoredAuditLogs(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(INITIAL_AUDIT_LOGS));
      return INITIAL_AUDIT_LOGS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_AUDIT_LOGS;
  }
}

export const getAuditLogs = getStoredAuditLogs;

/**
 * Update a user's full profile details
 */
export function updateUserProfile(userId: string, partial: Partial<AppUser>): { success: boolean; user?: AppUser; error?: string } {
  try {
    const users = getRegisteredUsers();
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) {
      return { success: false, error: 'User not found' };
    }

    const current = users[index];
    const updated: AppUser = {
      ...current,
      ...partial,
      id: current.id, // preserve ID
      email: partial.email ? partial.email.trim().toLowerCase() : current.email,
      role: partial.role || current.role,
      permissions: {
        ...current.permissions,
        ...(partial.permissions || {}),
      },
      preferences: {
        ...(current.preferences || {}),
        ...(partial.preferences || {}),
      },
      stats: {
        ...(current.stats || {}),
        ...(partial.stats || {}),
      },
    };

    users[index] = updated;
    saveRegisteredUsers(users);

    const session = getCurrentSession();
    if (session.id === userId) {
      saveCurrentSession(updated);
    }

    appendAuditLog({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      userId: updated.id,
      userName: updated.name,
      userRole: updated.role,
      action: 'Profile Updated',
      category: 'system',
      details: `Profile and clinical credentials updated for ${updated.name} (${updated.title}) at ${updated.institution}.`,
      status: 'success',
    });

    return { success: true, user: updated };
  } catch (err) {
    console.error('Failed to update user profile', err);
    return { success: false, error: 'Failed to save changes.' };
  }
}

/**
 * Change password for a logged-in user verifying old password
 */
export function changeUserPassword(
  email: string,
  oldPass: string,
  newPass: string
): { success: boolean; error?: string } {
  const emailLower = email.trim().toLowerCase();
  const passMap = getPasswordMap();
  const actualPass = passMap[emailLower];

  if (actualPass && actualPass !== oldPass) {
    return { success: false, error: 'Current password is incorrect. Please verify and try again.' };
  }

  if (!newPass || newPass.length < 6) {
    return { success: false, error: 'New password must be at least 6 characters long.' };
  }

  passMap[emailLower] = newPass;
  savePasswordMap(passMap);

  const users = getRegisteredUsers();
  const user = users.find((u) => u.email.toLowerCase() === emailLower);

  if (user) {
    appendAuditLog({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'Password Changed',
      category: 'auth',
      details: `Password changed for user ${user.name} (${user.email}).`,
      status: 'info',
    });
  }

  return { success: true };
}

export function appendAuditLog(entry: AuditLogEntry): void {
  try {
    const current = getStoredAuditLogs();
    const updated = [entry, ...current].slice(0, 50); // keep recent 50
    localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to append audit log', err);
  }
}

export const recordAuditLog = appendAuditLog;
