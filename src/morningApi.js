/**
 * Create a receipt in Morning (Green Invoice)
 * @param {Object} receiptData - Receipt data
 * @param {string} morningId - Your Morning API ID
 * @param {string} morningSecret - Your Morning API secret
 * @returns {Promise<Object>} Created receipt data
 */
export async function getMorningToken(morningId, morningSecret) {
    console.log("Getting Morning API token...");
    console.log("Using Morning ID:", morningId);
    console.log("Payload:", JSON.stringify({
      id: morningId,
      secret: "***" // Don't log the actual secret for security reasons
    }));
  
    try {
      // Use the updated API path
      const response = await fetch("/api/morning/api/v1/account/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: morningId,
          secret: morningSecret
        })
      });
  
      console.log("Morning API token request status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Morning API error response:", errorText);
        throw new Error(`Failed to get Morning token: ${response.status}`);
      }
  
      const data = await response.json();
      console.log("Morning token obtained successfully");
      return "Bearer " + data.token;
    } catch (error) {
      console.error("Error getting Morning token:", error);
      throw error;
    }
  }

export async function createMorningReceipt(receiptData, morningId, morningSecret) {
    console.log("Creating Morning receipt...");
  
    try {
      // Get token first
      const token = await getMorningToken(morningId, morningSecret);
  
      // Map payment method to Morning API values
      let paymentType = 0;
      switch (receiptData.paymentMethod) {
        case "העברה": paymentType = 4; break;
        case "אפליקציית תשלום": paymentType = 10; break;
        case "מזומן": paymentType = 1; break;
        case "צ׳ק": paymentType = 2; break;
        default: paymentType = 4;
      }
  
      // Map payment app to Morning API values
      let appType = null;
      if (receiptData.paymentMethod === "אפליקציית תשלום") {
        switch (receiptData.application) {
          case "ביט": appType = 1; break;
          case "פיי-בוקס": appType = 3; break;
          default: appType = "";
        }
      }
  
      // Create the receipt
      const payload = {
        description: receiptData.description,
        type: 400, // Receipt type
        vatType: 0,
        lang: "he",
        currency: "ILS",
        client: {
          name: receiptData.client,
          add: true,
          self: false,
        },
        rounding: false,
        income: [
          {
            description: receiptData.description,
            quantity: 1,
            price: parseFloat(receiptData.amount),
            currency: "ILS",
            vatType: 0
          },
        ],
        payment: [
          {
            type: paymentType,
            price: parseFloat(receiptData.amount),
            currency: "ILS",
            date: receiptData.date,
            appType: appType,
          },
        ]
      };
  
      console.log("Morning receipt payload:", JSON.stringify(payload));
  
      // Use the updated API path
      const response = await fetch("/api/morning/api/v1/documents", {
        method: "POST",
        headers: {
          "Authorization": token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Morning API error response:", errorText);
        throw new Error(`Failed to create Morning receipt: ${response.status}`);
      }
  
      const data = await response.json();
      console.log("Morning receipt created successfully:", data);
  
      // Send email if requested
      if (receiptData.sendEmail && data.client && data.client.id && data.id) {
        await sendMorningEmail(data.id, data.client.id, "קבלה", token);
      }
  
      return data;
    } catch (error) {
      console.error("Error creating Morning receipt:", error);
      throw error;
    }
  }
  
  /**
   * Send email with document from Morning
   * @param {string} documentId - Document ID
   * @param {string} clientId - Client ID
   * @param {string} documentType - Document type ("חשבונית" or "קבלה")
   * @param {string} token - Morning API token
   * @returns {Promise<Object>} Email response
   */
  async function sendMorningEmail(documentId, clientId, documentType, token) {
    console.log(`Sending ${documentType} email...`);
  
    try {
      // First get client email
      const clientResponse = await fetch(`/api/morning/api/v1/clients/${clientId}`, {
        method: "GET",
        headers: {
          "Authorization": token
        }
      });
  
      if (!clientResponse.ok) {
        throw new Error(`Failed to get client details: ${clientResponse.status}`);
      }
  
      const clientData = await clientResponse.json();
      const clientEmail = clientData.emails[0];
  
      if (!clientEmail) {
        throw new Error("Client has no email address");
      }
  
      // Send the email
      const emailSubject = documentType === "חשבונית" ? 
        'היי, מצ״ב דרישת תשלום (:' :
        'היי, מצ״ב קבלה (:';
  
      const emailResponse = await fetch(`/api/morning/api/v1/documents/${documentId}/distribute`, {
        method: "POST",
        headers: {
          "Authorization": token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          'remarks': emailSubject,
          'recipients': [clientEmail]
        })
      });
  
      if (!emailResponse.ok) {
        throw new Error(`Failed to send email: ${emailResponse.status}`);
      }
  
      const emailData = await emailResponse.json();
      console.log("Email sent successfully:", emailData);
      return emailData;
    } catch (error) {
      console.error("Error sending email:", error);
      throw error;
    }
  }