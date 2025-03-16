# .gitignore

```
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# production
/build

# misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

npm-debug.log*
yarn-debug.log*
yarn-error.log*

```

# api/morning.js

```js
// api/morning.js
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    // Extract path from request URL (remove /api/morning)
    const urlPath = req.url.replace(/^\/api\/morning/, '');
    const morningUrl = `https://api.greeninvoice.co.il${urlPath}`;
    
    console.log(`Proxying request to: ${morningUrl}`);
    
    // Get the request body for POST requests
    let body = null;
    if (req.method === 'POST' && req.body) {
      body = JSON.stringify(req.body);
    }
    
    // Make the request to Morning API
    const response = await fetch(morningUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        // Forward Authorization header if present
        ...(req.headers.authorization && { 'Authorization': req.headers.authorization })
      },
      // Only include body for POST/PUT requests
      ...(body && { body })
    });
    
    // Get the response as text
    const responseText = await response.text();
    
    // Try to parse as JSON if possible
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = responseText;
    }
    
    // Forward the status and response
    res.status(response.status).json(responseData);
  } catch (error) {
    console.error('Morning API proxy error:', error);
    res.status(500).json({ error: 'Error proxying to Morning API', message: error.message });
  }
};
```

# api/notion.js

```js
// api/notion.js
module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
    
    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    try {
      // Extract path from request URL (remove /api/notion)
      const urlPath = req.url.replace(/^\/api\/notion/, '');
      const notionUrl = `https://api.notion.com${urlPath}`;
      
      console.log(`Proxying request to: ${notionUrl}`);
      
      // Forward headers (especially Authorization)
      const headers = { ...req.headers };
      
      // Remove host-related headers that could cause issues
      delete headers.host;
      delete headers['x-forwarded-host'];
      delete headers['x-forwarded-proto'];
      delete headers['x-forwarded-port'];
      delete headers['x-real-ip'];
      
      // Add Notion version if not present
      if (!headers['notion-version']) {
        headers['notion-version'] = '2022-06-28';
      }
      
      // Forward the request to Notion API
      const fetchOptions = {
        method: req.method,
        headers: headers,
      };
      
      // Add body for non-GET requests
      if (req.method !== 'GET' && req.body) {
        fetchOptions.body = JSON.stringify(req.body);
      }
      
      // Make the request to Notion
      const response = await fetch(notionUrl, fetchOptions);
      
      // Get the response as text first (to properly handle any content type)
      const responseText = await response.text();
      
      // Try to parse as JSON if possible
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = responseText;
      }
      
      // Forward the status and response
      res.status(response.status).json(responseData);
    } catch (error) {
      console.error('Notion API proxy error:', error);
      res.status(500).json({ 
        error: 'Error proxying to Notion API', 
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  };
```

# package.json

```json
{
  "name": "financial-app",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@testing-library/dom": "^10.4.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.2.0",
    "@testing-library/user-event": "^13.5.0",
    "cors": "^2.8.5",
    "express": "^4.21.2",
    "http-proxy-middleware": "^3.0.3",
    "lucide-react": "^0.477.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-scripts": "5.0.1",
    "web-vitals": "^2.1.4"
  },
  "scripts": {
    "start": "react-scripts start",
    "start:proxy": "node server.js",
    "dev": "concurrently \"npm run start\" \"npm run start:proxy\"",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  "devDependencies": {
    "autoprefixer": "^10.4.13",
    "concurrently": "^9.1.2",
    "postcss": "^8.4.19",
    "tailwindcss": "^3.2.4"
  }
}
```

# postcss.config.js

```js
module.exports = {
    plugins: [
      require('tailwindcss'),
      require('autoprefixer'),
    ],
  }
```

# public/favicon.ico

This is a binary file of the type: Binary

# public/index.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta
      name="description"
      content="Web site created using create-react-app"
    />
    <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
    <!--
      manifest.json provides metadata used when your web app is installed on a
      user's mobile device or desktop. See https://developers.google.com/web/fundamentals/web-app-manifest/
    -->
    <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
    <!--
      Notice the use of %PUBLIC_URL% in the tags above.
      It will be replaced with the URL of the `public` folder during the build.
      Only files inside the `public` folder can be referenced from the HTML.

      Unlike "/favicon.ico" or "favicon.ico", "%PUBLIC_URL%/favicon.ico" will
      work correctly both with client-side routing and a non-root public URL.
      Learn how to configure a non-root public URL by running `npm run build`.
    -->
    <title>React App</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
    <!--
      This HTML file is a template.
      If you open it directly in the browser, you will see an empty page.

      You can add webfonts, meta tags, or analytics to this file.
      The build step will place the bundled scripts into the <body> tag.

      To begin the development, run `npm start` or `yarn start`.
      To create a production bundle, use `npm run build` or `yarn build`.
    -->
  </body>
</html>

```

# public/logo192.png

This is a binary file of the type: Image

# public/logo512.png

This is a binary file of the type: Image

# public/manifest.json

```json
{
  "short_name": "React App",
  "name": "Create React App Sample",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    },
    {
      "src": "logo192.png",
      "type": "image/png",
      "sizes": "192x192"
    },
    {
      "src": "logo512.png",
      "type": "image/png",
      "sizes": "512x512"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff"
}

```

# public/robots.txt

```txt
# https://www.robotstxt.org/robotstxt.html
User-agent: *
Disallow:

```

# README.md

```md
# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
# financial-app

```

# server.js

```js
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
app.use(cors());

// Proxy for Notion API
app.use('/notion', createProxyMiddleware({
  target: 'https://api.notion.com',
  changeOrigin: true,
  pathRewrite: { '^/notion': '' },
}));

// Proxy for Morning API
app.use('/morning', createProxyMiddleware({
  target: 'https://api.greeninvoice.co.il',
  changeOrigin: true,
  pathRewrite: { '^/morning': '' },
}));

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
```

# src/App.css

```css
.App {
  text-align: center;
}

.App-logo {
  height: 40vmin;
  pointer-events: none;
}

@media (prefers-reduced-motion: no-preference) {
  .App-logo {
    animation: App-logo-spin infinite 20s linear;
  }
}

.App-header {
  background-color: #282c34;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: calc(10px + 2vmin);
  color: white;
}

.App-link {
  color: #61dafb;
}

@keyframes App-logo-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

```

# src/App.js

```js
import React from 'react';
import FinancialApp from './FinancialApp';

function App() {
  return <FinancialApp />;
}

export default App;
```

# src/App.test.js

```js
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});

```

# src/config.js

```js
// For now, use placeholder values
export const NOTION_API_KEY = "secret_4Sf91PbLDjIVqdyBI64iKYy1FfkHNxVgrTN809qT6g5"; // You'll replace this later
export const NOTION_DATABASE_ID = "c18b4103b7a043018c695a7929f17ac3";
export const MORNING_ID = "828db717-aebf-4e58-a498-4218c51a827a"; // From your original code
export const MORNING_SECRET = "rtPIk4pW3mP-7daFgUttmQ";
export const NOTION_YEARS_DATABASE_ID = "4e6fe7f02f8d41199eb37037d3302a3e";
export const NOTION_MONTHS_DATABASE_ID = "6ba0cc96770b4afb813ec8933c08dc27";
```

# src/FinancialApp.css

```css
.app-container {
  display: flex;
  justify-content: center;
  min-height: 100vh;
  background-color: #111827;
  padding: 1rem;
  font-family: sans-serif;
  color: #f9fafb;
  direction: rtl;
}

.app-card {
  width: 100%;
  max-width: 48rem;
  background-color: #1f2937;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.app-title {
  font-size: 1.5rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 1.5rem;
  color: #93c5fd;
}

.message {
  margin-bottom: 1rem;
  padding: 0.75rem;
  border-radius: 0.375rem;
  text-align: center;
}

.message-error {
  background-color: #7f1d1d;
  color: #fecaca;
}

.message-success {
  background-color: #064e3b;
  color: #a7f3d0;
}

.form-group {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1rem;
}

.form-label {
  text-align: left;
  font-weight: 500;
  color: #93c5fd;
}

.form-input,
.form-select {
  width: 100%;
  padding: 0.5rem;
  background-color: #374151;
  color: white;
  border: 1px solid #4b5563;
  border-radius: 0.375rem;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px #3b82f6;
}

.button-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-top: 2rem;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.button {
  width: 100%;
  padding: 0.75rem;
  border-radius: 0.375rem;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.2s;
}

.button-receipt {
  background-color: #064e3b;
  color: #d1fae5;
}

.button-receipt:hover {
  background-color: #065f46;
}

.button-receipt-send {
  background-color: #1e3a8a;
  color: #dbeafe;
}

.button-receipt-send:hover {
  background-color: #1e40af;
}

.button-invoice {
  background-color: #78350f;
  color: #fef3c7;
}

.button-invoice:hover {
  background-color: #92400e;
}

.button-invoice-send {
  background-color: #7c2d12;
  color: #ffedd5;
}

.button-invoice-send:hover {
  background-color: #9a3412;
}

input[type="date"]::-webkit-calendar-picker-indicator {
  filter: invert(1);
  cursor: pointer;
}

/* Add these styles to your existing CSS file */
.position-relative {
  position: relative;
  width: 100%;
}

.client-options {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: #1f2937;
  border: 1px solid #4b5563;
  border-radius: 0.375rem;
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.client-option {
  padding: 0.5rem;
  cursor: pointer;
}

.client-option:hover {
  background-color: #374151;
}

.client-option-empty {
  padding: 0.5rem;
  color: #9ca3af;
  font-style: italic;
}
```

# src/FinancialApp.js

```js
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
  
  const createInvoice = async (sendEmail = false) => {
    if (!validateForm()) return;
    
    setLoading(true);
    setMessage('');
    
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
      
      // Clear form
      setFormData({
        income: '',
        client: '',
        amount: '',
        paymentMethod: '',
        date: new Date().toISOString().split('T')[0],
        application: ''
      });
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
      
      // Clear form
      setFormData({
        income: '',
        client: '',
        amount: '',
        paymentMethod: '',
        date: new Date().toISOString().split('T')[0],
        application: ''
      });
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
      </div>
    </div>
  );
};

export default FinancialApp;
```

# src/index.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
@import url('https://fonts.googleapis.com/css2?family=Assistant:wght@200;300;400;500;600;700;800&display=swap');

body {
  margin: 0;
  font-family: 'Assistant', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #111827;
  color: white;
}

/* Right-to-left for Hebrew */
[dir="rtl"] {
  text-align: right;
}
```

# src/index.js

```js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

```

# src/logo.svg

This is a file of the type: SVG Image

# src/morningApi.js

```js
/**
 * Get Morning API token
 * @param {string} morningId - Your Morning API ID
 * @param {string} morningSecret - Your Morning API secret
 * @returns {Promise<string>} Bearer token
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
  
  /**
   * Create an invoice in Morning (Green Invoice)
   * @param {Object} invoiceData - Invoice data
   * @param {string} morningId - Your Morning API ID
   * @param {string} morningSecret - Your Morning API secret
   * @returns {Promise<Object>} Created invoice data
   */
  export async function createMorningInvoice(invoiceData, morningId, morningSecret) {
    console.log("Creating Morning invoice...");
  
    try {
      // Get token first
      const token = await getMorningToken(morningId, morningSecret);
  
      // Map payment method to Morning API values
      let paymentType = 0;
      switch (invoiceData.paymentMethod) {
        case "העברה": paymentType = 4; break;
        case "אפליקציית תשלום": paymentType = 10; break;
        case "מזומן": paymentType = 1; break;
        case "צ׳ק": paymentType = 2; break;
        default: paymentType = 4;
      }
  
      // Map payment app to Morning API values
      let appType = null;
      if (invoiceData.paymentMethod === "אפליקציית תשלום") {
        switch (invoiceData.application) {
          case "ביט": appType = 1; break;
          case "פיי-בוקס": appType = 3; break;
          default: appType = "";
        }
      }
  
      // Create the invoice
      const payload = {
        description: invoiceData.description,
        type: 300, // Invoice type
        vatType: 0,
        lang: "he",
        currency: "ILS",
        remarks: 'פרטים להעברה: בנק 20, סניף 574, חשבון 113862',
        client: {
          name: invoiceData.client,
          add: true,
          self: false,
        },
        rounding: false,
        income: [
          {
            description: invoiceData.description,
            quantity: 1,
            price: parseFloat(invoiceData.amount),
            currency: "ILS",
            vatType: 0
          },
        ],
        payment: [
          {
            type: paymentType,
            price: parseFloat(invoiceData.amount),
            currency: "ILS",
            date: invoiceData.date,
            appType: appType,
          },
        ]
      };
  
      // If sending email, add content
      if (invoiceData.sendEmail) {
        payload.emailContent = 'פרטים להעברה: בנק 20, סניף 574, חשבון 113862';
      }
  
      console.log("Morning invoice payload:", JSON.stringify(payload));
  
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
        throw new Error(`Failed to create Morning invoice: ${response.status}`);
      }
  
      const data = await response.json();
      console.log("Morning invoice created successfully:", data);
  
      // Send email if requested
      if (invoiceData.sendEmail && data.client && data.client.id && data.id) {
        await sendMorningEmail(data.id, data.client.id, "חשבונית", token);
      }
  
      return data;
    } catch (error) {
      console.error("Error creating Morning invoice:", error);
      throw error;
    }
  }
  
  /**
   * Create a receipt in Morning (Green Invoice)
   * @param {Object} receiptData - Receipt data
   * @param {string} morningId - Your Morning API ID
   * @param {string} morningSecret - Your Morning API secret
   * @returns {Promise<Object>} Created receipt data
   */
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
```

# src/notionApi.js

```js
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
```

# src/reportWebVitals.js

```js
const reportWebVitals = onPerfEntry => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;

```

# src/setupTests.js

```js
// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

```

# tailwind.config.js

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
      extend: {},
    },
    plugins: [],
  }
```

# vercel.json

```json
{
    "version": 2,
    "routes": [
      {
        "src": "/api/notion/(.*)",
        "dest": "/api/notion.js"
      },
      {
        "src": "/api/morning/(.*)",
        "dest": "/api/morning.js"
      },
      {
        "src": "/(.*)",
        "dest": "/$1"
      }
    ]
  }
```

