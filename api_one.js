const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js'); // Import necessary modules
const cors = require('cors'); // Import the CORS middleware

// Create a new instance of the Express app
const app = express();
app.use(express.json()); // Middleware to parse JSON bodies
app.use(cors());

// Create a new WhatsApp client with local authentication
// const client = new Client({
//     puppeteer: { headless: false },
//     authStrategy: new LocalAuth()
// });

const client = new Client({
    puppeteer: {
        headless: true, // Enable headless mode
        args: ['--no-sandbox', '--disable-setuid-sandbox'], // Recommended arguments for running Puppeteer on a server
    },
    authStrategy: new LocalAuth()
});

console.log('Initializing...');

// Initialize the WhatsApp client
client.initialize();

client.on('qr', () => {
    console.log('Please scan the QR code on the browser.');
});

client.on('authenticated', () => {
    console.log('Authenticated successfully.');
});

client.on('ready', () => {
    console.log('Client is ready!');
});

// Define a list of valid secret codes
const validSecretCodes = [
    'REUBEN#RENUKASUPERCODE',
    'CODE#123456789',
    'MYSECRET#987654321'
];

// Define a POST route for creating a group with secret code validation
app.post('/create-group', async (req, res) => {
    const { groupName, phoneNumbers, SecretCode } = req.body;

    // Check if SecretCode is present and valid
    if (!SecretCode || !validSecretCodes.includes(SecretCode)) {
        return res.status(403).json({ error: 'Sorry, Code Problem. Please provide a valid SecretCode.' });
    }

    if (!groupName || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
        return res.status(400).json({ error: 'Group name and a list of phone numbers are required.' });
    }

    try {
        // Validate each phone number before adding them to the group
        const validNumbers = [];
        for (const number of phoneNumbers) {
            const contact = await client.getContactById(number);
            if (contact.isWAContact) {
                validNumbers.push(number);
                console.log(`Validated: ${number} is a valid WhatsApp contact.`);
            } else {
                console.warn(`Skipping: ${number} is not a valid WhatsApp contact.`);
            }
        }

        // Create the group with the validated phone numbers
        const group = await client.createGroup(groupName, validNumbers);
        console.log(`Group created successfully: ${group.gid.user}`);

        // Respond with the group ID and group name
        res.status(200).json({
            message: 'Group created successfully!',
            groupName: groupName,
            groupId: group.gid.user,
            addedParticipants: validNumbers
        });

    } catch (error) {
        console.error('An error occurred while creating the group or adding participants:', error);
        res.status(500).json({ error: 'Failed to create group. Please try again.' });
    }
});

// Define a GET route to check if the WhatsApp client is ready
app.get('/status', (req, res) => {
    if (client.info && client.info.pushname) {
        return res.status(200).json({ status: 'Client is ready!', pushName: client.info.pushname });
    }
    res.status(503).json({ status: 'Client is not ready. Please scan the QR code if required.' });
});

// Graceful exit and cleanup on shell exit
client.on('disconnected', () => {
    console.log('Client was logged out or disconnected.');
    process.exit();
});

// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
