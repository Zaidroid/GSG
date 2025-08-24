# GSG Contact Manager - Google Apps Script Setup Guide

## Overview
This guide will help you set up the Google Apps Script backend for the GSG Contact Manager. The backend provides a simple HTTP API that connects your HTML contact manager to a Google Sheet database.

## Prerequisites
- Google account with access to Google Drive, Sheets, and Apps Script
- The `google-apps-script.js` file from this project

## Step-by-Step Setup

### Step 1: Create the Google Sheet Database

1. **Create a new Google Sheet:**
   - Go to [Google Sheets](https://sheets.google.com)
   - Click "Blank" to create a new spreadsheet
   - Rename it to "GSG Contact Manager Database"

2. **Create the required sheets:**
   - Right-click on the "Sheet1" tab at the bottom
   - Select "Rename" and change it to "Contacts"
   - Right-click in the sheet tab area and select "Insert sheet"
   - Name the new sheet "Activities"
   - Insert another sheet and name it "Settings"

3. **Set up the Contacts sheet headers:**
   In the "Contacts" sheet, add these headers in row 1 (columns A through U):
   ```
   A1: id
   B1: projectId
   C1: type
   D1: name
   E1: title
   F1: company
   G1: industry
   H1: email
   I1: linkedin
   J1: phone
   K1: status
   L1: priority
   M1: assignee
   N1: nextFollowUp
   O1: notes
   P1: score
   Q1: scoreBreakdown
   R1: tags
   S1: dateAdded
   T1: lastModified
   U1: lastContacted
   ```

4. **Set up the Activities sheet headers:**
   In the "Activities" sheet, add these headers in row 1:
   ```
   A1: id
   B1: contactId
   C1: type
   D1: notes
   E1: date
   F1: user
   G1: metadata
   ```

5. **Set up the Settings sheet headers:**
   In the "Settings" sheet, add these headers in row 1:
   ```
   A1: key
   B1: value
   C1: description
   ```

6. **Get your Sheet ID:**
   - Look at the URL of your Google Sheet
   - The Sheet ID is the long string between `/d/` and `/edit`
   - Example: `https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit`
   - Sheet ID: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`
   - Copy this ID - you'll need it in the next step

### Step 2: Create the Google Apps Script

1. **Open Google Apps Script:**
   - Go to [Google Apps Script](https://script.google.com)
   - Click "New Project"

2. **Replace the default code:**
   - Delete all the default code in the editor
   - Copy the entire contents of `google-apps-script.js`
   - Paste it into the Apps Script editor

3. **Configure the Sheet ID:**
   - Find this line near the top of the code:
     ```javascript
     const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE';
     ```
   - Replace `YOUR_GOOGLE_SHEET_ID_HERE` with your actual Sheet ID from Step 1
   - Example:
     ```javascript
     const SHEET_ID = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';
     ```

4. **Save the project:**
   - Click the save icon or press Ctrl+S
   - Name your project "GSG Contact Manager Backend"

### Step 3: Test the Setup

1. **Run the test function:**
   - In the Apps Script editor, select "testSetup" from the function dropdown
   - Click the "Run" button (play icon)
   - You may be prompted to authorize the script - click "Review permissions"
   - Click "Allow" to grant the necessary permissions

2. **Check the logs:**
   - Click "View" > "Logs" or press Ctrl+Enter
   - You should see messages like:
     ```
     ✓ Successfully opened spreadsheet: GSG Contact Manager Database
     ✓ Contacts sheet found
     ✓ Activities sheet found
     ✓ Settings sheet found
     ✓ Successfully retrieved 0 contacts
     ✓ Successfully retrieved 0 activities
     Setup test completed successfully!
     ```

3. **If you see errors:**
   - Check that your Sheet ID is correct
   - Verify that all sheet names are exactly "Contacts", "Activities", and "Settings"
   - Make sure the headers are in the correct columns

### Step 4: Deploy as Web App

1. **Create a new deployment:**
   - Click "Deploy" > "New deployment"
   - Click the gear icon next to "Type" and select "Web app"

2. **Configure the deployment:**
   - Description: "GSG Contact Manager API"
   - Execute as: "Me"
   - Who has access: "Anyone" (this allows your team to use it without individual authentication)

3. **Deploy:**
   - Click "Deploy"
   - You may need to authorize again - click "Authorize access"
   - Copy the "Web app URL" - this is your API endpoint

### Step 5: Configure the HTML File

1. **Open your GSG Contact Manager HTML file**

2. **Find the configuration section:**
   - Look for a section near the top with a comment like "CONFIGURATION"
   - Find a line that looks like:
     ```javascript
     const GOOGLE_SCRIPT_URL = 'YOUR_WEB_APP_URL_HERE';
     ```

3. **Update the URL:**
   - Replace `YOUR_WEB_APP_URL_HERE` with the Web app URL from Step 4
   - Example:
     ```javascript
     const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw.../exec';
     ```

### Step 6: Test the Complete System

1. **Open the HTML file in your browser**

2. **Check the connection:**
   - The app should load without errors
   - You should see "Connected" or similar status indicator
   - The contacts table should be empty but functional

3. **Test adding a contact:**
   - Click "Add Contact" 
   - Fill in the required fields (name, email)
   - Click "Save"
   - Check your Google Sheet - the contact should appear in the Contacts sheet

## Troubleshooting

### Common Issues and Solutions

**"Script function not found" error:**
- Make sure you copied the entire `google-apps-script.js` file
- Verify that function names weren't accidentally changed

**"Permission denied" error:**
- Run the `testSetup` function and authorize the script
- Make sure the script has permission to access Google Sheets

**"Invalid sheet name" error:**
- Check that sheet names are exactly "Contacts", "Activities", "Settings" (case-sensitive)
- Make sure there are no extra spaces in the sheet names

**"CORS" or "Access denied" errors in the HTML app:**
- Verify the web app is deployed with "Anyone" access
- Make sure you're using the correct Web app URL (not the Apps Script editor URL)

**Data not appearing in the HTML app:**
- Check that the Sheet ID in the script matches your actual sheet
- Verify that the headers in your sheets match exactly
- Run the `testSetup` function to check for issues

**"Execution transcript" shows errors:**
- Check the logs in Apps Script (View > Logs)
- Look for specific error messages and line numbers
- Verify your sheet structure matches the requirements

### Testing Tools

**Test the API directly:**
- Open your Web app URL in a browser
- You should see a JSON response with your contacts data
- If you get an error page, check the Apps Script logs

**Check Google Sheet permissions:**
- Make sure you can edit the Google Sheet manually
- Verify that the Apps Script has the same permissions

### Getting Help

If you encounter issues:
1. Check the execution transcript in Apps Script for detailed error messages
2. Verify each step was completed exactly as described
3. Test with a simple contact first before adding complex data
4. Make sure your Google account has the necessary permissions

## Security Notes

- This setup allows anyone with the Web app URL to access your contact data
- All changes are logged in Google Sheets revision history
- Consider using "Anyone with the link" instead of "Anyone" for slightly better security
- The Google Sheet permissions control who can view/edit the underlying data

## Maintenance

**Updating the script:**
- Make changes in the Apps Script editor
- Save the changes
- Create a new deployment or update the existing one

**Backing up data:**
- Your data is automatically backed up in Google Sheets
- You can download the sheet as Excel/CSV for additional backups
- Google Sheets maintains revision history automatically

**Monitoring usage:**
- Check the Apps Script dashboard for usage statistics
- Monitor the execution transcript for errors
- Review Google Sheets activity for data changes