# User Invitation System - Admin Guide

**For**: Restaurant & Cafe Administrators
**Version**: 1.0
**Date**: October 25, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Inviting Users](#inviting-users)
4. [Managing Invitations](#managing-invitations)
5. [Understanding Roles](#understanding-roles)
6. [Rate Limits](#rate-limits)
7. [Multi-Tenant Users](#multi-tenant-users)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

---

## Overview

The User Invitation System allows you to invite team members and customers to join your restaurant or cafe on OrderFlow. Invited users receive an email with a secure link to set up their account and gain access to the system based on their assigned role.

### Key Features

- **Email-based invitations**: Users receive a secure signup link via email
- **Role-based access**: Assign admin, staff, or customer roles
- **Multi-tenant support**: Users can work for multiple restaurants
- **Invitation tracking**: Monitor pending and accepted invitations
- **Rate limiting**: Security feature to prevent abuse (10 invitations per hour)

---

## Getting Started

### Accessing the Invitation Manager

1. Log in to your OrderFlow admin panel
2. Click on the **"Team"** or **"Users"** tab in the sidebar
3. You'll see the Invitation Manager interface

### Prerequisites

- You must have an **admin** role to send invitations
- Your restaurant's email configuration must be set up (contact support if you're unsure)

---

## Inviting Users

### Step-by-Step: Sending an Invitation

1. **Open the Invitation Form**
   - Click the **"+ Invite User"** button in the top-right corner
   - A modal dialog will appear

2. **Enter User Details**
   - **Email Address**: Enter the user's email address (required)
     - Must be a valid email format (e.g., user@example.com)
     - Email will be used for login

   - **Role**: Select the appropriate role (required)
     - **Admin**: Full access to all management features
     - **Staff**: Access to kitchen display and order management
     - **Customer**: Basic customer account with order history

3. **Send the Invitation**
   - Click **"Send Invitation"**
   - Wait for confirmation message
   - Invitation will appear in your invitation list

### What Happens Next?

1. **Email Sent**: The user receives an invitation email within 60 seconds
2. **Email Contents**:
   - Your name as the inviter
   - Your restaurant name
   - The role they're being invited for
   - A secure signup link (valid for 72 hours)
   - Instructions on how to complete signup

3. **User Signup**:
   - User clicks the link
   - Sets their password and profile information
   - Automatically logged in

4. **Acceptance Notification**:
   - You receive an email when the user accepts
   - Invitation status updates to "accepted" in your list

---

## Managing Invitations

### Viewing Your Invitation List

The invitation table shows all invitations for your restaurant with the following information:

| Column | Description |
|--------|-------------|
| **Email** | The invited user's email address |
| **Role** | The role assigned to this user |
| **Status** | Current invitation status (see below) |
| **Invited By** | Admin who sent the invitation |
| **Date Sent** | When invitation was created |
| **Accepted Date** | When user completed signup (if accepted) |

### Invitation Statuses

| Status | Badge Color | Meaning |
|--------|-------------|---------|
| **Pending** | Yellow | Invitation sent, waiting for user to accept |
| **Accepted** | Green | User completed signup and has access |
| **Expired** | Gray | Invitation expired after 72 hours |
| **Error** | Red | Email failed to send (contact support) |

### Real-Time Updates

The invitation list updates automatically in real-time. You don't need to refresh the page to see:
- New invitations sent by other admins
- Status changes (pending → accepted)
- Acceptance dates

---

## Understanding Roles

### Admin Role

**Full System Access**

Admins can:
- Access the full admin panel
- Manage products, categories, and menu
- View and manage orders
- Configure restaurant settings
- Invite and manage users
- View financial reports and analytics
- Access kitchen display system

**When to Use**:
- Restaurant owners
- General managers
- Office managers with full authority

**Security Note**: Only invite trusted individuals as admins. They have full control over your restaurant's settings.

---

### Staff Role

**Operational Access**

Staff can:
- Access kitchen display system
- View and manage orders
- Update order status
- Mark items as complete
- View menu and products (read-only)

Staff CANNOT:
- Modify restaurant settings
- Change menu or pricing
- Invite users
- Access financial reports
- Delete data

**When to Use**:
- Kitchen staff
- Servers and waitstaff
- Shift supervisors
- Baristas

**Best Practice**: Most team members should have the staff role for security and simplicity.

---

### Customer Role

**Basic Customer Account**

Customers can:
- Browse menu
- Place orders
- View order history
- Manage their profile
- Track loyalty points

Customers CANNOT:
- Access admin panel
- Access kitchen display
- See other customers' orders
- Modify menu or settings

**When to Use**:
- Regular customers you want to give accounts to
- VIP customers
- Corporate clients

**Note**: Most customers will use self-registration (no invitation needed). Only use customer invitations for special cases.

---

## Rate Limits

### Why Rate Limits Exist

Rate limiting prevents accidental or malicious bulk invitation sending. It protects your restaurant from:
- Email spam complaints
- Mailgun account issues
- Accidental mass invitations

### Current Limits

**10 invitations per hour per restaurant**

This means:
- You can send up to 10 invitations in any 60-minute period
- The counter resets after 1 hour from your first invitation
- All admins share the same limit (not per-admin)

### Viewing Your Current Usage

Look at the top-right of the Invitation Manager:
- Shows: "X/10 invitations sent this hour"
- When limit reached, shows reset time: "Resets at 3:45 PM"

### What Happens When Limit Reached?

- The **"+ Invite User"** button becomes disabled
- You'll see a warning message if you try to send
- Error message shows when you can send again
- Wait for the reset time, then you can send 10 more

### Tips for Managing Rate Limits

1. **Plan Ahead**: If you're onboarding a large team, spread invitations over multiple hours
2. **Coordinate with Co-Admins**: Check with other admins before sending bulk invitations
3. **Contact Support**: If you need to onboard 20+ users quickly, contact support for assistance
4. **Batch Wisely**: Send your most urgent invitations first

---

## Multi-Tenant Users

### What is a Multi-Tenant User?

A multi-tenant user is someone who works for multiple restaurants using the same email address.

**Example Scenario**:
- Sarah is a manager at "Downtown Cafe" (admin role)
- Sarah also works part-time at "Uptown Restaurant" (staff role)
- Sarah uses sarah@example.com for both
- Sarah can switch between restaurants in OrderFlow

### How Multi-Tenant Works

1. **First Invitation**:
   - User accepts invitation from Restaurant A
   - Creates account with email and password

2. **Second Invitation**:
   - User receives invitation from Restaurant B
   - Clicks link and completes signup
   - System adds Restaurant B to existing account
   - No duplicate account created

3. **Logging In**:
   - User logs in with email/password
   - Sees tenant selector showing both restaurants
   - Selects which restaurant to access
   - Can switch restaurants from account menu

### Roles Per Tenant

Users can have **different roles in different restaurants**:
- Admin at Restaurant A
- Staff at Restaurant B
- Customer at Restaurant C

Each role is independent and enforced per restaurant.

### Switching Between Restaurants

Users can switch restaurants:
1. Click on account menu
2. Select "Switch Restaurant"
3. Choose from list of their restaurants
4. App reloads with new restaurant context

---

## Troubleshooting

### User Didn't Receive Email

**Possible Causes & Solutions**:

1. **Check Spam Folder**
   - Ask user to check spam/junk folder
   - Emails come from: noreply@orderflow.app
   - Subject: "You've been invited to join [Your Restaurant] on OrderFlow"

2. **Wrong Email Address**
   - Verify email address in invitation list
   - If wrong, send new invitation with correct email
   - Original invitation will remain as "pending"

3. **Email Server Issues**
   - Check invitation status in list
   - If status is "error" (red badge), email failed to send
   - Contact OrderFlow support with invitation details

4. **Waited Less Than 60 Seconds**
   - Emails can take up to 60 seconds to deliver
   - Ask user to wait a few minutes and check again

5. **User's Email Provider Blocking**
   - Some corporate email servers block automated emails
   - Ask user to whitelist noreply@orderflow.app
   - Or use personal email address instead

**Resolution Steps**:
1. Check invitation status (should be "pending", not "error")
2. Wait 5 minutes for email delivery
3. Ask user to check spam folder
4. If still not received, send new invitation
5. If problem persists, contact support

---

### Invitation Link Not Working

**Symptoms**: User clicks link but sees "Invalid invitation" error

**Possible Causes**:

1. **Invitation Expired**
   - Invitations expire after 72 hours
   - Check "Date Sent" in invitation list
   - If more than 3 days old, send new invitation

2. **Already Accepted**
   - Check if status is "accepted"
   - User may have already created account
   - Direct user to login page instead

3. **Link Broken in Email**
   - Email clients sometimes break long URLs
   - Ask user to copy entire link
   - Or send new invitation

4. **Token Invalid**
   - Rare technical issue
   - Send new invitation
   - Contact support if recurring

**Resolution**:
- For expired invitations: Send new invitation
- For accepted invitations: Direct user to login
- For broken links: Send new invitation
- Document the issue if it recurs

---

### User Can't Complete Signup

**Symptoms**: User fills out form but gets error message

**Common Errors & Solutions**:

1. **"Password too short"**
   - Password must be at least 8 characters
   - Ask user to create longer password

2. **"Email already registered"**
   - User already has OrderFlow account
   - This is multi-tenant feature working correctly
   - User should complete signup to add your restaurant to their account
   - If still errors, contact support

3. **"Invalid token" after form submission**
   - Invitation may have been used already
   - Check invitation status
   - Send new invitation if needed

4. **"Network error" or "Failed to create account"**
   - Temporary connectivity issue
   - Ask user to refresh page and try again
   - If persists, contact support

---

### Rate Limit Problems

**Issue**: Can't send invitations due to rate limit

**Solutions**:

1. **Wait for Reset**
   - Check reset time in rate limit indicator
   - System automatically resets after 1 hour

2. **Coordinate with Other Admins**
   - Check with other admins who might be sending invitations
   - Plan large batches together

3. **Urgent Invitations**
   - If you need to send 10+ invitations immediately, contact support
   - Support can temporarily increase your limit

4. **Failed Invitations Don't Count**
   - Invitations with "error" status don't count toward limit
   - You can retry failed invitations

---

### User Has Wrong Role

**Issue**: User invited with wrong role (e.g., customer instead of staff)

**Current Limitation**:
- Role cannot be changed after invitation sent
- User must complete signup with assigned role

**Workaround**:
1. Wait for current invitation to expire (72 hours)
2. Or contact support to cancel invitation
3. Send new invitation with correct role

**Future Feature**: Role editing will be added in future update

---

## Best Practices

### Planning Your Team

**Before Sending Invitations**:

1. **Create Role Matrix**
   - List all team members
   - Assign appropriate roles
   - Review with senior staff

2. **Start with Admins**
   - Invite key managers first
   - They can help invite other staff

3. **Batch by Department**
   - Invite kitchen staff together
   - Then front-of-house staff
   - Then office staff

4. **Communicate with Team**
   - Tell staff to expect email
   - Explain what OrderFlow is
   - Set deadline for account creation

---

### Security Best Practices

1. **Limit Admin Access**
   - Only give admin role to truly trusted individuals
   - Most staff should have staff role
   - Review admin list regularly

2. **Use Work Email Addresses**
   - Prefer company email over personal email
   - Easier to revoke access if employee leaves
   - Professional and traceable

3. **Monitor Invitation List**
   - Review pending invitations weekly
   - Remove/expire old pending invitations
   - Watch for unusual activity

4. **Offboarding Process**
   - When staff leaves, document their account
   - Future feature: deactivate user accounts
   - Change passwords if they had admin access

---

### Communication Tips

**Sample Invitation Email to Staff**:

```
Subject: Welcome to OrderFlow - Please Create Your Account

Hi [Name],

We're moving to OrderFlow, our new restaurant management system!

You'll receive an email from noreply@orderflow.app with an invitation link. Please:

1. Check your inbox (and spam folder) for the invitation
2. Click the link to create your account
3. Set a secure password
4. Complete your profile

The link expires in 3 days, so please complete this by [date].

If you have any issues, let me know!

Thanks,
[Your Name]
```

**Tips**:
- Send heads-up email BEFORE sending invitation
- Include deadline
- Offer to help with setup
- Follow up with no-shows after 24 hours

---

### Invitation Timing

**Best Times to Send**:
- **Morning** (9-11 AM): High email open rates
- **Early Week** (Tuesday-Wednesday): Better than Friday
- **Avoid Weekends**: Staff may not check work email

**Allow Time For**:
- Email delivery: Up to 60 seconds
- User to check email: 1-24 hours
- User to complete signup: 15 minutes

**Recommended Timeline**:
- Day 1: Send invitation
- Day 2: Follow up if not accepted
- Day 3: Reminder before expiration
- Day 4: Resend if expired

---

### Large Team Onboarding

**If You Have 20+ Staff**:

1. **Contact Support First**
   - Request temporary rate limit increase
   - Discuss batch import options

2. **Create Spreadsheet**
   - Column 1: Name
   - Column 2: Email
   - Column 3: Role
   - Column 4: Department
   - Column 5: Invitation Sent (date)
   - Column 6: Account Created (date)

3. **Send in Waves**
   - Wave 1: Admins and managers (day 1)
   - Wave 2: Kitchen staff (day 2)
   - Wave 3: Front-of-house (day 3)
   - Wave 4: Part-time staff (day 4)

4. **Track Progress**
   - Update spreadsheet daily
   - Follow up with no-shows
   - Celebrate milestones

---

## Getting Help

### Support Channels

**Email Support**: support@orderflow.app
- Response time: 24-48 hours
- Include: restaurant name, invitation email, error screenshots

**Live Chat**: Available in app (bottom-right corner)
- Available: Mon-Fri, 9 AM - 5 PM GMT
- Best for: urgent issues, quick questions

**Documentation**: docs.orderflow.app
- Troubleshooting guides
- Video tutorials
- FAQ

### What to Include in Support Requests

1. **Restaurant Details**
   - Restaurant name
   - Your admin email
   - Tenant ID (if known)

2. **Issue Details**
   - What you were trying to do
   - What happened instead
   - Error messages (exact text or screenshot)
   - When it happened (date/time)

3. **Context**
   - Invitation email address
   - User's reported issue
   - Steps you've already tried

4. **Screenshots**
   - Invitation list showing problem
   - Error messages
   - Email screenshots (if relevant)

---

## Frequently Asked Questions

### Can I cancel a pending invitation?

Not currently. Invitations expire automatically after 72 hours. Future feature will add cancellation.

### Can I resend an invitation?

Yes. If the invitation expired, you can send a new invitation to the same email address. The old invitation will remain as "expired" in your list.

### Can users change their own roles?

No. Only admins can assign roles. Users cannot change their own roles or other users' roles.

### What if a user works at multiple locations?

This is supported! They can accept invitations from multiple restaurants. When they log in, they'll select which restaurant to access.

### How do I remove a user?

User removal feature is coming in a future update. For now, users can have accounts but not access your restaurant if not invited.

### Can customers create accounts without invitation?

Yes! End customers can self-register at your restaurant's menu page. Use customer invitations only for VIP or corporate clients.

### Why is there a rate limit?

Rate limiting prevents spam and protects your email reputation. It's a security feature to prevent abuse.

### Can I customize the invitation email?

Not currently. All invitations use standard template. Custom branding coming in future update.

---

## Appendix: Role Comparison Table

| Feature | Admin | Staff | Customer |
|---------|-------|-------|----------|
| View menu | ✅ | ✅ | ✅ |
| Place orders | ✅ | ✅ | ✅ |
| View order history | ✅ (all) | ✅ (all) | ✅ (own) |
| Kitchen display | ✅ | ✅ | ❌ |
| Manage orders | ✅ | ✅ | ❌ |
| Edit menu/products | ✅ | ❌ | ❌ |
| Manage categories | ✅ | ❌ | ❌ |
| Change settings | ✅ | ❌ | ❌ |
| Invite users | ✅ | ❌ | ❌ |
| View reports | ✅ | ❌ | ❌ |
| Loyalty points | ✅ (manage) | ✅ (view) | ✅ (own) |

---

**Document Version**: 1.0
**Last Updated**: October 25, 2025
**Next Review**: After user feedback collection

For questions or feedback on this guide, contact: support@orderflow.app
