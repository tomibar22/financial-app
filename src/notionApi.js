/**
 * Fetch client list from Notion database
 * @param {string} notionApiKey - Your Notion API key
 * @param {string} databaseId - ID of the Notion database
 * @returns {Promise<string[]>} Array of client names
 */
export async function fetchClientsFromNotion(notionApiKey, databaseId) {
    console.log("Fetching clients from Notion...");
    console.log("Database ID:", databaseId);
    
    const headers = {
      "Authorization": `Bearer ${notionApiKey}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28"
    };
  
    try {
      // Query the database to get all records
      console.log("Sending request to Notion API via proxy...");
      const response = await fetch(`http://localhost:3001/notion/v1/databases/${databaseId}/query`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          page_size: 500, // Adjust based on your needs
        })
      });
  
      console.log("Notion API response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Notion API error response:", errorText);
        throw new Error(`Notion API responded with status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log("Received data from Notion, pages:", data.results.length);
      
      // Log the structure of the first result to help debug property access
      if (data.results.length > 0) {
        console.log("First result properties:", JSON.stringify(data.results[0].properties, null, 2));
      }
      
      // Extract unique client names from the "שולם ע״י" property
      const clientSet = new Set();
      
      data.results.forEach(page => {
        // Make sure to match the exact property name and type from your database
        if (page.properties["שולם ע״י"] && 
            page.properties["שולם ע״י"].select && 
            page.properties["שולם ע״י"].select.name) {
          clientSet.add(page.properties["שולם ע״י"].select.name);
        }
      });
      
      console.log("Extracted client names:", Array.from(clientSet));
      
      // Convert set to array and sort alphabetically
      return Array.from(clientSet).sort();
    } catch (error) {
      console.error("Error fetching clients from Notion:", error);
      throw error;
    }
  }
  
  /**
   * Get Notion database schema to verify property names and types
   * @param {string} notionApiKey - Your Notion API key
   * @param {string} databaseId - ID of the Notion database
   * @returns {Promise<Object>} Database schema
   */
//   export async function getNotionDatabaseSchema(notionApiKey, databaseId) {
//     console.log("Getting Notion database schema...");
    
//     const headers = {
//       "Authorization": `Bearer ${notionApiKey}`,
//       "Notion-Version": "2022-06-28"
//     };
  
//     try {
//       const response = await fetch(`http://localhost:3001/notion/v1/databases/${databaseId}`, {
//         method: "GET",
//         headers: headers
//       });
      
//       if (!response.ok) {
//         const errorText = await response.text();
//         console.error("Notion API error response:", errorText);
//         throw new Error(`Failed to get database schema: ${response.status}`);
//       }
      
//       const data = await response.json();
//       console.log("Database schema properties:", JSON.stringify(data.properties, null, 2));
//       return data;
//     } catch (error) {
//       console.error("Error getting database schema:", error);
//       throw error;
//     }
//   }
  
  /**
   * Create a new invoice/receipt document and record in Notion
   * @param {Object} documentData - Invoice or receipt data
   * @param {string} notionApiKey - Your Notion API key
   * @param {string} databaseId - ID of the Notion database
   * @returns {Promise<Object>} Created page data
   */
  export async function createNotionRecord(documentData, notionApiKey, databaseId) {
    console.log("Creating Notion record...");
    console.log("Database ID:", databaseId);
    console.log("Document Type:", documentData.documentType);
    console.log("Document Data:", JSON.stringify({
      income: documentData.income,
      client: documentData.client,
      amount: documentData.amount,
      paymentMethod: documentData.paymentMethod,
      date: documentData.date
    }));
  
    const headers = {
      "Authorization": `Bearer ${notionApiKey}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28"
    };
  
    try {
      const { income, client, amount, paymentMethod, date, documentType } = documentData;
      
      // Check for required fields
      if (!income || !client || !amount || !paymentMethod || !date) {
        console.error("Missing required fields for Notion record");
        throw new Error("Missing required fields for Notion record");
      }
      
      // Prepare the request body for creating a new page
      const requestBody = {
        parent: {
          database_id: databaseId
        },
        properties: {
          "הכנסה": {
            title: [
              {
                text: {
                  content: income
                }
              }
            ]
          },
          "סכום": {
            number: parseFloat(amount)
          },
          "שולם ע״י": {
            select: {
              name: client
            }
          },
          "אמצעי": {
            select: {
              name: paymentMethod
            }
          },
          "תאריך": {
            date: {
              start: date
            }
          }
        }
      };
      
      // Add document-specific properties
      if (documentType === 'invoice') {
        requestBody.properties["חשבונית"] = {
          checkbox: true
        };
        requestBody.properties["חשבונית נשלחה"] = {
          date: {
            start: date
          }
        };
      } else if (documentType === 'receipt') {
        requestBody.properties["קבלה"] = {
          checkbox: true
        };
        requestBody.properties["תאריך קבלה"] = {
          date: {
            start: date
          }
        };
      }
      
      console.log("Notion request body:", JSON.stringify(requestBody, null, 2));
      
      // Use the proxy server URL
      console.log("Sending request to Notion API via proxy...");
      const response = await fetch("http://localhost:3001/notion/v1/pages", {
        method: "POST",
        headers: headers,
        body: JSON.stringify(requestBody)
      });
      
      console.log("Notion API response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Notion API error response:", errorText);
        throw new Error(`Failed to create Notion record: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Successfully created Notion page. ID:", data.id);
      return data;
    } catch (error) {
      console.error("Error creating Notion record:", error);
      throw error;
    }
  }
  