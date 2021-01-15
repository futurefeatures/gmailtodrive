function doGet() {
  return HtmlService
  .createTemplateFromFile('main')
  .evaluate()
  .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

/**************************************************************************************************************************************************
This function is called within the popup.html file, it gets all labels in the user's Gmail and returns so the dialog box can show them in its list
**************************************************************************************************************************************************/
function getGmailLabels() {
  return GmailApp.getUserLabels();
}

/********************************************************************************************************
This function checks the options the user has submitted and then runs the appropriate subsequent function
********************************************************************************************************/
function exportEmails(label,format) {  
  var dateTime = new Date();
  var date = dateTime.toLocaleDateString();
  var time = dateTime.toLocaleTimeString();
  var timeString = time.substr(0,5);
  var folder = DriveApp.createFolder('Gmail export - ' + label + ' - ' + date + " " + timeString);
  var folderId = folder.getId();
  if (format === "pdf") {
    try {
      Logger.log("Function started...");
      createPdf(label,format,folderId);
      Logger.log("Successfully completed");
    }
    catch(err) {
      var emailTemplate = HtmlService.createTemplateFromFile("errorEmail");
      emailTemplate.err = err;
      var emailBody = emailTemplate.evaluate().getContent();
      GmailApp.sendEmail(Session.getActiveUser().getEmail(), 'Gmail bulk export - Task failed', "", {
        htmlBody: emailBody
      });
      Logger.log("Function failed");
    }
  }
  else if (format === "gdoc") {
    try {
      Logger.log("Function started...");
      createGdoc(label,format,folderId);
      Logger.log("Successfully completed");
    }
    catch(err) {
      var emailTemplate = HtmlService.createTemplateFromFile("errorEmail");
      emailTemplate.err = err;
      var emailBody = emailTemplate.evaluate().getContent();
      GmailApp.sendEmail(Session.getActiveUser().getEmail(), 'Gmail bulk export - Task failed', "", {
        htmlBody: emailBody
      });
      Logger.log("Function failed");
    }
  }
}

/***************************************************************************************
This function checks if the user wants emails grouped or split, then creates PDF file(s) 
***************************************************************************************/
function createPdf(label,format,folderId) {
  var threads = GmailApp.getUserLabelByName(label).getThreads();
  var folder = DriveApp.getFolderById(folderId);
  var today = new Date();
  var allMessages = "";
  var fileArray = [];
  for (var i = 0 ; i < threads.length ; i++) {
    var messages = threads[i].getMessages(); 
    for (var u = 0; u < messages.length; u++) {
      var date = messages[u].getDate();
      var from = messages[u].getFrom();
      var to = messages[u].getTo();
      var cc = messages[u].getCc();
      var bcc = messages[u].getBcc();
      var subject = messages[u].getSubject();
      var body = messages[u].getBody();
      var isForward = body.search(/---------- Forwarded message/i) != -1;
      if (!isForward) {
        var firstIndexOfThread = body.search(/gmail_quote/i); 
        body = (firstIndexOfThread == -1) ? body : body.substring(0, firstIndexOfThread);
      }       
      var complete = date + '<br>' + "From: " + from + '<br>' + "To: " + to + '<br>' + "CC: " + cc + '<br>' + "BCC: " + bcc + '<br>' + "Subject: " + subject + '<br>' + '<br>' + body + '<p style="page-break-before: always">';
      var fileLength = allMessages.length + complete.length;
      if (fileLength < 3217754) { 
        allMessages += complete;
      }
      else {
        fileArray.push(allMessages);
        var allMessages = "";
        allMessages += complete;
      }
    }
  }
  if (fileArray.length > 0) {
    for (a=0;a<fileArray.length;a++) {
      var pdfBlob = Utilities.newBlob(fileArray[a], MimeType.HTML, "Gmail export - "+label).getAs(MimeType.PDF);
      var pdfFile = DriveApp.createFile(pdfBlob);
      pdfFile.getParents().next().removeFile(pdfFile);
      DriveApp.getFolderById(folderId).addFile(pdfFile);
    }
  }
  var pdfBlob = Utilities.newBlob(allMessages, MimeType.HTML, "Gmail export - "+label).getAs(MimeType.PDF);
  var pdfFile = DriveApp.createFile(pdfBlob);
  pdfFile.getParents().next().removeFile(pdfFile);
  DriveApp.getFolderById(folderId).addFile(pdfFile);
  
  var emailTemplate = HtmlService.createTemplateFromFile("email");
  emailTemplate.folderUrl = folder.getUrl();
  var emailBody = emailTemplate.evaluate().getContent();
  GmailApp.sendEmail(Session.getActiveUser().getEmail(), 'Gmail bulk export complete', "", {
    htmlBody: emailBody
  });
}

/*****************************************************************************************
This function checks if the user wants emails grouped or split, then creates Google Doc(s)
*****************************************************************************************/
function createGdoc(label,format,folderId) {
  var threads = GmailApp.getUserLabelByName(label).getThreads();
  var folder = DriveApp.getFolderById(folderId);
  var today = new Date(); 
  var allMessages = "";
  var fileArray = [];
  for (var i = 0 ; i < threads.length ; i++) {
    var messages = threads[i].getMessages(); 
    for (var u = 0; u < messages.length; u++) {
      var date = messages[u].getDate();
      var from = messages[u].getFrom();
      var to = messages[u].getTo();
      var cc = messages[u].getCc();
      var bcc = messages[u].getBcc();
      var subject = messages[u].getSubject();
      var body = messages[u].getBody();
      var isForward = body.search(/---------- Forwarded message/i) != -1;
      if (!isForward) {
        var firstIndexOfThread = body.search(/gmail_quote/i); 
        body = (firstIndexOfThread == -1) ? body : body.substring(0, firstIndexOfThread);
      }       
      var complete = date + '<br>' + "From: " + from + '<br>' + "To: " + to + '<br>' + "CC: " + cc + '<br>' + "BCC: " + bcc + '<br>' + "Subject: " + subject + '<br>' + '<br>' + body + '<p style="page-break-before: always">';
      var fileLength = allMessages.length + complete.length;
      if (fileLength < 3217754) { 
        allMessages += complete;
      }
      else {
        fileArray.push(allMessages);
        var allMessages = "";
        allMessages += complete;
      }
    }
  }    
  if (fileArray.length > 0) {
    for (a=0;a<fileArray.length;a++) {
      var pdfBlob = Utilities.newBlob(fileArray[a], MimeType.HTML, "Gmail export - "+label).getAs(MimeType.PDF);
      var pdfFile = DriveApp.createFile(pdfBlob);
      pdfFile.getParents().next().removeFile(pdfFile);
      DriveApp.getFolderById(folderId).addFile(pdfFile);
    }
  }
  var htmlBlob = Utilities.newBlob("").setDataFromString(allMessages, "UTF-8").setContentType("text/html");
  var newFile = Drive.Files.insert({title: "Gmail export - "+label, mimeType: MimeType.GOOGLE_DOCS}, htmlBlob).id;
  var newFileDoc = DriveApp.getFileById(newFile);
  newFileDoc.getParents().next().removeFile(newFileDoc);
  DriveApp.getFolderById(folderId).addFile(newFileDoc); 
  
  var emailTemplate = HtmlService.createTemplateFromFile("email");
  emailTemplate.folderUrl = folder.getUrl();
  var emailBody = emailTemplate.evaluate().getContent(); 
  GmailApp.sendEmail(Session.getActiveUser().getEmail(), 'Gmail bulk export complete', "", {
    htmlBody: emailBody
  });
}
