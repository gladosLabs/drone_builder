const puppeteer = require('puppeteer');

async function debugPage() {
    console.log('🔍 Debugging GetFPV page structure...');
    
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1920, height: 1080 }
    });
    
    const page = await browser.newPage();
    
    // Try different URLs
    const urls = [
        'https://www.getfpv.com/motors.html',
        'https://www.getfpv.com/motors/',
        'https://www.getfpv.com/motors/brushless-motors.html',
        'https://www.getfpv.com/motors/brushless-motors/',
        'https://www.getfpv.com/category/motors.html',
        'https://www.getfpv.com/category/motors/',
        'https://www.getfpv.com/'
    ];
    
    for (const url of urls) {
        try {
            console.log(`\n🔍 Trying URL: ${url}`);
            
            await page.goto(url, { 
                waitUntil: 'networkidle2', 
                timeout: 30000 
            });
            
            // Wait a bit for dynamic content
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Get page title
            const title = await page.title();
            console.log(`📄 Page title: ${title}`);
            
            // Check if we're on the right page
            const currentUrl = page.url();
            console.log(`🔗 Current URL: ${currentUrl}`);
            
            // Check if page is not 404
            if (title.includes('404') || title.includes('Not Found')) {
                console.log('❌ 404 page - trying next URL');
                continue;
            }
            
            // Look for motor-related links
            const motorLinks = await page.evaluate(() => {
                const links = Array.from(document.querySelectorAll('a[href*="motor"], a[href*="Motor"]'));
                return links.map(link => ({
                    href: link.href,
                    text: link.textContent.trim().substring(0, 50),
                    className: link.className
                })).slice(0, 10);
            });
            
            console.log(`🔗 Found ${motorLinks.length} motor-related links:`);
            motorLinks.forEach((link, index) => {
                console.log(`${index + 1}. ${link.text} -> ${link.href}`);
            });
            
            // Look for any product links
            const productLinks = await page.evaluate(() => {
                const links = Array.from(document.querySelectorAll('a[href*="/"]'));
                return links.map(link => ({
                    href: link.href,
                    text: link.textContent.trim().substring(0, 30),
                    className: link.className
                })).filter(link => 
                    link.href.includes('getfpv.com') && 
                    !link.href.includes('customer') &&
                    !link.href.includes('account') &&
                    !link.href.includes('cart') &&
                    !link.href.includes('checkout')
                ).slice(0, 10);
            });
            
            console.log(`🔗 Found ${productLinks.length} product links:`);
            productLinks.forEach((link, index) => {
                console.log(`${index + 1}. ${link.text} -> ${link.href}`);
            });
            
            // If we found motor links, this might be the right page
            if (motorLinks.length > 0 || !title.includes('404')) {
                console.log('✅ Found working page!');
                break;
            }
            
        } catch (error) {
            console.log(`❌ Error with ${url}: ${error.message}`);
        }
    }
    
    await browser.close();
    console.log('🔒 Browser closed');
}

debugPage(); 