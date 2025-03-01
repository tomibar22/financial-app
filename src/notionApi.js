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
    let allResults = [];
    let hasMore = true;
    let startCursor = null;
    try {
        while (hasMore) {
            const body = {
                page_size: 100, // Max limit
            };
            if (startCursor) {
                body.start_cursor = startCursor; // Fetch next page
            }
            console.log("Sending request to Notion API...");
            const response = await fetch(`/api/notion/v1/databases/${databaseId}/query`, {
                method: "POST",
                headers: headers,
                body: JSON.stringify(body)
            });
            console.log("Notion API response status:", response.status);
            if (!response.ok) {
                const errorText = await response.text();
                console.error("Notion API error response:", errorText);
                throw new Error(`Notion API responded with status: ${response.status}`);
            }
            const data = await response.json();
            allResults = allResults.concat(data.results);
            hasMore = data.has_more;
            startCursor = data.next_cursor; // Set cursor for next page
            console.log(`Fetched ${data.results.length} more clients, total: ${allResults.length}`);
        }
        console.log("Total records fetched:", allResults.length);
        const clientSet = new Set();
        allResults.forEach(page => {
            if (page.properties["שולם ע״י"] && 
                page.properties["שולם ע״י"].select && 
                page.properties["שולם ע״י"].select.name) {
                clientSet.add(page.properties["שולם ע״י"].select.name);
            }
        });
        console.log("Extracted client names:", Array.from(clientSet));
        return Array.from(clientSet).sort();
    } catch (error) {
        console.error("Error fetching clients from Notion:", error);
        throw error;
    }
}
  
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
      
      // Use the updated API path
      console.log("Sending request to Notion API...");
      const response = await fetch("/api/notion/v1/pages", {
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