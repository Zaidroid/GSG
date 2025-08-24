# GSG Contact Manager - Troubleshooting Guide

## Issue: Contact appears to save but doesn't show in HTML or Google Sheet

This issue typically occurs when there's a problem with the data flow between the HTML frontend and Google Apps Script backend. Here's how to debug it step by step:

### Step 1: Check Google Apps Script Logs

1. **Open your Google Apps Script project**
   - Go to [script.google.com](https://script.google.com)
   - Open your "GSG Contact Manager Backend" project

2. **Check the execution logs**
   - Click "View" > "Execution transcript" (or press Ctrl+Enter)
   - Try adding a contact from the HTML file
   - Look for any error messages or debug output

3. **What to look for in the logs:**
   ```
   POST request received
   Action: saveContact
   Data received: {name: "Test Contact", email: "test@example.com", ...}
   saveContact called with data: {...}
   Sheet headers: [id, projectId, type, name, ...]
   Generated new ID: abc-123-def
   Prepared row data: [abc-123-def, "", "Individual", "Test Contact", ...]
   Added new contact: abc-123-def
   Sheet now has 2 rows total
   ```

### Step 2: Verify Google Sheet Setup

1. **Check your Google Sheet**
   - Open the Google Sheet you're using as the database
   - Verify it has exactly these sheet names: "Contacts", "Activities", "Settings"
   - Check that the "Contacts" sheet has the correct headers in row 1

2. **Expected headers in Contacts sheet (row 1):**
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

3. **Check the Sheet ID in your script**
   - In Google Apps Script, find this line: `const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE';`
   - Make sure it matches your actual Google Sheet ID
   - The Sheet ID is in the URL: `https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit`

### Step 3: Test the Backend Directly

1. **Run the testSetup function**
   - In Google Apps Script, select "testSetup" from the function dropdown
   - Click the "Run" button
   - Check the logs for any errors

2. **Test the web app URL directly**
   - Open your web app URL in a browser
   - You should see a JSON response like:
   ```json
   {
     "success": true,
     "data": {
       "contacts": [],
       "activities": []
     },
     "timestamp": "2024-01-01T12:00:00.000Z"
   }
   ```

### Step 4: Check HTML Configuration

1. **Verify the web app URL in HTML**
   - Open your `gsg-contact-manager.html` file
   - Find the configuration section at the top
   - Make sure `GOOGLE_SCRIPT_URL` is set to your actual web app URL
   - It should look like: `https://script.google.com/macros/s/AKfycbw.../exec`

2. **Check browser console for errors**
   - Open the HTML file in your browser
   - Press F12 to open developer tools
   - Go to the "Console" tab
   - Try adding a contact and look for any error messages

### Step 5: Common Issues and Solutions

#### Issue: "Script function not found" error
**Solution:** Make sure you copied the entire Google Apps Script code and didn't accidentally modify function names.

#### Issue: "Permission denied" error  
**Solution:** 
- Run the `testSetup` function in Google Apps Script to authorize permissions
- Make sure the script has access to Google Sheets

#### Issue: "Invalid sheet name" error
**Solution:** 
- Check that your sheet names are exactly "Contacts", "Activities", "Settings" (case-sensitive)
- No extra spaces or special characters

#### Issue: Web app returns 404 or "Access denied"
**Solution:**
- Redeploy the web app with correct permissions
- Make sure "Who has access" is set to "Anyone"
- Use the correct web app URL (ends with `/exec`, not `/dev`)

#### Issue: Contact data appears malformed in logs
**Solution:**
- Check that all required fields (name, email) are filled in the HTML form
- Verify the form field names match the expected column headers

#### Issue: Headers don't match expected format
**Solution:**
- Delete and recreate the headers in your Google Sheet
- Make sure there are no extra spaces or hidden characters
- Copy the headers exactly as shown in Step 2 above

### Step 6: Manual Testing Steps

1. **Test with minimal data:**
   - Try adding a contact with just name and email
   - Check if it appears in the sheet

2. **Check data types:**
   - Look at the data in the Google Sheet
   - Make sure dates are formatted correctly
   - Check that JSON fields (scoreBreakdown, tags) are valid

3. **Test the sync:**
   - Add a contact manually in the Google Sheet
   - Click "Sync" in the HTML app
   - See if it appears in the interface

### Step 7: Debug Mode

I've added extra logging to help debug. After updating your Google Apps Script with the latest code:

1. **Try adding a contact**
2. **Check the execution logs** for detailed debug information
3. **Look for these specific log messages:**
   - "POST request received"
   - "Data received: ..."
   - "Sheet headers: ..."
   - "Prepared row data: ..."
   - "Added new contact: ..."

### Getting Help

If you're still having issues:

1. **Share the execution logs** from Google Apps Script
2. **Check the browser console** for any JavaScript errors
3. **Verify your sheet structure** matches exactly what's expected
4. **Test the web app URL** directly in a browser

The most common issue is usually a mismatch between the expected sheet headers and what's actually in your Google Sheet, or an incorrect Sheet ID in the script configuration.