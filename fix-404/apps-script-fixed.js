function onEdit(e) {
  // Check if event object exists
  if (!e || !e.source) {
    console.log("No event object - running manual assignment");
    manualAssignSubcontractors();
    return;
  }
  
  var sheet = e.source.getActiveSheet();
  
  // Only run on Bookings sheet
  if (sheet.getName() !== "Bookings") return;
  
  var range = e.range;
  var row = range.getRow();
  
  // Only trigger when data is added to columns A-E (booking data)
  if (row < 2 || range.getColumn() > 5) return;
  
  assignSubcontractorWithConsecutiveCheck(sheet, row);
}

function assignSubcontractorWithConsecutiveCheck(sheet, row) {
  try {
    console.log("Assigning subcontractor for row " + row);
    
    // Get subcontractor data
    var subcontractorSheet = sheet.getParent().getSheetByName("Subcontractors");
    if (!subcontractorSheet) {
      console.log("Subcontractors sheet not found");
      return;
    }
    
    var subcontractorData = subcontractorSheet.getRange("A2:C50").getValues();
    var activeSubcontractors = subcontractorData.filter(function(subRow) {
      return subRow[0] && subRow[0] !== "";
    });
    
    if (activeSubcontractors.length === 0) {
      console.log("No active subcontractors found");
      return;
    }
    
    console.log("Found " + activeSubcontractors.length + " active subcontractors");
    
    // Get last 2 assignments to check for consecutive
    var lastAssignments = [];
    if (row > 2) {
      var startRow = Math.max(2, row - 2);
      var endRow = row - 1;
      
      for (var i = startRow; i <= endRow; i++) {
        var assignment = sheet.getRange(i, 6).getValue(); // Column F
        if (assignment && assignment !== "") {
          lastAssignments.push(assignment);
        }
      }
    }
    
    console.log("Last assignments: " + lastAssignments.join(", "));
    
    // Calculate next assignment avoiding 3 consecutive
    var assignmentIndex = (row - 2) % activeSubcontractors.length;
    var candidateSubcontractor = activeSubcontractors[assignmentIndex];
    
    // Check if this would create 3 consecutive assignments
    if (lastAssignments.length >= 2) {
      var lastTwo = lastAssignments.slice(-2);
      if (lastTwo[0] === candidateSubcontractor[0] && lastTwo[1] === candidateSubcontractor[0]) {
        // Would be 3 consecutive, skip to next contractor
        console.log("Preventing 3 consecutive assignments to " + candidateSubcontractor[0]);
        assignmentIndex = (assignmentIndex + 1) % activeSubcontractors.length;
        candidateSubcontractor = activeSubcontractors[assignmentIndex];
      }
    }
    
    // Assign the subcontractor
    sheet.getRange(row, 6).setValue(candidateSubcontractor[0]); // Name (Column F)
    sheet.getRange(row, 7).setValue(candidateSubcontractor[1]); // Email (Column G)
    
    console.log("Assigned " + candidateSubcontractor[0] + " to row " + row);
    
    // Add a small delay to ensure the assignment is saved
    Utilities.sleep(500);
    
  } catch (error) {
    console.error("Error in assignSubcontractorWithConsecutiveCheck: " + error.toString());
  }
}

// Manual function to assign subcontractors to existing rows
function manualAssignSubcontractors() {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Bookings");
    if (!sheet) {
      console.log("Bookings sheet not found");
      return;
    }
    
    var lastRow = sheet.getLastRow();
    console.log("Processing rows 2 to " + lastRow);
    
    for (var row = 2; row <= lastRow; row++) {
      var hasBookingData = sheet.getRange(row, 1).getValue(); // Check column A
      if (hasBookingData && hasBookingData !== "") {
        assignSubcontractorWithConsecutiveCheck(sheet, row);
      }
    }
    
    console.log("Manual assignment completed");
    
  } catch (error) {
    console.error("Error in manualAssignSubcontractors: " + error.toString());
  }
}

// Create trigger function
function createOnEditTrigger() {
  try {
    // Delete existing triggers
    var triggers = ScriptApp.getProjectTriggers();
    for (var i = 0; i < triggers.length; i++) {
      if (triggers[i].getHandlerFunction() === 'onEdit') {
        ScriptApp.deleteTrigger(triggers[i]);
      }
    }
    
    // Create new trigger
    ScriptApp.newTrigger('onEdit')
      .onEdit()
      .create();
      
    console.log("OnEdit trigger created successfully");
    
  } catch (error) {
    console.error("Error creating trigger: " + error.toString());
  }
}

// Test function
function testAssignment() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Bookings");
  if (sheet) {
    var lastRow = sheet.getLastRow();
    var nextRow = lastRow + 1;
    
    // Add test data
    sheet.getRange(nextRow, 1).setValue(new Date());
    sheet.getRange(nextRow, 2).setValue("Test Customer " + nextRow);
    sheet.getRange(nextRow, 3).setValue("Test Service");
    sheet.getRange(nextRow, 4).setValue("2024-06-01");
    sheet.getRange(nextRow, 5).setValue("Morning");
    
    // Assign subcontractor
    assignSubcontractorWithConsecutiveCheck(sheet, nextRow);
    
    console.log("Test assignment completed for row " + nextRow);
  }
}