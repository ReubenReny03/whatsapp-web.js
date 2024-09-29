const { Client, LocalAuth } = require('./index'); // Import necessary modules

// Create a new WhatsApp client with local authentication
const client = new Client({
    puppeteer: { headless: false },
    authStrategy: new LocalAuth()
});

console.log('Initializing...');

client.initialize();

client.on('qr', () => {
    console.log('Please scan the QR code on the browser.');
});


client.on('authenticated', () => {
    console.log('Authenticated successfully.');
});

client.on('ready', async () => {
    console.log('Client is ready!');

    const phoneNumbers = [
        '916300526540@c.us',
        '919901247459@c.us', // Replace with actual phone numbers
        '918100435794@c.us'
    ];

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

        client.createGroup('Testing Automation', phoneNumbers);


    } catch (error) {
        console.error('An error occurred while creating the group or adding participants:', error);
    }
});

// Graceful exit and cleanup on shell exit
client.on('disconnected', () => {
    console.log('Client was logged out or disconnected.');
    process.exit();
});
