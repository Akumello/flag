# Standard Operating Procedure (SOP): Google Apps Script Development

**Document ID:** GAS-SOP-2025-V1.0
**Effective Date:** 9/15/2025
**Author:** T3 Chat
**Review Cycle:** Annually

## 1.0 Purpose

This SOP establishes standardized guidelines, best practices, and security protocols for developing, deploying, and maintaining solutions using Google Apps Script (GAS) within the organization. The goal is to ensure all scripts are efficient, secure, maintainable, and scalable.

## 2.0 Scope

This document applies to all personnel involved in the creation, modification, or deployment of Google Apps Script projects, including but not limited to standalone scripts, container-bound scripts (in Sheets, Docs, etc.), Web Apps, Libraries, and Add-ons.

## 3.0 General Best Practices (Apply to ALL Projects)

These foundational practices must be followed in every Apps Script project, regardless of its specific application.

### 3.1 Code Quality & Maintainability

* **Naming Conventions:** Use `camelCase` for variables and functions (e.g., `processUserData`). Use `PascalCase` for custom classes or library names (e.g., `MyCustomLibrary`).
* **Comments & Documentation:** Use JSDoc-style comments for all functions to explain their purpose, parameters (`@param`), and return values (`@return`). This enables autocomplete in the editor.

    ```javascript
    /**
     * Retrieves user data from the active sheet and formats it.
     * @param {string} sheetName The name of the sheet to read from.
     * @returns {Array<Object>} An array of user objects.
     */
    function getUserData(sheetName) {
      // ... function logic
    }
    ```

* **Avoid Global Variables:** Limit the use of global variables. Pass data as parameters to functions to create modular, predictable, and testable code.
* **Error Handling:** Wrap critical code, especially API calls (`UrlFetchApp`, etc.), in `try...catch` blocks to handle potential failures gracefully and provide meaningful logs.
* **Use `clasp`:** For any non-trivial project, use the [Command Line Apps Script Projects (clasp)](https://github.com/google/clasp) tool. This allows you to develop locally in your preferred IDE (like VS Code), use version control (Git), and manage deployments from the command line.

### 3.2 Performance

* **Minimize API Calls:** Google Workspace service calls (e.g., `SpreadsheetApp.getRange()`) are slow. Read data in bulk, manipulate it in JavaScript arrays/objects, and write it back in a single operation.
  * **Bad (Slow):**

```javascript
const sheet = SpreadsheetApp.getActiveSheet();
for (let i = 1; i <= 100; i++) {
  sheet.getRange(i, 1).setValue("Updated"); // 100 API calls
}
```

* **Good (Fast):**

```javascript
const sheet = SpreadsheetApp.getActiveSheet();
const range = sheet.getRange("A1:A100");
const values = range.getValues(); // 1 read call
for (let i = 0; i < values.length; i++) {
  values[i][0] = "Updated";
}
range.setValues(values); // 1 write call
```

* **Use Caching:** For data that doesn't change frequently, use the `CacheService` to store results and reduce redundant processing or API calls.

### 3.3 Security

* **Principle of Least Privilege:** Request only the OAuth scopes your script absolutely needs. Use annotations like `/** @OnlyCurrentDoc */` to limit a script's access to only the document it is bound to.
* **`PropertiesService` for Secrets:** **NEVER** hardcode API keys, passwords, or other secrets directly in the code. Store them using `PropertiesService.getScriptProperties()` or `PropertiesService.getUserProperties()`. Script properties are accessible to all users of the script, while user properties are unique to the user running it.

    ```javascript
    // Storing a secret
    PropertiesService.getScriptProperties().setProperty('API_KEY', 'your_secret_key');

    // Retrieving a secret
    const apiKey = PropertiesService.getScriptProperties().getProperty('API_KEY');
    ```

### 3.4 AI-Assisted Development Best Practices

* **Code Generation & Debugging:** Use AI assistants to generate boilerplate code, write complex formulas/regex, or explain error messages. **Crucially, you must review, understand, and test all AI-generated code before implementation.**
* **Data Privacy:** **DO NOT** paste sensitive, confidential, or personally identifiable information (PII) from your scripts or data sources into public AI models for debugging or analysis. Use placeholder or anonymized data instead.
* **Documentation:** Leverage AI to quickly generate JSDoc comments for your functions. Paste your function and ask the AI to document it.

---

## 4.0 Sheet Automation

Automating workflows within Google Sheets (e.g., data processing, custom menus, triggers).

### 4.1 Best Practices

* **Use Event Objects:** For simple triggers like `onEdit(e)` or `onSelectionChange(e)`, use the provided event object `e` to get context (e.g., `e.range`, `e.value`). This prevents the script from having to re-scan the entire sheet to find a change.
* **Use `onEdit` Wisely:** An `onEdit` trigger can slow down the user experience. Keep the logic inside it as fast as possible. If a long process is needed, have the `onEdit` trigger log the task (e.g., in another sheet or using `PropertiesService`) and have a time-based trigger process the queue later.
* **Custom Menus:** Use the `onOpen(e)` trigger to add custom menus. This provides a clear, user-friendly way to execute scripts rather than having users open the script editor.

### 4.2 Security Considerations

* **Protected Ranges:** Be aware that scripts running under the owner's authority can often edit protected ranges. Ensure that scripts do not inadvertently modify locked-down data.
* **Data Validation:** When a script writes data to a sheet, ensure it validates the data first to maintain data integrity.

---

## 5.0 Doc Automation

Generating or manipulating Google Docs (e.g., report generation, mail merge).

### 5.1 Best Practices

* **Template-Based Generation:** The most effective method is to create a template Google Doc with placeholders (e.g., `{{customer_name}}`, `{{invoice_date}}`). The script can then make a copy of the template and use `body.replaceText('{{placeholder}}', 'actual_value')` to fill in the data.
* **Manipulate the Document Body:** Understand the document structure (`Body`, `Paragraph`, `Table`, `ListItem`). Use `getBody()` and append/edit elements programmatically.
* **PDF Conversion:** Once a document is generated, use `doc.getAs('application/pdf')` to create a PDF version for emailing or archiving.

### 5.2 Security Considerations

* **Input Sanitization:** If data being inserted into a document comes from an external or user-provided source (like a form), sanitize it to prevent insertion of malicious or malformed content.
* **Access Control:** Generated documents inherit the permissions of the folder they are created in. Ensure the script saves files to a secure, access-controlled folder.

---

## 6.0 Web App Deployment

Creating user-facing web applications with Google Apps Script.

### 6.1 Best Practices

* **Use `HtmlService`:** Always use `HtmlService` to build web app interfaces. It provides a security sandbox that helps prevent Cross-Site Scripting (XSS) attacks.
* **Templated HTML:** Use scriplets (`<? ... ?>`) to pass data from your server-side `.gs` code to your `.html` file. This is more secure and efficient than building HTML strings manually.
* **Asynchronous Calls:** Use `google.script.run` in your client-side JavaScript to call server-side `.gs` functions. This creates a responsive user interface that doesn't need to reload the page for every action.
* **Deployment Slots:** Use multiple deployments for development, staging, and production. This allows you to test new code (`/dev` URL) without affecting live users (`/exec` URL).

### 6.2 Security Considerations

* **Execution Permissions:** This is the most critical security setting.
  * **Execute as "Me":** The web app always runs with the script owner's permissions. Use this for apps that need to access centralized resources (e.g., a master spreadsheet).
  * **Execute as "User accessing the web app":** The app runs with the permissions of the person using it. Use this when the app needs to access the user's personal data (e.g., their own calendar or files). The user will be prompted for authorization on first use.
* **XSS Prevention:** `HtmlService` provides automatic contextual escaping, which is a major defense against XSS. Do not try to bypass this unless you are an expert and know exactly what you are doing.
* **Data Exposure:** In your `doGet(e)` or `doPost(e)` functions, be extremely careful about what data you return. Never expose sensitive information or internal system details.

---

## 7.0 Library Creation

Packaging reusable code into a library for use in other Apps Script projects.

### 7.1 Best Practices

* **Clear Public Functions:** Only functions intended for public use should be exposed. Do not include internal helper functions in the library's public interface. Suffix internal functions with an underscore (e.g., `_internalHelper()`) as a convention.
* **Use JSDoc:** Thoroughly document all public functions with JSDoc. This documentation will be visible to developers who include it.
* **Versioning:** Always create numbered versions for your library. Instruct users to bind to a specific version, not the development mode. This prevents breaking changes in your library from affecting their production scripts. Update the version number whenever you make a significant change.
* **Namespacing:** All public functions in a library are called via the library's identifier (e.g., `MyLibrary.doSomething()`). This prevents function name collisions with the consuming script.

### 7.2 Security Considerations

* **Authorization Model:** A library has no permissions of its own. It runs using the authorization of the user who is running the *consuming script*. Be aware that your library code may be executed by many different users with different levels of access.
* **Code Visibility:** The code of a library is visible to developers who include it. Do not store any secrets or sensitive logic within a library intended for wide distribution.

---

**Instructions for GitHub `README.md`:**

1. **Create a new file** in your GitHub repository named `README.md`.
2. **Copy this entire Markdown text** and paste it into the `README.md` file.
3. **Commit the changes.**

GitHub will automatically render this Markdown into a beautifully formatted document with headings, bullet points, inline code, and syntax-highlighted code blocks (thanks to the language identifier `javascript` after the triple backticks).
