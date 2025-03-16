// src/notionApi.js

/**
 * Fetch client list from Notion database
 * @param {string} notionApiKey - Your Notion API key
 * @param {string} databaseId - Notion database ID
 * @returns {Promise<Array<string>>} List of client names
 */
export async function fetchClientsFromNotion(notionApiKey, databaseId) {
  console.log("Fetching clients from Notion...");

  try {
    // Simplified approach - just get the most recent 250 entries
    // This is a good balance between speed and comprehensiveness
    const response = await fetch("/api/notion/v1/databases/" + databaseId + "/query", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + notionApiKey,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
      },
      body: JSON.stringify({
        page_size: 250, // Get a good number of recent entries
        sorts: [
          {
            timestamp: "created_time",
            direction: "descending" // Get most recent entries
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch clients: ${response.status}`);
    }

    const data = await response.json();
    
    // Use a Set for deduplication
    const uniqueClientsSet = new Set();
    
    // Extract client names
    data.results.forEach(page => {
      const clientProp = page.properties["שולם ע״י"];
      if (clientProp && clientProp.select && clientProp.select.name) {
        uniqueClientsSet.add(clientProp.select.name);
      }
    });
    
    // Convert Set to Array and sort alphabetically (using Hebrew locale)
    const uniqueClients = Array.from(uniqueClientsSet).sort((a, b) => 
      a.localeCompare(b, 'he')
    );
    
    console.log(`Fetched ${uniqueClients.length} unique clients`);
    return uniqueClients;
  } catch (error) {
    console.error("Error fetching clients from Notion:", error);
    throw error;
  }
}

/**
 * Find an existing Notion page by income description and client
 * @param {string} notionApiKey - Your Notion API key
 * @param {string} databaseId - Notion database ID
 * @param {string} income - Income description
 * @param {string} client - Client name
 * @returns {Promise<string|null>} Page ID if found, null otherwise
 */
export async function findNotionPage(notionApiKey, databaseId, income, client) {
  console.log(`Searching for Notion page with income "${income}" and client "${client}"...`);

  try {
    const response = await fetch("/api/notion/v1/databases/" + databaseId + "/query", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + notionApiKey,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
      },
      body: JSON.stringify({
        filter: {
          and: [
            {
              property: "הכנסה",
              title: {
                equals: income
              }
            },
            {
              property: "שולם ע״י",
              select: {
                equals: client
              }
            }
          ]
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to search for Notion page: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.results.length > 0) {
      const pageId = data.results[0].id;
      console.log(`Found existing Notion page with ID: ${pageId}`);
      return pageId;
    } else {
      console.log("No existing Notion page found");
      return null;
    }
  } catch (error) {
    console.error("Error searching for Notion page:", error);
    throw error;
  }
}

/**
 * Update an existing Notion page with receipt information
 * @param {string} notionApiKey - Your Notion API key
 * @param {string} pageId - Notion page ID
 * @param {string} date - Receipt date
 * @returns {Promise<Object>} Updated page data
 */
export async function updateNotionPageWithReceipt(notionApiKey, pageId, date) {
  console.log(`Updating Notion page ${pageId} with receipt information...`);

  try {
    const response = await fetch(`/api/notion/v1/pages/${pageId}`, {
      method: "PATCH",
      headers: {
        "Authorization": "Bearer " + notionApiKey,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
      },
      body: JSON.stringify({
        properties: {
          "קבלה": {
            checkbox: true
          },
          "תאריך קבלה": {
            date: {
              start: date
            }
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to update Notion page: ${response.status}`);
    }

    const data = await response.json();
    console.log("Notion page updated successfully");
    return data;
  } catch (error) {
    console.error("Error updating Notion page:", error);
    throw error;
  }
}

/**
 * Create a new Notion record
 * @param {Object} recordData - Record data
 * @param {string} notionApiKey - Your Notion API key
 * @param {string} databaseId - Notion database ID
 * @returns {Promise<Object>} Created record data
 */
export async function createNotionRecord(recordData, notionApiKey, databaseId) {
  console.log("Creating new Notion record...");

  try {
    // Format date properly
    const formattedDate = recordData.date ? new Date(recordData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    
    // Create properties object with required fields
    const properties = {
      "הכנסה": {
        title: [
          {
            text: {
              content: recordData.income || ""
            }
          }
        ]
      }
    };
    
    // Add other properties only if they have values
    if (recordData.amount) {
      properties["סכום"] = {
        number: parseFloat(recordData.amount)
      };
    }
    
    if (recordData.client) {
      properties["שולם ע״י"] = {
        select: {
          name: recordData.client
        }
      };
    }
    
    if (recordData.paymentMethod) {
      properties["אמצעי"] = {
        select: {
          name: recordData.paymentMethod
        }
      };
    }
    
    if (formattedDate) {
      properties["תאריך"] = {
        date: {
          start: formattedDate
        }
      };
      
      properties["חשבונית נשלחה"] = {
        date: {
          start: formattedDate
        }
      };
    }
    
    // Document type properties
    properties["חשבונית"] = {
      checkbox: recordData.documentType === 'invoice'
    };
    
    properties["קבלה"] = {
      checkbox: recordData.documentType === 'receipt'
    };
    
    if (recordData.documentType === 'receipt' && formattedDate) {
      properties["תאריך קבלה"] = {
        date: {
          start: formattedDate
        }
      };
    }
    
    properties["דו״ח"] = {
      checkbox: true
    };
    
    // Create the record with carefully formatted properties
    const response = await fetch("/api/notion/v1/pages", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + notionApiKey,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
      },
      body: JSON.stringify({
        parent: {
          database_id: databaseId
        },
        properties: properties
      })
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error("Notion API error response:", errorData);
      throw new Error(`Failed to create Notion record: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Notion record created successfully");
    return data;
  } catch (error) {
    console.error("Error creating Notion record:", error);
    throw error;
  }
}