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
    const response = await fetch("/api/notion/v1/databases/" + databaseId + "/query", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + notionApiKey,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
      },
      body: JSON.stringify({
        sorts: [
          {
            property: "שולם ע״י",
            direction: "ascending"
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch clients: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract unique client names from the "שולם ע״י" property
    const clients = data.results
      .map(page => {
        const clientProp = page.properties["שולם ע״י"];
        return clientProp && clientProp.select ? clientProp.select.name : null;
      })
      .filter(client => client !== null);
    
    // Remove duplicates
    const uniqueClients = [...new Set(clients)];
    
    console.log(`Found ${uniqueClients.length} unique clients`);
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
    // First, we need to get the current year and month page IDs
    const currentDate = new Date();
    const firstDayOfYear = new Date(currentDate.getFullYear(), 0, 1);
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    const formattedYear = firstDayOfYear.toISOString().split('T')[0];
    const formattedMonth = firstDayOfMonth.toISOString().split('T')[0];
    
    // Get year page ID
    const yearResponse = await fetch("/api/notion/v1/databases/4e6fe7f02f8d41199eb37037d3302a3e/query", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + notionApiKey,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
      },
      body: JSON.stringify({
        filter: {
          property: "Dates",
          date: {
            equals: formattedYear
          }
        }
      })
    });
    
    if (!yearResponse.ok) {
      throw new Error(`Failed to get year page ID: ${yearResponse.status}`);
    }
    
    const yearData = await yearResponse.json();
    if (yearData.results.length === 0) {
      throw new Error("Year page not found");
    }
    const yearId = yearData.results[0].id;
    
    // Get month page ID
    const monthResponse = await fetch("/api/notion/v1/databases/6ba0cc96770b4afb813ec8933c08dc27/query", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + notionApiKey,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
      },
      body: JSON.stringify({
        filter: {
          property: "Dates",
          date: {
            equals: formattedMonth
          }
        }
      })
    });
    
    if (!monthResponse.ok) {
      throw new Error(`Failed to get month page ID: ${monthResponse.status}`);
    }
    
    const monthData = await monthResponse.json();
    if (monthData.results.length === 0) {
      throw new Error("Month page not found");
    }
    const monthId = monthData.results[0].id;
    
    // Create the new record
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
        properties: {
          "הכנסה": {
            title: [
              {
                text: {
                  content: recordData.income
                }
              }
            ]
          },
          "סכום": {
            number: parseFloat(recordData.amount)
          },
          "שולם ע״י": {
            select: {
              name: recordData.client
            }
          },
          "אמצעי": {
            select: {
              name: recordData.paymentMethod
            }
          },
          "תאריך": {
            date: {
              start: recordData.date
            }
          },
          "חשבונית נשלחה": {
            date: {
              start: recordData.date
            }
          },
          "חודש": {
            relation: [
              {
                id: monthId
              }
            ]
          },
          "שנה": {
            relation: [
              {
                id: yearId
              }
            ]
          },
          "חשבונית": {
            checkbox: recordData.documentType === 'invoice'
          },
          "קבלה": {
            checkbox: recordData.documentType === 'receipt'
          },
          "תאריך קבלה": recordData.documentType === 'receipt' ? {
            date: {
              start: recordData.date
            }
          } : null,
          "דו״ח": {
            checkbox: true
          }
        }
      })
    });
    
    if (!response.ok) {
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