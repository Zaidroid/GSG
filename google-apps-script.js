/**
 * GSG Contact Manager - Google Apps Script Backend
 * 
 * SETUP INSTRUCTIONS:
 * ==================
 * 
 * 1. CREATE NEW GOOGLE APPS SCRIPT PROJECT:
 *    - Go to https://script.google.com
 *    - Click "New Project"
 *    - Replace the default code with this entire file
 *    - Save the project with name "GSG Contact Manager Backend"
 * 
 * 2. CREATE GOOGLE SHEET:
 *    - Create a new Google Sheet
 *    - Rename it to "GSG Contact Manager Database"
 *    - Create three sheets with these exact names:
 *      a) "Contacts" - Main contact data
 *      b) "Activities" - Activity timeline data  
 *      c) "Settings" - Application configuration
 * 
 * 3. SET UP SHEET HEADERS:
 *    In the "Contacts" sheet, add these headers in row 1:
 *    A1: id, B1: projectId, C1: type, D1: name, E1: title, F1: company, 
 *    G1: industry, H1: email, I1: linkedin, J1: phone, K1: status, 
 *    L1: priority, M1: assignee, N1: nextFollowUp, O1: notes, P1: score, 
 *    Q1: scoreBreakdown, R1: tags, S1: dateAdded, T1: lastModified, U1: lastContacted, V1: assignmentHistory
 * 
 *    In the "Activities" sheet, add these headers in row 1:
 *    A1: id, B1: contactId, C1: type, D1: notes, E1: date, F1: user, G1: metadata
 * 
 *    In the "Settings" sheet, add these headers in row 1:
 *    A1: key, B1: value, C1: description
 * 
 * 4. LINK SCRIPT TO SHEET:
 *    - In the Apps Script editor, click "Resources" > "Libraries" (if needed)
 *    - Update the SHEET_ID constant below with your Google Sheet ID
 *    - The Sheet ID is found in the URL: https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit
 * 
 * 5. DEPLOY AS WEB APP:
 *    - Click "Deploy" > "New Deployment"
 *    - Choose type: "Web app"
 *    - Description: "GSG Contact Manager API"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone" (for team access without authentication)
 *    - Click "Deploy"
 *    - Copy the Web App URL - you'll need this for the HTML file
 * 
 * 6. TEST THE DEPLOYMENT:
 *    - Open the Web App URL in a browser
 *    - You should see a JSON response with an empty contacts array
 *    - If you get an error, check the execution transcript in Apps Script
 * 
 * 7. CONFIGURE HTML FILE:
 *    - Open your GSG Contact Manager HTML file
 *    - Find the configuration section at the top
 *    - Replace the placeholder URL with your Web App URL
 * 
 * TROUBLESHOOTING:
 * ===============
 * 
 * Common Issues:
 * - "Script function not found": Make sure function names match exactly
 * - "Permission denied": Check that the script has access to Google Sheets
 * - "Invalid sheet name": Verify sheet names are exactly "Contacts", "Activities", "Settings"
 * - "CORS errors": Make sure the web app is deployed with "Anyone" access
 * 
 * Testing:
 * - Test GET: Open the web app URL directly in browser
 * - Test POST: Use the HTML interface or a tool like Postman
 * - Check logs: View > Execution transcript in Apps Script editor
 * 
 * Security Notes:
 * - This script allows public access for team collaboration
 * - Data is protected by Google Sheets permissions
 * - Consider restricting access to "Anyone with the link" if needed
 * - All changes are logged in Google Sheets revision history
 */

// CONFIGURATION - UPDATE THIS WITH YOUR GOOGLE SHEET ID
const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE'; // Replace with actual Sheet ID

// Sheet names - must match exactly
const CONTACTS_SHEET = 'Contacts';
const ACTIVITIES_SHEET = 'Activities';
const SETTINGS_SHEET = 'Settings';

/**
 * HTTP GET handler - Returns all contacts and activities
 * Called when someone visits the web app URL
 */
function doGet(e) {
  try {
    console.log('GET request received');
    
    const contacts = getContacts();
    const activities = getActivities();
    
    const response = {
      success: true,
      data: {
        contacts: contacts,
        activities: activities
      },
      timestamp: new Date().toISOString()
    };
    
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error in doGet:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString(),
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * HTTP POST handler - Handles CRUD operations
 * Expects JSON payload with action and data
 */
function doPost(e) {
  try {
    console.log('POST request received');
    debugRequest(e);
    
    if (!e.postData || !e.postData.contents) {
      throw new Error('No data provided in POST request');
    }
    
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;
    const data = requestData.data;
    
    console.log('Action:', action);
    console.log('Data received:', data);
    
    let result;
    
    switch (action) {
      case 'saveContact':
        result = saveContact(data);
        break;
      case 'deleteContact':
        result = deleteContact(data.id);
        break;
      case 'saveActivity':
        result = saveActivity(data);
        break;
      case 'deleteActivity':
        result = deleteActivity(data.id);
        break;
      case 'bulkUpdate':
        result = bulkUpdateContacts(data);
        break;
      case 'getSetting':
        result = getSetting(data.key);
        break;
      case 'setSetting':
        result = setSetting(data.key, data.value);
        break;
      default:
        throw new Error('Invalid action: ' + action);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error in doPost:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString(),
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Get all contacts from the Contacts sheet
 */
function getContacts() {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(CONTACTS_SHEET);
    
    if (!sheet) {
      throw new Error('Contacts sheet not found. Make sure sheet is named exactly "' + CONTACTS_SHEET + '"');
    }
    
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return []; // No data rows, only headers
    }
    
    const headers = data[0];
    const contacts = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const contact = {};
      
      for (let j = 0; j < headers.length; j++) {
        const header = headers[j];
        let value = row[j];
        
        // Handle special data types
        if (header === 'scoreBreakdown' && value) {
          try {
            value = JSON.parse(value);
          } catch (e) {
            value = {};
          }
        } else if (header === 'tags' && value) {
          try {
            value = JSON.parse(value);
          } catch (e) {
            value = [];
          }
        } else if (header === 'assignmentHistory' && value) {
          try {
            value = JSON.parse(value);
          } catch (e) {
            value = [];
          }
        } else if (header.includes('date') || header.includes('Date') || header === 'nextFollowUp') {
          if (value && value !== '') {
            value = new Date(value).toISOString();
          }
        }
        
        contact[header] = value;
      }
      
      contacts.push(contact);
    }
    
    console.log('Retrieved', contacts.length, 'contacts');
    return contacts;
    
  } catch (error) {
    console.error('Error getting contacts:', error);
    throw error;
  }
}

/**
 * Save or update a contact
 */
function saveContact(contactData) {
  try {
    console.log('saveContact called with data:', contactData);
    
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(CONTACTS_SHEET);
    
    if (!sheet) {
      throw new Error('Contacts sheet not found');
    }
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    console.log('Sheet headers:', headers);
    
    const data = sheet.getDataRange().getValues();
    console.log('Current sheet has', data.length - 1, 'contacts');
    
    // Generate ID if not provided
    if (!contactData.id) {
      contactData.id = Utilities.getUuid();
      console.log('Generated new ID:', contactData.id);
    }
    
    // Set timestamps
    const now = new Date().toISOString();
    contactData.lastModified = now;
    if (!contactData.dateAdded) {
      contactData.dateAdded = now;
    }
    
    // Find existing contact
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === contactData.id) { // Assuming ID is in first column
        rowIndex = i + 1; // Sheet rows are 1-indexed
        break;
      }
    }
    
    // Prepare row data
    const rowData = [];
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      let value = contactData[header] || '';
      
      // Handle special data types
      if (header === 'scoreBreakdown' && typeof value === 'object') {
        value = JSON.stringify(value);
      } else if (header === 'tags' && Array.isArray(value)) {
        value = JSON.stringify(value);
      } else if (header === 'assignmentHistory' && Array.isArray(value)) {
        value = JSON.stringify(value);
      }
      
      rowData.push(value);
    }
    
    console.log('Prepared row data:', rowData);
    console.log('Row will be', rowIndex > 0 ? 'updated at index ' + rowIndex : 'appended as new row');
    
    if (rowIndex > 0) {
      // Update existing contact
      sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
      console.log('Updated contact:', contactData.id);
    } else {
      // Add new contact
      sheet.appendRow(rowData);
      console.log('Added new contact:', contactData.id);
      console.log('Sheet now has', sheet.getLastRow(), 'rows total');
    }
    
    return { id: contactData.id, action: rowIndex > 0 ? 'updated' : 'created' };
    
  } catch (error) {
    console.error('Error saving contact:', error);
    throw error;
  }
}

/**
 * Delete a contact
 */
function deleteContact(contactId) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(CONTACTS_SHEET);
    
    if (!sheet) {
      throw new Error('Contacts sheet not found');
    }
    
    const data = sheet.getDataRange().getValues();
    
    // Find contact row
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === contactId) { // Assuming ID is in first column
        sheet.deleteRow(i + 1); // Sheet rows are 1-indexed
        console.log('Deleted contact:', contactId);
        
        // Also delete related activities
        deleteActivitiesByContactId(contactId);
        
        return { id: contactId, action: 'deleted' };
      }
    }
    
    throw new Error('Contact not found: ' + contactId);
    
  } catch (error) {
    console.error('Error deleting contact:', error);
    throw error;
  }
}

/**
 * Get all activities from the Activities sheet
 */
function getActivities() {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(ACTIVITIES_SHEET);
    
    if (!sheet) {
      console.log('Activities sheet not found, returning empty array');
      return [];
    }
    
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return []; // No data rows, only headers
    }
    
    const headers = data[0];
    const activities = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const activity = {};
      
      for (let j = 0; j < headers.length; j++) {
        const header = headers[j];
        let value = row[j];
        
        // Handle special data types
        if (header === 'metadata' && value) {
          try {
            value = JSON.parse(value);
          } catch (e) {
            value = {};
          }
        } else if (header === 'date') {
          if (value && value !== '') {
            value = new Date(value).toISOString();
          }
        }
        
        activity[header] = value;
      }
      
      activities.push(activity);
    }
    
    console.log('Retrieved', activities.length, 'activities');
    return activities;
    
  } catch (error) {
    console.error('Error getting activities:', error);
    return [];
  }
}

/**
 * Save or update an activity
 */
function saveActivity(activityData) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(ACTIVITIES_SHEET);
    
    if (!sheet) {
      throw new Error('Activities sheet not found');
    }
    
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Generate ID if not provided
    if (!activityData.id) {
      activityData.id = Utilities.getUuid();
    }
    
    // Set date if not provided
    if (!activityData.date) {
      activityData.date = new Date().toISOString();
    }
    
    // Prepare row data
    const rowData = [];
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      let value = activityData[header] || '';
      
      // Handle special data types
      if (header === 'metadata' && typeof value === 'object') {
        value = JSON.stringify(value);
      }
      
      rowData.push(value);
    }
    
    sheet.appendRow(rowData);
    console.log('Added new activity:', activityData.id);
    
    return { id: activityData.id, action: 'created' };
    
  } catch (error) {
    console.error('Error saving activity:', error);
    throw error;
  }
}

/**
 * Delete an activity
 */
function deleteActivity(activityId) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(ACTIVITIES_SHEET);
    
    if (!sheet) {
      throw new Error('Activities sheet not found');
    }
    
    const data = sheet.getDataRange().getValues();
    
    // Find activity row
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === activityId) { // Assuming ID is in first column
        sheet.deleteRow(i + 1); // Sheet rows are 1-indexed
        console.log('Deleted activity:', activityId);
        return { id: activityId, action: 'deleted' };
      }
    }
    
    throw new Error('Activity not found: ' + activityId);
    
  } catch (error) {
    console.error('Error deleting activity:', error);
    throw error;
  }
}

/**
 * Delete all activities for a specific contact
 */
function deleteActivitiesByContactId(contactId) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(ACTIVITIES_SHEET);
    
    if (!sheet) {
      return; // No activities sheet, nothing to delete
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const contactIdIndex = headers.indexOf('contactId');
    
    if (contactIdIndex === -1) {
      console.log('contactId column not found in activities sheet');
      return;
    }
    
    // Delete rows in reverse order to avoid index shifting
    for (let i = data.length - 1; i >= 1; i--) {
      if (data[i][contactIdIndex] === contactId) {
        sheet.deleteRow(i + 1); // Sheet rows are 1-indexed
        console.log('Deleted activity for contact:', contactId);
      }
    }
    
  } catch (error) {
    console.error('Error deleting activities by contact ID:', error);
  }
}

/**
 * Bulk update multiple contacts
 */
function bulkUpdateContacts(bulkData) {
  try {
    const { contactIds, updates } = bulkData;
    const results = [];
    
    for (const contactId of contactIds) {
      try {
        // Get existing contact data
        const contacts = getContacts();
        const existingContact = contacts.find(c => c.id === contactId);
        
        if (!existingContact) {
          results.push({ id: contactId, success: false, error: 'Contact not found' });
          continue;
        }
        
        // Merge updates with existing data
        const updatedContact = { ...existingContact, ...updates };
        
        // Save updated contact
        const result = saveContact(updatedContact);
        results.push({ id: contactId, success: true, result });
        
      } catch (error) {
        results.push({ id: contactId, success: false, error: error.toString() });
      }
    }
    
    console.log('Bulk update completed:', results.length, 'contacts processed');
    return results;
    
  } catch (error) {
    console.error('Error in bulk update:', error);
    throw error;
  }
}

/**
 * Get a setting value
 */
function getSetting(key) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SETTINGS_SHEET);
    
    if (!sheet) {
      console.log('Settings sheet not found');
      return null;
    }
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        return { key: key, value: data[i][1] };
      }
    }
    
    return null;
    
  } catch (error) {
    console.error('Error getting setting:', error);
    return null;
  }
}

/**
 * Set a setting value
 */
function setSetting(key, value) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SETTINGS_SHEET);
    
    if (!sheet) {
      throw new Error('Settings sheet not found');
    }
    
    const data = sheet.getDataRange().getValues();
    
    // Find existing setting
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        sheet.getRange(i + 1, 2).setValue(value); // Update value column
        console.log('Updated setting:', key);
        return { key: key, value: value, action: 'updated' };
      }
    }
    
    // Add new setting
    sheet.appendRow([key, value, '']);
    console.log('Added new setting:', key);
    return { key: key, value: value, action: 'created' };
    
  } catch (error) {
    console.error('Error setting value:', error);
    throw error;
  }
}

/**
 * Debug function to check what data is being received
 * This helps troubleshoot POST requests
 */
function debugRequest(e) {
  console.log('=== DEBUG REQUEST ===');
  console.log('Method:', e ? 'POST' : 'GET');
  
  if (e && e.postData) {
    console.log('POST data received:', e.postData.contents);
    try {
      const parsed = JSON.parse(e.postData.contents);
      console.log('Parsed data:', parsed);
    } catch (error) {
      console.log('Error parsing POST data:', error);
    }
  }
  
  console.log('=== END DEBUG ===');
}

/**
 * Test function to add a sample contact
 * Run this to test if contact saving works
 */
function testAddContact() {
  try {
    console.log('Testing contact creation...');
    
    const testContact = {
      name: 'Test Contact',
      email: 'test@example.com',
      type: 'Individual',
      status: 'New',
      priority: 'Medium',
      company: 'Test Company',
      title: 'Test Title'
    };
    
    const result = saveContact(testContact);
    console.log('Test contact result:', result);
    
    // Verify it was saved
    const contacts = getContacts();
    console.log('Total contacts after test:', contacts.length);
    
    return result;
    
  } catch (error) {
    console.error('Test contact failed:', error);
    return { error: error.toString() };
  }
}

/**
 * Test function to verify setup
 * Run this function manually to test your configuration
 */
function testSetup() {
  try {
    console.log('Testing Google Apps Script setup...');
    
    // Test sheet access
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    console.log('✓ Successfully opened spreadsheet:', spreadsheet.getName());
    
    // Test sheet existence
    const contactsSheet = spreadsheet.getSheetByName(CONTACTS_SHEET);
    const activitiesSheet = spreadsheet.getSheetByName(ACTIVITIES_SHEET);
    const settingsSheet = spreadsheet.getSheetByName(SETTINGS_SHEET);
    
    if (contactsSheet) {
      console.log('✓ Contacts sheet found');
    } else {
      console.log('✗ Contacts sheet not found - create sheet named "' + CONTACTS_SHEET + '"');
    }
    
    if (activitiesSheet) {
      console.log('✓ Activities sheet found');
    } else {
      console.log('✗ Activities sheet not found - create sheet named "' + ACTIVITIES_SHEET + '"');
    }
    
    if (settingsSheet) {
      console.log('✓ Settings sheet found');
    } else {
      console.log('✗ Settings sheet not found - create sheet named "' + SETTINGS_SHEET + '"');
    }
    
    // Test basic operations
    const contacts = getContacts();
    console.log('✓ Successfully retrieved', contacts.length, 'contacts');
    
    const activities = getActivities();
    console.log('✓ Successfully retrieved', activities.length, 'activities');
    
    console.log('Setup test completed successfully!');
    return true;
    
  } catch (error) {
    console.error('Setup test failed:', error);
    return false;
  }
}