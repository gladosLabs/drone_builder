const { GetFPVMotorScraper } = require('./getfpv-motor-scraper');

async function testScraper() {
    console.log('🧪 Testing GetFPV Motor Scraper...');
    
    const scraper = new GetFPVMotorScraper();
    
    try {
        await scraper.initialize();
        console.log('✅ Browser initialized successfully');
        
        // Test with a single motor page first
        const testUrl = 'https://www.getfpv.com/motors.html';
        console.log(`🔍 Testing with URL: ${testUrl}`);
        
        await scraper.page.goto(testUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        console.log('✅ Successfully loaded motor listings page');
        
        // Wait a bit for dynamic content
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Get a few motor URLs for testing
        const motorUrls = await scraper.page.evaluate(() => {
            // Use the same selectors as the main scraper
            const selectors = [
                '.item.product.product-item a',
                '.product-item a',
                '.product a',
                'a[href*="getfpv.com"][href*="motor"]'
            ];
            
            let links = [];
            for (const selector of selectors) {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    links = Array.from(elements);
                    console.log(`Found ${links.length} links with selector: ${selector}`);
                    break;
                }
            }
            
            // Filter for motor products
            return links.map(link => link.href).filter(href => 
                (href.includes('getfpv.com') && 
                 (href.includes('motor') || href.includes('Motor'))) &&
                !href.includes('customer') &&
                !href.includes('account') &&
                !href.includes('cart') &&
                !href.includes('checkout') &&
                !href.includes('wishlist') &&
                !href.includes('contact') &&
                !href.includes('brands') &&
                !href.includes('category') &&
                !href.includes('motors.html') &&
                !href.includes('mailto:') &&
                href.includes('.html')
            ).slice(0, 3); // Just get first 3 for testing
        });
        
        console.log(`📊 Found ${motorUrls.length} motor URLs for testing`);
        
        // Test scraping a few motors
        for (let i = 0; i < Math.min(motorUrls.length, 2); i++) {
            const url = motorUrls[i];
            console.log(`\n🔍 Testing motor ${i + 1}: ${url}`);
            await scraper.scrapeMotorPage(url);
            await scraper.delay(3000); // Wait between tests
        }
        
        console.log(`\n📊 Test Results:`);
        console.log(`- Total motors scraped: ${scraper.motors.length}`);
        
        if (scraper.motors.length > 0) {
            console.log(`- Sample motor data:`);
            console.log(JSON.stringify(scraper.motors[0], null, 2));
        }
        
        // Save test data
        if (scraper.motors.length > 0) {
            await scraper.saveToCSV();
            console.log('✅ Test data saved successfully');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    } finally {
        await scraper.close();
        console.log('🔒 Test completed');
    }
}

// Run the test
if (require.main === module) {
    testScraper();
}

module.exports = { testScraper }; 