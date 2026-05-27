const sdk = require('node-appwrite');

module.exports = async function(context) {
    const client = new sdk.Client();
    const messaging = new sdk.Messaging(client);
    
    client
        .setEndpoint(context.variables['APPWRITE_ENDPOINT'])
        .setProject(context.variables['APPWRITE_PROJECT_ID'])
        .setKey(context.variables['APPWRITE_API_KEY']);
    
    let eventData = {};
    try {
        eventData = typeof context.req.body === 'string' 
            ? JSON.parse(context.req.body) 
            : context.req.body;
    } catch(e) {
        context.log('Parse error:', e.message);
    }
    
    const event = context.req.headers['x-appwrite-event'] || '';
    context.log('Event:', event);
    context.log('Data:', JSON.stringify(eventData));
    
    let email = null;
    let subject = '';
    let htmlBody = '';
    
    // NEW CUSTOMER REGISTERED
    if (event.includes('customers.documents.create')) {
        email = eventData.email;
        subject = 'Karibu ' + eventData.fullName + '! - SEWAGE COLLECTION SERVICE';
        htmlBody = `
            <div style="font-family:Arial;max-width:600px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden">
                <div style="background:#00c853;padding:25px;text-align:center">
                    <h1 style="color:#0a1929;margin:0">SEWAGE COLLECTION SERVICE</h1>
                </div>
                <div style="padding:25px">
                    <h2 style="color:#0a1929">Karibu ${eventData.fullName}! 🎉</h2>
                    <p>Umefanikiwa kujisajili kwenye huduma yetu ya kukusanya na kusafirisha majitaka.</p>
                    <p><strong>Simu:</strong> ${eventData.phone}</p>
                    <p><strong>Anwani:</strong> ${eventData.address}</p>
                    <p>Tembelea dashboard yako kuomba huduma zetu. Asante!</p>
                </div>
            </div>
        `;
    }
    
    // NEW SERVICE REQUEST
    else if (event.includes('service_requests.documents.create')) {
        email = eventData.customerEmail;
        const requestId = (eventData.$id || '').substring(0, 8);
        subject = 'Ombi #' + requestId + ' Limepokelewa - SEWAGE SERVICE';
        htmlBody = `
            <div style="font-family:Arial;max-width:600px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden">
                <div style="background:#00c853;padding:25px;text-align:center">
                    <h1 style="color:#0a1929;margin:0">OMBI LIMEPOKELEWA</h1>
                </div>
                <div style="padding:25px">
                    <h2 style="color:#0a1929">Habari ${eventData.customerName}!</h2>
                    <p><strong>Namba ya Ombi:</strong> #${requestId}</p>
                    <p><strong>Huduma:</strong> ${eventData.serviceType}</p>
                    <p><strong>Tarehe:</strong> ${eventData.preferredDate}</p>
                    <p><strong>Eneo:</strong> ${eventData.customerLocation || 'N/A'}</p>
                    <p>Tutakupigia simu kuhusu malipo. Asante!</p>
                </div>
            </div>
        `;
    }
    
    // STATUS UPDATE
    else if (event.includes('service_requests.documents.update')) {
        email = eventData.customerEmail;
        const cost = eventData.cost || 0;
        
        const statusMessages = {
            'pending': 'Ombi linasubiri kushughulikiwa',
            'onroute': 'Timu iko njiani kwako! 🚛',
            'completed': 'Huduma imekamilika! Gharama: TSh ' + cost.toLocaleString(),
            'cancelled': 'Ombi limeghairiwa'
        };
        
        subject = statusMessages[eventData.status] || 'Update ya Ombi';
        htmlBody = `
            <div style="font-family:Arial;max-width:600px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden">
                <div style="background:#00c853;padding:25px;text-align:center">
                    <h1 style="color:#0a1929;margin:0">UPDATE YA OMBI</h1>
                </div>
                <div style="padding:25px">
                    <h2 style="color:#0a1929">${statusMessages[eventData.status] || 'Hali Imebadilika'}</h2>
                    <p>Asante kwa kuitumia SEWAGE COLLECTION SERVICE!</p>
                </div>
            </div>
        `;
    }
    
    // SEND EMAIL
    if (email) {
        try {
            const result = await messaging.createEmail(
                sdk.ID.unique(),
                subject,
                htmlBody,
                [],
                [],
                [],
                [email],
                []
            );
            
            context.log('✅ Email sent to:', email);
            return context.res.json({ success: true, emailId: result.$id });
        } catch(error) {
            context.error('❌ Error:', error.message);
            return context.res.json({ success: false, error: error.message });
        }
    }
    
    return context.res.json({ success: false, reason: 'No matching event' });
};
