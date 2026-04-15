/**
 * GCI 3D Print Lab – Print System Configuration
 * ──────────────────────────────────────────────
 * Replace the placeholder values below with your real Google Apps Script
 * web-app URLs before going live.
 *
 * HOW TO GET THESE URLs:
 *   1. Open script.google.com and create/open your Apps Script project.
 *   2. Click Deploy → New deployment → Web app.
 *   3. Set "Execute as" to "Me" and "Who has access" to "Anyone, even anonymous".
 *   4. Copy the web app URL — that is the value for each endpoint below.
 *
 * All three endpoints can point to the same deployed script URL if you use
 * a single Apps Script project that handles all request types (recommended).
 * The "requestType" field in the POST body tells the script what to do.
 *
 * SECURITY NOTE:
 *   These are public web-app URLs, not secrets. The private data they
 *   receive is stored only in your Google Sheet, never in this file.
 *   Never commit actual student or staff data to source control.
 */

(function (global) {
  'use strict';

  global.PRINT_CONFIG = {

    /**
     * Endpoint for student print submissions (POST).
     * Replace with your deployed Google Apps Script web-app URL.
     */
    STUDENT_SUBMIT_ENDPOINT: 'https://script.google.com/macros/s/AKfycby2iCumCrKod32eUOmL8qcvmPRDXV3jhF_hTF8l7Tp76xrlhax1BzgTALYtP9drQQxDLA/exec',

    /**
     * Endpoint for staff print requests (POST).
     * May be the same URL as STUDENT_SUBMIT_ENDPOINT if you use a single script.
     */
    STAFF_SUBMIT_ENDPOINT: 'https://script.google.com/macros/s/AKfycby2iCumCrKod32eUOmL8qcvmPRDXV3jhF_hTF8l7Tp76xrlhax1BzgTALYtP9drQQxDLA/exec',

    /**
     * Endpoint for the public live queue (GET).
     * Must return a JSON array of sanitized job objects (no names, emails, or
     * file links — only: jobId, projectType, status, printerAssigned, pickupStatus).
     */
    QUEUE_ENDPOINT: 'https://script.google.com/macros/s/AKfycby2iCumCrKod32eUOmL8qcvmPRDXV3jhF_hTF8l7Tp76xrlhax1BzgTALYtP9drQQxDLA/exec',

    /**
     * How often (in milliseconds) the live queue refreshes automatically.
     * Default: 60 000 ms = 60 seconds.
     */
    QUEUE_REFRESH_INTERVAL: 60000

  };

}(window));
