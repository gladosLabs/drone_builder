const puppeteer = require('puppeteer');

async function debugMotorPage() {
    console.log('🔍 Debugging Motor Product Page...');
    
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1920, height: 1080 }
    });
    
    const page = await browser.newPage();
    
    try {
        // Navigate to a specific motor page
        const motorUrl = 'https://www.getfpv.com/lumenier-zip-v2-2407-blackout-motor-1700kv.html';
        await page.goto(motorUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        
        console.log('✅ Motor page loaded successfully');
        
        // Wait for content to load
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Get page title
        const title = await page.title();
        console.log(`📄 Page title: ${title}`);
        
        // Look for specifications tables
        const specsTables = await page.evaluate(() => {
            const tables = document.querySelectorAll('table');
            return Array.from(tables).map((table, index) => ({
                index,
                className: table.className,
                rows: table.querySelectorAll('tr').length,
                content: Array.from(table.querySelectorAll('tr')).map(row => {
                    const cells = row.querySelectorAll('td, th');
                    return Array.from(cells).map(cell => cell.textContent.trim());
                }).slice(0, 5) // First 5 rows
            }));
        });
        
        console.log('\n📊 Specifications tables found:');
        specsTables.forEach((table, index) => {
            console.log(`${index + 1}. Table ${index}: ${table.className} (${table.rows} rows)`);
            table.content.forEach((row, rowIndex) => {
                console.log(`   Row ${rowIndex}: ${row.join(' | ')}`);
            });
        });
        
        // Look for any elements containing motor specifications
        const motorSpecs = await page.evaluate(() => {
            const elements = document.querySelectorAll('*');
            const specs = [];
            
            elements.forEach(el => {
                const text = el.textContent.toLowerCase();
                if ((text.includes('kv') || text.includes('weight') || text.includes('current') || 
                     text.includes('power') || text.includes('thrust') || text.includes('shaft')) && 
                    text.length < 200) {
                    specs.push({
                        tagName: el.tagName,
                        className: el.className,
                        text: el.textContent.trim()
                    });
                }
            });
            
            return specs.slice(0, 20);
        });
        
        console.log('\n⚡ Motor specification elements:');
        motorSpecs.forEach((spec, index) => {
            console.log(`${index + 1}. ${spec.tagName}.${spec.className}: ${spec.text}`);
        });
        
        // Look for product details sections
        const productSections = await page.evaluate(() => {
            const sections = document.querySelectorAll('[class*="product"], [class*="details"], [class*="specs"], [class*="info"]');
            return Array.from(sections).map(section => ({
                tagName: section.tagName,
                className: section.className,
                text: section.textContent.trim().substring(0, 200)
            })).slice(0, 10);
        });
        
        console.log('\n📦 Product sections:');
        productSections.forEach((section, index) => {
            console.log(`${index + 1}. ${section.tagName}.${section.className}`);
            console.log(`   ${section.text}`);
        });
        
        // Look for any structured data or JSON-LD
        const structuredData = await page.evaluate(() => {
            const scripts = document.querySelectorAll('script[type="application/ld+json"]');
            return Array.from(scripts).map(script => {
                try {
                    return JSON.parse(script.textContent);
                } catch (e) {
                    return null;
                }
            }).filter(data => data);
        });
        
        console.log('\n🔧 Structured data found:');
        structuredData.forEach((data, index) => {
            console.log(`${index + 1}. ${JSON.stringify(data, null, 2)}`);
        });
        
        // Take a screenshot
        await page.screenshot({ path: 'motor-product-page.png', fullPage: true });
        console.log('\n📸 Screenshot saved as motor-product-page.png');
        
    } catch (error) {
        console.error('❌ Error during debugging:', error.message);
    } finally {
        await browser.close();
        console.log('🔒 Browser closed');
    }
}

debugMotorPage(); 