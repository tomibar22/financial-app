import React, { useState, useEffect } from 'react';
import { 
  fetchClientsFromNotion, 
  createNotionRecord, 
  findNotionPage, 
  updateNotionPageWithReceipt 
} from './notionApi';
import { createMorningInvoice, createMorningReceipt } from './morningApi';
import { NOTION_API_KEY, NOTION_DATABASE_ID, MORNING_ID, MORNING_SECRET } from './config';
import './FinancialApp.css';

/**
 * Extract URL from text
 * @param {string} text - Text that may contain a URL
 * @returns {string|null} Extracted URL or null if not found
 */
function extractUrlFromText(text) {
  if (!text) return null;
  
  // URL pattern matching
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  
  if (matches && matches.length > 0) {
    // Return the first URL found in the text
    return matches[0];
  }
  
  return null;
}

const FinancialApp = () => {
  const [formData, setFormData] = useState({
    income: '',
    client: '',
    amount: '',
    paymentMethod: '',
    date: '',
    application: ''
  });
  
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [showClientOptions, setShowClientOptions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingClients, setLoadingClients] = useState(true);
  const [message, setMessage] = useState('');
  const [clientError, setClientError] = useState(null);
  const [documentLink, setDocumentLink] = useState('');
  
  // Initialize date to today when component mounts
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, date: today }));
  }, []);

  
  // Fetch clients from Notion database with local storage caching
  useEffect(() => {
    const getClients = async () => {
      try {
        setLoadingClients(true);
        setClientError(null);
        
        // First check if we have a cached version in localStorage
        const cachedClients = localStorage.getItem('financialAppClients');
        const cachedTimestamp = localStorage.getItem('financialAppClientsTimestamp');
        const now = new Date().getTime();
        
        // Use cached clients initially if available and not too old (less than 1 day old)
        if (cachedClients && cachedTimestamp && (now - parseInt(cachedTimestamp) < 24 * 60 * 60 * 1000)) {
          const parsedClients = JSON.parse(cachedClients);
          setClients(parsedClients);
          setFilteredClients(parsedClients);
          console.log("Using cached client list:", parsedClients.length, "clients");
          
          // Continue fetching in the background to update the cache
          fetchClientsFromNotion(NOTION_API_KEY, NOTION_DATABASE_ID)
            .then(freshClientList => {
              // Update cache with new client list
              localStorage.setItem('financialAppClients', JSON.stringify(freshClientList));
              localStorage.setItem('financialAppClientsTimestamp', now.toString());
              
              // Update state if component is still mounted
              setClients(freshClientList);
              setFilteredClients(freshClientList);
              console.log("Updated client list in background:", freshClientList.length, "clients");
            })
            .catch(err => console.error("Background client fetch error:", err));
        } else {
          // No valid cache, fetch from API
          const clientList = await fetchClientsFromNotion(NOTION_API_KEY, NOTION_DATABASE_ID);
          
          // Cache the results
          localStorage.setItem('financialAppClients', JSON.stringify(clientList));
          localStorage.setItem('financialAppClientsTimestamp', now.toString());
          
          // Update state
          setClients(clientList);
          setFilteredClients(clientList);
        }
      } catch (error) {
        setClientError(`שגיאה בטעינת רשימת לקוחות: ${error.message}`);
        console.error("Error fetching clients:", error);
        
        // Try to use cached clients even if they're old
        const cachedClients = localStorage.getItem('financialAppClients');
        if (cachedClients) {
          const parsedClients = JSON.parse(cachedClients);
          setClients(parsedClients);
          setFilteredClients(parsedClients);
          console.log("Using cached client list after error");
          setClientError(`שגיאה בטעינת רשימת לקוחות עדכנית. משתמש ברשימה מהזיכרון.`);
        } else {
          // Final fallback to mock data if no cache is available
          const mockClients = [
            "לקוח א",
            "לקוח ב",
            "לקוח ג",
            "פלוני אלמוני",
            "חברה בע״מ",
            "עסק קטן"
          ];
          setClients(mockClients);
          setFilteredClients(mockClients);
        }
      } finally {
        setLoadingClients(false);
      }
    };
    
    getClients();
  }, []);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    
    // Filter clients when typing in the client field
    if (name === 'client') {
      const filtered = clients.filter(client => 
        client.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredClients(filtered);
      setShowClientOptions(true);
    }
  };
  
  const selectClient = (client) => {
    setFormData(prevState => ({
      ...prevState,
      client
    }));
    setShowClientOptions(false);
  };
  
  const validateForm = () => {
    if (!formData.income.trim()) {
      setMessage('שגיאה: יש להזין פרטי הכנסה');
      return false;
    }
    if (!formData.client) {
      setMessage('שגיאה: יש לבחור לקוח');
      return false;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setMessage('שגיאה: יש להזין סכום תקין');
      return false;
    }
    if (!formData.paymentMethod) {
      setMessage('שגיאה: יש לבחור אמצעי תשלום');
      return false;
    }
    if (!formData.date) {
      setMessage('שגיאה: יש להזין תאריך');
      return false;
    }
    if (formData.paymentMethod === 'אפליקציית תשלום' && !formData.application) {
      setMessage('שגיאה: יש לבחור אפליקציה');
      return false;
    }
    return true;
  };
  
  const copyLinkToClipboard = () => {
    if (documentLink) {
      navigator.clipboard.writeText(documentLink)
        .then(() => {
          setMessage('הקישור הועתק בהצלחה!');
        })
        .catch(err => {
          console.error('Failed to copy link:', err);
          setMessage('לא ניתן להעתיק את הקישור - אנא העתק באופן ידני');
        });
    }
  };
  
  const resetForm = () => {
    setFormData({
      income: '',
      client: '',
      amount: '',
      paymentMethod: '',
      date: new Date().toISOString().split('T')[0],
      application: ''
    });
    setDocumentLink('');
  };
  
  const createInvoice = async (sendEmail = false) => {
    if (!validateForm()) return;
    
    setLoading(true);
    setMessage('');
    setDocumentLink('');
    
    try {
      console.log("Starting invoice creation process");
      
      // Step 1: Create Morning invoice
      let morningResult;
      try {
        console.log("Creating invoice in Morning...");
        morningResult = await createMorningInvoice(
          {
            description: formData.income,
            client: formData.client,
            amount: formData.amount,
            paymentMethod: formData.paymentMethod,
            date: formData.date,
            application: formData.application,
            sendEmail: sendEmail
          },
          MORNING_ID, 
          MORNING_SECRET
        );
        console.log("Morning invoice created:", morningResult);
        
        // Extract document link
        if (morningResult) {
          if (morningResult.url) {
            // Try to extract URLs from each field
            const enUrl = morningResult.url.en ? extractUrlFromText(morningResult.url.en) : null;
            const heUrl = morningResult.url.he ? extractUrlFromText(morningResult.url.he) : null;
            const originUrl = morningResult.url.origin ? extractUrlFromText(morningResult.url.origin) : null;
            
            // Use the first available URL, prioritizing English
            const link = enUrl || heUrl || originUrl;
            
            if (link) {
              setDocumentLink(link);
              console.log("Document link extracted:", link);
            }
          } else if (morningResult.id) {
            // Fallback to constructed URL
            setDocumentLink(`https://greeninvoice.co.il/view/${morningResult.id}`);
            console.log("Fallback document link set using ID");
          }
        }
      } catch (morningError) {
        console.error("Error creating Morning invoice:", morningError);
        throw new Error(`שגיאה ביצירת חשבונית ב-Green Invoice: ${morningError.message}`);
      }
      
      // Step 2: Create Notion record
      try {
        console.log("Creating record in Notion...");
        const notionResult = await createNotionRecord(
          {
            ...formData,
            documentType: 'invoice',
          },
          NOTION_API_KEY,
          NOTION_DATABASE_ID
        );
        console.log("Notion record created:", notionResult);
      } catch (notionError) {
        console.error("Error creating Notion record:", notionError);
        throw new Error(`שגיאה ביצירת רשומה ב-Notion: ${notionError.message}`);
      }
      
      // Success message
      setMessage(sendEmail ? 
        'חשבונית נוצרה ונשלחה בהצלחה!' : 
        'חשבונית נוצרה בהצלחה!');
      
    } catch (error) {
      console.error("Error in createInvoice:", error);
      setMessage('שגיאה: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const createReceipt = async (sendEmail = false) => {
    if (!validateForm()) return;
    
    setLoading(true);
    setMessage('');
    setDocumentLink('');
    
    try {
      console.log("Starting receipt creation process");
      
      // Step 1: Create Morning receipt
      let morningResult;
      try {
        console.log("Creating receipt in Morning...");
        morningResult = await createMorningReceipt(
          {
            description: formData.income,
            client: formData.client,
            amount: formData.amount,
            paymentMethod: formData.paymentMethod,
            date: formData.date,
            application: formData.application,
            sendEmail: sendEmail
          },
          MORNING_ID,
          MORNING_SECRET
        );
        console.log("Morning receipt created:", morningResult);
        
        // Extract document link
        if (morningResult) {
          if (morningResult.url) {
            // Try to extract URLs from each field
            const enUrl = morningResult.url.en ? extractUrlFromText(morningResult.url.en) : null;
            const heUrl = morningResult.url.he ? extractUrlFromText(morningResult.url.he) : null;
            const originUrl = morningResult.url.origin ? extractUrlFromText(morningResult.url.origin) : null;
            
            // Use the first available URL, prioritizing English
            const link = enUrl || heUrl || originUrl;
            
            if (link) {
              setDocumentLink(link);
              console.log("Document link extracted:", link);
            }
          } else if (morningResult.id) {
            // Fallback to constructed URL
            setDocumentLink(`https://greeninvoice.co.il/view/${morningResult.id}`);
            console.log("Fallback document link set using ID");
          }
        }
      } catch (morningError) {
        console.error("Error creating Morning receipt:", morningError);
        throw new Error(`שגיאה ביצירת קבלה ב-Green Invoice: ${morningError.message}`);
      }
      
      // Step 2: Find existing Notion page or create new one
      try {
        console.log("Searching for existing Notion page...");
        const existingPageId = await findNotionPage(
          NOTION_API_KEY,
          NOTION_DATABASE_ID,
          formData.income,
          formData.client
        );
        
        if (existingPageId) {
          // Update existing page with receipt information
          console.log("Updating existing Notion page with receipt info...");
          await updateNotionPageWithReceipt(
            NOTION_API_KEY,
            existingPageId,
            formData.date
          );
          console.log("Existing Notion page updated with receipt info");
        } else {
          // Create new page if no existing page found
          console.log("No existing page found, creating new Notion record...");
          await createNotionRecord(
            {
              ...formData,
              documentType: 'receipt',
            },
            NOTION_API_KEY,
            NOTION_DATABASE_ID
          );
          console.log("New Notion record created");
        }
      } catch (notionError) {
        console.error("Error handling Notion record:", notionError);
        throw new Error(`שגיאה בטיפול ברשומה ב-Notion: ${notionError.message}`);
      }
      
      // Success message
      setMessage(sendEmail ? 
        'קבלה נוצרה ונשלחה בהצלחה!' : 
        'קבלה נוצרה בהצלחה!');
      
    } catch (error) {
      console.error("Error in createReceipt:", error);
      setMessage('שגיאה: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="app-card">
        <h1 className="app-title">מערכת ניהול פיננסית</h1>
        
        {message && (
          <div className={`message ${message.includes('שגיאה') ? 'message-error' : 'message-success'}`}>
            {message}
          </div>
        )}
        
        {clientError && (
          <div className="message message-error">
            {clientError}
          </div>
        )}
        
        {documentLink && (
          <div className="document-link-container">
            <div className="document-link-box">
              <a 
                href={documentLink} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="document-link"
              >
                צפה במסמך
              </a>
              <button 
                onClick={copyLinkToClipboard} 
                className="button button-copy-link"
              >
                העתק קישור
              </button>
              <button 
                onClick={resetForm} 
                className="button button-new-document"
              >
                מסמך חדש
              </button>
            </div>
          </div>
        )}
        
        <div>
          <div className="form-group">
            <label className="form-label">פרטים:</label>
            <input
              name="income"
              value={formData.income}
              onChange={handleChange}
              className="form-input"
              placeholder="תיאור ההכנסה"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">לקוח:</label>
            <div className="position-relative">
              <input
                name="client"
                value={formData.client}
                onChange={handleChange}
                className="form-input"
                placeholder={loadingClients ? "טוען לקוחות..." : "הקלד לחיפוש לקוח"}
                onFocus={() => {
                  setFilteredClients(clients);
                  setShowClientOptions(true);
                }}
                onBlur={() => setTimeout(() => setShowClientOptions(false), 200)}
                disabled={loadingClients}
              />
              
              {showClientOptions && (
                <div className="client-options">
                  {filteredClients.length > 0 ? (
                    filteredClients.map((client, index) => (
                      <div 
                        key={index} 
                        className="client-option"
                        onMouseDown={() => selectClient(client)}
                      >
                        {client}
                      </div>
                    ))
                  ) : (
                    <div className="client-option-empty">אין תוצאות</div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">סכום:</label>
            <input
              name="amount"
              type="number"
              value={formData.amount}
              onChange={handleChange}
              className="form-input"
              placeholder="סכום בש״ח"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">אמצעי:</label>
            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              className="form-select"
            >
              <option value="">בחר אמצעי תשלום</option>
              <option value="העברה">העברה</option>
              <option value="מזומן">מזומן</option>
              <option value="צ׳ק">צ׳ק</option>
              <option value="אפליקציית תשלום">אפליקציית תשלום</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">תאריך:</label>
            <input
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              className="form-input"
            />
          </div>
          
          {formData.paymentMethod === 'אפליקציית תשלום' && (
            <div className="form-group">
              <label className="form-label">אפליקציה:</label>
              <select
                name="application"
                value={formData.application}
                onChange={handleChange}
                className="form-select"
              >
                <option value="">בחר אפליקציה</option>
                <option value="ביט">ביט</option>
                <option value="פיי-בוקס">פיי-בוקס</option>
              </select>
            </div>
          )}
        </div>
        
        {!documentLink && (
          <div className="button-container">
            <div className="button-group">
              <button
                onClick={() => createReceipt(false)}
                disabled={loading}
                className="button button-receipt"
              >
                {loading ? 'מעבד...' : 'הפקת קבלה'}
              </button>
              
              <button
                onClick={() => createReceipt(true)}
                disabled={loading}
                className="button button-receipt-send"
              >
                {loading ? 'מעבד...' : 'הפקת קבלה + שליחה'}
              </button>
            </div>
            
            <div className="button-group">
              <button
                onClick={() => createInvoice(false)}
                disabled={loading}
                className="button button-invoice"
              >
                {loading ? 'מעבד...' : 'הפקת דרישת תשלום'}
              </button>
              
              <button
                onClick={() => createInvoice(true)}
                disabled={loading}
                className="button button-invoice-send"
              >
                {loading ? 'מעבד...' : 'הפקת דרישת תשלום + שליחה'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialApp;